import { PRESETS } from '../domain/catalog';
import { catalogCreature, creatureIds, creatures, isCreatureId } from '../domain/creatures';
import { creatureStage, stageInfo } from '../domain/stages';

describe('the six creatures (Fase 6)', () => {
  it('offers six, each with its own color', () => {
    expect(creatureIds).toEqual(['fish', 'shark', 'turtle', 'jellyfish', 'octopus', 'ray']);
    const colors = creatureIds.map((id) => creatures[id].color);
    expect(new Set(colors).size).toBe(6);
  });

  it('shows old creatures as their closest match, without touching the data', () => {
    expect(catalogCreature('dolphin')).toBe('shark');
    expect(catalogCreature('whale')).toBe('ray');
    expect(catalogCreature('crab')).toBe('octopus');
    expect(catalogCreature('fish')).toBe('fish');
    expect(creatures.dolphin).toEqual(creatures.shark);
    // Still valid ids, so habits and profiles that chose them keep loading.
    expect(isCreatureId('seal')).toBe(true);
    expect(isCreatureId('unicorn')).toBe(false);
  });

  it('starts every model habit with one of the six', () => {
    for (const preset of PRESETS) expect(creatureIds).toContain(preset.creature);
  });

  it('grows in size, from a faint egg to an adult with a halo', () => {
    expect(stageInfo.egg.scale).toBeLessThan(stageInfo.baby.scale);
    expect(stageInfo.baby.scale).toBeLessThan(stageInfo.young.scale);
    expect(stageInfo.young.scale).toBeLessThan(stageInfo.adult.scale);
    expect(stageInfo.egg.opacity).toBeLessThan(1);
    expect(stageInfo.adult.glow).toBe(true);
  });

  it('rays and sharks are born, the others hatch', () => {
    expect(creatureStage('ray', 0)).toBe('baby');
    expect(creatureStage('shark', 0)).toBe('baby');
    expect(creatureStage('jellyfish', 0)).toBe('egg');
    expect(creatureStage('turtle', 0)).toBe('egg');
  });
});
