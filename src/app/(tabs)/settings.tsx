import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
  Checkbox,
  ListItem,
  Screen,
  SegmentedControl,
  Surface,
  Text,
  spacing,
  useTheme,
  type ThemePreference,
} from '@/design-system';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const {
    colors,
    preference,
    setPreference,
    reduceMotion,
    reduceTransparency,
    experimentalAndroidBlur,
    setExperimentalAndroidBlur,
  } = useTheme();

  return (
    <Screen title="Ajustes">
      <Section title="Aparência">
        <SegmentedControl
          accessibilityLabel="Tema"
          options={themeOptions}
          value={preference}
          onChange={setPreference}
        />
        {/* TODO(Etapa 4): persist the theme preference once local storage exists. */}
        <Text variant="footnote" tone="tertiary" style={styles.note}>
          Por enquanto, a escolha vale até o app fechar.
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
            {Platform.OS === 'android' ? (
              <ListItem
                separator
                title="Blur real no Android (experimental)"
                subtitle="Compare desempenho e visual no tablet"
                trailing={
                  <Checkbox
                    label="Blur real no Android"
                    checked={experimentalAndroidBlur}
                    onChange={setExperimentalAndroidBlur}
                  />
                }
              />
            ) : null}
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
