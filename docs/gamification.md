# Gamificação

**Status:** visão de produto. A Fundação (pontos, profundidade e estágios das criaturas) está implementada; regras em [gamification-rules.md](gamification-rules.md). O resto terá seu próprio checkpoint.

## Princípios

1. **Tudo importa.** Toda ação relevante gera um evento de domínio (`TASK_COMPLETED`, `HABIT_COMPLETED`...) que alimenta a progressão.
2. **Não punitiva.** Errar um dia desacelera, não destrói. Usamos sequência atual, melhor sequência, consistência de 30/90 dias e total na vida.
3. **A vida real vem primeiro.** Nenhuma mecânica pode incentivar comportamento prejudicial (ex.: treinar lesionado para não perder posição).
4. **Funcionalidades principais nunca ficam atrás de pagamento** ou de desempenho competitivo.

## Micro: cada hábito é um animal marinho

- Todo hábito tem uma criatura associada (ex.: Academia → Tartaruga).
- A criatura evolui por **consistência**, não por sequência perfeita.
- `CreatureLifecycle` define estágios por espécie, de forma biologicamente coerente:
  - ovíparos (tartaruga, polvo): ovo → filhote → juvenil → adulto;
  - mamíferos (baleia, golfinho): filhote → juvenil → adulto (sem "ovo de baleia").
- Estilo visual: sofisticado, não cartoon (a ser definido em checkpoint de arte, Etapa 11).

**Impacto no Design System desde já:** reservar espaço visual para a criatura em linhas e cartões de hábito; a paleta de cores precisa conviver com ilustrações de animais.

## Macro: profundidade global

Todas as ações alimentam o `ScoreEngine` (pesos configuráveis, limites diários contra exploração) e definem a zona: Surface → Coastal Waters → Coral Reef → Open Ocean → Twilight Zone → Midnight Zone → Abyss → Hadal Zone. A profundidade acumulada nunca regride; o que oscila é o Daily Score.

## Ideia: modo Casual e modo Ranqueado

**Status:** ideia do proprietário (2026-10-18), **não aprovada para implementação**. Inspirada na divisão casual/ranqueado de jogos competitivos (ex.: Rainbow Six Siege).

### Conceito

|             | Casual (padrão)   | Ranqueado (opt-in)                             |
| ----------- | ----------------- | ---------------------------------------------- |
| Quem        | Todos             | Quem escolhe competir                          |
| Hábitos     | Quaisquer         | Hábitos elegíveis, incluindo hábitos complexos |
| Competição  | Consigo mesmo     | Com outras pessoas, em divisões de rank        |
| Acesso      | Gratuito          | Valor simbólico                                |
| Recompensas | Progressão normal | Recompensas próprias por rank (cosméticas)     |

Regra inegociável: o ranqueado **não afeta as funcionalidades principais**. Quem não paga nem compete tem o app completo.

### Questões em aberto (a responder antes de qualquer checkpoint)

1. **Integridade:** hábitos são autodeclarados. Como evitar trapaça numa competição? Opções: hábitos verificáveis (ex.: dados de saúde do aparelho), validação por amigos, limites de pontuação por dia, temporadas curtas.
2. **Taxa de entrada + prêmios:** competição paga com recompensas pode ser enquadrada em regras específicas das lojas (Apple/Google) e da legislação brasileira sobre concursos e prêmios. Recompensas **apenas cosméticas, sem valor em dinheiro**, reduzem esse risco, mas é preciso verificar antes de implementar.
3. **Bem-estar:** competição pode empurrar excessos. Precisamos de tetos (ex.: hábitos com limite saudável) e temporadas com descanso.
4. **Justiça:** como comparar hábitos diferentes (academia vs. leitura)? Provavelmente por consistência e dificuldade declarada, com divisões por categoria.
5. **Dependências técnicas:** exige contas, servidor e sincronização (ADR-002 prevê sync), pagamentos (Etapa 17) e Social (Etapa 14).

### Posição no roadmap

Depois de Habits (10), Criaturas (11), Social (14) e Subscriptions (17). Sugestão: um checkpoint dedicado, "Ranked Seasons", após a Etapa 17.
