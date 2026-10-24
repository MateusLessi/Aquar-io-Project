import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import { createEventLog } from '@/core/events/eventLog';

import { createTodoRepository } from '../data/todoRepository';

let counter = 0;
const newId = () => `id-${++counter}`;
const clock = { now: new Date(2026, 9, 24, 9, 0) };
const today = '2026-10-24';

async function setup() {
  const db = createMemoryDatabase();
  await migrate(db);
  const changes = createDataChanges();
  const events = createEventLog({ db, newId, now: () => clock.now });
  const todo = createTodoRepository({ db, changes, events, newId, now: () => clock.now });
  return { db, todo };
}

/** UnB › Semestre 3 › (Cálculo 3, Física 2), plus a loose list. */
async function university() {
  const ctx = await setup();
  const { todo } = ctx;
  const unb = await todo.createFolder({ name: 'UnB', emoji: '🎓', color: 'tide' });
  const s3 = await todo.createFolder({ name: 'Semestre 3', parentId: unb });
  const calc = await todo.createList({ name: 'Cálculo 3', folderId: s3 });
  const fis = await todo.createList({ name: 'Física 2', folderId: s3 });
  const loose = await todo.createList({ name: 'Mercado' });
  await todo.createTask({ listId: calc, title: 'Lista 4', dueDate: '2026-10-25' });
  await todo.createTask({ listId: calc, title: 'Revisar Stokes', dueDate: '2026-10-30' });
  const lab = await todo.createTask({ listId: fis, title: 'Relatório', dueDate: today });
  await todo.createTask({ listId: fis, title: 'Ler cap. 21' });
  await todo.createTask({ listId: loose, title: 'Pão' });
  return { ...ctx, unb, s3, calc, fis, loose, lab };
}

describe('folders', () => {
  it('nests lists in folders and counts everything inside', async () => {
    const { todo, unb, s3, lab } = await university();
    await todo.setCompleted(lab, true);

    const top = await todo.folderContents(null);
    expect(top?.folders.map((f) => f.name)).toEqual(['UnB']);
    expect(top?.lists.map((l) => l.name)).toEqual(['Mercado']);
    expect(top?.path).toEqual([]);

    const [folder] = top!.folders;
    expect(folder).toMatchObject({
      id: unb,
      depth: 1,
      folderCount: 1,
      listCount: 2,
      openCount: 3,
      doneCount: 1,
    });

    const inside = await todo.folderContents(s3);
    expect(inside?.path.map((c) => c.name)).toEqual(['UnB', 'Semestre 3']);
    expect(inside?.lists.map((l) => l.name)).toEqual(['Cálculo 3', 'Física 2']);
    expect(inside?.folder?.depth).toBe(2);
    expect(await todo.folderContents('missing')).toBeNull();
  });

  it('shows every task of a folder together, open by due date and done last', async () => {
    const { todo, unb, lab } = await university();
    await todo.setCompleted(lab, true);
    const tasks = await todo.folderTasks(unb);
    expect(tasks.map((t) => [t.title, t.listName])).toEqual([
      ['Lista 4', 'Cálculo 3'],
      ['Revisar Stokes', 'Cálculo 3'],
      ['Ler cap. 21', 'Física 2'],
      ['Relatório', 'Física 2'],
    ]);
    expect(tasks[0]?.listPath).toEqual(['UnB', 'Semestre 3']);
  });

  it('tells where today’s tasks come from', async () => {
    const { todo } = await university();
    const [task] = await todo.listToday(today);
    expect([task?.title, task?.listPath]).toEqual(['Relatório', ['UnB', 'Semestre 3']]);
  });

  it('limits nesting to 4 levels and never moves a folder into itself', async () => {
    const { todo, unb, s3 } = await university();
    const l3 = await todo.createFolder({ name: 'Nível 3', parentId: s3 });
    const l4 = await todo.createFolder({ name: 'Nível 4', parentId: l3 });
    await expect(todo.createFolder({ name: 'Nível 5', parentId: l4 })).rejects.toThrow('4 níveis');
    await expect(todo.moveFolder(unb, l3)).rejects.toThrow('dentro dela mesma');

    const other = await todo.createFolder({ name: 'Casa' });
    // UnB spans 4 levels: it cannot go inside another folder.
    await expect(todo.moveFolder(unb, other)).rejects.toThrow('4 níveis');
    await todo.moveFolder(l4, other);
    expect((await todo.folderContents(other))?.folders.map((f) => f.name)).toEqual(['Nível 4']);
  });

  it('moves lists between folders and to the top level', async () => {
    const { todo, unb, calc } = await university();
    await todo.moveList(calc, unb);
    expect((await todo.folderContents(unb))?.lists.map((l) => l.name)).toEqual(['Cálculo 3']);
    await todo.moveList(calc, null);
    expect((await todo.folderContents(null))?.lists.map((l) => l.name)).toEqual([
      'Cálculo 3',
      'Mercado',
    ]);
    await expect(todo.moveList(calc, 'missing')).rejects.toThrow('não existe');
  });

  it('deletes a folder keeping what is inside, or with everything', async () => {
    const { todo, unb, s3 } = await university();
    await todo.deleteFolder(s3, 'keep');
    const unbNow = await todo.folderContents(unb);
    expect(unbNow?.lists.map((l) => l.name)).toEqual(['Cálculo 3', 'Física 2']);
    expect(unbNow?.folders).toEqual([]);

    await todo.deleteFolder(unb, 'all');
    const top = await todo.folderContents(null);
    expect(top?.folders).toEqual([]);
    expect(top?.lists.map((l) => l.name)).toEqual(['Mercado']);
    expect(await todo.listToday(today)).toEqual([]);
  });

  it('puts orphans at the top level instead of losing them', async () => {
    const { db, todo, s3 } = await university();
    // As if the parent folder had been deleted on another device without syncing its children.
    await db.run("UPDATE task_folders SET deleted_at = 'x' WHERE name = 'UnB'");
    const top = await todo.folderContents(null);
    expect(top?.folders.map((f) => f.id)).toEqual([s3]);
    // A loop (two devices moving folders into each other) also ends at the top level.
    const a = await todo.createFolder({ name: 'A' });
    const b = await todo.createFolder({ name: 'B', parentId: a });
    await db.run('UPDATE task_folders SET parent_id = ? WHERE id = ?', [b, a]);
    const names = (await todo.folderContents(null))?.folders.map((f) => f.name);
    expect(names).toEqual(expect.arrayContaining(['A', 'B']));
  });

  it('pins a folder and validates names', async () => {
    const { todo, unb } = await university();
    await todo.updateFolder(unb, { pinned: true, name: '  UnB  2026 ' });
    const [folder] = (await todo.listFolders()).filter((f) => f.pinned);
    expect(folder?.name).toBe('UnB 2026');
    await expect(todo.createFolder({ name: ' ' })).rejects.toThrow('Dê um nome para a pasta');
    await expect(todo.updateFolder('missing', { name: 'X' })).rejects.toThrow('não existe');
  });
});
