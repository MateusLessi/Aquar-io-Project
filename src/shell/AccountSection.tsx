import { CloudCheck, CloudOff, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  ListItem,
  Sheet,
  Surface,
  Text,
  TextInput,
  spacing,
  useTheme,
} from '@/design-system';

import { useAccount, type AccountState } from './Account';

/** Settings section: sign in to sync, or see how sync is going. Hidden when there is no cloud. */
export function AccountSection() {
  const account = useAccount();
  const { colors } = useTheme();
  const [signingIn, setSigningIn] = useState(false);
  if (!account) return null;

  if (!account.email) {
    return (
      <>
        <Surface>
          <ListItem
            title="Sincronizar aparelhos"
            subtitle="Entre com seu e-mail para ver suas listas no celular, no tablet e no computador."
            leading={<CloudOff size={22} color={colors.textSecondary} />}
            onPress={() => setSigningIn(true)}
          />
        </Surface>
        <SignInSheet account={account} visible={signingIn} onClose={() => setSigningIn(false)} />
      </>
    );
  }

  const failed = account.status === 'error';
  return (
    <>
      <Surface>
        <ListItem
          title={account.email}
          subtitle={statusLabel(account)}
          leading={
            failed ? (
              <CloudOff size={22} color={colors.error} />
            ) : (
              <CloudCheck size={22} color={colors.accent} />
            )
          }
        />
      </Surface>
      <View style={styles.actions}>
        <Button
          label="Sincronizar agora"
          variant="secondary"
          icon={RefreshCw}
          loading={account.status === 'syncing'}
          onPress={account.syncNow}
        />
        <Button label="Sair" variant="ghost" onPress={() => void account.signOut()} />
      </View>
      <Text variant="footnote" tone="tertiary" style={styles.note}>
        Ao sair, suas listas continuam neste aparelho.
      </Text>
    </>
  );
}

function statusLabel({ status, lastSyncedAt }: AccountState): string {
  if (status === 'syncing') return 'Sincronizando…';
  if (status === 'error') return 'Sem conexão. Suas mudanças ficam guardadas e sobem depois.';
  if (!lastSyncedAt) return 'Conectado';
  return `Sincronizado ${relativeTime(lastSyncedAt)}`;
}

function relativeTime(iso: string, now = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  return `em ${new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(new Date(iso))}`;
}

type SignInSheetProps = { account: AccountState; visible: boolean; onClose: () => void };

function SignInSheet({ account, visible, onClose }: SignInSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Entrar">
      {/* Remount for each opening so it always starts at the e-mail step. */}
      {visible ? <SignInForm account={account} onDone={onClose} /> : null}
    </Sheet>
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD = 6;

/** E-mail and password. The same form signs in or creates the account. */
function SignInForm({ account, onDone }: { account: AccountState; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState<'signIn' | 'signUp' | null>(null);

  const submit = (mode: 'signIn' | 'signUp') => {
    if (!EMAIL.test(email.trim())) {
      setError('Digite um e-mail válido.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    setBusy(mode);
    setError(undefined);
    (mode === 'signIn' ? account.signIn(email, password) : account.signUp(email, password))
      .then(onDone)
      .catch((failure: unknown) =>
        setError(failure instanceof Error ? failure.message : 'Algo deu errado. Tente de novo.'),
      )
      .finally(() => setBusy(null));
  };

  return (
    <View style={styles.form}>
      <Text variant="body" tone="secondary">
        Use o mesmo e-mail e senha em todos os seus aparelhos.
      </Text>
      <TextInput
        label="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        autoFocus
      />
      <TextInput
        label="Senha"
        value={password}
        onChangeText={setPassword}
        error={error}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => submit('signIn')}
      />
      <Button
        label="Entrar"
        block
        loading={busy === 'signIn'}
        disabled={busy !== null}
        onPress={() => submit('signIn')}
      />
      <Button
        label="Criar conta"
        variant="secondary"
        block
        loading={busy === 'signUp'}
        disabled={busy !== null}
        onPress={() => submit('signUp')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  note: { marginLeft: spacing.xs },
  form: { gap: spacing.lg },
});
