/** One table that could not sync, and why. */
export type SyncFailure = { table: string; cause: unknown };

/** A sync where some tables failed; the others went through. */
export class SyncError extends Error {
  constructor(readonly failures: SyncFailure[]) {
    const first = failures[0]?.cause;
    const reason = first instanceof Error ? first.message : String(first);
    super(`Sync failed for ${[...new Set(failures.map((f) => f.table))].join(', ')}: ${reason}`);
    this.name = 'SyncError';
  }
}

/**
 * What went wrong, in terms the app can explain:
 * - `offline`: no connection; everything stays queued.
 * - `outdated`: the cloud is missing a table or a column (an SQL migration was not run).
 * - `denied`: signed out or not allowed.
 * - `unknown`: anything else.
 */
export type SyncProblem = { kind: 'offline' | 'outdated' | 'denied' | 'unknown'; tables: string[] };

function textOf(cause: unknown): { message: string; code: string } {
  const value = cause as { message?: unknown; code?: unknown } | null;
  return {
    message: typeof value?.message === 'string' ? value.message : String(cause),
    code: typeof value?.code === 'string' ? value.code : '',
  };
}

function kindOf(cause: unknown): SyncProblem['kind'] {
  const { message, code } = textOf(cause);
  // Postgres: undefined column / table; PostgREST: not in the schema cache.
  if (['42703', '42P01', 'PGRST204', 'PGRST205'].includes(code)) return 'outdated';
  if (/schema cache|does not exist|could not find the .* column/i.test(message)) return 'outdated';
  if (['42501', 'PGRST301', '401', '403'].includes(code)) return 'denied';
  if (/jwt|not authorized|permission denied/i.test(message)) return 'denied';
  if (/failed to fetch|network|fetch failed|timeout|offline/i.test(message)) return 'offline';
  return 'unknown';
}

/** The most useful thing to tell the person: an outdated cloud first, then the rest. */
export function describeSyncError(error: unknown): SyncProblem {
  const failures: SyncFailure[] =
    error instanceof SyncError ? error.failures : [{ table: '', cause: error }];
  const kinds = failures.map((f) => ({ table: f.table, kind: kindOf(f.cause) }));
  const order: SyncProblem['kind'][] = ['outdated', 'denied', 'offline', 'unknown'];
  const kind = order.find((k) => kinds.some((f) => f.kind === k)) ?? 'unknown';
  return {
    kind,
    tables: kinds.filter((f) => f.kind === kind && f.table).map((f) => f.table),
  };
}
