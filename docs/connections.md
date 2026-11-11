# Tudo conectado (First Dive, etapa 3 · Lapidação, Fase 1a)

> **Fase 1a (novembro de 2026):** a conexão deixou de ser só "mostrar dentro". Uma lista, pasta ou rotina **dentro de um hábito** é **de onde o hábito vem**: os itens do dia decidem se ele está feito. Proposta aprovada no checkpoint 070: `docs/design/proposals/fase-1-conexoes-agenda.png`.

## O hábito conectado

- **Como ele é concluído?** No editor do hábito: **Sozinho** (como antes), **Uma lista**, **Uma pasta** ou **Uma rotina**. Dá para escolher ou criar a lista/pasta ali mesmo.
- **Lista:** se ela **zera todo dia**, todos os itens contam todo dia (treino, checklist). Se não zera, contam as tarefas com prazo naquele dia (um backlog não vira meta diária).
- **Pasta:** **uma lista por dia da semana** (Seg = Legday, Ter = Push; sem lista = descanso, e os dias do hábito passam a ser os dias com lista; essas listas passam a zerar todo dia) **ou o que vence no dia** (Semestre 4: as tarefas com prazo naquele dia, em qualquer lista e subpasta).
- **Rotina:** os passos da rotina, nos dias dela.
- **Feito quando:** todos os itens, ou **pelo menos N**. Itens com contador ou tempo contam em parte (2 de 4 séries = meio item).
- **Uma coisa, um lugar:** o item mora na lista (ou na rotina). O hábito, o Início e a rotina mostram o **mesmo** item: marcar em qualquer lugar é a mesma marca. "Marcar tudo" no hábito marca os itens do dia; "Desmarcar tudo" desmarca.
- **Pontos uma vez:** as conclusões das listas que alimentam um hábito contam como passos do hábito, não de novo como tarefas (`habitSourceLists` em `useProgress`).
- **Histórico:** o dia é **calculado** dos itens (`shell/connections/habitDay.ts`, função pura com testes). O `HabitSourcesProvider` grava em `habit_checks`/`habit_progress` o resultado do dia, para que sequência, consistência e crescimento da criatura sigam funcionando.
- **Encaixe entre módulos:** o módulo de hábitos define o contrato (`features/habits/hooks/habitSources.tsx`: `dayOf`, `setDone`, `DayView`, `SourcePicker`, `sourceOf`, `saveSource`); o app shell o implementa, porque junta três módulos.

## Regra na ligação

`links.rule` (JSON, `core/links/sourceRule.ts`): `{ doneWhen: 'all' | { atLeast }, folder?: { mode: 'weekday', lists } | { mode: 'due' } }`. Sem regra = "todos os itens". Rotina → hábito passou a ser uma ligação aceita.

Proposta aprovada no checkpoint 042: `docs/design/proposals/connected.png`.

Listas, pastas, hábitos e rotinas se encaixam uns nos outros. Conectar **nunca copia nem move** nada: o hábito continua um só, a lista continua uma só, em todo lugar onde aparece. Tirar uma ligação só desliga.

## Regras de encaixe

| Arrastar | Soltar em       | Resultado                                                             |
| -------- | --------------- | --------------------------------------------------------------------- |
| Lista    | Pasta           | Guarda a lista na pasta (`todo.moveList`)                             |
| Pasta    | Pasta           | Guarda a pasta dentro, respeitando os 4 níveis (`todo.moveFolder`)    |
| Lista    | Hábito          | Ligação: a lista aparece em "Conectado a" do hábito                   |
| Lista    | Rotina          | Ligação: a lista abre dentro da peça, com as tarefas de verdade       |
| Pasta    | Hábito / Rotina | Ligação à pasta inteira                                               |
| Hábito   | Rotina          | Ligação com **horário** dentro da rotina; marcar em um marca no outro |

Um hábito não entra em outro hábito.

## Dados (`src/core/links/`)

- Tabela `links` (migração v9): `item_kind`/`item_id` → `target_kind`/`target_id`, `at_time` (hábito dentro de rotina), `sort_order`, soft delete.
- O id vem do par (`linkId`, `idFrom`): ligar a mesma coisa em dois aparelhos é **uma linha só**; ligar de novo reaviva a linha.
- Ligações para coisas que não existem mais (apagadas, ou ainda não sincronizadas) ficam guardadas e simplesmente não aparecem.
- Sincroniza como o resto: `supabase/migrations/20261027000000_links.sql`.

## Telas (`src/shell/connections/`)

A composição fica no `shell`, porque junta três features. As telas das features só ganharam encaixes (`renderRoutine`, `renderExtra`, `footer`, `onConnect`).

- **Peça de rotina** (`RoutinePiece.tsx`): fechada mostra selos do que tem dentro e uma aba em relevo; aberta mostra passos, hábitos (com horário e controles) e listas. Segurar um item tira a ligação. A rotina de agora já abre aberta.
- **Painel Início** (`RoutineExtras.tsx`): a rotina de agora mostra seus hábitos e listas na linha do tempo; as outras, uma linha de selos.
- **Conectar a…** (`ConnectProvider.tsx`): menu acessível a partir de uma lista, pasta ou hábito, ou para dentro de uma rotina ou hábito. Aviso com **Desfazer**.
- **Conectado a / Usada em** (`ConnectedSection.tsx`): no detalhe do hábito e na tela da lista, nos dois sentidos.
- **Modo Conectar** (`ConnectMode.tsx`): botão "Conectar" no Aquário. Bandeja de listas, pastas e hábitos embaixo; destinos em cima. **Segure e arraste**, ou **toque no item e depois no destino**. Destinos que não aceitam ficam apagados; o que está sob o dedo acende. Usa `react-native-gesture-handler` 3 (`usePanGesture` com `activateAfterLongPress`).
- **Horário do hábito** (`HabitTimeSheet.tsx`): slider entre o início e o fim da rotina, "No começo" ou "Sem horário".
