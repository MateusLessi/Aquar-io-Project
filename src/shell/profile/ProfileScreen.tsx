import { useRouter } from 'expo-router';
import {
  ChartColumn,
  ChevronRight,
  Settings,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  IconButton,
  ListItem,
  Screen,
  Surface,
  Text,
  listColors,
  radius,
  spacing,
  useTheme,
  withAlpha,
  type ListColorName,
} from '@/design-system';
import { ProfileHeader } from './ProfileHeader';
import { ProfileShowcase } from './Showcase';

/** The person: profile, the way to statistics and the shop, and Ajustes (also the gear on top). */
export function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const settings = () => router.push('/profile/settings');

  return (
    <Screen
      title="Perfil"
      actions={<IconButton icon={Settings} label="Ajustes" onPress={settings} />}
    >
      <ProfileHeader />

      <View style={styles.tiles}>
        <Tile
          icon={ChartColumn}
          color="tide"
          title="Estatísticas"
          subtitle="Sua semana e seu mês"
          onPress={() => router.push('/stats')}
        />
        <Tile
          icon={ShoppingBag}
          color="sand"
          title="Loja"
          subtitle="Cenários e planos"
          onPress={() => router.push('/shop')}
        />
      </View>

      <ProfileShowcase />

      <Surface>
        <ListItem
          leading={<Settings size={22} color={colors.accent} />}
          title="Ajustes"
          subtitle="Aparência, calendário, sons, lembretes, conta e dados"
          onPress={settings}
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

/** A big shortcut with an icon on a tinted card. */
function Tile({
  icon: Icon,
  color,
  title,
  subtitle,
  onPress,
}: {
  icon: LucideIcon;
  color: ListColorName;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors, scheme } = useTheme();
  const tone = listColors[color][scheme];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}`}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surfaceRaised,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(tone, 0.16) }]} />
      <Icon size={26} color={tone} />
      <View>
        <Text variant="headline">{title}</Text>
        <Text variant="footnote" tone="secondary">
          {subtitle}
        </Text>
      </View>
    </Pressable>
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
  tiles: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    minHeight: 112,
    borderRadius: radius.xl,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  note: { marginLeft: spacing.xs },
});
