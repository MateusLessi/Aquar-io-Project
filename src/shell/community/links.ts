import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Where the app's community lives. Kept here, not in app.json's `extra`, because the web
 * export does not carry `extra` to the app.
 */
export const COMMUNITY = {
  discord: 'https://discord.gg/JMGgPhTtr',
  github: 'https://github.com/MateusLessi/Aquar-io-Project',
};

/** The links, checked: anything that is not an https URL stays hidden. */
export type CommunityLinks = {
  /** Discord invite. Null until the server exists: the button stays hidden. */
  discord: string | null;
  /** The GitHub repository, e.g. https://github.com/owner/repo */
  github: string | null;
};

const isUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https:\/\/\S+$/.test(value);

export function communityLinks(extra: unknown = COMMUNITY): CommunityLinks {
  const raw = (extra ?? {}) as Record<string, unknown>;
  return {
    discord: isUrl(raw.discord) ? raw.discord : null,
    github: isUrl(raw.github) ? raw.github.replace(/\/+$/, '') : null,
  };
}

export type DeviceInfo = { version: string; platform: string };

export function deviceInfo(): DeviceInfo {
  const platform =
    Platform.OS === 'ios'
      ? `iOS ${Platform.Version}`
      : Platform.OS === 'android'
        ? `Android ${Platform.Version}`
        : 'Web';
  return { version: Constants.expoConfig?.version ?? '—', platform };
}

/**
 * A new issue from one of the repository's forms, with the app version and device filled in
 * (the form fields `version` and `device`, see .github/ISSUE_TEMPLATE).
 */
export function issueUrl(github: string, template: 'bug' | 'idea', device: DeviceInfo): string {
  const params = new URLSearchParams({ template: `${template}.yml` });
  if (template === 'bug') {
    params.set('version', device.version);
    params.set('device', device.platform);
  }
  return `${github}/issues/new?${params.toString()}`;
}
