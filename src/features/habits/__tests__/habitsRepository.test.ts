import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import { createEventLog } from '@/core/events/eventLog';

import { createHabitsRepository } from '../data/habitsRepository';

let counter = 0;
const newId = () => `id-${++counter}`;
const clock = { now: new Date(2026, 9, 21, 9, 0) }; // Wednesday 2026-10-21, local time

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now: () => clock.now });
  const habits = createHabitsRepository({ db, changes, events, newId, now: () => clock.now });
  return { db, changes, events, habits };
}

describe('habits repository', () => {
  it('creates habits in order with validated fields', async () => {
    const { habits } = await setup();
    await habits.createHabit({ name: '  Beber   água ', creature: 'fish' });
    await habits.createHabit({ name: 'Academia', creature: 'turtle', days: 0b0111110 });
    const list = await habits.listHabits('2026-10-21');
    expect(list.map((h) => [h.name, h.creature, h.days])).toEqual([
      ['Beber água', 'fish', 0b1111111],
      ['Academia', 'turtle', 0b0111110],
    ]);
    await expect(habits.createHabit({ name: ' ', creature: 'fish' })).rejects.toThrow('Dê um nome');
    await expect(habits.createHabit({ name: 'X', creature: 'fish', days: 0 })).rejects.toThrow(
      'pelo menos um dia',
    );
  });

  it('checks and unchecks a day, recording events once', async () => {
    const { habits, events, changes } = await setup();
    const id = await habits.createHabit({ name: 'Ler', creature: 'octopus' });
    const topics: string[] = [];
    changes.subscribe((t) => topics.push(t));

    await habits.setChecked(id, '2026-10-21', true);
    await habits.setChecked(id, '2026-10-21', true); // already done: no-op
    let [habit] = await habits.listHabits('2026-10-21');
    expect(habit?.doneToday).toBe(true);
    expect(habit?.streak).toBe(1);
    expect(await events.count('HABIT_CHECKED')).toBe(1);

    await habits.setChecked(id, '2026-10-21', false);
    [habit] = await habits.listHabits('2026-10-21');
    expect(habit?.doneToday).toBe(false);
    expect(await events.count('HABIT_UNCHECKED')).toBe(1);

    // Checking again revives the same row instead of adding another.
    await habits.setChecked(id, '2026-10-21', true);
    expect((await habits.getHabit(id, '2026-10-21'))?.doneDays).toEqual(['2026-10-21']);
    expect(topics.every((t) => t === 'habits')).toBe(true);
  });

  it('builds streaks from past check-ins', async () => {
    const { habits } = await setup();
    clock.now = new Date(2026, 9, 10, 9, 0);
    const id = await habits.createHabit({ name: 'Meditar', creature: 'whale' });
    for (const day of ['2026-10-18', '2026-10-19', '2026-10-20']) {
      await habits.setChecked(id, day, true);
    }
    const [habit] = await habits.listHabits('2026-10-21');
    expect(habit?.streak).toBe(3);
    expect(habit?.bestStreak).toBe(3);
  });

  it('edits and deletes', async () => {
    const { habits } = await setup();
    const id = await habits.createHabit({ name: 'Correr', creature: 'dolphin' });
    await habits.updateHabit(id, { name: 'Caminhar', days: 0b1000001 });
    expect((await habits.getHabit(id))?.habit.name).toBe('Caminhar');
    await habits.deleteHabit(id);
    expect(await habits.listHabits()).toEqual([]);
    expect(await habits.getHabit(id)).toBeNull();
    await expect(habits.setChecked(id, '2026-10-21', true)).rejects.toThrow('não existe');
  });
});

describe('habit reminders', () => {
  it('stores unique, sorted reminder times', async () => {
    const { habits } = await setup();
    const id = await habits.createHabit({
      name: 'Beber água',
      creature: 'fish',
      reminderTimes: ['14:00', '10:00', '14:00'],
    });
    expect((await habits.getHabit(id))?.habit.reminderTimes).toEqual(['10:00', '14:00']);
    await habits.updateHabit(id, { reminderTimes: [] });
    expect((await habits.getHabit(id))?.habit.reminderTimes).toEqual([]);
    await expect(habits.updateHabit(id, { reminderTimes: ['7h'] })).rejects.toThrow('inválido');
  });
});
