import { randomUUID } from 'expo-crypto';

/** A new UUID v4, generated on the device so records can be created offline. */
export function newId(): string {
  return randomUUID();
}
