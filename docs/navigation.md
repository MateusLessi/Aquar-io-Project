# Navegação (Fase 2)

Onde cada coisa mora e como se chega nela. Proposta aprovada no checkpoint 076: `docs/design/proposals/fase-2-navegacao.png`.

## Destinos

| Destino      | Celular (barra)       | Tablet em pé (trilho) | PC e tablet deitado (barra lateral) |
| ------------ | --------------------- | --------------------- | ----------------------------------- |
| Início       | sim                   | sim                   | sim                                 |
| Aquário      | sim                   | sim                   | sim, com Hábitos / Agenda / Listas  |
| Estatísticas | sim                   | sim                   | sim                                 |
| Loja         | não: cartão no Perfil | sim                   | sim                                 |
| Perfil       | sim                   | sim                   | você, embaixo (avatar, nome, zona)  |
| Ajustes      | engrenagem no Perfil  | engrenagem embaixo    | engrenagem ao lado de você          |

`src/shell/destinations.ts` (`notOnPhone`, `phoneDestinations`). Links antigos para `/profile/stats` levam a `/stats`.

## Barra lateral viva

- **Aquário** abre as seções logo abaixo dele, com uma animação de mola (sem animação com "Reduzir movimento"). Cada seção leva direto à aba (`/aquarium?tab=`).
- **Agora** (`src/shell/nav/NowCard.tsx`): o que está acontecendo ou vem a seguir hoje na agenda (rotina ou evento com horário) e o **hábito do momento**: devido hoje, ainda não feito, com lembrete perto de agora primeiro (`nav/now.ts`, com testes). Um toque: +1 num contador, "feito" num hábito de sim/não; os outros abrem.
- **Você** embaixo (`nav/ProfileChip.tsx`) abre o Perfil; a engrenagem abre os Ajustes.

## Abas fixas no Aquário

- A barra Hábitos / Agenda / Listas fica num vidro sob o título e **gruda no topo** ao rolar, logo abaixo do cabeçalho compacto (`Screen` com `stickyBar`).
- Cada seção manda a própria barra para dentro dela com `StickySlot` (Dia / Semana / Mês / Lista com o +, Grade / Lista / Tudo junto). Fora do Aquário (dentro de uma pasta, por exemplo) a mesma barra aparece no lugar.
- Ícone junto da palavra (`SegmentedControl` com `icon`). Quando falta espaço, só a opção escolhida mantém o ícone.

## Ajustes (2b)

- **Busca** no topo (`settings/search.ts`, com testes): acha pelo nome ou pelas palavras que as pessoas usam ("notificação", "backup", "escuro"), sem acento e sem maiúscula. Tocar num resultado abre a seção **no ajuste** (`?focus=`): o grupo rola até ficar visível e brilha por um instante (`Group anchor`, `Screen` com `useScreenScroll`).
- Seções com **ícone na cor própria** e um resumo do que está escolhido; **Mais usados** (Aparência, Sons e lembretes, Calendário) no topo, depois **Tudo**.
- Entrada pela engrenagem no Início (celular), no Perfil, na barra lateral e no trilho.

## Arrastar na Semana (2b)

- Rotinas e eventos com horário podem ser arrastados na Semana: no PC, é só arrastar com o mouse; no toque, **segurar** (0,3 s) e arrastar, com uma vibração leve. Anda de **15 em 15 minutos**, mostra o novo horário em cima do bloco e fica dentro do dia (`shiftTimes`).
- Com os 7 dias lado a lado (tablet e PC), também troca de **dia**. No celular (um dia por vez), só o horário.
- Ao soltar uma **rotina**: **"Só nesta quarta"** (mudança de um dia; para outro dia, pula onde estava e aparece onde foi) ou **"Todas as quartas"** (muda o horário e, se trocou de dia, os dias da semana). Um **evento** muda inteiro, sem pergunta.
- Tarefas com data não se arrastam (o horário delas é o do lembrete). Quem não arrasta tem o mesmo caminho pelos botões: tocar no bloco → "Mudar o horário".
- Uma mudança de um dia pode agora **acrescentar** a rotina num dia em que ela não acontece (foi arrastada para lá).
