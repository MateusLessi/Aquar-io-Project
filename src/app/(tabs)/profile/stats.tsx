import { Redirect } from 'expo-router';

/** Statistics moved to their own destination (Fase 2); old links still land there. */
export default function OldStatsRoute() {
  return <Redirect href="/stats" />;
}
