import { Crown, Gem, Palette, Shell, Sparkles, Trophy, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import {
  DeepSurface,
  Glyph,
  type GlyphKey,
  Grid,
  RisingBubbles,
  Screen,
  Surface,
  Text,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
  type ListColorName,
} from '@/design-system';

/**
 * The shop, as a showcase for now (MOCK): nothing can be bought yet. It shows what is coming
 * so the structure is in place; payments arrive with Etapas 16 and 17 (docs/roadmap.md).
 * Core features are never behind a payment (docs/gamification.md).
 */
const plans: {
  name: string;
  description: string;
  perks: string[];
  color: ListColorName;
  icon: LucideIcon;
}[] = [
  {
    name: 'Mar Aberto',
    description: 'Para quem quer ir mais fundo.',
    perks: [
      'Temas exclusivos do oceano',
      'Estatísticas detalhadas',
      'Mais criaturas para escolher',
    ],
    color: 'tide',
    icon: Crown,
  },
  {
    name: 'Temporada Ranqueada',
    description: 'Compita com outras pessoas pela consistência.',
    perks: ['Divisões e temporadas', 'Recompensas cosméticas', 'Entrada simbólica'],
    color: 'coral',
    icon: Trophy,
  },
];

const cosmetics: { name: string; icon: GlyphKey; color: ListColorName }[] = [
  { name: 'Recife de corais', icon: 'shell', color: 'coral' },
  { name: 'Bolhas douradas', icon: 'sparkles', color: 'sand' },
  { name: 'Água-viva neon', icon: 'gem', color: 'anemone' },
  { name: 'Fundo abissal', icon: 'moon', color: 'tide' },
  { name: 'Floresta de algas', icon: 'leaf', color: 'kelp' },
  { name: 'Lagoa tropical', icon: 'palm', color: 'lagoon' },
];

export function ShopScreen() {
  const breakpoint = useBreakpoint();
  const { colors } = useTheme();
  return (
    <Screen title="Loja" eyebrow="Em breve">
      <DeepSurface radius="xl" style={styles.hero}>
        <RisingBubbles height={160} count={10} />
        <View style={styles.treasure} accessibilityElementsHidden>
          <Shell size={30} color={colors.deepAccent} />
          <Gem size={30} color={colors.deepAccent} />
          <Sparkles size={30} color={colors.deepAccent} />
        </View>
        <Text variant="title1" tone="onDeep">
          Tesouros do oceano
        </Text>
        <Text variant="callout" tone="onDeepSecondary">
          Planos e cosméticos para deixar seu aquário com a sua cara. Tudo que existe hoje no
          Aquar.io continua gratuito.
        </Text>
      </DeepSurface>

      <Section title="Planos">
        <Grid columns={breakpoint === 'compact' ? 1 : 2} gap={spacing.md}>
          {plans.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </Grid>
      </Section>

      <Section title="Cosméticos">
        <Grid columns={breakpoint === 'compact' ? 2 : 3} gap={spacing.md}>
          {cosmetics.map((item) => (
            <CosmeticCard key={item.name} {...item} />
          ))}
        </Grid>
      </Section>
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

function SoonBadge() {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.energy }]}>
      <Text variant="caption" tone="onEnergy">
        Em breve
      </Text>
    </View>
  );
}

function PlanCard({ name, description, perks, color, icon: Icon }: (typeof plans)[number]) {
  const { colors, scheme } = useTheme();
  const tone = listColors[color][scheme];
  return (
    <Surface
      accessible
      accessibilityLabel={`${name}, em breve. ${description} ${perks.join('. ')}.`}
      style={[styles.plan, { borderColor: withAlpha(tone, 0.45) }]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(tone, 0.12) }]} />
      <View style={styles.planHeader}>
        <View style={[styles.icon, { backgroundColor: withAlpha(tone, 0.22) }]}>
          <Icon size={24} color={tone} />
        </View>
        <SoonBadge />
      </View>
      <Text variant="title2">{name}</Text>
      <Text variant="callout" tone="secondary">
        {description}
      </Text>
      <View style={styles.perks}>
        {perks.map((perk) => (
          <Text key={perk} variant="callout">
            <Text variant="callout" style={{ color: tone }}>
              ●{' '}
            </Text>
            {perk}
          </Text>
        ))}
      </View>
      <Text variant="footnote" tone="tertiary" style={{ color: colors.textTertiary }}>
        Preço a definir
      </Text>
    </Surface>
  );
}

function CosmeticCard({ name, icon, color }: (typeof cosmetics)[number]) {
  const { scheme } = useTheme();
  const tone = listColors[color][scheme];
  return (
    <Surface
      accessible
      accessibilityLabel={`${name}, em breve`}
      style={[styles.cosmetic, { borderColor: withAlpha(tone, 0.35) }]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(tone, 0.16) }]} />
      <Palette size={16} color={tone} style={styles.palette} />
      <View style={styles.emoji}>
        <Glyph name={icon} size={34} color={tone} strokeWidth={1.8} />
      </View>
      <Text variant="headline" numberOfLines={1}>
        {name}
      </Text>
      <SoonBadge />
    </Surface>
  );
}

const styles = StyleSheet.create({
  hero: { padding: spacing.xl, gap: spacing.sm, overflow: 'hidden' },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  plan: { padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perks: { gap: spacing.xs, marginVertical: spacing.xs },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  cosmetic: {
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  palette: { position: 'absolute', top: spacing.md, right: spacing.md },
  emoji: { paddingVertical: spacing.xs },
  treasure: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xs },
});
