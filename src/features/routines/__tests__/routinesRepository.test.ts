import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import { createEventLog } from '@/core/events/eventLog';

import { createRoutinesRepository } from '../data/routinesRepository';

let counter = 0;
const newId = () => `id-${++counter}`;
const clock = { now: new Date(2026, 9, 23, 7, 20) }; // Friday 07:20

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now: () => clock.now });
  return createRoutinesRepository({ db, changes, events, newId, now: () => clock.now });
}

const morning = {
  name: 'Manhã',
  start: '06:00',
  end: '08:00',
  items: ['Beber água', 'Alongar', 'Café'],
};

describe('routines repository', () => {
  it('lists routines with their phase and today’s checklist', async () => {
    const repo = await setup();
    await repo.createRoutine({
      ...morning,
      name: 'Academia',
      start: '19:00',
      end: '20:00',
      items: [],
    });
    await repo.createRoutine(morning);
    const today = await repo.listToday();
    expect(today.map((r) => [r.name, r.phase, r.minutesLeft])).toEqual([
      ['Manhã', 'now', 40],
      ['Academia', 'upcoming', 700],
    ]);
    expect(today[0]?.items.map((i) => i.title)).toEqual(['Beber água', 'Alongar', 'Café']);
  });

  it('validates times, days and names', async () => {
    const repo = await setup();
    await expect(repo.createRoutine({ ...morning, end: '05:00' })).rejects.toThrow(
      'depois do começo',
    );
    await expect(repo.createRoutine({ ...morning, days: 0 })).rejects.toThrow('pelo menos um dia');
    await expect(repo.createRoutine({ ...morning, name: ' ' })).rejects.toThrow('nome');
  });

  it('checks items for a day only, once', async () => {
    const repo = await setup();
    const id = await repo.createRoutine(morning);
    const [routine] = await repo.listToday();
    const item = routine!.items[0]!;
    await repo.setItemChecked(id, item.id, '2026-10-23', true);
    await repo.setItemChecked(id, item.id, '2026-10-23', true);
    expect((await repo.listToday())[0]?.items[0]?.done).toBe(true);
    // A new day starts fresh.
    clock.now = new Date(2026, 9, 24, 7, 0);
    expect((await repo.listToday())[0]?.items[0]?.done).toBe(false);
    clock.now = new Date(2026, 9, 23, 7, 20);
  });

  it('keeps matching items when the checklist is edited', async () => {
    const repo = await setup();
    const id = await repo.createRoutine(morning);
    const before = (await repo.getRoutine(id))!.items;
    await repo.updateRoutine(id, { ...morning, items: ['Café', 'Beber água', 'Meditar'] });
    const after = (await repo.getRoutine(id))!.items;
    expect(after.map((i) => i.title)).toEqual(['Café', 'Beber água', 'Meditar']);
    // "Beber água" kept its id, so today's check survives the edit.
    expect(after.find((i) => i.title === 'Beber água')?.id).toBe(
      before.find((i) => i.title === 'Beber água')?.id,
    );
  });

  it('reports progress facts for gamification', async () => {
    const repo = await setup();
    const id = await repo.createRoutine(morning);
    const [routine] = await repo.listToday();
    await repo.setItemChecked(id, routine!.items[0]!.id, '2026-10-23', true);
    const facts = await repo.progressFacts('2026-10-23');
    expect(facts.checks).toEqual([{ day: '2026-10-23' }]);
    expect(facts.due).toEqual([{ day: '2026-10-23', total: 3, done: 1 }]);
  });
});
