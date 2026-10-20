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
});
