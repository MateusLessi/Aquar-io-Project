import { createMemoryDatabase } from '@/core/database/testing';
import { createSyncEngine } from '@/core/sync/syncEngine';
import { createMemoryRemote } from '@/core/sync/testing';
import { createAppData, type AppData } from '@/shell/AppData';

/** A device: its own local database, syncing with the shared cloud. */
async function device(cloud: ReturnType<typeof createMemoryRemote>, clock: { now: Date }) {
  const data = await createAppData(createMemoryDatabase(), () => clock.now);
  const sync = createSyncEngine({ db: data.db, remote: cloud.remote, changes: data.changes });
  return { data, sync };
}

const tick = (clock: { now: Date }, ms = 1000) => {
  clock.now = new Date(clock.now.getTime() + ms);
};

async function titles(data: AppData, listId: string) {
  return (await data.todo.listTasks(listId)).map((t) => t.title);
}

describe('sync between devices', () => {
  let cloud: ReturnType<typeof createMemoryRemote>;
  const clock = { now: new Date('2026-10-20T12:00:00.000Z') };

  beforeEach(() => {
    cloud = createMemoryRemote();
  });

  it('brings lists and tasks from the phone to the tablet', async () => {
    const phone = await device(cloud, clock);
    const tablet = await device(cloud, clock);
    const listId = await phone.data.todo.createList({ name: 'Academia' });
    const taskId = await phone.data.todo.createTask({ listId, title: 'Treino de perna' });
    await phone.data.todo.createTask({ listId, parentTaskId: taskId, title: 'Agachamento' });

    expect(await phone.sync.sync()).toEqual({ pushed: 3, pulled: 0 });
    expect(await phone.sync.pendingCount()).toBe(0);

    const notified: string[] = [];
    tablet.data.changes.subscribe((topic) => notified.push(topic));
    expect(await tablet.sync.sync()).toEqual({ pushed: 0, pulled: 3 });
    expect((await tablet.data.todo.listLists()).map((l) => l.name)).toEqual(['Academia']);
    expect(await titles(tablet.data, listId)).toEqual(['Treino de perna']);
    expect(await tablet.data.todo.listSubtasks(taskId)).toHaveLength(1);
    expect(notified.sort()).toEqual(['lists', 'tasks']);
    // Rows that came from the cloud are not sent back.
    expect(await tablet.sync.pendingCount()).toBe(0);
  });

  it('uploads data created before sync existed', async () => {
    const phone = await device(cloud, clock);
    await phone.data.todo.createList({ name: 'Casa' });
    await phone.sync.sync();
    expect(cloud.rows('task_lists')).toHaveLength(1);
  });

  it('keeps the most recent edit when two devices change the same task', async () => {
    const phone = await device(cloud, clock);
    const tablet = await device(cloud, clock);
    const listId = await phone.data.todo.createList({ name: 'Estudos' });
    const taskId = await phone.data.todo.createTask({ listId, title: 'Ler' });
    await phone.sync.sync();
    await tablet.sync.sync();

    await phone.data.todo.updateTask(taskId, { title: 'Ler capítulo 1' });
    tick(clock);
    await tablet.data.todo.updateTask(taskId, { title: 'Ler capítulo 2' });

    // The newer edit wins no matter which device syncs first.
    await tablet.sync.sync();
    await phone.sync.sync();
    await tablet.sync.sync();
    expect(await titles(phone.data, listId)).toEqual(['Ler capítulo 2']);
    expect(await titles(tablet.data, listId)).toEqual(['Ler capítulo 2']);
  });

  it('syncs completion and deletion', async () => {
    const phone = await device(cloud, clock);
    const tablet = await device(cloud, clock);
    const listId = await phone.data.todo.createList({ name: 'Mercado' });
    const milk = await phone.data.todo.createTask({ listId, title: 'Leite' });
    const bread = await phone.data.todo.createTask({ listId, title: 'Pão' });
    await phone.sync.sync();
    await tablet.sync.sync();

    tick(clock);
    await tablet.data.todo.setCompleted(milk, true);
    await tablet.data.todo.deleteTask(bread);
    await tablet.sync.sync();
    await phone.sync.sync();

    const tasks = await phone.data.todo.listTasks(listId);
    expect(tasks.map((t) => t.title)).toEqual(['Leite']);
    expect(tasks[0]?.completedAt).not.toBeNull();
  });

  it('keeps changes queued while offline and sends them later', async () => {
    const phone = await device(cloud, clock);
    await phone.data.todo.createList({ name: 'Viagem' });
    cloud.setOffline(true);
    await expect(phone.sync.sync()).rejects.toThrow('offline');
    expect(await phone.sync.pendingCount()).toBe(1);

    cloud.setOffline(false);
    await phone.sync.sync();
    expect(await phone.sync.pendingCount()).toBe(0);
    expect(cloud.rows('task_lists')).toHaveLength(1);
  });

  it('records when it last synced', async () => {
    const phone = await device(cloud, clock);
    expect(await phone.sync.lastSyncedAt()).toBeNull();
    await phone.sync.sync();
    expect(await phone.sync.lastSyncedAt()).not.toBeNull();
  });

  it('syncs habits and check-ins without duplicating a day checked on both devices', async () => {
    const phone = await device(cloud, clock);
    const tablet = await device(cloud, clock);
    const habitId = await phone.data.habits.createHabit({ name: 'Beber água', creature: 'fish' });
    await phone.sync.sync();
    await tablet.sync.sync();

    const today = '2026-10-20';
    await phone.data.habits.setChecked(habitId, today, true);
    tick(clock);
    await tablet.data.habits.setChecked(habitId, today, true);
    await phone.sync.sync();
    await tablet.sync.sync();
    await phone.sync.sync();

    expect(cloud.rows('habit_checks')).toHaveLength(1);
    const [onTablet] = await tablet.data.habits.listHabits(today);
    expect(onTablet?.doneToday).toBe(true);

    tick(clock);
    await tablet.data.habits.setChecked(habitId, today, false);
    await tablet.sync.sync();
    await phone.sync.sync();
    const [onPhone] = await phone.data.habits.listHabits(today);
    expect(onPhone?.doneToday).toBe(false);
  });
});

describe('routine sync', () => {
  it('brings routines, items and the day’s checks to the other device', async () => {
    const clock = { now: new Date('2026-10-23T10:20:00.000Z') };
    const cloud = createMemoryRemote();
    const phone = await device(cloud, clock);
    const tablet = await device(cloud, clock);
    const id = await phone.data.routines.createRoutine({
      name: 'Manhã',
      start: '00:00',
      end: '23:59',
      items: ['Beber água', 'Alongar'],
    });
    const [routine] = await phone.data.routines.listToday(clock.now);
    await phone.data.routines.setItemChecked(id, routine!.items[0]!.id, '2026-10-23', true);
    await phone.sync.sync();
    await tablet.sync.sync();

    const [onTablet] = await tablet.data.routines.listToday(clock.now);
    expect(onTablet?.name).toBe('Manhã');
    expect(onTablet?.items.map((i) => [i.title, i.done])).toEqual([
      ['Beber água', true],
      ['Alongar', false],
    ]);
  });
});

describe('profile sync', () => {
  it('shows the same name and avatar on every device, last change winning', async () => {
    const clock = { now: new Date('2026-10-23T10:00:00.000Z') };
    const cloud = createMemoryRemote();
    const phone = await device(cloud, clock);
    const tablet = await device(cloud, clock);
    await phone.data.profile.set({ name: 'Mateus', creature: 'turtle' });
    await phone.sync.sync();
    await tablet.sync.sync();
    expect(await tablet.data.profile.get()).toEqual({ name: 'Mateus', creature: 'turtle' });

    clock.now = new Date('2026-10-23T11:00:00.000Z');
    await tablet.data.profile.set({ name: 'Mateus L.', creature: 'whale' });
    await tablet.sync.sync();
    await phone.sync.sync();
    expect(await phone.data.profile.get()).toEqual({ name: 'Mateus L.', creature: 'whale' });
  });

  it('carries over a profile saved in the device settings before sync existed', async () => {
    const db = createMemoryDatabase();
    const first = await createAppData(db);
    await first.settings.set('profileName', 'Mateus');
    await first.settings.set('profileCreature', 'octopus');
    const again = await createAppData(db);
    expect(await again.profile.get()).toEqual({ name: 'Mateus', creature: 'octopus' });
  });
});

describe('sync when one cloud table is missing', () => {
  it('still syncs the other tables and keeps the failed changes queued', async () => {
    const clock = { now: new Date('2026-10-21T12:00:00.000Z') };
    const cloud = createMemoryRemote();
    const remote = {
      push: (table: string, rows: Parameters<typeof cloud.remote.push>[1]) =>
        table === 'habits'
          ? Promise.reject(new Error('relation does not exist'))
          : cloud.remote.push(table, rows),
      pull: cloud.remote.pull,
    };
    const data = await createAppData(createMemoryDatabase(), () => clock.now);
    const sync = createSyncEngine({ db: data.db, remote, changes: data.changes });
    await data.todo.createList({ name: 'Casa' });
    await data.habits.createHabit({ name: 'Ler', creature: 'octopus' });

    await expect(sync.sync()).rejects.toThrow('relation does not exist');
    expect(cloud.rows('task_lists')).toHaveLength(1);
    expect(await sync.pendingCount()).toBe(1);
  });
});
