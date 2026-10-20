import { Platform } from 'react-native';

import { shouldShowAmbient } from '../ambient';
import { tiltFromAcceleration, uprightRotation } from '../tilt';

const upright = { x: 0, y: -1, z: 0 };
const flat = { x: 0.1, y: 0.1, z: -1 };

describe('tiltFromAcceleration (iOS: Core Motion reports gravity)', () => {
  it('reads portrait when gravity points down the phone', () => {
    expect(tiltFromAcceleration(upright, 'landscapeLeft')).toBe('portrait');
  });

  it('tells which side the top of the phone points to', () => {
    expect(tiltFromAcceleration({ x: -1, y: 0, z: 0 }, 'portrait')).toBe('landscapeLeft');
    expect(tiltFromAcceleration({ x: 1, y: 0, z: 0 }, 'portrait')).toBe('landscapeRight');
  });

  it('keeps the previous tilt when flat on a table or in between', () => {
    expect(tiltFromAcceleration(flat, 'landscapeRight')).toBe('landscapeRight');
    expect(tiltFromAcceleration({ x: -0.5, y: -0.5, z: 0.3 }, 'portrait')).toBe('portrait');
  });
});

describe('tiltFromAcceleration (Android: reports the reaction force)', () => {
  const original = Platform.OS;
  beforeAll(() => {
    Platform.OS = 'android';
  });
  afterAll(() => {
    Platform.OS = original;
  });

  it('flips the x axis', () => {
    expect(tiltFromAcceleration({ x: 1, y: 0, z: 0 }, 'portrait')).toBe('landscapeLeft');
    expect(tiltFromAcceleration({ x: -1, y: 0, z: 0 }, 'portrait')).toBe('landscapeRight');
  });
});

describe('uprightRotation', () => {
  it('turns content against the tilt', () => {
    expect(uprightRotation('portrait')).toBe(0);
    expect(uprightRotation('landscapeLeft')).toBe(90);
    expect(uprightRotation('landscapeRight')).toBe(-90);
  });
});

describe('shouldShowAmbient', () => {
  const base = {
    isPhone: true,
    tilt: 'landscapeLeft' as const,
    charging: true,
    setting: 'on' as const,
    dismissed: false,
  };

  it('shows on a sideways phone that is charging', () => {
    expect(shouldShowAmbient(base)).toBe(true);
  });

  it.each([
    ['in portrait', { tilt: 'portrait' as const }],
    ['not charging', { charging: false }],
    ['turned off in Settings', { setting: 'off' as const }],
    ['dismissed with a tap', { dismissed: true }],
    ['on a tablet', { isPhone: false }],
  ])('stays hidden %s', (_, override) => {
    expect(shouldShowAmbient({ ...base, ...override })).toBe(false);
  });
});
