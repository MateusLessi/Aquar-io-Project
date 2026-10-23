import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HabitRoute from '@/app/(tabs)/aquarium/habits/[id]';
import AquariumScreen from '@/app/(tabs)/aquarium/index';
import AquariumLayout from '@/app/(tabs)/aquarium/_layout';
import ListRoute from '@/app/(tabs)/aquarium/lists/[id]';
import TabsLayout from '@/app/(tabs)/_layout';
import TodayScreen from '@/app/(tabs)/index';
import ProfileScreen from '@/app/(tabs)/profile';
import ShopScreen from '@/app/(tabs)/shop';
import { createMemoryDatabase } from '@/core/database/testing';
import { toDateKey } from '@/core/dates';
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
  '(tabs)/aquarium/_layout': AquariumLayout,
  '(tabs)/aquarium/index': AquariumScreen,
  '(tabs)/aquarium/habits/[id]': HabitRoute,
  '(tabs)/aquarium/lists/[id]': ListRoute,
  '(tabs)/shop': ShopScreen,
  '(tabs)/profile': ProfileScreen,
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
    expect(screen.getByRole('tab', { name: 'Início' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Aquário' }));
    expect(screen.getByRole('header', { name: 'Aquário' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Aquário' })).toBeSelected();
    expect(app.getPathname()).toBe('/aquarium');

    // The Aquarium's switch opens each module.
    await fireEvent.press(screen.getByRole('radio', { name: 'Listas' }));
    expect(await screen.findByRole('button', { name: 'Nova lista' })).toBeOnTheScreen();
  });

  it('creates a first list and a task for today, then completes it', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByText('Nada para hoje')).toBeOnTheScreen();

    // No lists yet: the quick add offers to create one first.
    await fireEvent.press(screen.getByRole('button', { name: 'Criar' }));
    await fireEvent.press(await screen.findByRole('button', { name: /^Criar tarefa/ }));
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

  it('offers "Criar" on Início and the Aquarium, not on the profile or the shop', async () => {
    await renderRouter(routes, { initialUrl: '/profile' });
    expect(screen.queryByRole('button', { name: 'Criar' })).toBeNull();
    await fireEvent.press(screen.getByRole('tab', { name: 'Loja' }));
    expect(screen.queryByRole('button', { name: 'Criar' })).toBeNull();
    await fireEvent.press(screen.getByRole('tab', { name: 'Aquário' }));
    expect(await screen.findByRole('button', { name: 'Criar' })).toBeOnTheScreen();
  });

  it('lets the person choose reduce motion and transparency, over the system', async () => {
    await renderRouter(routes, { initialUrl: '/profile' });
    const motion = screen.getByRole('switch', { name: 'Reduzir movimento' });
    expect(motion).not.toBeChecked();
    await fireEvent.press(motion);
    expect(screen.getByRole('switch', { name: 'Reduzir movimento' })).toBeChecked();
  });

  it('switches the theme from Settings', async () => {
    await renderRouter(routes, { initialUrl: '/profile' });
    const dark = screen.getByRole('radio', { name: 'Escuro' });
    expect(dark).not.toBeChecked();
    await fireEvent.press(dark);
    expect(screen.getByRole('radio', { name: 'Escuro' })).toBeChecked();
  });

  it('turns Modo Maré off from Settings and remembers it', async () => {
    await renderRouter(routes, { initialUrl: '/profile' });
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
    expect(screen.queryByText('Aquário')).toBeNull();
  });

  it('shows every tab name when the OS text size is large', async () => {
    setWindowWidth(390, 1.4);
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByText('Aquário')).toBeOnTheScreen();
    expect(screen.getByText('Loja')).toBeOnTheScreen();
    expect(screen.getByText('Perfil')).toBeOnTheScreen();
  });
});

describe('App shell on tablets and desktop', () => {
  beforeEach(() => setWindowWidth(1240));

  it('uses a sidebar with the same destinations', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByText('Aquar.io')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Início' })).toBeSelected();
    // The active item is filled so it reads clearly on the deep-water sidebar.
    expect(screen.getByRole('tab', { name: 'Início' })).toHaveStyle({
      backgroundColor: lightColors.deepAccent,
    });

    await fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }));
    expect(screen.getByRole('header', { name: 'Perfil' })).toBeOnTheScreen();
  });
});

describe('App shell on tablets in portrait', () => {
  beforeEach(() => setWindowWidth(800));

  it('uses a navigation rail', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    // The rail has no brand title, unlike the sidebar.
    expect(screen.queryByText('Aquar.io')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Início' })).toBeSelected();
    expect(screen.getByRole('button', { name: 'Criar' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('tab', { name: 'Aquário' }));
    expect(screen.getByRole('header', { name: 'Aquário' })).toBeOnTheScreen();
  });
});

describe('Account and sync', () => {
  beforeEach(() => setWindowWidth(390));

  it('is hidden when the app has no cloud', async () => {
    await renderRouter(routes, { initialUrl: '/profile' });
    expect(screen.queryByText('Sincronizar aparelhos')).toBeNull();
  });

  it('creates an account, uploads local lists, and signs in again', async () => {
    const cloud = createMemoryRemote();
    const { account } = createMemoryAccount(cloud.remote);
    data = await createAppData(createMemoryDatabase(), undefined, account);
    await data.todo.createList({ name: 'Academia' });

    await renderRouter(routes, { initialUrl: '/profile' });
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
    const app = renderRouter(routes, { initialUrl: '/aquarium?tab=habits' });
    await app;
    expect(screen.getByRole('tab', { name: 'Aquário' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Hábitos' })).toBeChecked();

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
    await fireEvent.press(screen.getByRole('tab', { name: 'Início' }));
    expect(await screen.findByText('Hábitos · 1 de 1')).toBeOnTheScreen();

    // The details show the streak.
    await fireEvent.press(screen.getByRole('tab', { name: 'Aquário' }));
    await fireEvent.press(
      await screen.findByRole('button', { name: /^Beber água, Primeiro dia!/ }),
    );
    expect(await screen.findByText('Feito hoje!')).toBeOnTheScreen();
    expect(app.getPathname()).toMatch(/^\/aquarium\/habits\//);
  });
});

describe('Repeating tasks and reminders', () => {
  beforeEach(() => setWindowWidth(390));

  it('sets a task to repeat with a reminder from its details', async () => {
    const listId = await data.todo.createList({ name: 'Casa' });
    const todayKey = toDateKey(new Date());
    const taskId = await data.todo.createTask({
      listId,
      title: 'Regar plantas',
      dueDate: todayKey,
    });

    await renderRouter(routes, { initialUrl: '/' });
    await fireEvent.press(await screen.findByText('Regar plantas'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Todo dia' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar lembrete' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Salvar lembrete' }));

    await waitFor(async () => {
      const task = await data.todo.getTask(taskId);
      expect(task?.repeat).toEqual({ kind: 'daily' });
      expect(task?.remindAt).toBe('09:00');
    });
    expect(
      await screen.findByRole('button', { name: 'Remover lembrete das 09:00' }),
    ).toBeOnTheScreen();
  });
});

describe('Depth and celebrations', () => {
  beforeEach(() => setWindowWidth(390));

  it('shows the depth gauge and celebrates reaching a new zone once', async () => {
    await data.settings.set('celebratedZone', 'surface');
    const listId = await data.todo.createList({ name: 'Casa' });
    for (let i = 0; i < 10; i++) {
      const id = await data.todo.createTask({ listId, title: `Tarefa ${i}` });
      await data.todo.setCompleted(id, true);
    }

    await renderRouter(routes, { initialUrl: '/' });
    expect(
      await screen.findByRole('progressbar', { name: /Profundidade: 100 m, Águas Costeiras/ }),
    ).toBeOnTheScreen();
    expect(await screen.findByText('🏝️ Você chegou: Águas Costeiras!')).toBeOnTheScreen();
    expect(await data.settings.get('celebratedZone')).toBe('coastal');
  });

  it('does not celebrate old progress the first time it runs', async () => {
    const listId = await data.todo.createList({ name: 'Casa' });
    for (let i = 0; i < 10; i++) {
      const id = await data.todo.createTask({ listId, title: `Tarefa ${i}` });
      await data.todo.setCompleted(id, true);
    }
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(async () => expect(await data.settings.get('celebratedZone')).toBe('coastal'));
    expect(screen.queryByText(/Você chegou/)).toBeNull();
  });
});

describe('Routines', () => {
  beforeEach(() => setWindowWidth(390));

  it('creates a routine with items and checks one on Today', async () => {
    // A routine running all day, so it is "now" whenever the test runs.
    const id = await data.routines.createRoutine({
      name: 'Dia todo',
      emoji: '🌅',
      start: '00:00',
      end: '23:59',
      items: ['Beber água', 'Alongar'],
    });

    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('Rotinas · 0 de 1')).toBeOnTheScreen();
    await fireEvent.press(await screen.findByRole('checkbox', { name: 'Beber água' }));
    await waitFor(async () => {
      const [routine] = await data.routines.listToday();
      expect(routine?.items.find((i) => i.title === 'Beber água')?.done).toBe(true);
    });
    expect(await data.events.count('ROUTINE_ITEM_CHECKED')).toBe(1);
    expect(id).toBeTruthy();
  });

  it('creates a routine from the Routines tab', async () => {
    await renderRouter(routes, { initialUrl: '/aquarium?tab=routines' });
    expect(screen.getByRole('radio', { name: 'Rotinas' })).toBeChecked();
    await fireEvent.press(await screen.findByRole('button', { name: 'Nova rotina' }));
    await fireEvent.changeText(await screen.findByLabelText('Nome'), 'Academia');
    await fireEvent.changeText(screen.getByLabelText('Novo item'), 'Aquecer');
    await fireEvent.press(screen.getByRole('button', { name: 'Adicionar item' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Criar rotina' }));
    expect(await screen.findByText('Academia')).toBeOnTheScreen();
    const [routine] = await data.routines.listToday();
    expect(routine?.items.map((i) => i.title)).toEqual(['Aquecer']);
  });
});
