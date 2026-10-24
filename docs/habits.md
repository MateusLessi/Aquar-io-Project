# Hábitos

Cada hábito é uma **criatura marinha** (ver [gamification.md](gamification.md)). A V1 cobre criar, marcar o dia, acompanhar a sequência e sincronizar entre aparelhos.

## O que existe

| Parte                                                       | Onde                                                                 | Estado |
| ----------------------------------------------------------- | -------------------------------------------------------------------- | ------ |
| Aba Hábitos (recife + cartões)                              | `src/features/habits/screens/HabitsScreen.tsx`                       | REAL   |
| Detalhe (estatísticas + calendário, corrigir dias passados) | `HabitDetailScreen.tsx`                                              | REAL   |
| Criar/editar/apagar (nome, criatura, dias)                  | `components/HabitEditorSheet.tsx`                                    | REAL   |
| Hábitos do dia na tela Hoje                                 | `components/TodayHabits.tsx`, composto em `src/app/(tabs)/index.tsx` | REAL   |
| Criaturas no Modo Maré                                      | `src/shell/AmbientDisplay.tsx`                                       | REAL   |
| Sincronização                                               | tabelas `habits` e `habit_checks` (ADR-004)                          | REAL   |
| Ilustrações e evolução das criaturas                        | Etapa 11                                                             | TODO   |
| Tipos de hábito, cápsulas, mergulho (Hábitos 2.0)           | ver abaixo                                                           | REAL   |

## Hábitos 2.0 (First Dive, etapa 1)

Proposta aprovada no checkpoint 036: `docs/design/proposals/habits-2.png`.

### Tipos (`domain/types.ts`, `domain/amount.ts`)

| Tipo        | Meta (`target`)     | Progresso do dia (`amount`) | Feito quando             |
| ----------- | ------------------- | --------------------------- | ------------------------ |
| `check`     | 1                   | —                           | marcado                  |
| `count`     | unidades (1–999)    | unidades, com `unit`        | `amount ≥ target`        |
| `time`      | minutos (1–600)     | **segundos**                | `amount ≥ target × 60`   |
| `checklist` | nº de passos (1–12) | passos feitos (`stepsDone`) | todos os passos marcados |

- O progresso parcial fica em `habit_progress` (um registro por hábito e dia, id `<hábito>:<dia>`). **`habit_checks` continua significando "dia feito"**: sequência, crescimento da criatura, pontos de Profundidade e lembretes não mudaram.
- Passar da meta conta nas estatísticas (`amount` guarda o total), mas **não dá pontos a mais** (regra de não premiar excesso).
- Os passos do checklist **recomeçam todo dia** e guardam o próprio id, então renomear um passo não o desmarca.
- Marcar ou desmarcar um dia no calendário enche a cápsula até a meta, ou a esvazia.
- Mudar a meta reavalia o dia de hoje (ex.: meta de 8 → 5 com 5 copos marca como feito).

### Cronômetro

`habit_timers` guarda só **a hora de início**, e só neste aparelho. Ele continua contando com o app fechado; pausar soma o tempo decorrido ao dia em que começou. Um aviso local toca quando a meta é atingida (`src/shell/reminders/plan.ts`) e abre o **mergulho** (`?dive=1`), que mantém a tela acesa.

### Telas

- **Cápsula** (`HabitCapsule.tsx`): o nível da água é o progresso de hoje; a criatura nada na superfície e sobe junto. Com "Reduzir movimento", a água não ondula.
- **Cartão** (`HabitCard.tsx`): cápsula, etiqueta (`3/8 copos`), **maré da semana** (7 mini-cápsulas) e o botão do tipo (✓, +1, ▶/❚❚, passos).
- **Painel Início** (`TodayHabits.tsx`): toque faz a ação principal; segurar abre o hábito.
- **Recife** (`ReefHero.tsx`): cada criatura nada na altura do seu progresso.
- **Detalhe**: cápsula grande com controles, passos, números, crescimento, mapa do recife (`ReefMap.tsx`) e calendário.

## Regras de progresso (`domain/progress.ts`)

- **Hoje nunca é falha:** até a meia-noite ainda dá tempo.
- **Dias de folga** (fora da agenda do hábito) não quebram a sequência. Marcar num dia de folga conta como bônus.
- **Sequência atual** termina num dia devido que passou sem check-in. A **melhor sequência** e a **consistência dos últimos 30 dias** guardam o histórico (gamificação não punitiva).
- Os dias são chaves `YYYY-MM-DD` no fuso do aparelho, como os prazos das tarefas (`src/core/dates.ts`).

## Criaturas

12 espécies com emoji e cor própria (`domain/creatures.ts`): a criatura define a cor, então criar um hábito é uma escolha só. Uma criatura desconhecida (vinda de uma versão mais nova do app) aparece como tartaruga.

## Eventos

`HABIT_CHECKED` e `HABIT_UNCHECKED` são gravados na mesma transação do check-in, para a futura Fundação da Gamificação (Etapa 9).
