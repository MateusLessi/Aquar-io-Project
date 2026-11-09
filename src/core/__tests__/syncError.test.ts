import { SyncError, describeSyncError } from '../sync/syncError';

const fail = (table: string, cause: unknown) => new SyncError([{ table, cause }]);

describe('describeSyncError', () => {
  it('spots a cloud that is missing a column or table (a migration not run)', () => {
    const missingColumn = Object.assign(new Error("Could not find the 'bio' column"), {
      code: 'PGRST204',
    });
    expect(describeSyncError(fail('profile', missingColumn))).toEqual({
      kind: 'outdated',
      tables: ['profile'],
    });
    expect(
      describeSyncError(fail('links', { message: 'relation "links" does not exist' })),
    ).toEqual({ kind: 'outdated', tables: ['links'] });
  });

  it('tells offline from the rest, and puts an outdated cloud first', () => {
    expect(describeSyncError(new TypeError('Failed to fetch')).kind).toBe('offline');
    const mixed = new SyncError([
      { table: 'tasks', cause: new TypeError('Failed to fetch') },
      { table: 'profile', cause: { code: '42703', message: 'column does not exist' } },
    ]);
    expect(describeSyncError(mixed)).toEqual({ kind: 'outdated', tables: ['profile'] });
    expect(describeSyncError(new Error('boom')).kind).toBe('unknown');
  });
});
