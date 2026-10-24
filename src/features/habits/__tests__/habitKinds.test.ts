import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import { createEventLog } from '@/core/events/eventLog';

import { createHabitsRepository } from '../data/habitsRepository';
import { amountLabel, clockLabel, fillRatio, goalOf } from '../domain/amount';

let counter = 0;
const newId = () => `id-${++counter}`;
const clock = { now: new Date(2026, 9, 21, 9, 0) }; // Wednesday 2026-10-21, local time
const today = '2026-10-21';

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now: () => clock.now });
  const habits = createHabitsRepository({ db, changes, events, newId, now: () => clock.now });
  const find = async (id: string) => (await habits.listHabits(today)).find((h) => h.id === id)!;
  return { db, events, habits, find };
}

describe('habit kinds', () => {
  beforeEach(() => {
    clock.now = new Date(2026, 9, 21, 9, 0);
  });

  it('keeps existing habits as yes/no', async () => {
    const { habits, find } = await setup();
    const id = await habits.createHabit({ name: 'Meditar', creature: 'whale' });
    const habit = await find(id);
    expect([habit.kind, habit.target, habit.unit, habit.steps]).toEqual(['check', 1, null, []]);
    expect(habit.today).toEqual({ amount: 0, stepsDone: [], ratio: 0, timerStartedAt: null });
    await habits.setChecked(id, today, true);
    expect((await find(id)).today.ratio).toBe(1);
  });

  it('counts toward the goal and is done once it is reached', async () => {
    const { habits, events, find } = await setup();
    const id = await habits.createHabit({
      name: 'Água',
      creature: 'dolphin',
      kind: 'count',
      target: 3,
      unit: ' copos ',
    });
    await habits.addAmount(id, today, 1);
    await habits.addAmount(id, today, 1);
    let habit = await find(id);
    expect(habit.unit).toBe('copos');
    expect([habit.today.amount, habit.doneToday]).toEqual([2, false]);
    expect(habit.today.ratio).toBeCloseTo(2 / 3);
    expect(amountLabel(habit, habit.today.amount)).toBe('2/3 copos');

    await habits.addAmount(id, today, 1);
    habit = await find(id);
    expect([habit.today.amount, habit.doneToday, habit.streak]).toEqual([3, true, 1]);
    expect(await events.count('HABIT_CHECKED')).toBe(1);

    // Going past the goal still counts; going back below reopens the day.
    await habits.addAmount(id, today, 2);
    expect((await find(id)).today.amount).toBe(5);
    await habits.setAmount(id, today, 2);
    habit = await find(id);
    expect([habit.today.amount, habit.doneToday]).toEqual([2, false]);
    await habits.addAmount(id, today, -10);
    expect((await find(id)).today.amount).toBe(0);
  });

  it('fills a checklist step by step, keeping step ids when edited', async () => {
    const { habits, find } = await setup();
    const id = await habits.createHabit({
      name: 'Skincare',
      creature: 'octopus',
      kind: 'checklist',
      steps: [{ title: 'Limpar' }, { title: ' ' }, { title: 'Hidratar' }],
    });
    let habit = await find(id);
    expect(habit.steps.map((s) => s.title)).toEqual(['Limpar', 'Hidratar']);
    expect(habit.target).toBe(2);
    const [limpar, hidratar] = habit.steps;

    await habits.setStep(id, today, limpar!.id, true);
    habit = await find(id);
    expect([habit.today.amount, habit.today.stepsDone, habit.doneToday]).toEqual([
      1,
      [limpar!.id],
      false,
    ]);

    // Renaming keeps the step checked; adding one raises the goal.
    await habits.updateHabit(id, {
      steps: [{ id: limpar!.id, title: 'Limpar o rosto' }, hidratar!, { title: 'Protetor' }],
    });
    habit = await find(id);
    expect(habit.steps.map((s) => s.title)).toEqual(['Limpar o rosto', 'Hidratar', 'Protetor']);
    expect(habit.today.stepsDone).toEqual([limpar!.id]);

    for (const step of habit.steps) await habits.setStep(id, today, step.id, true);
    expect((await find(id)).doneToday).toBe(true);
    await habits.setStep(id, today, hidratar!.id, false);
    expect((await find(id)).doneToday).toBe(false);
    await expect(habits.setStep(id, today, 'nope', true)).rejects.toThrow('não existe');
  });

  it('runs a timer that keeps counting while the app is closed', async () => {
    const { habits, find } = await setup();
    const id = await habits.createHabit({
      name: 'Ler',
      creature: 'fish',
      kind: 'time',
      target: 20,
    });
    await habits.startTimer(id, today);
    expect((await find(id)).today.timerStartedAt).toBe(clock.now.toISOString());

    clock.now = new Date(2026, 9, 21, 9, 12, 30);
    expect(await habits.stopTimer(id)).toBe(750);
    let habit = await find(id);
    expect([habit.today.amount, habit.today.timerStartedAt, habit.doneToday]).toEqual([
      750,
      null,
      false,
    ]);
    expect(amountLabel(habit, habit.today.amount)).toBe('12/20 min');

    await habits.startTimer(id, today);
    clock.now = new Date(2026, 9, 21, 9, 20, 30);
    await habits.stopTimer(id);
    habit = await find(id);
    expect([habit.today.amount, habit.doneToday]).toEqual([1230, true]);
    expect(await habits.stopTimer(id)).toBe(0);
  });

  it('marks a partial day done or not from the calendar', async () => {
    const { habits, find } = await setup();
    const id = await habits.createHabit({
      name: 'Água',
      creature: 'dolphin',
      kind: 'count',
      target: 8,
    });
    await habits.addAmount(id, today, 3);
    await habits.setChecked(id, today, true);
    let habit = await find(id);
    expect([habit.today.amount, habit.doneToday]).toEqual([8, true]);
    await habits.setChecked(id, today, false);
    habit = await find(id);
    expect([habit.today.amount, habit.doneToday]).toEqual([0, false]);
  });

  it('re-evaluates today when the goal changes', async () => {
    const { habits, find } = await setup();
    const id = await habits.createHabit({
      name: 'Água',
      creature: 'dolphin',
      kind: 'count',
      target: 8,
    });
    await habits.addAmount(id, today, 5);
    await habits.updateHabit(id, { target: 5 });
    expect((await find(id)).doneToday).toBe(true);
    await habits.updateHabit(id, { target: 6 });
    expect((await find(id)).doneToday).toBe(false);
  });

  it('shows how full each day of the week was', async () => {
    const { habits, find } = await setup();
    const id = await habits.createHabit({
      name: 'Água',
      creature: 'dolphin',
      kind: 'count',
      target: 4,
    });
    await habits.setAmount(id, '2026-10-19', 2); // Monday
    await habits.setAmount(id, '2026-10-20', 4); // Tuesday
    await habits.setAmount(id, today, 1);
    expect((await find(id)).weekRatios).toEqual([0, 0.5, 1, 0.25, 0, 0, 0]);
    const detail = await habits.getHabit(id, today);
    expect(detail?.dayRatios).toEqual({ '2026-10-19': 0.5, '2026-10-20': 1, [today]: 0.25 });
  });

  it('validates goals, units and steps', async () => {
    const { habits } = await setup();
    const base = { name: 'X', creature: 'fish' } as const;
    await expect(habits.createHabit({ ...base, kind: 'count', target: 0 })).rejects.toThrow(
      'meta',
    );
    await expect(habits.createHabit({ ...base, kind: 'time', target: 601 })).rejects.toThrow(
      'minutos',
    );
    await expect(habits.createHabit({ ...base, kind: 'checklist', steps: [] })).rejects.toThrow(
      'pelo menos um passo',
    );
    await expect(
      habits.createHabit({ ...base, kind: 'count', target: 2, unit: 'x'.repeat(21) }),
    ).rejects.toThrow('20 letras');
    const id = await habits.createHabit(base);
    await expect(habits.addAmount(id, today, 1)).rejects.toThrow('quantidade');
    await expect(habits.startTimer(id, today)).rejects.toThrow('tempo');
  });
});

describe('amount helpers', () => {
  const time = { kind: 'time', target: 20, steps: [], unit: null } as const;
  it('measures time in seconds against a goal in minutes', () => {
    expect(goalOf(time)).toBe(1200);
    expect(fillRatio(time, 600, false)).toBe(0.5);
    expect(fillRatio(time, 5000, false)).toBe(1);
    expect(fillRatio({ ...time, kind: 'check' }, 0, true)).toBe(1);
  });

  it('formats a running clock', () => {
    expect(clockLabel(0)).toBe('0:00');
    expect(clockLabel(724)).toBe('12:04');
    expect(clockLabel(3729)).toBe('1:02:09');
  });
});
