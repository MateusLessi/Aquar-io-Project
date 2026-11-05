import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import { createEventLog } from '@/core/events/eventLog';
import { createTodoRepository } from '@/features/todo/data/todoRepository';

import { collectExport, tasksCsv, wipeLocalData } from '../data/localData';

let n = 0;
const newId = () => `id-${++n}`;
const now = () => new Date(2026, 10, 5, 9);

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now });
  const todo = createTodoRepository({ db, changes, events, newId, now });
  const list = await todo.createList({ name: 'Faculdade, UnB' });
  const task = await todo.createTask({ listId: list, title: 'Lista "4" de Cálculo' });
  await todo.setCompleted(task, true);
  const gone = await todo.createTask({ listId: list, title: 'Apagada' });
  await todo.deleteTask(gone);
  return { db, changes };
}

describe('local data', () => {
  it('exports what exists, without deleted rows', async () => {
    const { db } = await setup();
    const data = await collectExport(db, now());
    expect(data.app).toBe('Aquar.io');
    expect(data.tables.tasks?.map((t) => t.title)).toEqual(['Lista "4" de Cálculo']);
    expect(data.tables.task_lists).toHaveLength(1);
  });

  it('writes the tasks as CSV, quoting what needs it', async () => {
    const { db } = await setup();
    const [head, row] = (await tasksCsv(db)).split('\n');
    expect(head).toBe('Lista,Tarefa,Subtarefa de,Prazo,Concluída em,Criada em');
    expect(row?.startsWith('"Faculdade, UnB","Lista ""4"" de Cálculo",,,')).toBe(true);
  });

  it('wipes the content and the sync queue, and tells the screens', async () => {
    const { db, changes } = await setup();
    const topics: string[] = [];
    changes.subscribe((t) => topics.push(t));
    await wipeLocalData(db, changes);
    expect(await db.all('SELECT * FROM tasks')).toEqual([]);
    expect(await db.all('SELECT * FROM sync_outbox')).toEqual([]);
    expect(topics).toContain('tasks');
  });
});
