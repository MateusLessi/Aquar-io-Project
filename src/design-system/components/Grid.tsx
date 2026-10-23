import { Children, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

export type GridProps = Omit<ViewProps, 'children'> & {
  columns: number;
  gap: number;
  children: ReactNode;
};

/**
 * Tiles in rows of `columns`, each taking an equal share of the row. No widths are computed in
 * pixels, so browser zoom and fractional screen sizes can never push a tile to the next line.
 * A short last row keeps the same tile size (empty cells fill the rest).
 */
export function Grid({ columns, gap, children, style, ...rest }: GridProps) {
  const items = Children.toArray(children);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += columns) rows.push(items.slice(i, i + columns));

  return (
    <View style={[{ gap }, style]} {...rest}>
      {rows.map((row, r) => (
        <View key={r} style={[styles.row, { gap }]}>
          {row.map((item, c) => (
            <View key={c} style={styles.cell}>
              {item}
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, e) => (
            <View key={`empty-${e}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cell: { flex: 1, minWidth: 0 },
});
