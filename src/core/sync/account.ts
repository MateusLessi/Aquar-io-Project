import type { SupabaseClient } from '@supabase/supabase-js';

import type { SyncRemote } from './remote';
import { createSupabaseRemote, getSupabase } from './supabase';

/** Who is signed in, how to sign in, and where their data syncs to. */
export type AccountService = {
  remote: SyncRemote;
  currentEmail(): Promise<string | null>;
  /** Calls back with the signed-in email (or null) whenever it changes. */
  onChange(listener: (email: string | null) => void): () => void;
  signIn(email: string, password: string): Promise<void>;
  /** Creates the account and signs in (the project has e-mail confirmation turned off). */
  signUp(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  /** Pause token refresh while the app is in the background (native). */
  setForeground(foreground: boolean): void;
};

/** Messages people can act on, in Portuguese. */
export class AccountError extends Error {}

function friendly(error: { message: string; status?: number; code?: string }): AccountError {
  const text = `${error.code ?? ''} ${error.message}`.toLowerCase();
  if (error.status === 429 || text.includes('rate limit')) {
    return new AccountError('Muitas tentativas. Espere alguns minutos e tente de novo.');
  }
  if (text.includes('invalid login') || text.includes('invalid_credentials')) {
    return new AccountError('E-mail ou senha incorretos.');
  }
  if (text.includes('already registered') || text.includes('user_already_exists')) {
    return new AccountError('Já existe uma conta com esse e-mail. Toque em Entrar.');
  }
  if (text.includes('password')) {
    return new AccountError('A senha precisa ter pelo menos 6 caracteres.');
  }
  if (text.includes('not confirmed')) {
    return new AccountError('Este e-mail ainda não foi confirmado.');
  }
  if (text.includes('email')) return new AccountError('Confira o e-mail digitado.');
  return new AccountError('Não foi possível falar com o servidor. Verifique sua conexão.');
}

export function createSupabaseAccount(supabase: SupabaseClient): AccountService {
  return {
    remote: createSupabaseRemote(supabase),
    async currentEmail() {
      const { data } = await supabase.auth.getSession();
      return data.session?.user.email ?? null;
    },
    onChange(listener) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) =>
        listener(session?.user.email ?? null),
      );
      return () => data.subscription.unsubscribe();
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw friendly(error);
    },
    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw friendly(error);
      // With confirmation on, Supabase answers without a session (and without an error).
      if (!data.session) {
        throw new AccountError('Conta criada, mas o projeto pede confirmação por e-mail.');
      }
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw friendly(error);
    },
    setForeground(foreground) {
      if (foreground) void supabase.auth.startAutoRefresh();
      else void supabase.auth.stopAutoRefresh();
    },
  };
}

/** The app's account service, or null when built without a Supabase project. */
export function createDefaultAccount(): AccountService | null {
  const supabase = getSupabase();
  return supabase ? createSupabaseAccount(supabase) : null;
}
