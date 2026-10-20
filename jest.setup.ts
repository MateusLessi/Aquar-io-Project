import { setUpTests } from 'react-native-reanimated';

setUpTests();

// expo-crypto is a native module; in Jest, use Node's UUID generator instead.
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<{ randomUUID: () => string }>('node:crypto').randomUUID(),
}));

// Device sensors and battery: native modules. Tests run as a phone held upright, unplugged.
jest.mock('expo-battery', () => ({
  ...jest.requireActual<object>('expo-battery'),
  getBatteryStateAsync: jest.fn(() => Promise.resolve(1)), // BatteryState.UNPLUGGED
  addBatteryStateListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));
