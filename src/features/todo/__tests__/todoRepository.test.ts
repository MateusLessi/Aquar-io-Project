import { createDataChanges } from '@/core/database/changes';
import { migrate, migrations } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import type { Database } from '@/core/database/types';
import { createEventLog } from '@/core/events/eventLog';

import { createTodoRepository, type TodoRepository } from '../data/todoRepository';
import { ValidationError } from '../domain/validation';

const TODAY = '2026-10-18';

async function setup() {
  const db: Database = createMemoryDatabase();
  await migrate(db);
  let counter = 0;
  const newId = () => `id-${++counter}`;
  let clock = new Date('2026-10-18T12:00:00');
  const now = () => clock;
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now });
  const repo: TodoRepository = createTodoRepository({ db, changes, events, newId, now });
  return {
    db,
    repo,
    events,
    changes,
    advance: (ms: number) => (clock = new Date(clock.getTime() + ms)),
  };
}

describe('migrations', () => {
  it('runs once and records the schema version', async () => {
    const db = createMemoryDatabase();
    expect(await migrate(db)).toBe(migrations.length);
    // Running again is a no-op instead of failing on "table already exists".
    expect(await migrate(db)).toBe(migrations.length);
    const row = await db.get<{ user_version: number }>('PRAGMA user_version');
    expect(row?.user_version).toBe(migrations.length);
  });
});

describe('lists', () => {
  it('creates, renames and orders lists with pending counts', async () => {
    const { repo } = await setup();
    const gym = await repo.createList({ name: '  Academia  ', emoji: '🏋️', color: 'kelp' });
    const home = await repo.createList({ name: 'Casa' });
    await repo.createTask({ listId: gym, title: 'Treino de perna' });

    await repo.updateList(home, { name: 'Casa e família', color: 'coral' });

    const lists = await repo.listLists();
    expect(lists.map((l) => l.name)).toEqual(['Academia', 'Casa e família']);
    expect(lists[0]).toMatchObject({ emoji: '🏋️', color: 'kelp', pendingCount: 1 });
    expect(lists[1]).toMatchObject({ color: 'coral', pendingCount: 0 });
  });

  it('rejects empty names and unknown colors', async () => {
    const { repo } = await setup();
    await expect(repo.createList({ name: '   ' })).rejects.toThrow(ValidationError);
    await expect(repo.createList({ name: 'X', color: 'pink' as never })).rejects.toThrow(
      'Cor inválida.',
    );
  });

  it('deleting a list hides it and its tasks', async () => {
    const { repo } = await setup();
    const list = await repo.createList({ name: 'Faculdade' });
    const task = await repo.createTask({ listId: list, title: 'Relatório', dueDate: TODAY });

    await repo.deleteList(list);

    expect(await repo.listLists()).toEqual([]);
    expect(await repo.getTask(task)).toBeNull();
    expect(await repo.listToday(TODAY)).toEqual([]);
  });
});

describe('tasks', () => {
  it('creates tasks with details and edits them', async () => {
    const { repo } = await setup();
    const list = await repo.createList({ name: 'Faculdade' });
    const id = await repo.createTask({ listId: list, title: 'Relatório', priority: 3 });

    await repo.updateTask(id, { notes: '  capítulo 2  ', dueDate: '2026-10-20' });

    expect(await repo.getTask(id)).toMatchObject({
      title: 'Relatório',
      priority: 3,
      notes: 'capítulo 2',
      dueDate: '2026-10-20',
      completedAt: null,
    });
  });

  it('validates titles, dates and priorities', async () => {
    const { repo } = await setup();
    const list = await repo.createList({ name: 'L' });
    await expect(repo.createTask({ listId: list, title: '' })).rejects.toThrow(
      'Dê um nome para a tarefa.',
    );
    await expect(
      repo.createTask({ listId: list, title: 'X', dueDate: '2026-02-30' }),
    ).rejects.toThrow('Data inválida.');
    await expect(
      repo.createTask({ listId: list, title: 'X', priority: 7 as never }),
    ).rejects.toThrow('Prioridade inválida.');
  });

  it('supports one level of subtasks, counted on the parent', async () => {
    const { repo } = await setup();
    const list = await repo.createList({ name: 'Academia' });
    const workout = await repo.createTask({ listId: list, title: 'Treino push' });
    const bench = await repo.createTask({ listId: list, parentTaskId: workout, title: 'Supino' });
    await repo.createTask({ listId: list, parentTaskId: workout, title: 'Tríceps' });
    await repo.setCompleted(bench, true);

    expect(await repo.getTask(workout)).toMatchObject({ subtaskCount: 2, subtaskDoneCount: 1 });
    expect((await repo.listSubtasks(workout)).map((t) => t.title)).toEqual(['Supino', 'Tríceps']);
    // Subtasks don't appear as top-level tasks of the list.
    expect((await repo.listTasks(list)).map((t) => t.title)).toEqual(['Treino push']);
    await expect(
      repo.createTask({ listId: list, parentTaskId: bench, title: 'Nível 3' }),
    ).rejects.toThrow('Subtarefas não podem ter subtarefas.');
  });

  it('orders open tasks first, then completed ones', async () => {
    const { repo, advance } = await setup();
    const list = await repo.createList({ name: 'Casa' });
    const a = await repo.createTask({ listId: list, title: 'A' });
    await repo.createTask({ listId: list, title: 'B' });
    await repo.setCompleted(a, true);
    advance(1000);

    expect((await repo.listTasks(list)).map((t) => t.title)).toEqual(['B', 'A']);
  });

  it('deleting a task also deletes its subtasks', async () => {
    const { repo } = await setup();
    const list = await repo.createList({ name: 'Casa' });
    const parent = await repo.createTask({ listId: list, title: 'Mudança' });
    const child = await repo.createTask({ listId: list, parentTaskId: parent, title: 'Caixas' });

    await repo.deleteTask(parent);

    expect(await repo.getTask(child)).toBeNull();
    expect(await repo.listTasks(list)).toEqual([]);
  });
});

describe('completion events', () => {
  it('records TASK_COMPLETED and TASK_UNCOMPLETED once per real change', async () => {
    const { repo, events } = await setup();
    const published: string[] = [];
    events.subscribe((event) => published.push(event.type));
    const list = await repo.createList({ name: 'Casa' });
    const task = await repo.createTask({ listId: list, title: 'Lavar louça' });

    await repo.setCompleted(task, true);
    await repo.setCompleted(task, true); // already done: no second event
    await repo.setCompleted(task, false);

    expect(await events.count('TASK_COMPLETED')).toBe(1);
    expect(await events.count('TASK_UNCOMPLETED')).toBe(1);
    expect(published).toEqual(['TASK_COMPLETED', 'TASK_UNCOMPLETED']);
    expect((await repo.getTask(task))?.completedAt).toBeNull();
  });

  it('notifies live screens about what changed', async () => {
    const { repo, changes } = await setup();
    const topics: string[] = [];
    changes.subscribe((topic) => topics.push(topic));
    const list = await repo.createList({ name: 'Casa' });
    const task = await repo.createTask({ listId: list, title: 'X' });
    await repo.setCompleted(task, true);

    expect(topics).toEqual(['lists', 'tasks', 'tasks', 'lists']);
  });
});

describe('today', () => {
  it('shows tasks due today and open overdue tasks, overdue first', async () => {
    const { repo } = await setup();
    const list = await repo.createList({ name: 'Faculdade', color: 'tide', emoji: '📚' });
    await repo.createTask({ listId: list, title: 'Hoje A', dueDate: TODAY });
    const doneToday = await repo.createTask({ listId: list, title: 'Hoje feita', dueDate: TODAY });
    await repo.createTask({ listId: list, title: 'Atrasada', dueDate: '2026-10-16' });
    const doneLate = await repo.createTask({
      listId: list,
      title: 'Atrasada feita',
      dueDate: '2026-10-15',
    });
    await repo.createTask({ listId: list, title: 'Amanhã', dueDate: '2026-10-19' });
    await repo.createTask({ listId: list, title: 'Sem data' });
    await repo.setCompleted(doneToday, true);
    await repo.setCompleted(doneLate, true);

    const today = await repo.listToday(TODAY);

    expect(today.map((t) => t.title)).toEqual(['Atrasada', 'Hoje A', 'Hoje feita']);
    expect(today[0]).toMatchObject({ listName: 'Faculdade', listColor: 'tide', listEmoji: '📚' });
  });
});
