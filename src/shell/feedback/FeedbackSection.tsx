import { Play } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  ListItem,
  Slider,
  Surface,
  Switch,
  Text,
  haptics,
  sound,
  spacing,
  type SoundGroup,
} from '@/design-system';

import { useFeedbackSettings } from './useFeedbackSettings';

const GROUPS: { group: SoundGroup; title: string; subtitle: string }[] = [
  { group: 'completions', title: 'Conclusões', subtitle: 'Tarefas, hábitos, itens de rotina' },
  {
    group: 'celebrations',
    title: 'Celebrações',
    subtitle: 'Lista completa, maré cheia, nova zona',
  },
  { group: 'connect', title: 'Conectar', subtitle: 'Ao soltar um item numa rotina ou hábito' },
];

/** Perfil → Sons e toque: sounds on/off, volume, which groups play, and vibration. */
export function FeedbackSection() {
  const { prefs, setSound, setVolume, setGroup, setHaptics } = useFeedbackSettings();
  return (
    <View style={styles.root}>
      <Surface>
        <ListItem
          title="Sons"
          subtitle="Gotas, bolhas e sinos ao concluir"
          trailing={<Switch label="Sons" value={prefs.sound} onChange={setSound} />}
        />
        {prefs.sound ? (
          <>
            <View style={styles.volume}>
              <Text variant="body">Volume · {Math.round(prefs.volume * 100)}%</Text>
              <Slider
                label="Volume dos sons"
                value={Math.round(prefs.volume * 100)}
                min={10}
                max={100}
                step={10}
                onChange={(v) => setVolume(v / 100)}
                valueText={(v) => `${v}%`}
              />
            </View>
            {GROUPS.map(({ group, title, subtitle }) => (
              <ListItem
                key={group}
                separator
                title={title}
                subtitle={subtitle}
                trailing={
                  <Switch label={title} value={prefs.groups[group]} onChange={setGroup[group]} />
                }
              />
            ))}
          </>
        ) : null}
        <View style={styles.preview}>
          <Button
            label="Ouvir um exemplo"
            variant="secondary"
            icon={Play}
            block
            onPress={() => {
              sound.play('complete', { preview: true });
              haptics.success();
            }}
          />
        </View>
      </Surface>
      <Surface>
        <ListItem
          title="Vibração"
          subtitle="Pulsos leves ao tocar e concluir"
          trailing={<Switch label="Vibração" value={prefs.haptics} onChange={setHaptics} />}
        />
      </Surface>
      <Text variant="footnote" tone="tertiary" style={styles.note}>
        Vale só para este aparelho. No iPhone, com o modo silencioso ligado, só vibra. Os sons se
        misturam com a sua música, sem pausar nada.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  volume: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.xs },
  preview: { padding: spacing.lg, paddingTop: spacing.sm },
  note: { marginHorizontal: spacing.xs },
});
