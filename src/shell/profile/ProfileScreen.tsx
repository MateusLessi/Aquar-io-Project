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
  Switch,
  Text,
  spacing,
  useTheme,
  type ThemePreference,
} from '@/design-system';
import { useAccount } from '../Account';
import { AccountSection } from '../AccountSection';
import { FeedbackSection } from '../feedback/FeedbackSection';
import { AMBIENT_SETTING, type AmbientSetting } from '../ambient';
import { RemindersSection } from '../reminders/RemindersSection';
import { ProfileHeader } from './ProfileHeader';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

const ambientOptions: { value: AmbientSetting; label: string }[] = [
  { value: 'on', label: 'Ligado' },
  { value: 'off', label: 'Desligado' },
];

/** Profile on top, then every setting of the app. */
export function ProfileScreen() {
  const router = useRouter();
  const { colors, preference, setPreference, reduceMotion, reduceTransparency, setAccessibility } =
    useTheme();
  const hasCloud = useAccount() !== null;
  const [ambient, setAmbient] = useSetting<AmbientSetting>(AMBIENT_SETTING, 'on');

  return (
    <Screen title="Perfil">
      <ProfileHeader />

      <Surface>
        <ListItem
          title="Estatísticas"
          subtitle="Sua semana e seu mês em gráficos e tabelas"
          onPress={() => router.push('/profile/stats')}
          trailing={<ChevronRight size={20} color={colors.textTertiary} />}
        />
      </Surface>

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

      <Section title="Sons e toque">
        <FeedbackSection />
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
          <ListItem
            title="Reduzir movimento"
            subtitle="Menos animações e efeitos"
            trailing={
              <Switch
                label="Reduzir movimento"
                value={reduceMotion}
                onChange={(on) => setAccessibility('reduceMotion', on)}
              />
            }
          />
          <ListItem
            separator
            title="Reduzir transparência"
            subtitle="Barras e painéis sólidos em vez de vidro"
            trailing={
              <Switch
                label="Reduzir transparência"
                value={reduceTransparency}
                onChange={(on) => setAccessibility('reduceTransparency', on)}
              />
            }
          />
        </Surface>
        <Text variant="footnote" tone="tertiary" style={styles.note}>
          Começam iguais às configurações do seu aparelho; o que você escolher aqui vale para o
          Aquar.io.
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
              title="Prévia das Rotinas"
              onPress={() => router.push('/dev/routines')}
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

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  note: { marginLeft: spacing.xs },
});
