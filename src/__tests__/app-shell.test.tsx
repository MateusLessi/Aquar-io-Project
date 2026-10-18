import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ListRoute from '@/app/(tabs)/lists/[id]';
import ListsLayout from '@/app/(tabs)/lists/_layout';
import ListsScreen from '@/app/(tabs)/lists/index';
import SettingsScreen from '@/app/(tabs)/settings';
import TabsLayout from '@/app/(tabs)/_layout';
import TodayScreen from '@/app/(tabs)/index';
import { createMemoryDatabase } from '@/core/database/testing';
import { ThemeProvider, lightColors } from '@/design-system';
import { AppDataProvider, createAppData, type AppData } from '@/shell/AppData';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

let data: AppData;

beforeEach(async () => {
  data = await createAppData(createMemoryDatabase());
});

function TestRoot() {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider initialPreference="light">
        <AppDataProvider data={data}>
          <Slot />
        </AppDataProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const routes = {
  _layout: TestRoot,
  '(tabs)/_layout': TabsLayout,
  '(tabs)/index': TodayScreen,
  '(tabs)/lists/_layout': ListsLayout,
  '(tabs)/lists/index': ListsScreen,
  '(tabs)/lists/[id]': ListRoute,
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

  it('creates a first list and a task for today, then completes it', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByText('Nada para hoje')).toBeOnTheScreen();

    // No lists yet: the quick add offers to create one first.
    await fireEvent.press(screen.getByRole('button', { name: 'Nova tarefa' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Criar lista' }));
    await fireEvent.changeText(await screen.findByLabelText('Nome'), 'Academia');
    const createButtons = screen.getAllByRole('button', { name: 'Criar lista' });
    await fireEvent.press(createButtons[createButtons.length - 1]!);

    // Back in quick add, with "Para hoje" preselected because we came from Today.
    await fireEvent.changeText(await screen.findByLabelText('Tarefa'), 'Treino de perna');
    expect(screen.getByRole('button', { name: 'Para hoje' })).toBeSelected();
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar' }));

    const checkbox = await screen.findByRole('checkbox', { name: 'Treino de perna' });
    expect(screen.getByRole('progressbar', { name: /0 de 1/ })).toBeOnTheScreen();
    await fireEvent.press(checkbox);
    expect(await screen.findByRole('progressbar', { name: /1 de 1/ })).toBeOnTheScreen();
    expect(await data.events.count('TASK_COMPLETED')).toBe(1);
  });

  it('does not offer "Nova tarefa" on Settings', async () => {
    await renderRouter(routes, { initialUrl: '/settings' });
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
