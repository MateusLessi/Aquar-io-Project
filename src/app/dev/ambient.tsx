// Development-only preview of Modo Maré (the accelerometer can't be simulated on web).
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { AmbientContent } from '@/shell/AmbientDisplay';

export default function AmbientPreview() {
  const router = useRouter();
  const { rotation } = useLocalSearchParams<{ rotation?: string }>();
  if (!__DEV__) return <Redirect href="/" />;
  return <AmbientContent rotation={Number(rotation ?? 0)} onExit={() => router.back()} />;
}
