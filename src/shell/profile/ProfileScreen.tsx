import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ListItem, Screen, Surface, Text, spacing, useTheme } from '@/design-system';
import { ProfileHeader } from './ProfileHeader';
import { ProfileShowcase } from './Showcase';

/** The person: profile, statistics and the way into Ajustes. */
export function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen title="Perfil">
      <ProfileHeader />
      <ProfileShowcase />

      <Surface>
        <ListItem
          title="Estatísticas"
          subtitle="Sua semana e seu mês em gráficos e tabelas"
          onPress={() => router.push('/profile/stats')}
          trailing={<ChevronRight size={20} color={colors.textTertiary} />}
        />
      </Surface>

      <Surface>
        <ListItem
          title="Ajustes"
          subtitle="Aparência, calendário, sons, lembretes, conta e dados"
          onPress={() => router.push('/profile/settings')}
          trailing={<ChevronRight size={20} color={colors.textTertiary} />}
        />
      </Surface>

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
