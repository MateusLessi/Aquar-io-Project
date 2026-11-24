import { useRouter } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Fish,
  HeartHandshake,
  LayoutGrid,
  Sparkles,
  Trophy,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ListItem, Screen, Surface, Text, radius, spacing, useTheme } from '@/design-system';

import { AppearanceSettings } from '../settings/sections';
import { OrnamentPicker } from './OrnamentPicker';
import { RegionPicker } from './RegionPicker';

/** A way to make the app yours that already exists, and where it lives. */
type Shortcut = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: Parameters<ReturnType<typeof useRouter>['push']>[0];
};

const shortcuts: Shortcut[] = [
  {
    icon: UserRound,
    title: 'Sua criatura e sua cor',
    subtitle: 'Quem você é no oceano, no seu perfil',
    href: { pathname: '/profile', params: { edit: '1' } },
  },
  {
    icon: LayoutGrid,
    title: 'Blocos do Início',
    subtitle: 'O que aparece e em que ordem',
    href: { pathname: '/profile/settings', params: { section: 'home', focus: 'home-cards' } },
  },
  {
    icon: Fish,
    title: 'Criatura dos hábitos novos',
    subtitle: 'Quem nasce quando você cria um hábito',
    href: { pathname: '/profile/settings', params: { section: 'game' } },
  },
  {
    icon: Trophy,
    title: 'Regiões e comemorações',
    subtitle: 'O jogo do mergulho, do seu jeito',
    href: { pathname: '/profile/settings', params: { section: 'game', focus: 'game' } },
  },
  {
    icon: Bell,
    title: 'Sons e lembretes',
    subtitle: 'Bolhas, vibração e horário silencioso',
    href: { pathname: '/profile/settings', params: { section: 'sounds' } },
  },
];

/**
 * Personalizar (Fase 5b, was the shop): it opens with what you can already change, free:
 * theme and text size right here, shortcuts to the rest. Then one honest line on what is
 * coming, and a small card for the plans. Nothing here is for sale yet, and nothing in use
 * today will ever become paid (docs/gamification.md).
 */
export function PersonalizeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Screen title="Personalizar" eyebrow="Tudo isto já é seu, de graça">
      <Section title="Cenário do aquário">
        <RegionPicker />
      </Section>

      <Section title="Enfeites do lago">
        <OrnamentPicker />
      </Section>

      <Section title="Aparência">
        <AppearanceSettings />
      </Section>

      <Section title="Mais do seu jeito">
        <Surface>
          {shortcuts.map((item, i) => (
            <ListItem
              key={item.title}
              separator={i > 0}
              leading={<item.icon size={22} color={colors.accent} />}
              title={item.title}
              subtitle={item.subtitle}
              onPress={() => router.push(item.href)}
              trailing={<ChevronRight size={20} color={colors.textTertiary} />}
            />
          ))}
        </Surface>
      </Section>

      {/* What is coming, said plainly: no showcase of things that don't exist. */}
      <View style={styles.soon}>
        <Sparkles size={18} color={colors.textSecondary} />
        <Text variant="callout" tone="secondary" style={styles.flex}>
          Em breve: o nível das criaturas e criaturas raras. Nada do que você usa hoje vai virar
          pago.
        </Text>
      </View>

      <Surface style={styles.plans}>
        <View style={[styles.plansIcon, { backgroundColor: colors.accentSoft }]}>
          <HeartHandshake size={22} color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <Text variant="headline">Planos</Text>
          <Text variant="footnote" tone="secondary">
            Para apoiar o app · preço a definir
          </Text>
        </View>
      </Surface>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
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
  flex: { flex: 1 },
  soon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  plans: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  plansIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
