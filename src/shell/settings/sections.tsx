import Constants from 'expo-constants';
import { ChevronDown, ChevronUp, Download } from 'lucide-react-native';
import { useContext, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { DataChangesContext } from '@/core/database/useLiveQuery';
import { notificationsSupported } from '@/core/notifications';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import { useSetting } from '@/core/settings/useSetting';
import {
  Button,
  ConfirmDialog,
  IconButton,
  ListItem,
  SegmentedControl,
  Sheet,
  Surface,
  Switch,
  Text,
  TextInput,
  TimePicker,
  radius,
  spacing,
  useTheme,
  type ThemePreference,
} from '@/design-system';
import { creatureIds, creatures } from '@/features/habits/domain/creatures';

import { useAccount } from '../Account';
import { AccountSection } from '../AccountSection';
import { TEXT_SCALES } from '../AppData';
import { AMBIENT_SETTING, type AmbientSetting } from '../ambient';
import { collectExport, tasksCsv, wipeLocalData } from '../data/localData';
import { shareFiles } from '../data/shareFiles';
import { useDatabase } from '../data/useDatabase';
import { FeedbackSection } from '../feedback/FeedbackSection';
import { useWelcome } from '../welcome/WelcomeHost';
import { parseQuietHours } from '../reminders/plan';
import { RemindersSection } from '../reminders/RemindersSection';
import { QUIET_HOURS_SETTING } from '../reminders/useReminderScheduler';
import {
  DASHBOARD_CARDS,
  SETTINGS,
  startTabs,
  useDashboardCards,
  useGamePrefs,
  useStartTab,
} from './prefs';

export function Group({
  title,
  children,
  note,
}: {
  title?: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <View style={styles.group}>
      {title ? (
        <Text variant="overline" tone="tertiary" style={styles.groupTitle}>
          {title}
        </Text>
      ) : null}
      {children}
      {note ? (
        <Text variant="footnote" tone="tertiary" style={styles.note}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

function Choice({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View style={styles.choice}>
      <Text variant="body">{label}</Text>
      {hint ? (
        <Text variant="footnote" tone="tertiary">
          {hint}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'crystal', label: 'Crystal' },
];
const textSizeLabels = ['Padrão', 'Grande', 'Maior'];

export function AppearanceSettings() {
  const { preference, setPreference, textScale, setTextScale } = useTheme();
  return (
    <Group>
      <Surface>
        <Choice label="Tema">
          <SegmentedControl
            accessibilityLabel="Tema"
            options={themeOptions}
            value={preference}
            onChange={setPreference}
          />
        </Choice>
        <Choice label="Tamanho do texto" hint="Soma-se ao tamanho escolhido no seu aparelho">
          <SegmentedControl
            accessibilityLabel="Tamanho do texto"
            options={TEXT_SCALES.map((scale, i) => ({
              value: String(scale),
              label: textSizeLabels[i]!,
            }))}
            value={String(textScale)}
            onChange={(value) => setTextScale(Number(value))}
          />
        </Choice>
      </Surface>
    </Group>
  );
}

export function HomeSettings() {
  const [startTab, setStartTab] = useStartTab();
  const [cards, setCards] = useDashboardCards();
  const move = (index: number, delta: -1 | 1) => {
    const next = [...cards];
    const [card] = next.splice(index, 1);
    next.splice(index + delta, 0, card!);
    void setCards(next);
  };
  return (
    <>
      <Group title="O app abre em" note="Links e notificações continuam abrindo onde apontam.">
        <SegmentedControl
          accessibilityLabel="O app abre em"
          options={startTabs}
          value={startTab}
          onChange={(value) => void setStartTab(value)}
        />
      </Group>
      <Group
        title="Cartões do painel"
        note="A maré do dia vem sempre primeiro. As setas mudam a ordem."
      >
        <Surface>
          {cards.map((card, i) => {
            const label = DASHBOARD_CARDS.find((c) => c.id === card.id)!.label;
            return (
              <ListItem
                key={card.id}
                separator={i > 0}
                title={label}
                trailing={
                  <View style={styles.cardActions}>
                    <IconButton
                      icon={ChevronUp}
                      label={`Mover ${label} para cima`}
                      disabled={i === 0}
                      onPress={() => move(i, -1)}
                    />
                    <IconButton
                      icon={ChevronDown}
                      label={`Mover ${label} para baixo`}
                      disabled={i === cards.length - 1}
                      onPress={() => move(i, 1)}
                    />
                    <Switch
                      label={`Mostrar ${label}`}
                      value={card.visible}
                      onChange={(visible) =>
                        void setCards(cards.map((c) => (c.id === card.id ? { ...c, visible } : c)))
                      }
                    />
                  </View>
                }
              />
            );
          })}
        </Surface>
      </Group>
    </>
  );
}

export function CalendarSettings() {
  const [weekStart, setWeekStart] = useSetting<'0' | '1'>(SETTINGS.weekStart, '0');
  const [clock, setClock] = useSetting<'24' | '12'>(SETTINGS.clock, '24');
  return (
    <Group>
      <Surface>
        <Choice
          label="A semana começa"
          hint="Vale na Semana das rotinas, nas Estatísticas, nos calendários e nos seletores de dias"
        >
          <SegmentedControl
            accessibilityLabel="A semana começa"
            options={[
              { value: '0', label: 'Domingo' },
              { value: '1', label: 'Segunda' },
            ]}
            value={weekStart}
            onChange={(value) => void setWeekStart(value)}
          />
        </Choice>
        <Choice label="Formato de hora" hint="Ex.: 19:30 ou 7:30 PM">
          <SegmentedControl
            accessibilityLabel="Formato de hora"
            options={[
              { value: '24', label: '24 horas' },
              { value: '12', label: '12 horas' },
            ]}
            value={clock}
            onChange={(value) => void setClock(value)}
          />
        </Choice>
      </Surface>
    </Group>
  );
}

export function SoundRemindersSettings() {
  return (
    <>
      <Group title="Sons e toque">
        <FeedbackSection />
      </Group>
      <Group title="Lembretes">
        <RemindersSection />
        {notificationsSupported ? <QuietHours /> : null}
      </Group>
    </>
  );
}

function QuietHours() {
  const { colors } = useTheme();
  const { showTime } = useCalendarPrefs();
  const [value, setValue] = useSetting<string>(QUIET_HOURS_SETTING, '');
  const quiet = parseQuietHours(value);
  const [editing, setEditing] = useState<'from' | 'to' | null>(null);
  const set = (from: string, to: string) => void setValue(`${from}-${to}`);
  return (
    <Surface>
      <ListItem
        title="Horário silencioso"
        subtitle={
          quiet
            ? `Nada toca das ${showTime(quiet.from)} às ${showTime(quiet.to)}`
            : 'Lembretes podem tocar a qualquer hora'
        }
        trailing={
          <Switch
            label="Horário silencioso"
            value={quiet !== null}
            onChange={(on) => void setValue(on ? '22:00-07:00' : '')}
          />
        }
      />
      {quiet ? (
        <View style={styles.quiet}>
          <View style={styles.times}>
            {(['from', 'to'] as const).map((which) => (
              <Pressable
                key={which}
                onPress={() => setEditing(editing === which ? null : which)}
                accessibilityRole="button"
                accessibilityLabel={`${which === 'from' ? 'Começa' : 'Termina'} às ${showTime(quiet[which])}`}
                style={[
                  styles.timeButton,
                  { borderColor: editing === which ? colors.accent : colors.border },
                ]}
              >
                <Text variant="caption" tone="secondary">
                  {which === 'from' ? 'Das' : 'Até'}
                </Text>
                <Text variant="title2">{showTime(quiet[which])}</Text>
              </Pressable>
            ))}
          </View>
          {editing ? (
            <TimePicker
              value={quiet[editing]}
              onChange={(time) =>
                editing === 'from' ? set(time, quiet.to) : set(quiet.from, time)
              }
            />
          ) : null}
          <Text variant="footnote" tone="tertiary">
            Um lembrete marcado nesse horário não toca; ele continua aparecendo no app.
          </Text>
        </View>
      ) : null}
    </Surface>
  );
}

export function GameSettings() {
  const { colors } = useTheme();
  const game = useGamePrefs();
  return (
    <>
      <Group title="Criatura dos hábitos novos">
        <View style={styles.creatures}>
          {creatureIds.map((id) => {
            const selected = game.defaultCreature === id;
            return (
              <Pressable
                key={id}
                onPress={() => game.setDefaultCreature(id)}
                accessibilityRole="radio"
                accessibilityLabel={creatures[id].name}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                style={[
                  styles.creature,
                  {
                    backgroundColor: selected ? colors.accentSoft : colors.surfaceRaised,
                    borderColor: selected ? colors.accent : 'transparent',
                  },
                ]}
              >
                <Text variant="title2">{creatures[id].emoji}</Text>
                <Text variant="caption" tone={selected ? 'accent' : 'secondary'}>
                  {creatures[id].name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Group>
      <Group title="Jogo">
        <Surface>
          <ListItem
            title="Mostrar Profundidade"
            subtitle="Metros, zona e pontos no painel e nas Estatísticas"
            trailing={
              <Switch
                label="Mostrar Profundidade"
                value={game.showDepth}
                onChange={game.setShowDepth}
              />
            }
          />
          <ListItem
            separator
            title="Comemorações"
            subtitle="Avisos de nova zona e de criatura que cresceu"
            trailing={
              <Switch
                label="Comemorações"
                value={game.celebrations}
                onChange={game.setCelebrations}
              />
            }
          />
        </Surface>
      </Group>
    </>
  );
}

export function TideModeSettings() {
  const [ambient, setAmbient] = useSetting<AmbientSetting>(AMBIENT_SETTING, 'on');
  return (
    <Group note="Com o celular deitado e carregando, o Aquar.io vira um painel com a hora, a maré do dia e o que vem a seguir. Toque na tela para sair.">
      <SegmentedControl
        accessibilityLabel="Modo Maré"
        options={[
          { value: 'on', label: 'Ligado' },
          { value: 'off', label: 'Desligado' },
        ]}
        value={ambient}
        onChange={(value) => void setAmbient(value)}
      />
    </Group>
  );
}

export function AccessibilitySettings() {
  const { reduceMotion, reduceTransparency, highContrast, setAccessibility } = useTheme();
  const rows = [
    {
      key: 'reduceMotion' as const,
      title: 'Reduzir movimento',
      subtitle: 'Menos animações e efeitos',
      value: reduceMotion,
    },
    {
      key: 'reduceTransparency' as const,
      title: 'Reduzir transparência',
      subtitle: 'Barras e painéis sólidos em vez de vidro',
      value: reduceTransparency,
    },
    {
      key: 'highContrast' as const,
      title: 'Alto contraste',
      subtitle: 'Textos e bordas mais fortes',
      value: highContrast,
    },
  ];
  return (
    <Group note="Começam iguais às configurações do seu aparelho; o que você escolher aqui vale para o Aquar.io. O tamanho do texto fica em Aparência.">
      <Surface>
        {rows.map((row, i) => (
          <ListItem
            key={row.key}
            separator={i > 0}
            title={row.title}
            subtitle={row.subtitle}
            trailing={
              <Switch
                label={row.title}
                value={row.value}
                onChange={(on) => setAccessibility(row.key, on)}
              />
            }
          />
        ))}
      </Surface>
    </Group>
  );
}

export function AccountDataSettings() {
  const account = useAccount();
  const db = useDatabase();
  const changes = useContext(DataChangesContext);
  const [busy, setBusy] = useState<'export' | 'wipe' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const signedIn = Boolean(account?.email);

  const exportAll = async () => {
    setBusy('export');
    setMessage(null);
    try {
      const day = new Date().toISOString().slice(0, 10);
      await shareFiles([
        {
          name: `aquario-${day}.json`,
          content: JSON.stringify(await collectExport(db), null, 2),
          mimeType: 'application/json',
        },
        { name: `aquario-tarefas-${day}.csv`, content: await tasksCsv(db), mimeType: 'text/csv' },
      ]);
      setMessage(Platform.OS === 'web' ? 'Arquivos baixados.' : null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Não deu para exportar.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {account ? (
        <Group title="Sincronização">
          <AccountSection />
        </Group>
      ) : null}
      <Group
        title="Seus dados"
        note="Um arquivo JSON com listas, pastas, tarefas, hábitos, rotinas e ligações, e um CSV das tarefas para abrir numa planilha."
      >
        <Button
          label="Exportar meus dados"
          variant="secondary"
          icon={Download}
          loading={busy === 'export'}
          onPress={() => void exportAll()}
        />
        {message ? (
          <Text variant="footnote" tone="secondary" accessibilityLiveRegion="polite">
            {message}
          </Text>
        ) : null}
      </Group>
      <Group title="Zona de perigo">
        <Button
          label="Apagar os dados deste aparelho"
          variant="danger"
          loading={busy === 'wipe'}
          onPress={() => setConfirmWipe(true)}
        />
        {signedIn ? (
          <Button label="Apagar minha conta" variant="danger" onPress={() => setDeleting(true)} />
        ) : null}
      </Group>
      <ConfirmDialog
        visible={confirmWipe}
        title="Apagar os dados deste aparelho?"
        message={
          signedIn
            ? 'Suas listas, hábitos e rotinas saem deste aparelho e você sai da conta. A cópia na nuvem continua: entrando de novo, tudo volta.'
            : 'Suas listas, hábitos e rotinas somem deste aparelho. Não dá para desfazer; exporte antes, se quiser uma cópia.'
        }
        confirmLabel="Apagar"
        destructive
        onCancel={() => setConfirmWipe(false)}
        onConfirm={() => {
          setConfirmWipe(false);
          setBusy('wipe');
          void (async () => {
            try {
              if (signedIn) await account?.signOut();
              if (changes) await wipeLocalData(db, changes);
              setMessage('Os dados deste aparelho foram apagados.');
            } finally {
              setBusy(null);
            }
          })();
        }}
      />
      {account ? (
        <DeleteAccountSheet
          visible={deleting}
          onClose={() => setDeleting(false)}
          onDelete={async () => {
            await account.deleteAccount();
            setMessage('Sua conta foi apagada.');
          }}
        />
      ) : null}
    </>
  );
}

function DeleteAccountSheet({
  visible,
  onClose,
  onDelete,
}: {
  visible: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  return (
    <Sheet visible={visible} onClose={onClose} title="Apagar sua conta?">
      <View style={styles.sheet}>
        <Text variant="body" tone="secondary">
          Seus dados somem da nuvem e de todos os aparelhos. Não dá para desfazer. Antes, você pode
          exportar uma cópia.
        </Text>
        <TextInput
          label="Digite APAGAR para confirmar"
          value={typed}
          onChangeText={(text) => {
            setTyped(text);
            setError(null);
          }}
          autoCapitalize="characters"
          error={error ?? undefined}
        />
        <Button
          label="Apagar para sempre"
          variant="danger"
          block
          loading={working}
          disabled={typed.trim().toUpperCase() !== 'APAGAR'}
          onPress={() => {
            setWorking(true);
            onDelete()
              .then(onClose)
              .catch((e: unknown) =>
                setError(e instanceof Error ? e.message : 'Não deu para apagar. Tente de novo.'),
              )
              .finally(() => setWorking(false));
          }}
        />
      </View>
    </Sheet>
  );
}

export function AboutSettings() {
  const welcome = useWelcome();
  return (
    <>
      <Button label="Ver as boas-vindas" variant="secondary" onPress={welcome.open} />
      <Group>
        <Surface>
          <ListItem
            title="Versão"
            trailing={
              <Text variant="callout" tone="secondary">
                {Constants.expoConfig?.version ?? '—'}
              </Text>
            }
          />
          <ListItem
            separator
            title="Aparelho"
            trailing={
              <Text variant="callout" tone="secondary">
                {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'}
              </Text>
            }
          />
        </Surface>
      </Group>
      <Group title="Créditos">
        <Text variant="footnote" tone="secondary" style={styles.note}>
          Feito por Mateus Leodido de Siqueira. Sons sintetizados para o Aquar.io. Fonte Plus
          Jakarta Sans (SIL Open Font License). Ícones Lucide (ISC).
        </Text>
      </Group>
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  groupTitle: { marginLeft: spacing.xs },
  note: { marginHorizontal: spacing.xs },
  choice: { padding: spacing.lg, gap: spacing.sm },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  quiet: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  times: { flexDirection: 'row', gap: spacing.md },
  timeButton: { flex: 1, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  creatures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  creature: {
    width: 84,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 2,
  },
  sheet: { gap: spacing.lg },
});
