// Development-only catalog of the design system. Not reachable in production builds.
import { Redirect, useRouter } from 'expo-router';
import { CalendarDays, ChevronLeft, House, List, Search, User } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Checkbox,
  FloatingActionButton,
  GlassSurface,
  IconButton,
  ListItem,
  OceanBackground,
  Sheet,
  Surface,
  Text,
  TextInput,
  WaterLevel,
  Waterline,
  listColorNames,
  fontFamily,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  type ListColorName,
  type ThemePreference,
  type TypographyVariant,
} from '@/design-system';

type DemoTask = {
  id: string;
  title: string;
  list: ListColorName;
  listName: string;
  meta?: string;
  priority?: boolean;
  done: boolean;
};

const initialTasks: DemoTask[] = [
  {
    id: '1',
    title: 'Ir para academia',
    list: 'kelp',
    listName: 'Academia',
    meta: '18:00',
    done: false,
  },
  {
    id: '2',
    title: 'Entregar relatório de Cálculo',
    list: 'tide',
    listName: 'Faculdade',
    meta: '2 de 4',
    priority: true,
    done: false,
  },
  { id: '3', title: 'Beber 2 L de água', list: 'coral', listName: 'Casa', done: false },
  { id: '4', title: 'Escovar os dentes', list: 'coral', listName: 'Casa', done: true },
  { id: '5', title: 'Revisar agenda da semana', list: 'lagoon', listName: 'Pessoal', done: true },
];

const typeSamples: { variant: TypographyVariant; sample: string }[] = [
  { variant: 'largeTitle', sample: 'Hoje' },
  { variant: 'title1', sample: 'Academia' },
  { variant: 'title2', sample: 'Minhas listas' },
  { variant: 'headline', sample: 'Concluídas' },
  { variant: 'body', sample: 'Entregar relatório de Cálculo' },
  { variant: 'callout', sample: 'Rotinas, hábitos e tarefas no mesmo oceano.' },
  { variant: 'footnote', sample: 'Amanhã · 3 subtarefas' },
  { variant: 'overline', sample: 'Pendentes' },
  { variant: 'numeric', sample: '00:17:24' },
];

export default function DesignSystemCatalog() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Catalog />;
}

function Catalog() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const breakpoint = useBreakpoint();
  const { scheme, preference, setPreference, reduceMotion, reduceTransparency, supportsBlur } =
    useTheme();
  const [tasks, setTasks] = useState(initialTasks);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const done = tasks.filter((task) => task.done).length;
  const toggle = (id: string, value: boolean) =>
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: value } : task)),
    );

  const preferences: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'Sistema' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Escuro' },
  ];

  return (
    <OceanBackground>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + 120 },
        ]}
      >
        <View style={styles.column}>
          <IconButton icon={ChevronLeft} label="Voltar" onPress={() => router.back()} />

          <View style={styles.header}>
            <Text variant="footnote" tone="secondary">
              Catálogo · {breakpoint} · {scheme}
            </Text>
            <Text variant="largeTitle">Aquatic Glass</Text>
            <View style={styles.row}>
              <WaterLevel
                value={done}
                total={tasks.length}
                accessibilityLabel="Tarefas concluídas hoje"
              />
              <Text variant="footnote" tone="secondary">
                conclua tarefas para encher
              </Text>
            </View>
          </View>
          <Waterline />

          <Section title="Tema">
            <View style={styles.wrap}>
              {preferences.map((option) => (
                <Button
                  key={option.value}
                  label={option.label}
                  variant={preference === option.value ? 'primary' : 'secondary'}
                  onPress={() => setPreference(option.value)}
                />
              ))}
            </View>
            <Text variant="footnote" tone="tertiary">
              Blur: {supportsBlur && !reduceTransparency ? 'ativo' : 'fallback sólido'} · Reduzir
              movimento: {reduceMotion ? 'sim' : 'não'}
            </Text>
          </Section>

          <Section title="Lista (Checkbox + ListItem)">
            <Surface>
              {tasks.map((task, index) => (
                <ListItem
                  key={task.id}
                  title={task.title}
                  completed={task.done}
                  separator={index > 0}
                  onPress={() => {}}
                  leading={
                    <Checkbox
                      checked={task.done}
                      label={task.title}
                      onChange={(value) => toggle(task.id, value)}
                    />
                  }
                  subtitle={
                    task.done ? undefined : (
                      <View style={styles.meta}>
                        {task.priority ? (
                          <Text variant="footnote" tone="priority" style={styles.bold}>
                            Alta
                          </Text>
                        ) : null}
                        <View style={styles.listTag}>
                          <View
                            style={[styles.dot, { backgroundColor: listColors[task.list][scheme] }]}
                          />
                          <Text variant="footnote" tone="secondary">
                            {task.listName}
                          </Text>
                        </View>
                        {task.meta ? (
                          <Text variant="footnote" tone="secondary">
                            {task.meta}
                          </Text>
                        ) : null}
                      </View>
                    )
                  }
                />
              ))}
            </Surface>
          </Section>

          <Section title="Botões">
            <View style={styles.wrap}>
              <Button label="Primário" />
              <Button label="Secundário" variant="secondary" />
              <Button label="Ghost" variant="ghost" />
            </View>
            <View style={styles.wrap}>
              <Button label="Desabilitado" disabled />
              <Button
                label="Salvar"
                loading={loading}
                onPress={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1500);
                }}
              />
              <Button label="Buscar" icon={Search} variant="secondary" />
            </View>
            <View style={styles.wrap}>
              <IconButton icon={House} label="Início" selected />
              <IconButton icon={List} label="Listas" />
              <IconButton icon={CalendarDays} label="Agenda" />
              <IconButton icon={User} label="Perfil" disabled />
            </View>
          </Section>

          <Section title="Campos">
            <TextInput
              label="Nova tarefa"
              placeholder="O que você quer fazer?"
              value={draft}
              onChangeText={setDraft}
            />
            <TextInput
              label="Nome da lista"
              value=""
              error="Dê um nome para a lista."
              onChangeText={() => {}}
            />
            <TextInput label="Desabilitado" value="Somente leitura" disabled />
          </Section>

          <Section title="Tipografia (Outfit + Manrope)">
            <Surface style={styles.padded}>
              {typeSamples.map(({ variant, sample }) => (
                <View key={variant} style={styles.typeRow}>
                  <Text variant="caption" tone="tertiary" style={styles.typeLabel}>
                    {variant}
                  </Text>
                  <Text variant={variant} style={styles.flex}>
                    {sample}
                  </Text>
                </View>
              ))}
            </Surface>
          </Section>

          <Section title="Cores das listas">
            <View style={styles.wrap}>
              {listColorNames.map((name) => (
                <View key={name} style={styles.swatchItem}>
                  <View style={[styles.swatch, { backgroundColor: listColors[name][scheme] }]} />
                  <Text variant="caption" tone="secondary">
                    {name}
                  </Text>
                </View>
              ))}
            </View>
          </Section>

          <Section title="Sheet">
            <Button label="Abrir sheet" variant="secondary" onPress={() => setSheetOpen(true)} />
          </Section>
        </View>
      </ScrollView>

      {/* Floating chrome: glass over scrolling content, as in the app shell to come. */}
      <View
        style={[styles.dockArea, { bottom: insets.bottom + spacing.lg }]}
        pointerEvents="box-none"
      >
        <View style={styles.dock} pointerEvents="box-none">
          <GlassSurface depth={1} radius="pill" style={styles.nav}>
            <IconButton icon={House} label="Início" selected />
            <IconButton icon={List} label="Listas" />
            <IconButton icon={CalendarDays} label="Agenda" />
            <IconButton icon={User} label="Perfil" />
          </GlassSurface>
          <FloatingActionButton label="Nova tarefa" onPress={() => setSheetOpen(true)} />
        </View>
      </View>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Nova tarefa">
        <View style={styles.sheetBody}>
          <TextInput label="Título" placeholder="O que você quer fazer?" autoFocus={false} />
          <Button label="Adicionar" block onPress={() => setSheetOpen(false)} />
          <Text variant="footnote" tone="tertiary">
            Arraste a alça para baixo ou toque fora para fechar.
          </Text>
        </View>
      </Sheet>
    </OceanBackground>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="tertiary">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  column: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: spacing.sm },
  header: { paddingHorizontal: spacing.sm, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  section: { gap: spacing.md, marginTop: spacing.lg },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  listTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bold: { fontFamily: fontFamily.textBold },
  padded: { padding: spacing.lg, gap: spacing.sm },
  typeRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  typeLabel: { width: 84 },
  flex: { flex: 1 },
  swatchItem: { alignItems: 'center', gap: spacing.xs },
  swatch: { width: 52, height: 40, borderRadius: radius.md },
  dockArea: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  dock: {
    width: '100%',
    maxWidth: 560,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nav: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  sheetBody: { gap: spacing.lg },
});
