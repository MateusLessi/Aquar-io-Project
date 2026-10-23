import { useGlobalSearchParams, usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, useTabTrigger } from 'expo-router/ui';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSetting } from '@/core/settings/useSetting';
import { ChromeInsetsProvider, OceanBackground, chrome, useBreakpoint } from '@/design-system';

import { AMBIENT_SETTING, shouldShowAmbient, useCharging, type AmbientSetting } from './ambient';
import { AmbientDisplay } from './AmbientDisplay';
import { aquariumTab } from './aquarium/AquariumScreen';
import { CreateFlow } from './create/CreateFlow';
import { destinations } from './destinations';
import { NavigationRail } from './NavigationRail';
import { isPhoneScreen, useOrientationPolicy } from './orientation';
import { CelebrationBanner } from './progress/CelebrationBanner';
import { useCelebrations } from './progress/useCelebrations';
import { useReminderScheduler } from './reminders/useReminderScheduler';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { uprightRotation, useDeviceTilt } from './tilt';

/**
 * The app's frame, adapting to the device:
 * - phones (compact): floating tab bar; the UI stays in portrait and icons turn with the phone;
 * - tablets in portrait / unfolded foldables (medium): slim navigation rail;
 * - tablets in landscape / desktop (expanded): full sidebar.
 * Navigation itself is Expo Router's headless tabs: the visuals are entirely ours.
 */
export function AppShell() {
  return (
    <Tabs style={styles.root}>
      <TabList style={styles.hidden}>
        {destinations.map((destination) => (
          <TabTrigger key={destination.name} name={destination.name} href={destination.href} />
        ))}
      </TabList>
      <ShellLayout />
    </Tabs>
  );
}

function ShellLayout() {
  useOrientationPolicy();
  useReminderScheduler();
  const celebration = useCelebrations();
  const breakpoint = useBreakpoint();
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);

  // Any trigger can report which tab is focused.
  const { getTrigger } = useTabTrigger({ name: destinations[0]?.name ?? 'index' });
  const activeName = destinations.find((d) => getTrigger(d.name)?.isFocused)?.name;
  // When a list is open, new tasks go to it by default.
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ id?: string; tab?: string }>();
  const currentListId = pathname.startsWith('/aquarium/lists/') ? params.id : undefined;
  // In the Aquarium, the open section is the most likely thing to create.
  const suggestedCreate = pathname.startsWith('/aquarium/lists/')
    ? 'task'
    : pathname.startsWith('/aquarium')
      ? ({ habits: 'habit', routines: 'routine', lists: 'list' } as const)[aquariumTab(params.tab)]
      : undefined;

  // Phones: follow the physical tilt for icons and Modo Maré.
  const isPhone = isPhoneScreen();
  const tilt = useDeviceTilt(isPhone);
  const charging = useCharging(isPhone);
  const [ambientSetting] = useSetting<AmbientSetting>(AMBIENT_SETTING, 'on');
  const [dismissedTilt, setDismissedTilt] = useState<string | null>(null);
  const showAmbient = shouldShowAmbient({
    isPhone,
    tilt,
    charging,
    setting: ambientSetting,
    // A tap dismisses Modo Maré until the phone is held another way.
    dismissed: dismissedTilt === tilt,
  });

  const chromeInsets = useMemo(
    () => ({
      bottom:
        breakpoint === 'compact' ? insets.bottom + chrome.tabBarOffset + chrome.tabBarHeight : 0,
    }),
    [breakpoint, insets.bottom],
  );
  const create = () => setCreating(true);

  return (
    <OceanBackground caustics={false}>
      <View style={[styles.body, breakpoint !== 'compact' && styles.row]}>
        {breakpoint === 'expanded' ? (
          <Sidebar destinations={destinations} onCreate={create} />
        ) : null}
        {breakpoint === 'medium' ? (
          <NavigationRail destinations={destinations} onCreate={create} />
        ) : null}
        <ChromeInsetsProvider value={chromeInsets}>
          <View style={styles.content}>
            {/* TabSlot's container does not shrink by default: a long screen (e.g. Settings)
                would grow past the window and never scroll. */}
            <TabSlot style={styles.slot} />
          </View>
        </ChromeInsetsProvider>
      </View>
      {breakpoint === 'compact' ? (
        <TabBar
          destinations={destinations}
          activeName={activeName}
          onCreate={create}
          iconRotation={uprightRotation(tilt)}
        />
      ) : null}
      <CreateFlow
        visible={creating}
        onClose={() => setCreating(false)}
        suggested={suggestedCreate}
        defaultListId={currentListId}
        dueToday={activeName === 'index'}
      />
      {celebration.message ? (
        <CelebrationBanner
          key={celebration.message}
          message={celebration.message}
          onDone={celebration.dismiss}
        />
      ) : null}
      {showAmbient ? (
        <AmbientDisplay rotation={uprightRotation(tilt)} onExit={() => setDismissedTilt(tilt)} />
      ) : null}
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hidden: { display: 'none' },
  body: { flex: 1 },
  row: { flexDirection: 'row' },
  content: { flex: 1 },
  slot: { flexGrow: 1, flexShrink: 1, minHeight: 0 },
});
