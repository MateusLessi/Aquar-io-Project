import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import {
  Button,
  RisingBubbles,
  Text,
  TextInput,
  oceanDepths,
  radius,
  spacing,
  useSvgId,
  useTheme,
  withAlpha,
} from '@/design-system';
import { CreatureBubble } from '@/features/habits/components/CreatureBubble';
import { creatureIds, creatures, type CreatureId } from '@/features/habits/domain/creatures';

import {
  AGES,
  AREAS,
  DEFAULT_AVATAR,
  PEAKS,
  STARTER_HABITS,
  suggestionsFor,
  type AgeRange,
  type Area,
  type Peak,
  type StarterHabit,
  type Suggestion,
} from './suggestions';

export type WelcomeResult = {
  name: string;
  creature: CreatureId;
  age: AgeRange | null;
  create: Suggestion[];
};

const STEPS = 6;
const LAST = STEPS - 1;

/**
 * The first dive: six screens, each a little deeper, one idea per screen. The quiz is optional
 * (Pular everywhere) and ends with a starter aquarium the person can trim before creating it.
 */
export function WelcomeFlow({
  visible,
  onFinish,
  onSkip,
  onHaveAccount,
}: {
  visible: boolean;
  onFinish: (result: WelcomeResult) => Promise<void>;
  onSkip: () => void;
  onHaveAccount: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { colors } = useTheme();
  const gradientId = useSvgId('dive');
  const [step, setStep] = useState(0);
  const [areas, setAreas] = useState<Area[]>([]);
  const [peak, setPeak] = useState<Peak | null>(null);
  const [habits, setHabits] = useState<StarterHabit[]>([]);
  const [age, setAge] = useState<AgeRange | null>(null);
  const [name, setName] = useState('');
  const [creature, setCreature] = useState<CreatureId>(DEFAULT_AVATAR);
  const [unchecked, setUnchecked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const depth = oceanDepths[step]!;
  const suggestions = suggestionsFor({ areas, peak, habits, age });
  const toggle = <T,>(list: T[], value: T) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const next = () => setStep((s) => Math.min(LAST, s + 1));
  const finish = () => {
    setSaving(true);
    void onFinish({
      name,
      creature,
      age,
      create: suggestions.filter((s) => !unchecked.includes(s.key)),
    }).finally(() => setSaving(false));
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onSkip} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: depth.bottom }]}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={depth.top} />
              <Stop offset="1" stopColor={depth.bottom} />
            </LinearGradient>
          </Defs>
          <Rect width={width} height={height} fill={`url(#${gradientId})`} />
        </Svg>
        <Scene step={step} width={width} height={height} />

        <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
          {step > 0 && step < LAST ? (
            <Button label="Pular" variant="ghost" onPress={onSkip} />
          ) : (
            <View />
          )}
          <Text
            variant="caption"
            tone="onDeepSecondary"
            accessibilityLabel={`${depth.meters} metros de profundidade`}
          >
            {new Intl.NumberFormat('pt-BR').format(depth.meters)} m
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            key={step}
            entering={FadeIn.duration(450)}
            exiting={FadeOut.duration(200)}
            style={styles.page}
          >
            {step === 0 ? (
              <View style={styles.hero}>
                <Text
                  variant="display"
                  tone="onDeep"
                  style={styles.center}
                  accessibilityRole="header"
                >
                  Aquar.io
                </Text>
                <Text variant="headline" tone="onDeep" style={styles.center}>
                  Tudo importa.
                </Text>
                <Text variant="body" tone="onDeepSecondary" style={styles.center}>
                  Organize tarefas, hábitos e rotinas como um ecossistema vivo.
                </Text>
              </View>
            ) : null}

            {step === 1 ? (
              <>
                <Title text="Um oceano que cresce com você" />
                {[
                  ['🐢', 'Hábitos viram criaturas', 'Elas crescem a cada dia feito.'],
                  ['🌊', 'Rotinas são as marés do dia', 'Blocos com hora e passos.'],
                  ['📋', 'Listas guardam o resto', 'Tarefas, pastas e prazos.'],
                  ['🪸', 'Cada coisa feita é um mergulho', 'Você desce de zona em zona.'],
                ].map(([emoji, title, detail]) => (
                  <View
                    key={title}
                    style={[styles.card, { backgroundColor: withAlpha(colors.onDeep, 0.08) }]}
                  >
                    <Text variant="title2">{emoji}</Text>
                    <View style={styles.flex}>
                      <Text variant="headline" tone="onDeep">
                        {title}
                      </Text>
                      <Text variant="footnote" tone="onDeepSecondary">
                        {detail}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            {step === 2 ? (
              <>
                <Title text="O que você quer organizar?" hint="Escolha quantos quiser." />
                <View style={styles.chips}>
                  {AREAS.map((a) => (
                    <Choice
                      key={a.id}
                      label={`${a.emoji} ${a.label}`}
                      selected={areas.includes(a.id)}
                      onPress={() => setAreas(toggle(areas, a.id))}
                      multiple
                    />
                  ))}
                </View>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <Title text="Quando seu dia rende mais?" />
                <View style={styles.options} accessibilityRole="radiogroup">
                  {PEAKS.map((p) => (
                    <Choice
                      key={p.id}
                      label={`${p.emoji} ${p.label}`}
                      selected={peak === p.id}
                      onPress={() => setPeak(peak === p.id ? null : p.id)}
                      wide
                    />
                  ))}
                </View>
                <Title text="Que hábitos quer começar?" small />
                <View style={styles.chips}>
                  {(Object.keys(STARTER_HABITS) as StarterHabit[]).map((id) => (
                    <Choice
                      key={id}
                      label={`${STARTER_HABITS[id].emoji} ${STARTER_HABITS[id].label}`}
                      selected={habits.includes(id)}
                      onPress={() => setHabits(toggle(habits, id))}
                      multiple
                    />
                  ))}
                </View>
              </>
            ) : null}

            {step === 4 ? (
              <>
                <Title text="Escolha sua criatura" />
                <View style={styles.creatures} accessibilityRole="radiogroup">
                  {creatureIds.map((id) => {
                    const selected = id === creature;
                    return (
                      <Pressable
                        key={id}
                        onPress={() => setCreature(id)}
                        accessibilityRole="radio"
                        accessibilityLabel={creatures[id].name}
                        accessibilityState={{ checked: selected }}
                        aria-checked={selected}
                        style={[
                          styles.creature,
                          selected && {
                            borderColor: colors.deepAccent,
                            backgroundColor: withAlpha(colors.deepAccent, 0.2),
                          },
                        ]}
                      >
                        <CreatureBubble creature={id} size={46} done={selected} />
                      </Pressable>
                    );
                  })}
                </View>
                <TextInput
                  label="Como quer ser chamado?"
                  value={name}
                  onChangeText={setName}
                  maxLength={40}
                  placeholder="Seu nome"
                />
                <Title text="Faixa de idade (opcional)" small />
                <View style={styles.chips} accessibilityRole="radiogroup">
                  {AGES.map((a) => (
                    <Choice
                      key={a.id}
                      label={a.label}
                      selected={age === a.id}
                      onPress={() => setAge(age === a.id ? null : a.id)}
                    />
                  ))}
                </View>
                <Text variant="footnote" tone="onDeepSecondary">
                  Só para ajustar as sugestões (ex.: rotina de estudos). Fica só neste aparelho, não
                  vai para a nuvem.
                </Text>
              </>
            ) : null}

            {step === LAST ? (
              <>
                <Title
                  text="Seu aquário está pronto"
                  hint={
                    suggestions.length > 0
                      ? 'Desmarque o que não quiser. Dá para mudar tudo depois.'
                      : 'Você começa com o aquário vazio: crie o que quiser pelo botão Criar.'
                  }
                />
                {suggestions.map((s) => {
                  const on = !unchecked.includes(s.key);
                  return (
                    <Pressable
                      key={s.key}
                      onPress={() => setUnchecked(toggle(unchecked, s.key))}
                      accessibilityRole="checkbox"
                      accessibilityLabel={`${s.title}, ${s.detail}`}
                      accessibilityState={{ checked: on }}
                      aria-checked={on}
                      style={[
                        styles.card,
                        { backgroundColor: withAlpha(colors.onDeep, on ? 0.1 : 0.04) },
                      ]}
                    >
                      <Text variant="title2" style={!on && styles.off}>
                        {s.emoji}
                      </Text>
                      <View style={[styles.flex, !on && styles.off]}>
                        <Text variant="headline" tone="onDeep">
                          {s.title}
                        </Text>
                        <Text variant="footnote" tone="onDeepSecondary">
                          {s.detail}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.check,
                          {
                            borderColor: colors.deepAccent,
                            backgroundColor: on ? colors.deepAccent : 'transparent',
                          },
                        ]}
                      >
                        <Text variant="caption" tone="onDeepAccent">
                          {on ? '✓' : ''}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </>
            ) : null}
          </Animated.View>
        </ScrollView>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.dots} accessibilityLabel={`Tela ${step + 1} de ${STEPS}`}>
            {Array.from({ length: STEPS }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: withAlpha(colors.onDeep, i === step ? 1 : 0.3) },
                  i === step && styles.dotOn,
                ]}
              />
            ))}
          </View>
          <Button
            label={step === 0 ? 'Começar o mergulho' : step === LAST ? 'Mergulhar' : 'Continuar'}
            variant="energy"
            block
            loading={saving}
            onPress={step === LAST ? finish : next}
          />
          {step === 0 ? (
            <Button label="Já tenho conta" variant="ghost" onPress={onHaveAccount} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function Title({ text, hint, small }: { text: string; hint?: string; small?: boolean }) {
  return (
    <View style={[styles.title, small && styles.titleSmall]}>
      <Text variant={small ? 'title2' : 'title1'} tone="onDeep" accessibilityRole="header">
        {text}
      </Text>
      {hint ? (
        <Text variant="callout" tone="onDeepSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function Choice({
  label,
  selected,
  onPress,
  multiple,
  wide,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  multiple?: boolean;
  wide?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      aria-checked={selected}
      style={[
        styles.choice,
        wide && styles.choiceWide,
        {
          backgroundColor: withAlpha(
            selected ? colors.deepAccent : colors.onDeep,
            selected ? 0.25 : 0.08,
          ),
          borderColor: selected ? colors.deepAccent : withAlpha(colors.onDeep, 0.18),
        },
      ]}
    >
      <Text variant="callout" tone="onDeep">
        {label}
      </Text>
      {wide && selected ? (
        <Text variant="callout" tone="deepAccent">
          ✓
        </Text>
      ) : null}
    </Pressable>
  );
}

/** Light from above near the surface, kelp on the reef, creatures drifting: deeper each step. */
function Scene({ step, width, height }: { step: number; width: number; height: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
    >
      {step <= 1 ? (
        <Svg width={width} height={height * 0.6} style={StyleSheet.absoluteFill}>
          {[0.1, 0.35, 0.62, 0.85].map((x, i) => (
            <Path
              key={i}
              d={`M${width * x} 0 L${width * x + 40} 0 L${width * x - 40} ${height * 0.6} L${width * x - 90} ${height * 0.6} Z`}
              fill={withAlpha(colors.onDeep, 0.06)}
            />
          ))}
        </Svg>
      ) : null}
      {step >= 2 && step <= 4 ? (
        <Svg width={width} height={180} style={[styles.kelp, { top: height - 180 }]}>
          {[0.06, 0.12, 0.88, 0.94].map((x, i) => (
            <Path
              key={i}
              d={`M${width * x} 180 C${width * x - 18} 120 ${width * x + 18} 80 ${width * x - 6} ${20 + i * 18}`}
              stroke={withAlpha(colors.success, 0.55)}
              strokeWidth={9}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </Svg>
      ) : null}
      <Drifter emoji={step < 2 ? '🐠' : step < 4 ? '🐢' : '🐋'} top={height * 0.62} width={width} />
      {step >= 1 ? (
        <Drifter emoji={step < 3 ? '🐟' : '🦑'} top={height * 0.3} width={width} reverse />
      ) : null}
      <View style={[styles.bubbles, { height }]}>
        <RisingBubbles height={height} count={10} />
      </View>
    </View>
  );
}

function Drifter({
  emoji,
  top,
  width,
  reverse,
}: {
  emoji: string;
  top: number;
  width: number;
  reverse?: boolean;
}) {
  const { reduceMotion } = useTheme();
  const x = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    x.set(
      withRepeat(withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [reduceMotion, x]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (reverse ? 1 - x.get() : x.get()) * (width * 0.6) },
      { scaleX: reverse ? -1 : 1 },
    ],
  }));
  return (
    <Animated.View style={[styles.drifter, { top, left: width * 0.15 }, style]}>
      <Text variant="title1" style={styles.faint}>
        {emoji}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingTop: 96, alignItems: 'center' },
  page: { width: '100%', maxWidth: 520, gap: spacing.md },
  hero: { marginTop: '30%', gap: spacing.md },
  center: { textAlign: 'center' },
  title: { gap: spacing.xs, marginBottom: spacing.sm },
  titleSmall: { marginTop: spacing.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  flex: { flex: 1 },
  off: { opacity: 0.45 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  options: { gap: spacing.sm },
  choice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  choiceWide: { paddingVertical: spacing.md },
  creatures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  creature: { padding: 4, borderRadius: radius.lg, borderWidth: 2, borderColor: 'transparent' },
  check: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
    alignItems: 'stretch',
  },
  dots: { flexDirection: 'row', gap: 5, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  dotOn: { width: 20 },
  kelp: { position: 'absolute', left: 0 },
  drifter: { position: 'absolute' },
  faint: { opacity: 0.55 },
  bubbles: { position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.6 },
});
