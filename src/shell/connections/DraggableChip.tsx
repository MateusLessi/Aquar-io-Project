import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { Text, radius, spacing, useTheme } from '@/design-system';

/** A tray item: tap to pick it, or hold and drag it; a ghost follows the finger. */
export function DraggableChip({
  label,
  selected,
  lifted,
  onSelect,
  onLift,
  onMove,
  onRelease,
}: {
  label: string;
  selected: boolean;
  lifted: boolean;
  onSelect: () => void;
  onLift: () => void;
  onMove: (x: number, y: number) => void;
  onRelease: (x: number, y: number) => void;
}) {
  const { colors } = useTheme();
  const dx = useSharedValue(0);
  const dy = useSharedValue(0);
  const pan = usePanGesture({
    activateAfterLongPress: 220,
    runOnJS: true,
    onActivate: () => {
      dx.set(0);
      dy.set(0);
      onLift();
    },
    onUpdate: (e) => {
      dx.set(e.translationX);
      dy.set(e.translationY);
      onMove(e.absoluteX, e.absoluteY);
    },
    onDeactivate: (e) => {
      onRelease(e.absoluteX, e.absoluteY);
      dx.set(0);
      dy.set(0);
    },
  });
  const ghost = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.get() }, { translateY: dy.get() }, { rotate: '-4deg' }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View>
        <Pressable
          onPress={onSelect}
          accessibilityRole="button"
          accessibilityLabel={`${label}${selected ? ', escolhido' : ''}`}
          accessibilityHint="Toque para escolher e depois toque no destino. Ou segure e arraste."
          accessibilityState={{ selected }}
          style={[
            styles.chip,
            {
              borderColor: selected ? colors.accent : colors.border,
              backgroundColor: selected ? colors.accentSoft : colors.surfaceBase,
              opacity: lifted ? 0.35 : 1,
              borderStyle: lifted ? 'dashed' : 'solid',
            },
          ]}
        >
          <Text variant="callout" numberOfLines={1}>
            {label}
          </Text>
        </Pressable>
        {lifted ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.chip,
              styles.ghost,
              {
                borderColor: colors.accent,
                backgroundColor: colors.surfaceRaised,
                shadowColor: colors.shadow,
              },
              ghost,
            ]}
          >
            <Text variant="callout" numberOfLines={1}>
              {label}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    maxWidth: 220,
  },
  ghost: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
});
