/** iPhone/iPad Safari, outside the installed app: Safari has no install prompt, so we explain. */
export function needsInstallHint(env: {
  userAgent: string;
  maxTouchPoints: number;
  standalone: boolean;
  dismissed: boolean;
}): boolean {
  if (env.standalone || env.dismissed) return false;
  const ua = env.userAgent;
  // iPadOS reports itself as a Mac; touch gives it away.
  const apple = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && env.maxTouchPoints > 1);
  // Only Safari can add to the home screen from the share sheet on older iOS.
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return apple && safari;
}
