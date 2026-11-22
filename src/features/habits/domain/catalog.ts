import type { GlyphKey } from '@/design-system';

import type { CreatureId } from './creatures';
import type { HabitKind, WeekdayMask } from './types';

/**
 * Ready-made habits to start from (Lapidação, Fase 3). A model only fills the editor: nothing
 * links a habit to its model, so changing the catalog never changes anyone's habits.
 */

export type CategoryId =
  'saude' | 'mente' | 'espiritualidade' | 'estudos' | 'trabalho' | 'casa' | 'financas' | 'social';

export const CATEGORIES: { id: CategoryId; label: string; glyph: GlyphKey }[] = [
  { id: 'saude', label: 'Saúde', glyph: 'heart' },
  { id: 'mente', label: 'Mente', glyph: 'brain' },
  { id: 'espiritualidade', label: 'Espiritualidade', glyph: 'sunrise' },
  { id: 'estudos', label: 'Estudos', glyph: 'graduation' },
  { id: 'trabalho', label: 'Trabalho', glyph: 'briefcase' },
  { id: 'casa', label: 'Casa', glyph: 'house' },
  { id: 'financas', label: 'Finanças', glyph: 'wallet' },
  { id: 'social', label: 'Social', glyph: 'users' },
];

/** A unit a count habit can use, with how much one of it holds (for "2 litros por dia"). */
export type UnitOption = {
  /** Stored on the habit: "copos". */
  unit: string;
  /** On the chip: "Copo 250 ml". */
  label: string;
  /** Millilitres in one, for drinks. */
  ml?: number;
  /** A sensible goal in this unit. */
  target: number;
};

export const DRINK_UNITS: UnitOption[] = [
  { unit: 'copos', label: 'Copo 250 ml', ml: 250, target: 8 },
  { unit: 'garrafas', label: 'Garrafa 500 ml', ml: 500, target: 4 },
  { unit: 'litros', label: 'Litro', ml: 1000, target: 2 },
];

export type HabitPreset = {
  id: string;
  name: string;
  category: CategoryId;
  glyph: GlyphKey;
  creature: CreatureId;
  kind: HabitKind;
  /** Units (count) or minutes (time); ignored for the other kinds. */
  target?: number;
  unit?: string;
  /** Other units to offer, with conversion (drinks). */
  units?: UnitOption[];
  steps?: string[];
  days: WeekdayMask;
  reminderTimes: string[];
  description?: string;
  /** More words people may search with. */
  keywords?: string[];
};

const EVERY_DAY = 0b1111111;
const WEEKDAYS = 0b0111110;
const MON_WED_FRI = 0b0101010;
const SUNDAY = 0b0000001;
const SATURDAY = 0b1000000;

export const PRESETS: HabitPreset[] = [
  // Saúde
  {
    id: 'agua',
    name: 'Beber água',
    category: 'saude',
    glyph: 'droplet',
    creature: 'shark',
    kind: 'count',
    target: 8,
    unit: 'copos',
    units: DRINK_UNITS,
    days: EVERY_DAY,
    reminderTimes: ['10:00', '14:00', '17:00'],
    keywords: ['hidratar', 'hidratacao', 'copo'],
  },
  {
    id: 'caminhar',
    name: 'Caminhar',
    category: 'saude',
    glyph: 'run',
    creature: 'turtle',
    kind: 'time',
    target: 30,
    days: WEEKDAYS,
    reminderTimes: ['18:30'],
    keywords: ['andar', 'passos', 'exercicio'],
  },
  {
    id: 'treinar',
    name: 'Treinar',
    category: 'saude',
    glyph: 'dumbbell',
    creature: 'shark',
    kind: 'time',
    target: 45,
    days: MON_WED_FRI,
    reminderTimes: ['18:00'],
    keywords: ['academia', 'musculacao', 'exercicio', 'malhar'],
  },
  {
    id: 'alongar',
    name: 'Alongar',
    category: 'saude',
    glyph: 'sparkles',
    creature: 'octopus',
    kind: 'checklist',
    steps: ['Pescoço', 'Ombros', 'Costas', 'Pernas'],
    days: EVERY_DAY,
    reminderTimes: ['07:30'],
    keywords: ['alongamento', 'mobilidade'],
  },
  {
    id: 'dormir',
    name: 'Dormir cedo',
    category: 'saude',
    glyph: 'moon',
    creature: 'ray',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: ['22:00'],
    keywords: ['sono', 'descansar'],
  },
  {
    id: 'frutas',
    name: 'Comer frutas',
    category: 'saude',
    glyph: 'apple',
    creature: 'octopus',
    kind: 'count',
    target: 3,
    unit: 'porções',
    days: EVERY_DAY,
    reminderTimes: [],
    keywords: ['alimentacao', 'fruta', 'saudavel'],
  },
  {
    id: 'remedio',
    name: 'Tomar o remédio',
    category: 'saude',
    glyph: 'pill',
    creature: 'turtle',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: ['08:00'],
    keywords: ['medicamento', 'vitamina', 'remedio'],
  },
  // Mente
  {
    id: 'meditar',
    name: 'Meditar',
    category: 'mente',
    glyph: 'brain',
    creature: 'jellyfish',
    kind: 'time',
    target: 10,
    days: EVERY_DAY,
    reminderTimes: ['07:00'],
    keywords: ['meditacao', 'mindfulness', 'calma'],
  },
  {
    id: 'diario',
    name: 'Escrever no diário',
    category: 'mente',
    glyph: 'feather',
    creature: 'octopus',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: ['21:30'],
    keywords: ['journal', 'escrever'],
  },
  {
    id: 'gratidao',
    name: 'Gratidão',
    category: 'mente',
    glyph: 'heart',
    creature: 'shark',
    kind: 'count',
    target: 3,
    unit: 'coisas',
    days: EVERY_DAY,
    reminderTimes: ['21:00'],
    description: 'Três coisas boas do dia',
    keywords: ['agradecer', 'gratidao'],
  },
  {
    id: 'respirar',
    name: 'Respirar fundo',
    category: 'mente',
    glyph: 'waves',
    creature: 'jellyfish',
    kind: 'time',
    target: 5,
    days: EVERY_DAY,
    reminderTimes: ['15:00'],
    keywords: ['respiracao', 'ansiedade', 'calma'],
  },
  {
    id: 'telas',
    name: 'Sem telas antes de dormir',
    category: 'mente',
    glyph: 'moon',
    creature: 'ray',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: ['21:30'],
    keywords: ['celular', 'desconectar', 'tela'],
  },
  // Espiritualidade
  {
    id: 'orar',
    name: 'Orar',
    category: 'espiritualidade',
    glyph: 'sunrise',
    creature: 'ray',
    kind: 'count',
    target: 2,
    unit: 'vezes',
    days: EVERY_DAY,
    reminderTimes: ['07:00', '21:00'],
    description: 'Manhã e noite',
    keywords: ['oracao', 'rezar', 'prece', 'fe', 'deus'],
  },
  {
    id: 'leitura-sagrada',
    name: 'Leitura sagrada',
    category: 'espiritualidade',
    glyph: 'book',
    creature: 'turtle',
    kind: 'count',
    target: 1,
    unit: 'capítulo',
    days: EVERY_DAY,
    reminderTimes: ['06:30'],
    keywords: ['biblia', 'alcorao', 'escrituras', 'fe'],
  },
  {
    id: 'devocional',
    name: 'Devocional',
    category: 'espiritualidade',
    glyph: 'feather',
    creature: 'fish',
    kind: 'time',
    target: 15,
    days: EVERY_DAY,
    reminderTimes: ['06:30'],
    keywords: ['fe', 'reflexao'],
  },
  {
    id: 'comunidade',
    name: 'Encontro da comunidade',
    category: 'espiritualidade',
    glyph: 'users',
    creature: 'turtle',
    kind: 'check',
    days: SUNDAY,
    reminderTimes: ['09:00'],
    keywords: ['culto', 'missa', 'igreja', 'templo', 'fe'],
  },
  {
    id: 'silencio',
    name: 'Momento de silêncio',
    category: 'espiritualidade',
    glyph: 'leaf',
    creature: 'jellyfish',
    kind: 'time',
    target: 10,
    days: EVERY_DAY,
    reminderTimes: ['20:00'],
    keywords: ['contemplar', 'paz'],
  },
  // Estudos
  {
    id: 'estudar',
    name: 'Estudar',
    category: 'estudos',
    glyph: 'graduation',
    creature: 'shark',
    kind: 'time',
    target: 60,
    days: WEEKDAYS,
    reminderTimes: ['19:00'],
    keywords: ['faculdade', 'escola', 'prova', 'vestibular'],
  },
  {
    id: 'ler',
    name: 'Ler',
    category: 'estudos',
    glyph: 'book',
    creature: 'fish',
    kind: 'count',
    target: 20,
    unit: 'páginas',
    days: EVERY_DAY,
    reminderTimes: ['21:00'],
    keywords: ['leitura', 'livro'],
  },
  {
    id: 'idioma',
    name: 'Praticar um idioma',
    category: 'estudos',
    glyph: 'globe',
    creature: 'octopus',
    kind: 'time',
    target: 15,
    days: EVERY_DAY,
    reminderTimes: ['12:30'],
    keywords: ['ingles', 'espanhol', 'lingua', 'duolingo'],
  },
  {
    id: 'flashcards',
    name: 'Revisar flashcards',
    category: 'estudos',
    glyph: 'library',
    creature: 'octopus',
    kind: 'count',
    target: 20,
    unit: 'cartões',
    days: EVERY_DAY,
    reminderTimes: ['08:00'],
    keywords: ['anki', 'revisao', 'memorizar'],
  },
  {
    id: 'curso',
    name: 'Aula do curso',
    category: 'estudos',
    glyph: 'laptop',
    creature: 'shark',
    kind: 'check',
    days: WEEKDAYS,
    reminderTimes: ['20:00'],
    keywords: ['online', 'video', 'aula'],
  },
  // Trabalho
  {
    id: 'foco',
    name: 'Foco profundo',
    category: 'trabalho',
    glyph: 'target',
    creature: 'shark',
    kind: 'time',
    target: 90,
    days: WEEKDAYS,
    reminderTimes: ['09:00'],
    keywords: ['concentracao', 'pomodoro', 'produtividade'],
  },
  {
    id: 'planejar',
    name: 'Planejar o dia',
    category: 'trabalho',
    glyph: 'list',
    creature: 'turtle',
    kind: 'check',
    days: WEEKDAYS,
    reminderTimes: ['08:30'],
    keywords: ['organizar', 'agenda', 'planejamento'],
  },
  {
    id: 'inbox',
    name: 'Zerar a caixa de entrada',
    category: 'trabalho',
    glyph: 'briefcase',
    creature: 'octopus',
    kind: 'check',
    days: WEEKDAYS,
    reminderTimes: ['17:30'],
    keywords: ['email', 'mensagens'],
  },
  {
    id: 'pausas',
    name: 'Pausas para levantar',
    category: 'trabalho',
    glyph: 'timer',
    creature: 'turtle',
    kind: 'count',
    target: 4,
    unit: 'pausas',
    days: WEEKDAYS,
    reminderTimes: ['10:30', '15:30'],
    keywords: ['postura', 'descanso', 'levantar'],
  },
  {
    id: 'aprender',
    name: 'Aprender algo do trabalho',
    category: 'trabalho',
    glyph: 'lightbulb',
    creature: 'shark',
    kind: 'time',
    target: 20,
    days: WEEKDAYS,
    reminderTimes: [],
    keywords: ['carreira', 'estudo'],
  },
  // Casa
  {
    id: 'cama',
    name: 'Arrumar a cama',
    category: 'casa',
    glyph: 'bed',
    creature: 'turtle',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: ['07:30'],
    keywords: ['quarto', 'organizar'],
  },
  {
    id: 'louca',
    name: 'Lavar a louça',
    category: 'casa',
    glyph: 'utensils',
    creature: 'octopus',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: ['21:00'],
    keywords: ['cozinha', 'limpar', 'loica'],
  },
  {
    id: 'arrumar',
    name: 'Organizar a casa',
    category: 'casa',
    glyph: 'house',
    creature: 'octopus',
    kind: 'time',
    target: 10,
    days: EVERY_DAY,
    reminderTimes: [],
    keywords: ['faxina', 'limpeza', 'arrumar'],
  },
  {
    id: 'plantas',
    name: 'Regar as plantas',
    category: 'casa',
    glyph: 'leaf',
    creature: 'turtle',
    kind: 'check',
    days: 0b0010010,
    reminderTimes: ['08:00'],
    keywords: ['jardim', 'horta'],
  },
  {
    id: 'cozinhar',
    name: 'Cozinhar em casa',
    category: 'casa',
    glyph: 'utensils',
    creature: 'octopus',
    kind: 'check',
    days: WEEKDAYS,
    reminderTimes: [],
    keywords: ['comida', 'refeicao', 'marmita'],
  },
  // Finanças
  {
    id: 'gastos',
    name: 'Anotar os gastos',
    category: 'financas',
    glyph: 'wallet',
    creature: 'fish',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: ['21:00'],
    keywords: ['dinheiro', 'despesas', 'controle'],
  },
  {
    id: 'sem-gastar',
    name: 'Dia sem compras por impulso',
    category: 'financas',
    glyph: 'gem',
    creature: 'fish',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: [],
    keywords: ['economizar', 'impulso', 'dinheiro'],
  },
  {
    id: 'guardar',
    name: 'Guardar dinheiro',
    category: 'financas',
    glyph: 'wallet',
    creature: 'ray',
    kind: 'check',
    days: 0b0000010,
    reminderTimes: ['09:00'],
    keywords: ['poupar', 'investir', 'reserva'],
  },
  {
    id: 'orcamento',
    name: 'Revisar o orçamento',
    category: 'financas',
    glyph: 'target',
    creature: 'shark',
    kind: 'check',
    days: SUNDAY,
    reminderTimes: ['19:00'],
    keywords: ['planilha', 'contas', 'orcamento'],
  },
  // Social
  {
    id: 'ligar',
    name: 'Falar com alguém querido',
    category: 'social',
    glyph: 'users',
    creature: 'shark',
    kind: 'check',
    days: MON_WED_FRI,
    reminderTimes: ['19:00'],
    keywords: ['ligar', 'familia', 'amigos', 'conversar'],
  },
  {
    id: 'familia',
    name: 'Tempo com a família',
    category: 'social',
    glyph: 'house',
    creature: 'turtle',
    kind: 'time',
    target: 30,
    days: EVERY_DAY,
    reminderTimes: [],
    keywords: ['filhos', 'pais', 'casa'],
  },
  {
    id: 'mensagem',
    name: 'Mandar mensagem a um amigo',
    category: 'social',
    glyph: 'heart',
    creature: 'fish',
    kind: 'check',
    days: EVERY_DAY,
    reminderTimes: [],
    keywords: ['amizade', 'contato'],
  },
  {
    id: 'ajudar',
    name: 'Ajudar alguém',
    category: 'social',
    glyph: 'gift',
    creature: 'fish',
    kind: 'check',
    days: SATURDAY,
    reminderTimes: [],
    keywords: ['voluntario', 'gentileza', 'bondade'],
  },
];

/** The first ones shown, before choosing a category. */
export const POPULAR = [
  'agua',
  'ler',
  'meditar',
  'caminhar',
  'orar',
  'estudar',
  'idioma',
  'dormir',
];

/** Lowercase, without accents: "Oração" matches "oracao". */
const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Models matching what was typed: every word starts a word of the name, the category or a keyword. */
export function searchPresets(query: string, presets = PRESETS): HabitPreset[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const category = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? '';
  const scored = presets.flatMap((preset) => {
    const name = fold(preset.name).split(/[\s-]+/);
    const others = [category(preset.category), ...(preset.keywords ?? [])].flatMap((k) =>
      fold(k).split(/\s+/),
    );
    let score = 0;
    for (const word of words) {
      if (name.some((w) => w.startsWith(word))) score += 2;
      else if (others.some((w) => w.startsWith(word))) score += 1;
      else return [];
    }
    return [{ preset, score }];
  });
  return scored.sort((a, b) => b.score - a.score).map((s) => s.preset);
}

/** "2 litros por dia", "1,5 litro por dia": what a drink goal adds up to; null otherwise. */
export function totalLabel(target: number, option: UnitOption | undefined): string | null {
  if (!option?.ml || option.unit === 'litros') return null;
  const ml = target * option.ml;
  if (ml < 1000) return `${ml} ml por dia`;
  const litres = ml / 1000;
  const text = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(litres);
  return `${text} ${litres >= 2 ? 'litros' : 'litro'} por dia`;
}
