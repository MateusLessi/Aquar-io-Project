import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HabitRoute from '@/app/(tabs)/habits/[id]';
import HabitsLayout from '@/app/(tabs)/habits/_layout';
import HabitsScreen from '@/app/(tabs)/habits/index';
import ListRoute from '@/app/(tabs)/lists/[id]';
import ListsLayout from '@/app/(tabs)/lists/_layout';
import ListsScreen from '@/app/(tabs)/lists/index';
import SettingsScreen from '@/app/(tabs)/settings';
import TabsLayout from '@/app/(tabs)/_layout';
import TodayScreen from '@/app/(tabs)/index';
import { createMemoryDatabase } from '@/core/database/testing';
import { createMemoryAccount, createMemoryRemote } from '@/core/sync/testing';
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
  '(tabs)/habits/_layout': HabitsLayout,
  '(tabs)/habits/index': HabitsScreen,
  '(tabs)/habits/[id]': HabitRoute,
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

  it('turns Modo Maré off from Settings and remembers it', async () => {
    await renderRouter(routes, { initialUrl: '/settings' });
    expect(await screen.findByRole('radio', { name: 'Ligado' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Desligado' }));
    expect(await screen.findByRole('radio', { name: 'Desligado' })).toBeChecked();
    expect(await data.settings.get('ambientMode')).toBe('off');
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

describe('App shell on tablets in portrait', () => {
  beforeEach(() => setWindowWidth(800));

  it('uses a navigation rail', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    // The rail has no brand title, unlike the sidebar.
    expect(screen.queryByText('Aquar.io')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Hoje' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Nova tarefa' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Listas' }));
    expect(screen.getByRole('header', { name: 'Listas' })).toBeOnTheScreen();
  });
});

describe('Account and sync', () => {
  beforeEach(() => setWindowWidth(390));

  it('is hidden when the app has no cloud', async () => {
    await renderRouter(routes, { initialUrl: '/settings' });
    expect(screen.queryByText('Sincronizar aparelhos')).toBeNull();
  });

  it('creates an account, uploads local lists, and signs in again', async () => {
    const cloud = createMemoryRemote();
    const { account } = createMemoryAccount(cloud.remote);
    data = await createAppData(createMemoryDatabase(), undefined, account);
    await data.todo.createList({ name: 'Academia' });

    await renderRouter(routes, { initialUrl: '/settings' });
    await fireEvent.press(await screen.findByText('Sincronizar aparelhos'));

    await fireEvent.press(await screen.findByRole('button', { name: 'Criar conta' }));
    expect(screen.getByText('Digite um e-mail válido.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('E-mail'), ' Mateus@Exemplo.com ');
    await fireEvent.changeText(screen.getByLabelText('Senha'), '123');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }));
    expect(screen.getByText('A senha precisa ter pelo menos 6 caracteres.')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Senha'), 'mar-calmo');
    await fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('mateus@exemplo.com')).toBeOnTheScreen();
    await waitFor(() => expect(cloud.rows('task_lists')).toHaveLength(1));
    expect(await screen.findByText(/Sincronizado agora mesmo/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Sair' }));
    expect(await screen.findByText('Sincronizar aparelhos')).toBeOnTheScreen();

    // Signing in again: a wrong password is refused, the right one works.
    await fireEvent.press(screen.getByText('Sincronizar aparelhos'));
    await fireEvent.changeText(await screen.findByLabelText('E-mail'), 'mateus@exemplo.com');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'errada!');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('E-mail ou senha incorretos.')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'mar-calmo');
    await fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('mateus@exemplo.com')).toBeOnTheScreen();
  });
});

describe('Habits', () => {
  beforeEach(() => setWindowWidth(390));

  it('creates a habit, checks it today, and shows it on Today and in its details', async () => {
    const app = renderRouter(routes, { initialUrl: '/habits' });
    await app;
    expect(screen.getByRole('tab', { name: 'Hábitos' })).toBeSelected();

    await fireEvent.press(await screen.findByRole('button', { name: 'Novo hábito' }));
    await fireEvent.changeText(await screen.findByLabelText('Nome'), 'Beber água');
    await fireEvent.press(screen.getByRole('radio', { name: 'Peixe' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Criar hábito' }));

    const check = await screen.findByRole('checkbox', { name: 'Beber água: feito hoje' });
    expect(check).not.toBeChecked();
    await fireEvent.press(check);
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Beber água: feito hoje' })).toBeChecked(),
    );
    expect(await data.events.count('HABIT_CHECKED')).toBe(1);

    // Today shows the creature, already done.
    await fireEvent.press(screen.getByRole('tab', { name: 'Hoje' }));
    expect(await screen.findByText('Hábitos · 1 de 1')).toBeOnTheScreen();

    // The details show the streak.
    await fireEvent.press(screen.getByRole('tab', { name: 'Hábitos' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Beber água, Primeiro dia!' }));
    expect(await screen.findByText('Feito hoje!')).toBeOnTheScreen();
    expect(app.getPathname()).toMatch(/^\/habits\//);
  });
});
