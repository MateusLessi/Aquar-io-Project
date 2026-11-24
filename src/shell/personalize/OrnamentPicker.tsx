import { Lock } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

import { ZONES } from '@/core/progress/rules';
import { ListItem, Surface, Switch, radius, useTheme } from '@/design-system';
import { OrnamentArt } from '@/features/habits/components/Ornaments';
import { ornaments, usePondOrnaments } from '@/features/habits/hooks/aquariumRegion';

import { useProgress } from '../progress/useProgress';

const points = (n: number) => new Intl.NumberFormat('pt-BR').format(n);

/**
 * Enfeites (Fase 6, etapa 12b): one per region, earned with it, each turned on or off. They sit
 * at the edges of any scene, so they mix (a coral in the Lagoa).
 */
export function OrnamentPicker() {
  const { colors } = useTheme();
  const { data } = useProgress();
  const [on, toggle] = usePondOrnaments();
  const total = data?.depth.meters ?? 0;
  return (
    <Surface>
      {ornaments.map((item, i) => {
        const region = ZONES.find((z) => z.id === item.region)!;
        const earned = total >= region.from;
        return (
          <ListItem
            key={item.id}
            separator={i > 0}
            leading={
              <View style={[styles.preview, { backgroundColor: colors.selected }]}>
                <OrnamentArt id={item.id} size={34} />
              </View>
            }
            title={item.name}
            subtitle={
              earned ? region.name : `${region.name} · faltam ${points(region.from - total)} pontos`
            }
            trailing={
              earned ? (
                <Switch
                  label={item.name}
                  value={on.includes(item.id)}
                  onChange={(next) => void toggle(item.id, next)}
                />
              ) : (
                <Lock size={18} color={colors.textTertiary} accessibilityLabel="Ainda não ganho" />
              )
            }
          />
        );
      })}
    </Surface>
  );
}

const styles = StyleSheet.create({
  preview: {
    width: 40,
    height: 40,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
