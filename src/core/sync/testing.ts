// Test helper: an in-memory cloud that behaves like the Supabase tables (see supabase/).
import type { AccountService } from './account';
import type { RemoteRow, SyncRemote, SyncRow } from './remote';

export function createMemoryRemote() {
  const tables = new Map<string, Map<string, RemoteRow>>();
  let clock = Date.parse('2026-01-01T00:00:00.000Z');
  let failing = false;

  const table = (name: string) => {
    let rows = tables.get(name);
    if (!rows) tables.set(name, (rows = new Map()));
    return rows;
  };

  const remote: SyncRemote = {
    async push(name, rows: SyncRow[]) {
      if (failing) throw new Error('offline');
      const stored = table(name);
      for (const row of rows) {
        const existing = stored.get(row.id);
        // Server rule: an older version never overwrites a newer one.
        if (existing && row.updated_at < existing.updated_at) continue;
        clock += 1;
        stored.set(row.id, { ...row, server_updated_at: new Date(clock).toISOString() });
      }
    },
    async pull(name, since, limit) {
      if (failing) throw new Error('offline');
      return [...table(name).values()]
        .filter((row) => since === null || row.server_updated_at > since)
        .sort((a, b) => a.server_updated_at.localeCompare(b.server_updated_at))
        .slice(0, limit);
    },
  };

  return {
    remote,
    rows: (name: string) => [...table(name).values()],
    setOffline: (offline: boolean) => {
      failing = offline;
    },
  };
}

/** A fake account: any email signs in with the code 123456. */
export function createMemoryAccount(remote: SyncRemote, signedInAs: string | null = null) {
  let email = signedInAs;
  const listeners = new Set<(email: string | null) => void>();
  const set = (next: string | null) => {
    email = next;
    listeners.forEach((listener) => listener(next));
  };
  const sentTo: string[] = [];

  const account: AccountService = {
    remote,
    currentEmail: async () => email,
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async sendCode(to) {
      sentTo.push(to);
    },
    async verifyCode(to, code) {
      if (code !== '123456') throw new Error('Código inválido ou expirado.');
      set(to);
    },
    async signOut() {
      set(null);
    },
    setForeground: () => {},
  };
  return { account, sentTo };
}
