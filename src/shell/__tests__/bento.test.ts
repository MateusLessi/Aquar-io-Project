import { packBento } from '../dashboard/bento';

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
