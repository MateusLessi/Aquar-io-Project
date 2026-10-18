import { useGlobalSearchParams, usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, useTabTrigger } from 'expo-router/ui';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChromeInsetsProvider, OceanBackground, chrome, useBreakpoint } from '@/design-system';
import { QuickAddSheet } from '@/features/todo/components/QuickAddSheet';

import { destinations } from './destinations';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';

/**
 * The app's frame. Phones get a floating glass tab bar; tablets and desktop get a sidebar.
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
  const wide = useBreakpoint() !== 'compact';
  const insets = useSafeAreaInsets();
  const [creating, setCreating] = useState(false);

  // Any trigger can report which tab is focused.
  const { getTrigger } = useTabTrigger({ name: destinations[0]?.name ?? 'index' });
  const activeName = destinations.find((d) => getTrigger(d.name)?.isFocused)?.name;
  // When a list is open, new tasks go to it by default.
  const pathname = usePathname();
  const params = useGlobalSearchParams<{ id?: string }>();
  const currentListId = pathname.startsWith('/lists/') ? params.id : undefined;

  const chromeInsets = useMemo(
    () => ({ bottom: wide ? 0 : insets.bottom + chrome.tabBarOffset + chrome.tabBarHeight }),
    [wide, insets.bottom],
  );

  return (
    <OceanBackground caustics={false}>
      <View style={[styles.body, wide && styles.row]}>
        {wide ? <Sidebar destinations={destinations} onCreate={() => setCreating(true)} /> : null}
        <ChromeInsetsProvider value={chromeInsets}>
          <View style={styles.content}>
            <TabSlot />
          </View>
        </ChromeInsetsProvider>
      </View>
      {wide ? null : (
        <TabBar
          destinations={destinations}
          activeName={activeName}
          onCreate={() => setCreating(true)}
        />
      )}
      <QuickAddSheet
        visible={creating}
        onClose={() => setCreating(false)}
        defaultListId={currentListId}
        dueToday={activeName === 'index'}
      />
    </OceanBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hidden: { display: 'none' },
  body: { flex: 1 },
  row: { flexDirection: 'row' },
  content: { flex: 1 },
});
