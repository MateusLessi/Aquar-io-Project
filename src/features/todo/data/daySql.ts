// SQL pieces for lists that start over every day (task_checks), shared by the repositories.

/** The day a list that starts over shows, inlined after a strict check (it is never user text). */
export function dayLiteral(day: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`Bad day key: ${day}`);
  return `'${day}'`;
}

/** Done that day, for an item of a list that starts over every day (task_checks). */
export const doneOn = (task: string, day: string) =>
  `(SELECT c.updated_at FROM task_checks c WHERE c.task_id = ${task}.id AND c.date = ${dayLiteral(day)}
     AND c.done = 1 AND c.deleted_at IS NULL)`;
export const resetsOf = (task: string) =>
  `(SELECT r.resets FROM task_lists r WHERE r.id = ${task}.list_id)`;
