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

// Notifications are native; tests check the reminder plan, not the OS scheduler.
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { HIGH: 4 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

// Reanimated 4.7's mock runs on top of Worklets, whose real module needs a native UI thread.
jest.mock('react-native-worklets', () =>
  jest.requireActual<object>('react-native-worklets/lib/module/mock'),
);
// Reanimated 4.7 initializes its CSS animations on import, which its Jest stand-in
// (JSReanimated) refuses to do. Nothing to initialize in tests.
jest.mock('react-native-reanimated/src/initializers', () => ({
  initializeReanimatedModule: () => {},
}));

// Reanimated's Jest mock has no ReducedMotionConfig (the theme renders one); it has no effect
// in tests anyway.
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual<object>('react-native-reanimated/mock'),
  ReducedMotionConfig: () => null,
}));
