/**
 * How a habit is done from what is linked into it: a list, a folder or a routine
 * (docs/connections.md). Stored on the link, as JSON in `links.rule`.
 */
export type SourceRule = {
  /** Done when every item of the day is done, or when at least `atLeast` are. */
  doneWhen: 'all' | { atLeast: number };
  /**
   * For a folder: which of its lists counts on each weekday (0 = Sunday … 6 = Saturday), or
   * the tasks due that day in any of its lists.
   */
  folder?: { mode: 'weekday'; lists: Partial<Record<number, string>> } | { mode: 'due' };
};

export const DEFAULT_RULE: SourceRule = { doneWhen: 'all' };

const MAX_AT_LEAST = 99;

/** Reads a stored rule; anything missing or malformed falls back to the default. */
export function parseRule(raw: string | null | undefined): SourceRule {
  if (!raw) return DEFAULT_RULE;
  try {
    const value = JSON.parse(raw) as Partial<SourceRule>;
    const rule: SourceRule = { doneWhen: 'all' };
    const atLeast =
      typeof value.doneWhen === 'object' && value.doneWhen
        ? Math.round(Number(value.doneWhen.atLeast))
        : NaN;
    if (atLeast >= 1 && atLeast <= MAX_AT_LEAST) rule.doneWhen = { atLeast };
    const folder = value.folder;
    if (folder?.mode === 'due') rule.folder = { mode: 'due' };
    else if (folder?.mode === 'weekday' && folder.lists && typeof folder.lists === 'object') {
      const lists: Partial<Record<number, string>> = {};
      for (const [day, id] of Object.entries(folder.lists)) {
        const weekday = Number(day);
        if (Number.isInteger(weekday) && weekday >= 0 && weekday <= 6 && typeof id === 'string') {
          lists[weekday] = id;
        }
      }
      rule.folder = { mode: 'weekday', lists };
    }
    return rule;
  } catch {
    return DEFAULT_RULE;
  }
}

/** The JSON to store; null for the default, to keep rows small. */
export function formatRule(rule: SourceRule | null | undefined): string | null {
  const clean = parseRule(rule ? JSON.stringify(rule) : null);
  if (clean.doneWhen === 'all' && !clean.folder) return null;
  return JSON.stringify(clean);
}
