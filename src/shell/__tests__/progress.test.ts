import { createMemoryDatabase } from '@/core/database/testing';
import { createAppData } from '@/shell/AppData';

import { computeProgress } from '../progress/computeProgress';

const today = '2026-10-22';
const clock = { now: new Date(2026, 9, 20, 9, 0) }; // habits created on Tuesday the 20th

async function setup() {
  const data = await createAppData(createMemoryDatabase(), () => clock.now, null);
  const progress = async () =>
    computeProgress(
      await data.todo.progressFacts(today),
      await data.habits.progressFacts(today),
      today,
    );
  return { data, progress };
}

describe('progress from real data', () => {
  it('turns tasks and habits into depth and today’s points', async () => {
    const { data, progress } = await setup();
    const listId = await data.todo.createList({ name: 'Casa' });
    const habitId = await data.habits.createHabit({ name: 'Ler', creature: 'octopus' });
    await data.habits.setChecked(habitId, '2026-10-21', true); // yesterday: 15

    clock.now = new Date(2026, 9, 22, 10, 0);
    const a = await data.todo.createTask({ listId, title: 'A', dueDate: today });
    const b = await data.todo.createTask({ listId, title: 'B', dueDate: today });
    await data.todo.setCompleted(a, true);
    await data.todo.setCompleted(b, true);
    await data.habits.setChecked(habitId, today, true);

    // Today: 2 tasks (20) + 1 habit (15) + full tide (3 due, 3 done: 25) = 60.
    const result = await progress();
    expect(result.today).toMatchObject({ points: 60, fullTide: true, capped: false });
    expect(result.depth.meters).toBe(15 + 60);
    expect(result.depth.zone.id).toBe('surface');
  });

  it('gives points back when something is undone, and keeps them for deleted tasks', async () => {
    const { data, progress } = await setup();
    clock.now = new Date(2026, 9, 22, 10, 0);
    const listId = await data.todo.createList({ name: 'Casa' });
    const id = await data.todo.createTask({ listId, title: 'A' });
    await data.todo.setCompleted(id, true);
    expect((await progress()).today.points).toBe(10);
    await data.todo.deleteTask(id);
    expect((await progress()).today.points).toBe(10);
    const other = await data.todo.createTask({ listId, title: 'B' });
    await data.todo.setCompleted(other, true);
    await data.todo.setCompleted(other, false);
    expect((await progress()).today.points).toBe(10);
  });
});
