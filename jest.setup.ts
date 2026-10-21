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
