import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import {
  Glyph,
  ListItem,
  Screen,
  Surface,
  Text,
  TextInput,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
  type ListColorName,
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
import { CommunitySettings, PrivacySettings } from './community';
import { searchSettings, type SettingEntry } from './search';

const SECTIONS = {
  appearance: { title: 'Aparência', icon: 'palette', color: 'anemone', render: AppearanceSettings },
  sounds: {
    title: 'Sons, toque e lembretes',
    icon: 'bell',
    color: 'coral',
    render: SoundRemindersSettings,
  },
  calendar: { title: 'Calendário', icon: 'calendar', color: 'tide', render: CalendarSettings },
  home: { title: 'Início', icon: 'house', color: 'lagoon', render: HomeSettings },
  game: { title: 'Hábitos e jogo', icon: 'shell', color: 'sand', render: GameSettings },
  tide: { title: 'Modo Maré', icon: 'waves', color: 'tide', render: TideModeSettings },
  accessibility: {
    title: 'Acessibilidade',
    icon: 'accessibility',
    color: 'kelp',
    render: AccessibilitySettings,
  },
  account: { title: 'Conta e dados', icon: 'cloud', color: 'lagoon', render: AccountDataSettings },
  community: {
    title: 'Comunidade e feedback',
    icon: 'users',
    color: 'anemone',
    render: CommunitySettings,
  },
  privacy: { title: 'Privacidade', icon: 'lock', color: 'kelp', render: PrivacySettings },
  about: { title: 'Sobre o Aquar.io', icon: 'info', color: 'sand', render: AboutSettings },
} as const satisfies Record<
  SettingEntry['section'],
  { color: ListColorName } & Record<string, unknown>
>;
export type SettingsSection = keyof typeof SECTIONS;
/** The ones people change most, on top (Checkpoint 076). */
const MOST_USED: SettingsSection[] = ['appearance', 'sounds', 'calendar'];
const REST = (Object.keys(SECTIONS) as SettingsSection[]).filter((s) => !MOST_USED.includes(s));
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
    community: 'Discord, problemas e ideias',
    privacy: 'O que fica onde',
    about: `Versão ${Constants.expoConfig?.version ?? '—'}`,
  };
}

/**
 * Ajustes: a search and the sections, the most used on top. On a phone, a list that opens each
 * section; on tablets and computers, the list on the left and the open section on the right.
 * A search result opens its section on the setting (`?focus=`).
 */
export function SettingsScreen() {
  const wide = useBreakpoint() !== 'compact';
  const params = useLocalSearchParams<{ section?: string }>();
  const open = isSection(params.section) ? params.section : null;
  const summaries = useSummaries();
  const choose = (section: SettingsSection, focus = '') => router.setParams({ section, focus });

  if (!wide && open) {
    const Section = SECTIONS[open].render;
    return (
      <Screen
        title={SECTIONS[open].title}
        onBack={() => router.setParams({ section: '', focus: '' })}
      >
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
  onChoose: (section: SettingsSection, focus?: string) => void;
}) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const results = searchSettings(query);
  const row = (id: SettingsSection, i: number) => (
    <ListItem
      key={id}
      separator={i > 0}
      title={SECTIONS[id].title}
      subtitle={summaries[id]}
      selected={active === id}
      leading={<SectionIcon id={id} />}
      trailing={<ChevronRight size={20} color={colors.textTertiary} />}
      onPress={() => onChoose(id)}
    />
  );
  return (
    <View style={styles.list}>
      <TextInput
        label="Buscar nos ajustes"
        value={query}
        onChangeText={setQuery}
        placeholder="Tema, lembrete, semana…"
        returnKeyType="search"
        onSubmitEditing={() => {
          const first = results[0];
          if (first) onChoose(first.section, first.anchor ?? '');
        }}
      />
      {query.trim() ? (
        results.length > 0 ? (
          <Surface>
            {results.map((entry, i) => (
              <ListItem
                key={entry.id}
                separator={i > 0}
                title={entry.label}
                subtitle={SECTIONS[entry.section].title}
                leading={<SectionIcon id={entry.section} />}
                trailing={<ChevronRight size={20} color={colors.textTertiary} />}
                onPress={() => onChoose(entry.section, entry.anchor ?? '')}
              />
            ))}
          </Surface>
        ) : (
          <Text variant="footnote" tone="secondary" style={styles.label}>
            {`Nada com “${query.trim()}”. Tente outra palavra, como “tema” ou “lembrete”.`}
          </Text>
        )
      ) : (
        <>
          <Text variant="overline" tone="tertiary" style={styles.label}>
            Mais usados
          </Text>
          <Surface>{MOST_USED.map(row)}</Surface>
          <Text variant="overline" tone="tertiary" style={styles.label}>
            Tudo
          </Text>
          <Surface>{REST.map(row)}</Surface>
        </>
      )}
    </View>
  );
}

/** The section's icon on a tint of its own color. */
function SectionIcon({ id }: { id: SettingsSection }) {
  const { scheme } = useTheme();
  const tone = listColors[SECTIONS[id].color][scheme];
  return (
    <View style={[styles.icon, { backgroundColor: withAlpha(tone, 0.2) }]}>
      <Glyph name={SECTIONS[id].icon} size={20} color={tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: spacing.xl, alignItems: 'flex-start' },
  rail: { width: 340 },
  detail: { flex: 1, gap: spacing.lg },
  list: { gap: spacing.sm },
  label: { marginLeft: spacing.xs, marginTop: spacing.xs },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
