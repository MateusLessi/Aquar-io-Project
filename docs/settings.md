# Ajustes

**Perfil → Ajustes** (`/profile/settings`, `src/shell/settings/`). No celular, uma lista que abre cada seção (`?section=…`); no tablet e no PC, a lista à esquerda e a seção à direita. Cada linha mostra o valor atual. Tudo vale **por aparelho** (tabela local `app_settings`).

| Seção                   | O que muda                                                                        | Chave                                                |
| ----------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Aparência               | Tema; tamanho do texto (padrão, grande 1,15×, maior 1,3×, somado ao do sistema)   | `theme`, `textScale`                                 |
| Início                  | Aba em que o app abre; cartões do painel (mostrar, esconder, ordem com ↑ ↓)       | `start.tab`, `dashboard.cards`                       |
| Calendário              | Semana começa no domingo ou na segunda; hora 24 h ou 12 h                         | `calendar.weekStart`, `calendar.clock`               |
| Sons, toque e lembretes | Sons e vibração (etapa 6); lembretes; horário silencioso                          | `feedback.*`, `reminders`, `reminders.quiet`         |
| Hábitos e jogo          | Criatura dos hábitos novos; mostrar Profundidade; comemorações                    | `habits.creature`, `game.depth`, `game.celebrations` |
| Modo Maré               | Ligado ou desligado                                                               | `ambientMode`                                        |
| Acessibilidade          | Reduzir movimento, reduzir transparência, **alto contraste**                      | `reduceMotion`, `reduceTransparency`, `highContrast` |
| Conta e dados           | Sincronização; exportar (JSON + CSV); apagar os dados do aparelho; apagar a conta | —                                                    |
| Sobre                   | Versão, aparelho, créditos                                                        | —                                                    |

## Como cada ajuste chega às telas

- **Calendário:** `CalendarPrefsContext` (`src/core/preferences/calendarPrefs.ts`), fornecido pelo shell. `useCalendarPrefs()` dá `weekStart` e `showTime("19:30")`. Helpers em `src/core/dates.ts`: `startOfWeek`, `weekdayOrder`, `leadingBlanks`, `formatTime`. Usado na Semana e na faixa das rotinas, nas Estatísticas, nos calendários (painel, hábito, prazo), no recife, na maré da semana dos hábitos e nos seletores de dias. Os dados continuam iguais (dias como bits, domingo = 0): só a apresentação muda.
- **Texto e contraste:** no `ThemeProvider`. `Text` multiplica tamanho e entrelinha por `textScale`; `highContrastColors` (em `tokens/themes.ts`) reforça textos secundários, separadores e bordas, com texto ≥ 7:1 (teste em `contrast.test.ts`).
- **Painel:** `parseDashboardCards` guarda a ordem com `-` para escondidos; cartões novos de versões futuras entram no fim. Cada layout (celular, tablet, PC) mantém suas colunas e ordena dentro delas.
- **Horário silencioso:** `inQuietHours` (atravessa a meia-noite) filtra os lembretes antes de agendar.
- **Aba inicial:** só quando o app abre no Início; links e notificações vão para onde apontam.

## Dados

- **Exportar:** `collectExport` (todas as tabelas de conteúdo, sem o que foi apagado) e `tasksCsv`. Na web vira download; no celular e tablet, a folha de compartilhar do sistema (`expo-file-system` + `expo-sharing`).
- **Apagar os dados do aparelho:** `wipeLocalData` apaga conteúdo, fila de sincronização e eventos, mantendo os Ajustes. Se a pessoa está conectada, sai da conta antes (a cópia na nuvem fica).
- **Apagar a conta:** função `public.delete_my_account()` (`supabase/migrations/20261105000000_delete_account.sql`, precisa ser rodada no Supabase). Ela apaga o usuário em `auth.users`; todas as tabelas têm `on delete cascade`. Depois o app esquece a sessão e apaga os dados locais. Confirmação digitando APAGAR.
