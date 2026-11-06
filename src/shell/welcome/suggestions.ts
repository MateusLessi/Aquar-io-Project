import type { GlyphKey, ListColorName } from '@/design-system';
import type { CreatureId } from '@/features/habits/domain/creatures';
import type { NewHabit } from '@/features/habits/domain/types';
import type { NewRoutine } from '@/features/routines/domain/types';
import type { NewList } from '@/features/todo/domain/types';

export type Area = 'study' | 'work' | 'health' | 'home' | 'projects' | 'wellbeing';
export type Peak = 'morning' | 'day' | 'night';
export type StarterHabit = 'water' | 'meditate' | 'read' | 'exercise' | 'sleep' | 'study';
export type AgeRange = 'u18' | '18-24' | '25-34' | '35-49' | '50+' | 'none';

export const AREAS: { id: Area; icon: GlyphKey; label: string }[] = [
  { id: 'study', icon: 'library', label: 'Estudos' },
  { id: 'work', icon: 'briefcase', label: 'Trabalho' },
  { id: 'health', icon: 'dumbbell', label: 'Saúde e exercício' },
  { id: 'home', icon: 'house', label: 'Casa' },
  { id: 'projects', icon: 'palette', label: 'Projetos pessoais' },
  { id: 'wellbeing', icon: 'leaf', label: 'Bem-estar' },
];

export const PEAKS: { id: Peak; icon: GlyphKey; label: string }[] = [
  { id: 'morning', icon: 'sunrise', label: 'De manhã cedo' },
  { id: 'day', icon: 'sun', label: 'Durante o dia' },
  { id: 'night', icon: 'moon', label: 'À noite' },
];

export const AGES: { id: AgeRange; label: string }[] = [
  { id: 'u18', label: 'até 17' },
  { id: '18-24', label: '18–24' },
  { id: '25-34', label: '25–34' },
  { id: '35-49', label: '35–49' },
  { id: '50+', label: '50+' },
  { id: 'none', label: 'Prefiro não dizer' },
];

/** Starter habits with the right kind and goal (glasses, pages, minutes). */
export const STARTER_HABITS: Record<
  StarterHabit,
  { icon: GlyphKey; label: string; detail: string; habit: NewHabit }
> = {
  water: {
    icon: 'droplet',
    label: 'Beber água',
    detail: '8 copos por dia',
    habit: { name: 'Beber água', creature: 'fish', kind: 'count', target: 8, unit: 'copos' },
  },
  meditate: {
    icon: 'leaf',
    label: 'Meditar',
    detail: '10 minutos por dia',
    habit: { name: 'Meditar', creature: 'turtle', kind: 'time', target: 10 },
  },
  read: {
    icon: 'book-open',
    label: 'Ler',
    detail: '20 páginas por dia',
    habit: { name: 'Ler', creature: 'octopus', kind: 'count', target: 20, unit: 'páginas' },
  },
  exercise: {
    icon: 'run',
    label: 'Exercício',
    detail: 'Seg, qua e sex',
    habit: { name: 'Exercício', creature: 'dolphin', kind: 'check', days: 0b0101010 },
  },
  sleep: {
    icon: 'bed',
    label: 'Dormir cedo',
    detail: 'Todo dia',
    habit: { name: 'Dormir cedo', creature: 'seal', kind: 'check' },
  },
  study: {
    icon: 'feather',
    label: 'Estudar',
    detail: '30 minutos, de seg a sex',
    habit: { name: 'Estudar', creature: 'whale', kind: 'time', target: 30, days: 0b0111110 },
  },
};

export type WelcomeAnswers = {
  areas: Area[];
  peak: Peak | null;
  habits: StarterHabit[];
  age: AgeRange | null;
};

export type Suggestion =
  | { key: string; kind: 'habit'; icon: GlyphKey; title: string; detail: string; habit: NewHabit }
  | {
      key: string;
      kind: 'routine';
      icon: GlyphKey;
      title: string;
      detail: string;
      routine: NewRoutine;
    }
  | { key: string; kind: 'list'; icon: GlyphKey; title: string; detail: string; list: NewList };

const WEEKDAYS = 0b0111110;
const MON_WED_FRI = 0b0101010;

const TIMES: Record<'study' | 'work' | 'health', Record<Peak, [string, string]>> = {
  study: { morning: ['07:00', '09:00'], day: ['14:00', '16:00'], night: ['19:00', '21:00'] },
  work: { morning: ['08:00', '12:00'], day: ['09:00', '12:00'], night: ['13:00', '17:00'] },
  health: { morning: ['06:30', '07:30'], day: ['12:00', '13:00'], night: ['18:30', '19:30'] },
};

/** "Escola", "Faculdade" or "Estudos": the only thing the age range changes. */
function studyListName(age: AgeRange | null): string {
  if (age === 'u18') return 'Escola';
  if (age === '18-24') return 'Faculdade';
  return 'Estudos';
}

const daysLabel = (days: number) =>
  days === WEEKDAYS ? 'seg a sex' : days === MON_WED_FRI ? 'seg, qua e sex' : 'todo dia';

function routine(
  key: string,
  icon: GlyphKey,
  name: string,
  color: ListColorName,
  [start, end]: [string, string],
  days: number,
  items: string[],
): Suggestion {
  return {
    key,
    kind: 'routine',
    icon,
    title: `Rotina: ${name}`,
    detail: `${start}–${end} · ${daysLabel(days)}`,
    routine: { name, emoji: icon, color, start, end, days, items },
  };
}

function list(key: string, icon: GlyphKey, name: string, color: ListColorName, detail: string) {
  return {
    key,
    kind: 'list' as const,
    icon,
    title: `Lista: ${name}`,
    detail,
    list: { name, emoji: icon, color },
  };
}

/**
 * The starter aquarium from the quiz: the chosen habits, up to two routines at the time the
 * day goes best, and a list per area. Nothing is created until the person confirms.
 */
export function suggestionsFor(answers: WelcomeAnswers): Suggestion[] {
  const peak = answers.peak ?? 'day';
  const has = (a: Area) => answers.areas.includes(a);
  const out: Suggestion[] = answers.habits.map((id) => {
    const h = STARTER_HABITS[id];
    return {
      key: `habit:${id}`,
      kind: 'habit',
      icon: h.icon,
      title: h.label,
      detail: h.detail,
      habit: h.habit,
    };
  });

  const routines: Suggestion[] = [];
  if (has('study'))
    routines.push(
      routine('routine:study', 'library', 'Estudo', 'anemone', TIMES.study[peak], WEEKDAYS, [
        'Revisar a matéria',
        'Exercícios',
      ]),
    );
  if (has('work'))
    routines.push(
      routine('routine:work', 'briefcase', 'Trabalho', 'tide', TIMES.work[peak], WEEKDAYS, [
        'Planejar o dia',
        'Responder mensagens',
      ]),
    );
  if (has('health'))
    routines.push(
      routine('routine:health', 'dumbbell', 'Treino', 'coral', TIMES.health[peak], MON_WED_FRI, [
        'Aquecer',
        'Treino',
        'Alongar',
      ]),
    );
  if (has('wellbeing'))
    routines.push(
      peak === 'morning'
        ? routine('routine:wellbeing', 'sunrise', 'Manhã', 'kelp', ['07:00', '07:30'], 0b1111111, [
            'Beber água',
            'Alongar',
          ])
        : routine(
            'routine:wellbeing',
            'moon',
            'Noite tranquila',
            'kelp',
            ['21:30', '22:00'],
            0b1111111,
            ['Desligar as telas', 'Ler um pouco'],
          ),
    );
  out.push(...routines.slice(0, 2));

  if (has('study'))
    out.push(
      list(
        'list:study',
        'library',
        studyListName(answers.age),
        'anemone',
        'Matérias, provas e trabalhos',
      ),
    );
  if (has('work'))
    out.push(list('list:work', 'briefcase', 'Trabalho', 'tide', 'Projetos e pendências'));
  if (has('health'))
    out.push(list('list:health', 'dumbbell', 'Treinos', 'coral', 'Para planejar a semana'));
  if (has('home'))
    out.push(list('list:home', 'house', 'Casa', 'sand', 'Compras e tarefas de casa'));
  if (has('projects'))
    out.push(list('list:projects', 'palette', 'Projetos', 'lagoon', 'Ideias e próximos passos'));
  return out;
}

/** The starter creature for the profile when the person does not pick one. */
export const DEFAULT_AVATAR: CreatureId = 'dolphin';
