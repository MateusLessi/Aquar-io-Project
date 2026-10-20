import type { SupabaseClient } from '@supabase/supabase-js';

import type { SyncRemote } from './remote';
import { createSupabaseRemote, getSupabase } from './supabase';

/** Who is signed in, how to sign in, and where their data syncs to. */
export type AccountService = {
  remote: SyncRemote;
  currentEmail(): Promise<string | null>;
  /** Calls back with the signed-in email (or null) whenever it changes. */
  onChange(listener: (email: string | null) => void): () => void;
  /** Emails a one-time code. Creates the account on first use. */
  sendCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
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
  if (text.includes('expired') || text.includes('invalid') || text.includes('otp')) {
    return new AccountError('Código inválido ou expirado. Confira ou peça um novo.');
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
    async sendCode(email) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw friendly(error);
    },
    async verifyCode(email, code) {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) throw friendly(error);
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
