import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AsyncStorage } from 'expo-sqlite/kv-store';
import { Platform } from 'react-native';

import type { SyncRemote, SyncRow } from './remote';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

let client: SupabaseClient | null | undefined;

/** The Supabase client, or null when the app was built without a Supabase project (e.g. tests). */
export function getSupabase(): SupabaseClient | null {
  if (client === undefined) {
    client =
      url && key
        ? createClient(url, key, {
            auth: {
              // Web keeps the session in localStorage; native in a small SQLite key-value store.
              storage: Platform.OS === 'web' ? undefined : AsyncStorage,
              autoRefreshToken: true,
              persistSession: true,
              detectSessionInUrl: false,
            },
          })
        : null;
  }
  return client;
}

export function createSupabaseRemote(supabase: SupabaseClient): SyncRemote {
  return {
    async push(table, rows) {
      const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`Upload to ${table} failed: ${error.message}`);
    },
    async pull(table, since, limit) {
      let query = supabase.from(table).select('*').order('server_updated_at').limit(limit);
      if (since) query = query.gt('server_updated_at', since);
      const { data, error } = await query;
      if (error) throw new Error(`Download from ${table} failed: ${error.message}`);
      return (data as (SyncRow & { server_updated_at: string })[]) ?? [];
    },
  };
}
