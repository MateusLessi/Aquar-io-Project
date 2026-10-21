import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { spacing } from '../tokens';
import { Chip } from './Chip';
import { SegmentedControl } from './SegmentedControl';
import { Text } from './Text';

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'] as const;
const CHIP_WIDTH = 64;

export type TimePickerProps = {
  /** `HH:MM`, 24h. Minutes snap to quarters. */
  value: string;
  onChange: (value: string) => void;
};

/**
 * Picks a time of day with two taps: the hour, then the quarter. Large targets and no
 * spinning wheels, so it is easy for anyone and the same on every platform.
 */
export function TimePicker({ value, onChange }: TimePickerProps) {
  const [hour = '08', minute = '00'] = value.split(':');
  const snapped = MINUTES.find((m) => m === minute) ?? '00';
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    // Start with the chosen hour in view.
    scroll.current?.scrollTo({
      x: Math.max(0, Number(hour) - 1) * (CHIP_WIDTH + spacing.sm),
      animated: false,
    });
    // Only on mount: scrolling on every tap would fight the person's own scrolling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.root}>
      <Text variant="largeTitle" style={styles.display} accessibilityLiveRegion="polite">
        {hour}:{snapped}
      </Text>
      <ScrollView
        ref={scroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hours}
        accessibilityLabel="Hora"
      >
        {HOURS.map((h) => (
          <View key={h} style={{ width: CHIP_WIDTH }}>
            <Chip
              label={`${h}h`}
              selected={h === hour}
              onPress={() => onChange(`${h}:${snapped}`)}
            />
          </View>
        ))}
      </ScrollView>
      <SegmentedControl
        accessibilityLabel="Minutos"
        options={MINUTES.map((m) => ({ value: m, label: `:${m}` }))}
        value={snapped}
        onChange={(m) => onChange(`${hour}:${m}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  display: { textAlign: 'center', fontVariant: ['tabular-nums'] },
  hours: { gap: spacing.sm, paddingVertical: spacing.xs },
});
