import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ListsScreen from '@/app/(tabs)/lists';
import SettingsScreen from '@/app/(tabs)/settings';
import TabsLayout from '@/app/(tabs)/_layout';
import TodayScreen from '@/app/(tabs)/index';
import { ThemeProvider, lightColors } from '@/design-system';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function TestRoot() {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider initialPreference="light">
        <Slot />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const routes = {
  _layout: TestRoot,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': TodayScreen,
  '(tabs)/lists': ListsScreen,
  '(tabs)/settings': SettingsScreen,
};

function setWindowWidth(width: number, fontScale = 1) {
  Dimensions.set({
    window: { width, height: 844, scale: 3, fontScale },
    screen: { width, height: 844, scale: 3, fontScale },
  });
}

describe('App shell on phones', () => {
  beforeEach(() => setWindowWidth(390));

  it('opens on Today and navigates between destinations', async () => {
    const app = renderRouter(routes, { initialUrl: '/' });
    await app;
    expect(screen.getByRole('header', { name: 'Hoje' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Hoje' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Listas' }));
    expect(screen.getByRole('header', { name: 'Listas' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Listas' })).toBeSelected();
    expect(app.getPathname()).toBe('/lists');
  });

  it('offers "Nova tarefa" on Today but not on Settings', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await fireEvent.press(screen.getByRole('button', { name: 'Nova tarefa' }));
    expect(screen.getByText(/Criar tarefas chega na próxima etapa/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Entendi' }));

    await fireEvent.press(screen.getByRole('tab', { name: 'Ajustes' }));
    expect(screen.queryByRole('button', { name: 'Nova tarefa' })).toBeNull();
  });

  it('switches the theme from Settings', async () => {
    await renderRouter(routes, { initialUrl: '/settings' });
    const dark = screen.getByRole('radio', { name: 'Escuro' });
    expect(dark).not.toBeChecked();
    await fireEvent.press(dark);
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeChecked();
  });
});

describe('App shell with large text', () => {
  it('shows only the active tab name at normal sizes', async () => {
    setWindowWidth(390, 1.0);
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.queryByText('Listas')).toBeNull();
  });

  it('shows every tab name when the OS text size is large', async () => {
    setWindowWidth(390, 1.4);
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByText('Listas')).toBeOnTheScreen();
    expect(screen.getByText('Ajustes')).toBeOnTheScreen();
  });
});

describe('App shell on tablets and desktop', () => {
  beforeEach(() => setWindowWidth(1240));

  it('uses a sidebar with the same destinations', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByText('Aquar.io')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Hoje' })).toBeSelected();
    // The active item is filled so it reads clearly on the deep-water sidebar.
    expect(screen.getByRole('tab', { name: 'Hoje' })).toHaveStyle({
      backgroundColor: lightColors.deepAccent,
    });

    await fireEvent.press(screen.getByRole('tab', { name: 'Ajustes' }));
    expect(screen.getByRole('header', { name: 'Ajustes' })).toBeOnTheScreen();
  });
});
