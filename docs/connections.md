# Tudo conectado (First Dive, etapa 3)

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
