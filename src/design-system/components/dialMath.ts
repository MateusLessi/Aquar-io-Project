/**
 * Where a press on a dial lands, as a value. The dial turns more than once (`perTurn` per full
 * turn), so the new value is the one at that angle closest to the current value: dragging past
 * the top goes on to the next turn instead of jumping back.
 */
export function dialValue({
  x,
  y,
  size,
  current,
  perTurn,
  min,
  max,
  step = 1,
}: {
  x: number;
  y: number;
  size: number;
  current: number;
  perTurn: number;
  min: number;
  max: number;
  step?: number;
}): number {
  const dx = x - size / 2;
  const dy = y - size / 2;
  // 0 at the top, growing clockwise.
  const turn = (Math.atan2(dx, -dy) / (2 * Math.PI) + 1) % 1;
  const within = Math.round((turn * perTurn) / step) * step;
  const base = Math.floor(current / perTurn) * perTurn;
  const candidates = [base - perTurn, base, base + perTurn].map((b) => b + within);
  const nearest = candidates.reduce((best, c) =>
    Math.abs(c - current) < Math.abs(best - current) ? c : best,
  );
  return Math.min(max, Math.max(min, nearest));
}
