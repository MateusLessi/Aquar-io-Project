import { createDataChanges } from '@/core/database/changes';
import { migrate } from '@/core/database/migrations';
import { createMemoryDatabase } from '@/core/database/testing';
import { createEventLog } from '@/core/events/eventLog';
import { glyphKeys } from '@/design-system';

import { createHabitsRepository } from '../data/habitsRepository';
import {
  CATEGORIES,
  DRINK_UNITS,
  POPULAR,
  PRESETS,
  searchPresets,
  totalLabel,
} from '../domain/catalog';

describe('habit catalog', () => {
  it('has unique ids, a few models in every category, and known popular ones', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const category of CATEGORIES) {
      expect(PRESETS.filter((p) => p.category === category.id).length).toBeGreaterThanOrEqual(4);
    }
    for (const id of POPULAR) expect(PRESETS.some((p) => p.id === id)).toBe(true);
    for (const preset of PRESETS) expect(glyphKeys).toContain(preset.glyph);
  });

  it('every model makes a valid habit', async () => {
    const db = createMemoryDatabase();
    await migrate(db);
    let n = 0;
    const now = () => new Date(2026, 10, 17, 10);
    const habits = createHabitsRepository({
      db,
      changes: createDataChanges(),
      events: createEventLog({ db, newId: () => `e${++n}`, now }),
      newId: () => `id-${++n}`,
      now,
    });
    for (const p of PRESETS) {
      await expect(
        habits.createHabit({
          name: p.name,
          description: p.description,
          creature: p.creature,
          kind: p.kind,
          target: p.target,
          unit: p.unit,
          steps: p.steps?.map((title) => ({ title })),
          days: p.days,
          reminderTimes: p.reminderTimes,
        }),
      ).resolves.toEqual(expect.any(String));
    }
  });

  it('finds models by name, category or common words, without accents', () => {
    const ids = (q: string) => searchPresets(q).map((p) => p.id);
    expect(ids('agua')[0]).toBe('agua');
    expect(ids('oração')).toContain('orar');
    expect(ids('biblia')).toEqual(['leitura-sagrada']);
    expect(ids('espiritualidade')).toHaveLength(5);
    expect(ids('ingles')).toEqual(['idioma']);
    expect(ids('')).toEqual([]);
  });

  it('adds drinks up', () => {
    const [cup, bottle, litre] = DRINK_UNITS;
    expect(totalLabel(8, cup)).toBe('2 litros por dia');
    expect(totalLabel(3, bottle)).toBe('1,5 litro por dia');
    expect(totalLabel(2, cup)).toBe('500 ml por dia');
    expect(totalLabel(2, litre)).toBeNull();
    expect(totalLabel(20, undefined)).toBeNull();
  });
});
