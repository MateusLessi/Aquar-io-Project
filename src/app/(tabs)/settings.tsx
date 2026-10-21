import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSetting } from '@/core/settings/useSetting';
import {
  ListItem,
  Screen,
  SegmentedControl,
  Surface,
  Text,
  spacing,
  useTheme,
  type ThemePreference,
} from '@/design-system';
import { useAccount } from '@/shell/Account';
import { AccountSection } from '@/shell/AccountSection';
import { AMBIENT_SETTING, type AmbientSetting } from '@/shell/ambient';
import { RemindersSection } from '@/shell/reminders/RemindersSection';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

const ambientOptions: { value: AmbientSetting; label: string }[] = [
  { value: 'on', label: 'Ligado' },
  { value: 'off', label: 'Desligado' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, preference, setPreference, reduceMotion, reduceTransparency } = useTheme();
  const hasCloud = useAccount() !== null;
  const [ambient, setAmbient] = useSetting<AmbientSetting>(AMBIENT_SETTING, 'on');

  return (
    <Screen title="Ajustes">
      {hasCloud ? (
        <Section title="Conta e sincronização">
          <AccountSection />
        </Section>
      ) : null}

      <Section title="Aparência">
        <SegmentedControl
          accessibilityLabel="Tema"
          options={themeOptions}
          value={preference}
          onChange={setPreference}
        />
      </Section>

      <Section title="Lembretes">
        <RemindersSection />
      </Section>

      <Section title="Modo Maré">
        <SegmentedControl
          accessibilityLabel="Modo Maré"
          options={ambientOptions}
          value={ambient}
          onChange={(value) => void setAmbient(value)}
        />
        <Text variant="footnote" tone="tertiary" style={styles.note}>
          Com o celular deitado e carregando, o Aquar.io vira um painel com a hora, a maré do dia e
          o que vem a seguir. Toque na tela para sair.
        </Text>
      </Section>

      <Section title="Acessibilidade">
        <Surface>
          <ListItem title="Reduzir movimento" trailing={<Status on={reduceMotion} />} />
          <ListItem
            separator
            title="Reduzir transparência"
            trailing={<Status on={reduceTransparency} />}
          />
        </Surface>
        <Text variant="footnote" tone="tertiary" style={styles.note}>
          O Aquar.io segue as configurações de acessibilidade do sistema.
        </Text>
      </Section>

      {__DEV__ ? (
        <Section title="Desenvolvimento">
          <Surface>
            <ListItem
              title="Catálogo de componentes"
              onPress={() => router.push('/dev/design-system')}
              trailing={<ChevronRight size={20} color={colors.textTertiary} />}
            />
            <ListItem
              separator
              title="Prévia dos Hábitos"
              onPress={() => router.push('/dev/habits')}
              trailing={<ChevronRight size={20} color={colors.textTertiary} />}
            />
            <ListItem
              separator
              title="Prévia do Modo Maré"
              onPress={() => router.push('/dev/ambient?rotation=90')}
              trailing={<ChevronRight size={20} color={colors.textTertiary} />}
            />
          </Surface>
        </Section>
      ) : null}

      <Section title="Sobre">
        <Surface>
          <ListItem
            title="Versão"
            trailing={
              <Text variant="callout" tone="secondary">
                {Constants.expoConfig?.version ?? '—'}
              </Text>
            }
          />
        </Surface>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="tertiary" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Status({ on }: { on: boolean }) {
  return (
    <Text variant="callout" tone={on ? 'accent' : 'secondary'}>
      {on ? 'Ativado' : 'Desativado'}
    </Text>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  note: { marginLeft: spacing.xs },
});
