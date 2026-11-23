# Painel (Início)

Fase 4 da Lapidação (M9). Proposta aprovada no checkpoint 082: `docs/design/proposals/fase-4-painel.png`. Como ficou: `fase-4-desk.png`, `fase-4-tablet.png`, `fase-4-phone.png`.

## Início novo (Fase 6)

- **Consistência da semana** (`stats/ConsistencyCard.tsx`): um anel, um número e uma frase. É a parte do planejado até hoje nesta semana (hábitos e itens de rotina) que foi feita (`consistency`, com testes). Sem nada planejado, mostra "—" em vez de 0%. Ocupa o lugar do antigo "Esta semana" (mesmo bloco em Ajustes → Início). No PC, fica com a altura dele.
- **Hábitos de hoje em linhas** (`TodayHabits`): a criatura, o nome, onde está ("5 de 8 copos", "Feito hoje") e, à direita, a ação do hábito (✓, +1, ▶, passos). A linha abre o hábito; o botão redondo age (nunca um botão dentro de outro).
- **Celular**: o lago (240 de altura), a consistência e os blocos; saíram os mini-cartões do topo.
- **Ordem padrão**: consistência, hábitos, tarefas, agenda, profundidade, pastas e marés. Quem já mudou a ordem em Ajustes mantém a sua.

## O dia numa tela só (PC)

No PC (largura "expanded"), o Início **cabe na janela, sem rolar a página**, do notebook ao monitor de 27" (`Screen` com `fit`; `FitGrid` em `DashboardScreen.tsx`; `fitBoard` e `fitShape` em `bento.ts`, com testes). A ideia: abrir e entender o dia de relance, sem métricas complicadas.

- **Coluna do aquário**: o tanque (maré do dia, sequência, profundidade), com a caixa **Marés** embaixo quando a coluna tem três caixas: Semana ou Mês num seletor, e a escolha fica salva (`dashboard.tides`).
- **Coluna(s) do meio**: os blocos na ordem de Ajustes → Início (por padrão Consistência da semana, Hábitos de hoje, Tarefas de hoje), três por coluna (duas numa janela baixa).
- **Sem saudação no PC**: o título "Boa tarde" e a onda saem (cada linha conta ali); para leitores de tela fica um título "Início" invisível (`Screen` com `titleHidden`). A data vai para o título da Agenda. No celular e no tablet a saudação continua: lá a página rola e ela é a boas-vindas.
- **Coluna da direita**: a **Agenda** ("Agenda · quarta-feira, 18 de novembro") inteira: "Próxima: …" e as rotinas de hoje (a semana das rotinas fica no celular e no tablet).
- Monitor largo ganha uma coluna a mais, mas só se ela tiver pelo menos duas caixas; senão as outras ficam mais largas.
- Cada caixa tem tamanho fixo: o que passa dela rola **dentro dela** (`Tile` com `scroll`). O que não couber na janela fica de fora do Início (continua no Aquário e nas Estatísticas).
- Janela baixa demais (menos de ~460 px para os blocos): a página volta a rolar, para nada ficar espremido.

## Grade que preenche (tablet)

- Os blocos entram em **linhas cheias** (`dashboard/bento.ts`, com testes). Cada bloco pede 1 ou 2 colunas (Sua semana e o Mês pedem 2). Se o próximo não cabe, a linha fecha e o último bloco dela cresce até a borda. São 3 colunas no PC e 2 no tablet.
- Numa linha, todos os blocos têm a altura do mais alto. O tanque também cresce com a linha (`FillingTank`), então nenhuma coluna termina antes e deixa buraco.
- Ao lado do tanque não há o bloco Profundidade, porque o tanque já mostra metros, zona e maré. No celular ele continua, se estiver ligado.
- A ordem e o que aparece seguem **Ajustes → Início**. Ao esconder um bloco, os outros se rearrumam.

## Cada bloco é clicável

`dashboard/Tile.tsx`: o bloco inteiro abre o lugar dele (tanque → Aquário; Agenda de hoje → Agenda; Hábitos → Hábitos; Tarefas e Pastas → Listas; Esta semana e Sua semana → Estatísticas; Mês → Agenda no Mês). Os botões de dentro (marcar um hábito, uma tarefa, um dia do mês) continuam funcionando sozinhos. Dentro do bloco, os componentes ficam "bare": sem fundo próprio, sem o "Ver todos" (a seta no canto faz esse papel) e com uma frase de vazio em vez de sumir.

## O que mudou nos blocos

- **Agenda de hoje** (`TodayRoutines bare`): a semana das rotinas, os eventos de hoje e as rotinas do dia, sob um título só.
- **Pastas fixadas:** as subpastas aparecem como chips que as abrem, com quantas tarefas pendentes têm.
- **Sua semana:** as barras são **empilhadas por tipo** (tarefas, hábitos, rotinas, nas cores das Estatísticas). Tocar num dia mostra ali mesmo o que foi feito ("3 tarefas, 1 hábito · 45 pontos"). O progresso por dia (`computeProgress`) passou a contar cada tipo.
- **Mês:** tocar num dia abre a Agenda no Mês, nesse dia.
- **Celular:** depois do tanque vêm dois blocos pequenos lado a lado, **Hábitos** (quantos já foram feitos e o próximo) e **Agora / A seguir** (o que está na agenda). Depois, os blocos inteiros, um embaixo do outro.
