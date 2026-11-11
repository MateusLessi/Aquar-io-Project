import type { Link } from '@/core/links/linksRepository';
import type { SourceRule } from '@/core/links/sourceRule';
import { taskRatio } from '@/features/todo/domain/validation';
import type { TaskKind } from '@/features/todo/domain/types';

/** What the calculation needs about a task (a top-level item of a list). */
export type DayTask = {
  id: string;
  listId: string;
  title: string;
  dueDate: string | null;
  completedAt: string | null;
  kind: TaskKind;
  target: number | null;
  amount: number;
};
export type DayList = { id: string; name: string; folderId: string | null; resets: boolean };
export type DayFolder = { id: string; name: string; parentId: string | null };
export type DayRoutine = {
  id: string;
  name: string;
  days: number;
  items: { id: string; title: string; done: boolean }[];
};

export type DayFacts = {
  tasks: DayTask[];
  lists: DayList[];
  folders: DayFolder[];
  routines: DayRoutine[];
};

/** One thing to do today for a habit: a task of a list, or a step of a routine. */
export type DayItem =
  | { kind: 'task'; id: string; title: string; listId: string; ratio: number; done: boolean }
  | {
      kind: 'routineItem';
      id: string;
      routineId: string;
      title: string;
      ratio: number;
      done: boolean;
    };

/** A habit done from a list, folder or routine, on one day. */
export type HabitDay = {
  items: DayItem[];
  /** What it comes from today: "Push", "Semestre 4", "Treino". */
  label: string;
  /** How many items must be done: all of them, or "at least N". */
  required: number;
  doneCount: number;
  /** 0–1, counting items done in part (2 of 4 sets is half an item). */
  ratio: number;
  done: boolean;
};

/** Every list inside a folder, through its subfolders. */
function listsInFolder(folderId: string, facts: DayFacts): DayList[] {
  const inside = new Set([folderId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const folder of facts.folders) {
      if (folder.parentId && inside.has(folder.parentId) && !inside.has(folder.id)) {
        inside.add(folder.id);
        grew = true;
      }
    }
  }
  return facts.lists.filter((list) => list.folderId !== null && inside.has(list.folderId));
}

const completedOn = (task: DayTask, day: string, dayOfIso: (iso: string) => string) =>
  task.completedAt !== null && dayOfIso(task.completedAt) === day;

/**
 * A list's items for the day. A list that starts over gives all its items. Any other list
 * gives what is due that day, or was done that day: a backlog is not a daily habit.
 */
function itemsOfList(
  list: DayList,
  facts: DayFacts,
  day: string,
  dayOfIso: (iso: string) => string,
): DayItem[] {
  return facts.tasks
    .filter((task) => task.listId === list.id)
    .filter((task) => list.resets || task.dueDate === day || completedOn(task, day, dayOfIso))
    .map((task) => {
      const ratio = taskRatio(task);
      return {
        kind: 'task',
        id: task.id,
        title: task.title,
        listId: list.id,
        ratio,
        done: ratio >= 1,
      };
    });
}

/** What one link brings to the habit today, and how many of its items are required. */
function fromLink(
  link: Link,
  facts: DayFacts,
  day: string,
  weekday: number,
  dayOfIso: (iso: string) => string,
): { items: DayItem[]; label: string } | null {
  if (link.itemKind === 'list') {
    const list = facts.lists.find((l) => l.id === link.itemId);
    return list ? { items: itemsOfList(list, facts, day, dayOfIso), label: list.name } : null;
  }
  if (link.itemKind === 'folder') {
    const folder = facts.folders.find((f) => f.id === link.itemId);
    if (!folder) return null;
    const rule: SourceRule = link.rule;
    if (rule.folder?.mode === 'weekday') {
      // The list of the day, all of its items (these lists start over every day, see the
      // habit editor). No list that day is a rest day.
      const listId = rule.folder.lists[weekday];
      const list = listId ? facts.lists.find((l) => l.id === listId) : undefined;
      return list
        ? { items: itemsOfList({ ...list, resets: true }, facts, day, dayOfIso), label: list.name }
        : { items: [], label: folder.name };
    }
    // Otherwise: what is due that day in any of its lists (exams, assignments).
    const items = listsInFolder(folder.id, facts).flatMap((list) =>
      itemsOfList({ ...list, resets: false }, facts, day, dayOfIso),
    );
    return { items, label: folder.name };
  }
  if (link.itemKind === 'routine') {
    const routine = facts.routines.find((r) => r.id === link.itemId);
    if (!routine) return null;
    const scheduled = (routine.days & (1 << weekday)) !== 0;
    const items: DayItem[] = scheduled
      ? routine.items.map((item) => ({
          kind: 'routineItem',
          id: item.id,
          routineId: routine.id,
          title: item.title,
          ratio: item.done ? 1 : 0,
          done: item.done,
        }))
      : [];
    return { items, label: routine.name };
  }
  return null;
}

/**
 * The day of a habit done from what is linked into it, or null for a habit done on its own.
 * Nothing here is stored: it is read from the items themselves, so marking an item anywhere
 * (its list, the habit, Início, a routine) is the same mark, counted once.
 */
export function habitDay(
  links: Link[],
  facts: DayFacts,
  day: string,
  weekday: number,
  dayOfIso: (iso: string) => string,
): HabitDay | null {
  const sources = links.filter(
    (l) => l.targetKind === 'habit' && ['list', 'folder', 'routine'].includes(l.itemKind),
  );
  if (sources.length === 0) return null;

  const items: DayItem[] = [];
  const labels: string[] = [];
  let required = 0;
  for (const link of sources) {
    const part = fromLink(link, facts, day, weekday, dayOfIso);
    if (!part) continue;
    // The same item linked twice (a list and its folder) counts once.
    const fresh = part.items.filter((item) => !items.some((i) => i.id === item.id));
    items.push(...fresh);
    labels.push(part.label);
    const atLeast = typeof link.rule.doneWhen === 'object' ? link.rule.doneWhen.atLeast : null;
    required += atLeast === null ? fresh.length : Math.min(atLeast, fresh.length);
  }

  const doneCount = items.filter((i) => i.done).length;
  const partial = items.reduce((sum, item) => sum + item.ratio, 0);
  const ratio = required === 0 ? 0 : Math.min(1, partial / required);
  return {
    items,
    label: labels.join(' · '),
    required,
    doneCount,
    ratio,
    done: required > 0 && doneCount >= required,
  };
}

/**
 * Lists whose items feed a habit. Their completions count once, as the habit's steps, and not
 * again as tasks (docs/connections.md).
 */
export function habitSourceLists(links: Link[], facts: Pick<DayFacts, 'lists' | 'folders'>) {
  const ids = new Set<string>();
  for (const link of links) {
    if (link.targetKind !== 'habit') continue;
    if (link.itemKind === 'list') ids.add(link.itemId);
    if (link.itemKind === 'folder') {
      for (const list of listsInFolder(link.itemId, { ...facts, tasks: [], routines: [] })) {
        ids.add(list.id);
      }
    }
  }
  return ids;
}
