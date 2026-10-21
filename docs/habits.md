# Hábitos (V1)

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
| Metas por dia (ex.: 8 copos), lembretes                     | futuro                                                               | TODO   |

## Regras de progresso (`domain/progress.ts`)

- **Hoje nunca é falha:** até a meia-noite ainda dá tempo.
- **Dias de folga** (fora da agenda do hábito) não quebram a sequência. Marcar num dia de folga conta como bônus.
- **Sequência atual** termina num dia devido que passou sem check-in. A **melhor sequência** e a **consistência dos últimos 30 dias** guardam o histórico (gamificação não punitiva).
- Os dias são chaves `YYYY-MM-DD` no fuso do aparelho, como os prazos das tarefas (`src/core/dates.ts`).

## Criaturas

12 espécies com emoji e cor própria (`domain/creatures.ts`): a criatura define a cor, então criar um hábito é uma escolha só. Uma criatura desconhecida (vinda de uma versão mais nova do app) aparece como tartaruga.

## Eventos

`HABIT_CHECKED` e `HABIT_UNCHECKED` são gravados na mesma transação do check-in, para a futura Fundação da Gamificação (Etapa 9).
