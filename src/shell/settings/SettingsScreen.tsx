import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import {
  Glyph,
  ListItem,
  Screen,
  Surface,
  Text,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';

import { useAccount } from '../Account';
import { useFeedbackSettings } from '../feedback/useFeedbackSettings';
import { useGamePrefs, useStartTab, startTabs } from './prefs';
import {
  AboutSettings,
  AccessibilitySettings,
  AccountDataSettings,
  AppearanceSettings,
  CalendarSettings,
  GameSettings,
  HomeSettings,
  SoundRemindersSettings,
  TideModeSettings,
} from './sections';

const SECTIONS = {
  appearance: { title: 'Aparência', icon: 'palette', render: AppearanceSettings },
  home: { title: 'Início', icon: 'house', render: HomeSettings },
  calendar: { title: 'Calendário', icon: 'calendar', render: CalendarSettings },
  sounds: { title: 'Sons, toque e lembretes', icon: 'bell', render: SoundRemindersSettings },
  game: { title: 'Hábitos e jogo', icon: 'shell', render: GameSettings },
  tide: { title: 'Modo Maré', icon: 'waves', render: TideModeSettings },
  accessibility: { title: 'Acessibilidade', icon: 'accessibility', render: AccessibilitySettings },
  account: { title: 'Conta e dados', icon: 'cloud', render: AccountDataSettings },
  about: { title: 'Sobre o Aquar.io', icon: 'info', render: AboutSettings },
} as const;
export type SettingsSection = keyof typeof SECTIONS;
const ORDER = Object.keys(SECTIONS) as SettingsSection[];
const isSection = (value: string | undefined): value is SettingsSection =>
  value !== undefined && value in SECTIONS;

/** What each row says without opening it ("Semana começa no domingo · 24 h"). */
function useSummaries(): Record<SettingsSection, string> {
  const { preference, textScale, reduceMotion, reduceTransparency, highContrast } = useTheme();
  const { weekStart, clock24 } = useCalendarPrefs();
  const [startTab] = useStartTab();
  const { prefs } = useFeedbackSettings();
  const game = useGamePrefs();
  const account = useAccount();
  const a11y = [
    reduceMotion && 'menos movimento',
    reduceTransparency && 'sem transparência',
    highContrast && 'alto contraste',
  ].filter(Boolean);
  return {
    appearance: `Tema ${{ system: 'do sistema', light: 'claro', dark: 'escuro', crystal: 'crystal' }[preference]} · texto ${
      textScale > 1.2 ? 'maior' : textScale > 1 ? 'grande' : 'padrão'
    }`,
    home: `Abre em ${startTabs.find((t) => t.value === startTab)?.label ?? 'Início'}`,
    calendar: `Semana começa ${weekStart === 1 ? 'na segunda' : 'no domingo'} · ${clock24 ? '24 h' : '12 h'}`,
    sounds: prefs.sound
      ? `Sons ligados · volume ${Math.round(prefs.volume * 100)}%`
      : 'Sons desligados',
    game: game.showDepth ? 'Profundidade visível' : 'Profundidade escondida',
    tide: 'Tela de descanso carregando',
    accessibility: a11y.length
      ? a11y.join(', ').replace(/^./, (c) => c.toUpperCase())
      : 'Como no aparelho',
    account: account?.email ?? 'Exportar e apagar dados',
    about: `Versão ${Constants.expoConfig?.version ?? '—'}`,
  };
}

/**
 * Ajustes: nine sections. On a phone, a list that opens each section; on tablets and
 * computers, the list on the left and the open section on the right.
 */
export function SettingsScreen() {
  const wide = useBreakpoint() !== 'compact';
  const params = useLocalSearchParams<{ section?: string }>();
  const open = isSection(params.section) ? params.section : null;
  const summaries = useSummaries();
  const choose = (section: SettingsSection) => router.setParams({ section });

  if (!wide && open) {
    const Section = SECTIONS[open].render;
    return (
      <Screen title={SECTIONS[open].title} onBack={() => router.setParams({ section: '' })}>
        <Section />
      </Screen>
    );
  }

  const list = (
    <SectionList
      active={wide ? (open ?? 'appearance') : null}
      summaries={summaries}
      onChoose={choose}
    />
  );
  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile'));
  if (!wide) {
    return (
      <Screen title="Ajustes" onBack={back}>
        {list}
      </Screen>
    );
  }
  const current = open ?? 'appearance';
  const Section = SECTIONS[current].render;
  return (
    <Screen title="Ajustes" onBack={back} wide>
      <View style={styles.columns}>
        <View style={styles.rail}>{list}</View>
        <View style={styles.detail}>
          <Text variant="title2" accessibilityRole="header">
            {SECTIONS[current].title}
          </Text>
          <Section />
        </View>
      </View>
    </Screen>
  );
}

function SectionList({
  active,
  summaries,
  onChoose,
}: {
  active: SettingsSection | null;
  summaries: Record<SettingsSection, string>;
  onChoose: (section: SettingsSection) => void;
}) {
  const { colors } = useTheme();
  return (
    <Surface>
      {ORDER.map((id, i) => (
        <ListItem
          key={id}
          separator={i > 0}
          title={SECTIONS[id].title}
          subtitle={summaries[id]}
          selected={active === id}
          leading={
            <View style={[styles.icon, { backgroundColor: withAlpha(colors.accent, 0.14) }]}>
              <Glyph name={SECTIONS[id].icon} size={20} color={colors.accent} />
            </View>
          }
          trailing={<ChevronRight size={20} color={colors.textTertiary} />}
          onPress={() => onChoose(id)}
        />
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: spacing.xl, alignItems: 'flex-start' },
  rail: { width: 340 },
  detail: { flex: 1, gap: spacing.lg },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
