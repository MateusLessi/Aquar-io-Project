/** A setting the search can find: where it lives, and the words people may type for it. */
export type SettingEntry = {
  id: string;
  label: string;
  section:
    | 'appearance'
    | 'home'
    | 'calendar'
    | 'sounds'
    | 'game'
    | 'tide'
    | 'accessibility'
    | 'account'
    | 'community'
    | 'privacy'
    | 'about';
  /** The group to scroll to inside the section, when it is not at the top. */
  anchor?: string;
  keywords: string[];
};

export const SETTING_ENTRIES: SettingEntry[] = [
  {
    id: 'theme',
    label: 'Tema',
    section: 'appearance',
    keywords: ['tema', 'escuro', 'claro', 'crystal', 'cor', 'modo', 'aparencia', 'noturno', 'dark'],
  },
  {
    id: 'text',
    label: 'Tamanho do texto',
    section: 'appearance',
    keywords: ['texto', 'letra', 'fonte', 'tamanho', 'grande', 'ler'],
  },
  {
    id: 'start',
    label: 'O app abre em',
    section: 'home',
    keywords: ['abre', 'inicio', 'comecar', 'primeira tela', 'aba'],
  },
  {
    id: 'cards',
    label: 'Cartões do painel',
    section: 'home',
    anchor: 'home-cards',
    keywords: ['cartoes', 'painel', 'ordem', 'esconder', 'inicio', 'dashboard'],
  },
  {
    id: 'week',
    label: 'A semana começa',
    section: 'calendar',
    keywords: ['semana', 'domingo', 'segunda', 'calendario'],
  },
  {
    id: 'clock',
    label: 'Formato de hora',
    section: 'calendar',
    keywords: ['hora', '24', '12', 'am', 'pm', 'relogio', 'formato'],
  },
  {
    id: 'sounds',
    label: 'Sons e toque',
    section: 'sounds',
    keywords: ['som', 'sons', 'volume', 'vibracao', 'vibrar', 'toque', 'audio', 'barulho'],
  },
  {
    id: 'reminders',
    label: 'Lembretes',
    section: 'sounds',
    anchor: 'reminders',
    keywords: ['lembrete', 'lembretes', 'notificacao', 'notificacoes', 'aviso', 'alarme'],
  },
  {
    id: 'quiet',
    label: 'Horário silencioso',
    section: 'sounds',
    anchor: 'reminders',
    keywords: ['silencioso', 'silencio', 'noite', 'dormir', 'nao perturbe'],
  },
  {
    id: 'creature',
    label: 'Criatura dos hábitos novos',
    section: 'game',
    keywords: ['criatura', 'peixe', 'animal', 'habito'],
  },
  {
    id: 'depth',
    label: 'Mostrar Profundidade',
    section: 'game',
    anchor: 'game',
    keywords: ['profundidade', 'metros', 'zona', 'pontos', 'jogo', 'nivel'],
  },
  {
    id: 'celebrations',
    label: 'Comemorações',
    section: 'game',
    anchor: 'game',
    keywords: ['comemoracao', 'comemoracoes', 'parabens', 'aviso', 'jogo'],
  },
  {
    id: 'tide',
    label: 'Modo Maré',
    section: 'tide',
    keywords: ['mare', 'descanso', 'carregando', 'deitado', 'relogio'],
  },
  {
    id: 'motion',
    label: 'Reduzir movimento',
    section: 'accessibility',
    keywords: ['movimento', 'animacao', 'animacoes', 'enjoo', 'acessibilidade'],
  },
  {
    id: 'transparency',
    label: 'Reduzir transparência',
    section: 'accessibility',
    keywords: ['transparencia', 'vidro', 'blur', 'lento', 'acessibilidade'],
  },
  {
    id: 'contrast',
    label: 'Alto contraste',
    section: 'accessibility',
    keywords: ['contraste', 'ler', 'visao', 'acessibilidade'],
  },
  {
    id: 'sync',
    label: 'Conta e sincronização',
    section: 'account',
    keywords: [
      'conta',
      'entrar',
      'login',
      'email',
      'sincronizar',
      'sincronizacao',
      'nuvem',
      'sair',
    ],
  },
  {
    id: 'export',
    label: 'Exportar meus dados',
    section: 'account',
    anchor: 'account-data',
    keywords: ['exportar', 'backup', 'csv', 'json', 'planilha', 'dados', 'baixar'],
  },
  {
    id: 'erase',
    label: 'Apagar dados ou conta',
    section: 'account',
    anchor: 'account-danger',
    keywords: ['apagar', 'excluir', 'deletar', 'conta', 'limpar'],
  },
  {
    id: 'discord',
    label: 'Discord',
    section: 'community',
    keywords: ['discord', 'comunidade', 'conversa'],
  },
  {
    id: 'feedback',
    label: 'Relatar um problema ou ideia',
    section: 'community',
    anchor: 'feedback',
    keywords: ['problema', 'bug', 'erro', 'ideia', 'sugestao', 'feedback', 'github'],
  },
  {
    id: 'privacy',
    label: 'Privacidade',
    section: 'privacy',
    keywords: ['privacidade', 'dados', 'rastreio', 'seguranca'],
  },
  {
    id: 'about',
    label: 'Versão e créditos',
    section: 'about',
    keywords: ['versao', 'sobre', 'creditos', 'aparelho'],
  },
  {
    id: 'welcome',
    label: 'Ver as boas-vindas',
    section: 'about',
    keywords: ['boas-vindas', 'tutorial', 'inicio', 'ajuda'],
  },
];

/** Lowercase, without accents: "Notificação" matches "notificacao". */
export const fold = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Settings that match what was typed: every word must start a word of the label or a keyword.
 * Label matches come first.
 */
export function searchSettings(query: string, entries = SETTING_ENTRIES): SettingEntry[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const scored: { entry: SettingEntry; score: number }[] = [];
  for (const entry of entries) {
    const label = fold(entry.label).split(/[\s-]+/);
    const keys = entry.keywords.flatMap((k) => fold(k).split(/\s+/));
    let score = 0;
    let all = true;
    for (const word of words) {
      if (label.some((w) => w.startsWith(word))) score += 2;
      else if (keys.some((k) => k.startsWith(word))) score += 1;
      else all = false;
    }
    if (all) scored.push({ entry, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.entry);
}
