/** A dashboard block and how many columns it would like. */
export type BentoItem<Id extends string> = { id: Id; span: number };

/**
 * Packs the blocks, in order, into rows of `columns`: a block that doesn't fit starts a new
 * row, and the last block of a row grows to fill it. Every row is full, so no column ends
 * early and leaves a hole (Fase 4).
 */
export function packBento<Id extends string>(
  items: readonly BentoItem<Id>[],
  columns: number,
): BentoItem<Id>[][] {
  const rows: BentoItem<Id>[][] = [];
  let row: BentoItem<Id>[] = [];
  let used = 0;
  const close = () => {
    if (row.length === 0) return;
    const last = row[row.length - 1]!;
    row[row.length - 1] = { ...last, span: last.span + (columns - used) };
    rows.push(row);
    row = [];
    used = 0;
  };
  for (const item of items) {
    const span = Math.min(columns, Math.max(1, item.span));
    if (used + span > columns) close();
    row.push({ id: item.id, span });
    used += span;
  }
  close();
  return rows;
}
