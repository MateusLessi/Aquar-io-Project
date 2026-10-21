import { idFrom } from '../ids';

describe('idFrom', () => {
  it('gives the same UUID for the same seed and different ones otherwise', () => {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    expect(idFrom('task-1:next')).toMatch(uuid);
    expect(idFrom('task-1:next')).toBe(idFrom('task-1:next'));
    expect(idFrom('task-1:next')).not.toBe(idFrom('task-2:next'));
  });
});
