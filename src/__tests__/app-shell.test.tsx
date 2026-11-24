import { Slot } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor, within } from 'expo-router/testing-library';
import { Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HabitRoute from '@/app/(tabs)/aquarium/habits/[id]';
import AquariumScreen from '@/app/(tabs)/aquarium/index';
import AquariumLayout from '@/app/(tabs)/aquarium/_layout';
import ListRoute from '@/app/(tabs)/aquarium/lists/[id]';
import TabsLayout from '@/app/(tabs)/_layout';
import TodayScreen from '@/app/(tabs)/index';
import ProfileScreen from '@/app/(tabs)/profile/index';
import SettingsRoute from '@/app/(tabs)/profile/settings';
import ProfileLayout from '@/app/(tabs)/profile/_layout';
import PersonalizeScreen from '@/app/(tabs)/personalize';
import PondRoute from '@/app/pond';
import StatsRoute from '@/app/(tabs)/stats';
import { createMemoryDatabase } from '@/core/database/testing';
import { toDateKey } from '@/core/dates';
import { createMemoryAccount, createMemoryRemote } from '@/core/sync/testing';
import { ThemeProvider, appColors } from '@/design-system';
import { AppDataProvider, createAppData, type AppData } from '@/shell/AppData';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

let data: AppData;

beforeEach(async () => {
  data = await createAppData(createMemoryDatabase());
  // These tests start inside the app; the welcome dive has its own tests below.
  await data.settings.set('welcome.done', 'test');
});

function TestRoot() {
  return (
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider>
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
  '(tabs)/personalize': PersonalizeScreen,
  '(tabs)/stats': StatsRoute,
  '(tabs)/profile/_layout': ProfileLayout,
  '(tabs)/profile/index': ProfileScreen,
  '(tabs)/profile/settings': SettingsRoute,
  pond: PondRoute,
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
    const app = await renderRouter(routes, { initialUrl: '/' });
    await app;
    // Início greets by the time of day.
    expect(
      screen.getByRole('header', { name: /^(Bom dia|Boa tarde|Boa noite)/ }),
    ).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Início' })).toBeSelected();

    await fireEvent.press(screen.getByRole('tab', { name: 'Aquário' }));
    expect(screen.getByRole('header', { name: 'Aquário' })).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Aquário' })).toBeSelected();
    expect(app.getPathname()).toBe('/aquarium');

    // The Aquarium's switch opens each module.
    await fireEvent.press(screen.getByRole('radio', { name: 'Listas' }));
    expect(await screen.findByRole('button', { name: 'Nova lista ou pasta' })).toBeOnTheScreen();
  });

  it('creates a first list and a task for today, then completes it', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByText(/^Nenhuma tarefa para hoje/)).toBeOnTheScreen();

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

  it('offers "Criar" on Início and the Aquarium, not on the profile or the statistics', async () => {
    await renderRouter(routes, { initialUrl: '/profile' });
    expect(screen.queryByRole('button', { name: 'Criar' })).toBeNull();
    // On phones Personalizar is a tile in the profile, not a tab.
    expect(screen.queryByRole('tab', { name: 'Personalizar' })).toBeNull();
    await fireEvent.press(screen.getByRole('tab', { name: 'Estatísticas' }));
    expect(screen.queryByRole('button', { name: 'Criar' })).toBeNull();
    await fireEvent.press(screen.getByRole('tab', { name: 'Aquário' }));
    expect(await screen.findByRole('button', { name: 'Criar' })).toBeOnTheScreen();
  });

  it('lets the person choose reduce motion and transparency, over the system', async () => {
    await renderRouter(routes, { initialUrl: '/profile/settings?section=accessibility' });
    const motion = screen.getByRole('switch', { name: 'Reduzir movimento' });
    expect(motion).not.toBeChecked();
    await fireEvent.press(motion);
    expect(screen.getByRole('switch', { name: 'Reduzir movimento' })).toBeChecked();
  });

  it('changes the text size from Settings, with no theme to pick (one look)', async () => {
    await renderRouter(routes, { initialUrl: '/profile/settings?section=appearance' });
    expect(screen.queryByRole('radio', { name: 'Escuro' })).toBeNull();
    const large = screen.getByRole('radio', { name: 'Grande' });
    expect(large).not.toBeChecked();
    await fireEvent.press(large);
    expect(screen.getByRole('radio', { name: 'Grande' })).toBeChecked();
  });

  it('turns Modo Maré off from Settings and remembers it', async () => {
    await renderRouter(routes, { initialUrl: '/profile/settings?section=tide' });
    expect(await screen.findByRole('radio', { name: 'Ligado' })).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Desligado' }));
    expect(await screen.findByRole('radio', { name: 'Desligado' })).toBeChecked();
    expect(await data.settings.get('ambientMode')).toBe('off');
  });
});

describe('Início (Fase 6)', () => {
  beforeEach(() => setWindowWidth(390));

  it('shows the week as one number and today’s habits as rows you can check', async () => {
    await data.habits.createHabit({ name: 'Meditar', creature: 'jellyfish' });
    await renderRouter(routes, { initialUrl: '/' });
    expect(
      await screen.findByText('Hábitos de hoje · 0 de 1', {}, { timeout: 5000 }),
    ).toBeOnTheScreen();
    // The card reads as one sentence to screen readers.
    expect(screen.getByLabelText(/^Consistência da semana: /)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Meditar, Para hoje' })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Meditar: feito hoje' }));
    expect(await screen.findByText('Hábitos de hoje · 1 de 1')).toBeOnTheScreen();
    expect(
      await screen.findByLabelText('Consistência da semana: 100%. 1 de 1 hábitos e rotinas feitos'),
    ).toBeOnTheScreen();
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
    expect(screen.getByText('Estatísticas')).toBeOnTheScreen();
    expect(screen.getByText('Perfil')).toBeOnTheScreen();
  });
});

describe('App shell on tablets and desktop', () => {
  beforeEach(() => setWindowWidth(1240));

  it('uses a sidebar with the same destinations', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    expect(screen.getByText('Aquar.io')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Início' })).toBeSelected();
    // The active item sits on a solid piece in the panel's color, so it uses the panel's text.
    expect(within(screen.getByRole('tab', { name: 'Início' })).getByText('Início')).toHaveStyle({
      color: appColors.textPrimary,
    });

    // You sit at the bottom: the chip opens the profile, the gear opens Ajustes.
    await fireEvent.press(screen.getByRole('button', { name: /^Perfil: / }));
    expect(await screen.findByRole('header', { name: 'Perfil' })).toBeOnTheScreen();

    // The Aquarium opens its sections under it.
    await fireEvent.press(screen.getByRole('tab', { name: 'Aquário' }));
    await fireEvent.press(await screen.findByRole('link', { name: 'Aquário: Listas' }));
    expect(await screen.findByRole('link', { name: 'Aquário: Listas' })).toBeSelected();
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
    await data.settings.set('welcome.done', 'test');
    await data.todo.createList({ name: 'Academia' });

    await renderRouter(routes, { initialUrl: '/profile/settings?section=account' });
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
    const app = await renderRouter(routes, { initialUrl: '/aquarium?tab=habits' });
    await app;
    expect(screen.getByRole('tab', { name: 'Aquário' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Hábitos' })).toBeChecked();

    await fireEvent.press(await screen.findByRole('button', { name: 'Novo hábito' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Começar do zero' }));
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
    expect(await screen.findByText('Hábitos de hoje · 1 de 1')).toBeOnTheScreen();

    // The details show the streak.
    await fireEvent.press(screen.getByRole('tab', { name: 'Aquário' }));
    await fireEvent.press(
      await screen.findByRole('button', { name: /^Beber água, Feito, Primeiro dia!/ }),
    );
    expect(await screen.findByText('Feito hoje!')).toBeOnTheScreen();
    expect(app.getPathname()).toMatch(/^\/aquarium\/habits\//);
  });

  it('greets the first day of a habit instead of a row of zeros', async () => {
    await renderRouter(routes, { initialUrl: '/aquarium?tab=habits' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Novo hábito' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Começar do zero' }));
    await fireEvent.changeText(await screen.findByLabelText('Nome'), 'Ler');
    await fireEvent.press(screen.getByRole('radio', { name: 'Peixe' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Criar hábito' }));
    await fireEvent.press(await screen.findByRole('button', { name: /^Ler, / }));
    expect(await screen.findByText('Seu primeiro dia com Ler')).toBeOnTheScreen();
    expect(screen.queryByText('Seguidos')).toBeNull();
  });

  it("shows the habit as its creature: stage, evolution, this week and 'Marcar hoje'", async () => {
    await renderRouter(routes, { initialUrl: '/aquarium?tab=habits' });
    await fireEvent.press(await screen.findByRole('button', { name: 'Novo hábito' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Começar do zero' }));
    await fireEvent.changeText(await screen.findByLabelText('Nome'), 'Ler');
    await fireEvent.press(screen.getByRole('radio', { name: 'Peixe' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Criar hábito' }));
    await fireEvent.press(await screen.findByRole('button', { name: /^Ler, / }));

    // The fish, still an egg: the path ahead, and how far the next stage is.
    expect(await screen.findByLabelText('Peixe, ovo, no lago. Para hoje.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Crescimento: 0 de 3 dias até Filhote')).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        'Evolução: Ovo, agora; Filhote, com 3 dias; Jovem, com 10 dias; Adulto, com 30 dias',
      ),
    ).toBeOnTheScreen();

    // Marking today counts a day toward the next stage, and the week shows it.
    await fireEvent.press(screen.getByRole('button', { name: 'Marcar hoje' }));
    expect(await screen.findByText('Feito hoje!')).toBeOnTheScreen();
    expect(await screen.findByLabelText('Peixe, ovo, no lago. Feito hoje.')).toBeOnTheScreen();
    expect(screen.getByLabelText('Crescimento: 1 de 3 dias até Filhote')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Esta semana: .*feito/)).toBeOnTheScreen();
    expect(await data.events.count('HABIT_CHECKED')).toBe(1);

    // And it can be undone.
    await fireEvent.press(screen.getByRole('button', { name: 'Desmarcar' }));
    expect(await screen.findByRole('button', { name: 'Marcar hoje' })).toBeOnTheScreen();
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
    expect(await screen.findByText('Você chegou: Águas Costeiras!')).toBeOnTheScreen();
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

  it('drops the section views down from the capsule on phones', async () => {
    await renderRouter(routes, { initialUrl: '/aquarium?tab=routines' });
    const agenda = await screen.findByRole('radio', { name: 'Agenda' });
    expect(agenda).toBeChecked();
    // Closed, the capsule says what you see; the views wait in the dropdown.
    expect(screen.queryByRole('radio', { name: 'Semana' })).toBeNull();
    await fireEvent.press(agenda);
    expect(screen.getByRole('radio', { name: 'Agenda' })).toBeExpanded();
    await fireEvent.press(screen.getByRole('radio', { name: 'Semana' }));
    // Picking closes it, and the capsule now reads the new view.
    expect(screen.queryByRole('radio', { name: 'Semana' })).toBeNull();
    expect(screen.getByText(' · Semana')).toBeOnTheScreen();
  });

  it('creates a routine from the Routines tab', async () => {
    await renderRouter(routes, { initialUrl: '/aquarium?tab=routines' });
    expect(screen.getByRole('radio', { name: 'Agenda' })).toBeChecked();
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

describe('Início as a bento on large screens', () => {
  beforeEach(() => setWindowWidth(1240));

  it('fits the day in one window: the tank, and the tides as a week or a month under it', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    // "Criar" lives in the sidebar only.
    expect(screen.getAllByRole('button', { name: 'Criar' })).toHaveLength(1);
    // The pond opens Seu aquário, to explore.
    expect(screen.getByRole('button', { name: 'Explorar o aquário' })).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Sua semana: 0 pontos/)).toBeOnTheScreen();
    // The same box switches to the month, and remembers it.
    await fireEvent.press(screen.getByRole('radio', { name: 'Mês' }));
    expect(await screen.findByText('0 dias de maré cheia')).toBeOnTheScreen();
    await waitFor(async () => expect(await data.settings.get('dashboard.tides')).toBe('month'));
  });
});

describe('Welcome dive', () => {
  beforeEach(() => setWindowWidth(390));

  it('opens on a device with nothing in it, and Pular remembers it', async () => {
    data = await createAppData(createMemoryDatabase());
    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByRole('button', { name: 'Começar o mergulho' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Começar o mergulho' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Pular' }));
    expect(await data.settings.get('welcome.done')).toBe('skipped');
  });

  it('stays away for people who already use the app', async () => {
    data = await createAppData(createMemoryDatabase());
    await data.todo.createList({ name: 'Academia' });
    await renderRouter(routes, { initialUrl: '/' });
    await waitFor(async () => expect(await data.settings.get('welcome.done')).toBe('existing'));
    expect(screen.queryByRole('button', { name: 'Começar o mergulho' })).toBeNull();
  });
});

describe('Seu aquário (Fase 6)', () => {
  beforeEach(() => setWindowWidth(390));

  it('opens from Aquário → Hábitos; a creature shows its habit, and its page is one tap away', async () => {
    const lerId = await data.habits.createHabit({ name: 'Ler', creature: 'fish' });
    await data.habits.createHabit({ name: 'Estudar', creature: 'shark' });
    const app = await renderRouter(routes, { initialUrl: '/aquarium?tab=habits' });
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Explorar o aquário: 2 criaturas. 0 de 2 hoje.' }),
    );
    expect(app.getPathname()).toBe('/pond');
    expect(await screen.findByText('2 criaturas · 0 de 2 hoje')).toBeOnTheScreen();
    expect(screen.getByText('Toque numa criatura para ver o hábito dela')).toBeOnTheScreen();

    // A tap on the creature in the water shows its card.
    await fireEvent(screen.getByTestId('pond', { includeHiddenElements: true }), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 844 } },
    });
    await fireEvent.press(
      await screen.findByTestId(`pond-creature-${lerId}`, { includeHiddenElements: true }),
    );
    expect(await screen.findByText('Peixe · Ovo · Para hoje')).toBeOnTheScreen();
    expect(screen.getByLabelText('Crescimento: 0 de 3 dias até Filhote')).toBeOnTheScreen();

    // The same choice from the row of creatures; today's action works from the card.
    await fireEvent.press(
      screen.getByRole('button', { name: 'Estudar: Tubarão, Filhote. Para hoje.' }),
    );
    expect(await screen.findByText('Tubarão · Filhote · Para hoje')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Estudar: feito hoje' }));
    expect(await screen.findByText('Tubarão · Filhote · Feito hoje')).toBeOnTheScreen();
    expect(await screen.findByText('2 criaturas · 1 de 2 hoje')).toBeOnTheScreen();

    // Its page, then back to the pond.
    await fireEvent.press(screen.getByRole('button', { name: 'Ver hábito' }));
    await waitFor(() => expect(app.getPathname()).toMatch(/^\/aquarium\/habits\//));
  });

  it('says what to do when the aquarium is empty', async () => {
    await renderRouter(routes, { initialUrl: '/pond' });
    expect(await screen.findByText('Seu aquário está vazio')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Criar um hábito' })).toBeOnTheScreen();
  });
});

describe('The pond (Fase 6)', () => {
  beforeEach(() => setWindowWidth(390));

  it('opens Início on the pond, and the old tank is one switch away in Ajustes', async () => {
    await renderRouter(routes, { initialUrl: '/profile/settings?section=home' });
    const pond = await screen.findByRole('radio', { name: 'Lago' });
    expect(pond).toBeChecked();
    await fireEvent.press(screen.getByRole('radio', { name: 'Tanque' }));
    await waitFor(async () => expect(await data.settings.get('aquarium.view')).toBe('tank'));
  });

  it('shows the day in one number over the water', async () => {
    await data.todo.createTask({
      listId: await data.todo.createList({ name: 'Casa' }),
      title: 'Lavar a louça',
      dueDate: toDateKey(new Date()),
    });
    await renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText('Abrir aquário ›')).toBeOnTheScreen();
    expect(screen.getByText('de 1 hoje')).toBeOnTheScreen();
    // The old tank's chips are not there.
    expect(screen.queryByText('Maré do dia')).toBeNull();
  });
});
