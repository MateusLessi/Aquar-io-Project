import { setUpTests } from 'react-native-reanimated';

setUpTests();

// expo-crypto is a native module; in Jest, use Node's UUID generator instead.
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<{ randomUUID: () => string }>('node:crypto').randomUUID(),
}));
