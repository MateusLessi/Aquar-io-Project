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

## Ainda nesta fase (2b)

Ajustes com busca e seções com ícone e resumo; arrastar blocos na Semana ("Só nesta quarta / Todas as quartas").
