import { SETTING_ENTRIES, searchSettings } from '../settings/search';

const ids = (q: string) => searchSettings(q).map((e) => e.id);

describe('searchSettings', () => {
  it('finds settings by name or by the words people use, without accents', () => {
    expect(ids('tema')[0]).toBe('theme');
    expect(ids('escuro')).toContain('theme');
    expect(ids('notificação')).toContain('reminders');
    expect(ids('NOTIFICACAO')).toContain('reminders');
    expect(ids('semana')[0]).toBe('week');
    expect(ids('backup')).toEqual(['export']);
  });

  it('needs every word, and finds nothing for an empty query', () => {
    expect(ids('apagar conta')).toEqual(['erase']);
    expect(ids('tema volume')).toEqual([]);
    expect(ids('  ')).toEqual([]);
  });

  it('every entry has a unique id', () => {
    expect(new Set(SETTING_ENTRIES.map((e) => e.id)).size).toBe(SETTING_ENTRIES.length);
  });
});
