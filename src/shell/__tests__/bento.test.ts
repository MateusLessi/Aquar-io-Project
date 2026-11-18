import { fitBoard, fitShape, packBento } from '../dashboard/bento';

const ids = (rows: { id: string; span: number }[][]) =>
  rows.map((r) => r.map((c) => `${c.id}${c.span}`).join(' '));

describe('packBento', () => {
  it('fills every row, widening the last block when one does not fit', () => {
    const rows = packBento(
      [
        { id: 'tank', span: 1 },
        { id: 'agenda', span: 1 },
        { id: 'habits', span: 1 },
        { id: 'tasks', span: 1 },
        { id: 'week', span: 2 },
        { id: 'folders', span: 1 },
        { id: 'month', span: 2 },
      ],
      3,
    );
    expect(ids(rows)).toEqual(['tank1 agenda1 habits1', 'tasks1 week2', 'folders1 month2']);
  });

  it('closes a row early when the next block is too wide, and fills the last row', () => {
    expect(
      ids(
        packBento(
          [
            { id: 'a', span: 1 },
            { id: 'b', span: 2 },
            { id: 'c', span: 2 },
            { id: 'd', span: 1 },
          ],
          2,
        ),
      ),
    ).toEqual(['a2', 'b2', 'c2', 'd2']);
    expect(ids(packBento([{ id: 'x', span: 5 }], 3))).toEqual(['x3']);
    expect(packBento([], 3)).toEqual([]);
  });
});

describe('fitBoard', () => {
  const ids = ['weekStats', 'routines', 'habits', 'tasks', 'folders', 'week', 'calendar'] as const;

  it('fits a laptop: one stack of three, the agenda at the right', () => {
    const board = fitBoard(ids, fitShape(1100, 600), 'routines');
    expect(board.columns).toEqual([['weekStats', 'habits', 'tasks'], ['routines']]);
    expect(board.left).toEqual(['folders', 'week', 'calendar']);
  });

  it('uses the extra column of a wide monitor', () => {
    const board = fitBoard(ids, fitShape(1800, 900), 'routines');
    expect(board.columns).toEqual([
      ['weekStats', 'habits', 'tasks'],
      ['folders', 'week', 'calendar'],
      ['routines'],
    ]);
    expect(board.left).toEqual([]);
  });

  it('stacks two a column in a short window', () => {
    expect(fitShape(1100, 480)).toEqual({ columns: 3, rows: 2 });
    expect(fitBoard(ids, { columns: 3, rows: 2 }, 'routines').columns).toEqual([
      ['weekStats', 'habits'],
      ['routines'],
    ]);
  });

  it('puts the tides under the tank when a column holds three boxes', () => {
    const board = fitBoard(ids, fitShape(1100, 600), 'routines', 'week');
    expect(board.underTank).toBe('week');
    expect(board.columns).toEqual([['weekStats', 'habits', 'tasks'], ['routines']]);
    expect(board.left).toEqual(['folders', 'calendar']);
    // Two a column: no room under the tank.
    expect(fitBoard(ids, { columns: 3, rows: 2 }, 'routines', 'week').underTank).toBeNull();
  });

  it('drops a column that would hold a single box, so the others get wider', () => {
    // As on Início: the week and the month are one box (under the tank).
    const shown = ids.filter((id) => id !== 'calendar');
    const board = fitBoard(shown, fitShape(2200, 1200), 'routines', 'week');
    expect(board.columns).toEqual([['weekStats', 'habits', 'tasks'], ['routines']]);
    expect(board.left).toEqual(['folders']);
  });

  it('gives every column to the stacks when the agenda is hidden, in the person order', () => {
    const board = fitBoard(
      ['tasks', 'habits', 'weekStats', 'folders'],
      { columns: 3, rows: 2 },
      'routines',
    );
    expect(board.columns).toEqual([
      ['tasks', 'habits'],
      ['weekStats', 'folders'],
    ]);
    expect(board.left).toEqual([]);
  });
});
