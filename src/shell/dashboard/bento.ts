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

/** How Início fits one computer window: columns of boxes, each column as tall as the window. */
export type FitBoard<Id extends string> = {
  /** The box under the tank (the tides, week or month), when there is room for it. */
  underTank: Id | null;
  /** Columns after the tank, left to right; each holds its boxes top to bottom. */
  columns: Id[][];
  /** Blocks that did not fit this window (still in the Aquarium and the statistics). */
  left: Id[];
};

/** Columns and boxes per column for a window of this size (inside the content panel). */
export function fitShape(width: number, height: number): { columns: number; rows: number } {
  return {
    // The tank's column plus two or three more; wide monitors get the extra one.
    columns: width >= 1400 ? 4 : 3,
    // Three boxes a column when there is room for them to show something, else two.
    rows: height >= 520 ? 3 : 2,
  };
}

/**
 * Lays Início out to fit one window, with no page scroll: the tank takes the first column
 * (with the `under` block below it when there are three boxes a column),
 * a `tall` block (the day's agenda) takes a whole column at the right, and the rest stack
 * in the columns between, `rows` per column, in the person's order. What doesn't fit is left
 * out (and reported), never squeezed.
 */
export function fitBoard<Id extends string>(
  ids: readonly Id[],
  shape: { columns: number; rows: number },
  tall: Id,
  /** Goes under the tank, when the window has three boxes a column. */
  under?: Id,
): FitBoard<Id> {
  const underTank = under && shape.rows >= 3 && ids.includes(under) ? under : null;
  const free = Math.max(1, shape.columns - 1);
  const hasTall = ids.includes(tall);
  const stackColumns = hasTall ? free - 1 : free;
  const stacks: Id[][] = [];
  const left: Id[] = [];
  for (const id of ids) {
    if (id === tall || id === underTank) continue;
    const last = stacks[stacks.length - 1];
    if (last && last.length < shape.rows) last.push(id);
    else if (stacks.length < stackColumns) stacks.push([id]);
    else left.push(id);
  }
  // A column with a single box among taller stacks is mostly empty: give its room to the
  // others (wider boxes) and leave the block out instead.
  while (shape.rows >= 3 && stacks.length > 1 && stacks[stacks.length - 1]!.length === 1) {
    left.unshift(stacks.pop()![0]!);
  }
  return { underTank, columns: hasTall ? [...stacks, [tall]] : stacks, left };
}
