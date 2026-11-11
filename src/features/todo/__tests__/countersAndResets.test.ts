import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import { createEventLog } from '@/core/events/eventLog';

import { createTodoRepository } from '../data/todoRepository';
import { taskRatio, ValidationError } from '../domain/validation';

const DAY = 24 * 60 * 60 * 1000;

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  let counter = 0;
  const newId = () => `id-${++counter}`;
  let clock = new Date('2026-11-17T10:00:00');
  const now = () => clock;
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now });
  const repo = createTodoRepository({ db, changes, events, newId, now });
  return { db, repo, advance: (ms: number) => (clock = new Date(clock.getTime() + ms)) };
}

describe('items with a counter or a timer', () => {
  it('a count item fills toward its goal and completes on reaching it', async () => {
    const { repo } = await setup();
    const list = await repo.createList({ name: 'Push' });
    const id = await repo.createTask({
      listId: list,
      title: 'Supino',
      kind: 'count',
      target: 4,
      unit: 'séries',
    });
    await repo.addAmount(id, 2);
    let [task] = await repo.listTasks(list);
    expect(task).toMatchObject({ kind: 'count', target: 4, unit: 'séries', amount: 2 });
    expect(task!.completedAt).toBeNull();
    expect(taskRatio(task!)).toBe(0.5);

    await repo.addAmount(id, 2);
    [task] = await repo.listTasks(list);
    expect(task!.completedAt).not.toBeNull();

    // Going back below the goal reopens it, keeping what was done.
    await repo.addAmount(id, -1);
    [task] = await repo.listTasks(list);
    expect(task).toMatchObject({ amount: 3, completedAt: null });
  });

  it('a time item counts the timer, even across a closed app', async () => {
    const { repo, advance } = await setup();
    const list = await repo.createList({ name: 'Push' });
    const id = await repo.createTask({ listId: list, title: 'Prancha', kind: 'time', target: 1 });
    await repo.startTimer(id);
    expect((await repo.listTasks(list))[0]!.timerStartedAt).not.toBeNull();
    advance(70_000);
    expect(await repo.stopTimer(id)).toBe(70);
    const [task] = await repo.listTasks(list);
    expect(task).toMatchObject({ amount: 70, timerStartedAt: null });
    expect(task!.completedAt).not.toBeNull();
  });

  it('rejects goals that make no sense', async () => {
    const { repo } = await setup();
    const list = await repo.createList({ name: 'Push' });
    await expect(
      repo.createTask({ listId: list, title: 'X', kind: 'count', target: 0 }),
    ).rejects.toThrow(ValidationError);
    const id = await repo.createTask({ listId: list, title: 'Alongar' });
    await expect(repo.addAmount(id, 1)).rejects.toThrow(ValidationError);
  });
});

describe('lists that start over every day', () => {
  it('marks items for today only: tomorrow they come back unchecked', async () => {
    const { repo, advance } = await setup();
    const list = await repo.createList({ name: 'Legday', resets: true });
    const squat = await repo.createTask({ listId: list, title: 'Agachamento' });
    const press = await repo.createTask({
      listId: list,
      title: 'Leg press',
      kind: 'count',
      target: 3,
    });

    await repo.setCompleted(squat, true);
    await repo.addAmount(press, 1);
    let tasks = await repo.listTasks(list);
    expect(tasks.find((t) => t.id === squat)!.completedAt).not.toBeNull();
    expect(tasks.find((t) => t.id === press)!.amount).toBe(1);
    expect((await repo.getList(list))!).toMatchObject({ resets: true, pendingCount: 1 });

    advance(DAY);
    tasks = await repo.listTasks(list);
    expect(tasks.every((t) => t.completedAt === null && t.amount === 0)).toBe(true);
    expect((await repo.getList(list))!.pendingCount).toBe(2);
  });

  it("counts each day's marks on their day, with the list they came from", async () => {
    const { repo, advance } = await setup();
    const gym = await repo.createList({ name: 'Legday', resets: true });
    const chores = await repo.createList({ name: 'Casa' });
    const squat = await repo.createTask({ listId: gym, title: 'Agachamento' });
    const dishes = await repo.createTask({ listId: chores, title: 'Louça' });
    await repo.setCompleted(squat, true);
    await repo.setCompleted(dishes, true);
    advance(DAY);
    await repo.setCompleted(squat, true);

    const { completions } = await repo.progressFacts('2026-11-18');
    expect(completions).toEqual(
      expect.arrayContaining([
        { day: '2026-11-17', subtask: false, listId: chores },
        { day: '2026-11-17', subtask: false, listId: gym },
        { day: '2026-11-18', subtask: false, listId: gym },
      ]),
    );
    expect(completions).toHaveLength(3);
  });
});
