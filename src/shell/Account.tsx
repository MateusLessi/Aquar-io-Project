import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import type { DataChanges } from '@/core/database/changes';
import type { Database } from '@/core/database/types';
import type { AccountService } from '@/core/sync/account';
import { createSyncEngine } from '@/core/sync/syncEngine';

/** Local edits wait this long before uploading, so a burst of changes goes up together. */
const EDIT_DEBOUNCE_MS = 1500;
/** While the app is open, also check the cloud this often for changes from other devices. */
const POLL_MS = 60_000;

export type SyncStatus = 'idle' | 'syncing' | 'error';

export type AccountState = {
  email: string | null;
  status: SyncStatus;
  lastSyncedAt: string | null;
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  syncNow(): void;
};

const AccountContext = createContext<AccountState | null>(null);

/** Null when the app has no cloud (built without a Supabase project). */
export function useAccount(): AccountState | null {
  return useContext(AccountContext);
}

type AccountProviderProps = {
  account: AccountService | null;
  db: Database;
  changes: DataChanges;
  children: ReactNode;
};

export function AccountProvider({ account, children, ...data }: AccountProviderProps) {
  if (!account) return children;
  return (
    <AccountSync account={account} {...data}>
      {children}
    </AccountSync>
  );
}

/** Tracks who is signed in and keeps this device in sync while someone is (ADR-004). */
function AccountSync({
  account,
  db,
  changes,
  children,
}: AccountProviderProps & {
  account: AccountService;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const engine = useMemo(
    () => createSyncEngine({ db, remote: account.remote, changes }),
    [account, db, changes],
  );
  const syncing = useRef(false);

  useEffect(() => {
    let active = true;
    account.currentEmail().then((current) => active && setEmail(current), console.warn);
    engine.lastSyncedAt().then((at) => active && setLastSyncedAt(at), console.warn);
    const unsubscribe = account.onChange(setEmail);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [account, engine]);

  const syncNow = useCallback(() => {
    if (!email || syncing.current) return;
    syncing.current = true;
    setStatus('syncing');
    const run = async () => {
      // Edits made during a sync stay queued; go again until nothing is left.
      do {
        await engine.sync();
      } while ((await engine.pendingCount()) > 0);
    };
    run()
      .then(async () => {
        setStatus('idle');
        setLastSyncedAt(await engine.lastSyncedAt());
      })
      .catch((error: unknown) => {
        // Offline or server trouble: changes stay queued and the next attempt sends them.
        console.warn('Sync failed.', error);
        setStatus('error');
      })
      .finally(() => {
        syncing.current = false;
      });
  }, [email, engine]);

  // Sync on sign-in, after local edits, when the app comes back, and every minute.
  useEffect(() => {
    if (!email) return;
    syncNow();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribeChanges = changes.subscribe((topic) => {
      if (topic === 'settings' || syncing.current) return;
      clearTimeout(timer);
      timer = setTimeout(syncNow, EDIT_DEBOUNCE_MS);
    });
    const poll = setInterval(syncNow, POLL_MS);
    const appState = AppState.addEventListener('change', (state) => {
      account.setForeground(state === 'active');
      if (state === 'active') syncNow();
    });
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      unsubscribeChanges();
      appState.remove();
    };
  }, [email, account, changes, syncNow]);

  const value = useMemo<AccountState>(
    () => ({
      email,
      status,
      lastSyncedAt,
      sendCode: (to) => account.sendCode(to.trim().toLowerCase()),
      verifyCode: (to, code) => account.verifyCode(to.trim().toLowerCase(), code.trim()),
      signOut: () => account.signOut(),
      syncNow,
    }),
    [account, email, status, lastSyncedAt, syncNow],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}
