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

/**
 * Two steps, no password: the person types their e-mail, receives a one-time code and types it
 * here. Works the same on every device, with no links to open.
 */
function SignInForm({ account, onDone }: { account: AccountState; onDone: () => void }) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const attempt = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await work();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Algo deu errado. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () => {
    if (!EMAIL.test(email.trim())) {
      setError('Digite um e-mail válido.');
      return;
    }
    void attempt(async () => {
      await account.sendCode(email);
      setStep('code');
    });
  };

  const verify = () =>
    void attempt(async () => {
      await account.verifyCode(email, code);
      onDone();
    });

  if (step === 'email') {
    return (
      <View style={styles.form}>
        <Text variant="body" tone="secondary">
          Vamos enviar um código para o seu e-mail. Não precisa de senha.
        </Text>
        <TextInput
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          error={error}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={sendCode}
          autoFocus
        />
        <Button label="Enviar código" block loading={busy} onPress={sendCode} />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Text variant="body" tone="secondary">
        Enviamos um código para {email.trim()}. Ele chega em até um minuto; confira também o spam.
      </Text>
      <TextInput
        label="Código"
        value={code}
        onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
        error={error}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={10}
        returnKeyType="done"
        onSubmitEditing={verify}
        autoFocus
      />
      <Button label="Entrar" block loading={busy} disabled={code.length < 6} onPress={verify} />
      <Button
        label="Usar outro e-mail"
        variant="ghost"
        block
        onPress={() => {
          setStep('email');
          setCode('');
          setError(undefined);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  note: { marginLeft: spacing.xs },
  form: { gap: spacing.lg },
});
