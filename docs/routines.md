# Rotinas (V1)

Uma rotina é um **bloco de tempo do dia** com uma lista curta de itens que **recomeça todo dia**. Ex.: "Manhã" das 6:00 às 8:00 (beber água, alongar, café).

## O que existe

| Parte                                                                     | Onde                                                            | Estado |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- | ------ |
| Aba Rotinas (lista "Hoje" / "Outros dias")                                | `src/features/routines/screens/RoutinesScreen.tsx`              | REAL   |
| Linha do tempo na tela Hoje: a rotina de agora abre com o checklist       | `components/RoutineTimeline.tsx`, `TodayRoutines.tsx`           | REAL   |
| Criar, editar e apagar (nome, ícone, cor, horário, dias, itens, lembrete) | `components/RoutineEditorSheet.tsx`                             | REAL   |
| Itens contam na maré do dia (5 pontos cada, no limite diário)             | `src/core/progress/rules.ts`                                    | REAL   |
| Lembrete no início da rotina                                              | `src/shell/reminders/plan.ts`                                   | REAL   |
| Sincronização (`routines`, `routine_items`, `routine_checks`)             | ADR-004, `supabase/migrations/20261023000000_routines_sync.sql` | REAL   |
| Conflitos de horário, rotinas que passam da meia-noite                    | Etapa 7                                                         | TODO   |

## Regras

- Fases: **próxima** (ainda não começou), **agora**, **passou** e **descanso** (não é dia dela). A tela atualiza a cada 30 segundos.
- O fim precisa ser depois do começo (sem atravessar a meia-noite na V1).
- Até 20 itens por rotina. Editar a lista mantém os itens com o mesmo nome (e o que já foi marcado hoje).
- Um check por item e por dia, com id `"<item>:<dia>"`: marcar o mesmo item em dois aparelhos não duplica.
- Para os dias passados, a maré cheia usa a lista de itens atual (aproximação da V1).

## Navegação

Com Rotinas, o celular teria 5 abas. Por isso, no celular, **Ajustes saiu da barra** e virou uma engrenagem no topo da tela Hoje (`notOnPhoneBar` em `src/shell/destinations.ts`). No tablet e no notebook continua no menu lateral.
