# Regras da Fundação da Gamificação

**Status:** aprovado (Checkpoint 022) e implementado. Todos os números ficam em `src/core/progress/rules.ts` (pontos e zonas) e `src/features/habits/domain/stages.ts` (estágios), para ajustar com o uso real.

## De onde vêm os pontos

Os pontos são **calculados a partir do estado atual**, não guardados: tarefas com `completed_at` e check-ins de hábito (`habit_checks`). Os dois já sincronizam, então a pontuação é a mesma em todos os aparelhos, sem SQL novo.

| Ação                                                       | Pontos | Dia em que conta |
| ---------------------------------------------------------- | -----: | ---------------- |
| Concluir uma tarefa                                        |     10 | dia da conclusão |
| Concluir uma subtarefa                                     |      3 | dia da conclusão |
| Hábito feito num dia previsto                              |     15 | dia do check-in  |
| Hábito feito num dia de folga (bônus)                      |      8 | dia do check-in  |
| Item de rotina marcado                                     |      5 | dia do check     |
| **Maré cheia** (tudo do dia feito, com pelo menos 3 itens) |    +25 | o próprio dia    |

- **Limite diário: 150 pontos.** Evita "farmar" criando tarefas falsas. Um dia excelente vale no máximo 150.
- Desmarcar devolve os pontos daquele dia; marcar de novo não conta em dobro.
- Corrigir um hábito de ontem conta para ontem (respeitando o limite de ontem).
- Excluir uma tarefa que já foi concluída **não** tira os pontos: o esforço aconteceu.

## Regiões (nunca voltam)

**Fase 6, etapa 12:** as zonas de profundidade viraram **regiões do oceano** e os metros saíram de cena. Os pontos são os mesmos (somados dia a dia, cada dia com o limite) e levam o aquário a regiões novas. Toda região alcançada pode ser o **cenário do lago** (Personalizar → Cenário do aquário); sem escolha, o lago mostra a mais nova.

| Região                   | A partir de | Com ~100 pontos/dia |
| ------------------------ | ----------: | ------------------- |
| 🏝️ Lagoa                 |    0 pontos | dia 1               |
| 🪸 Recife de Coral       |         300 | ~3 dias             |
| 🌿 Floresta de Kelp      |       1.000 | ~10 dias            |
| 🌊 Mar Aberto            |       2.500 | ~1 mês              |
| ✨ Fossa Bioluminescente |       5.500 | ~2 meses            |
| 🏁 Fossa das Marianas    |      10.994 | ~4 meses            |

Chegar numa região nova mostra uma comemoração uma vez ("Nova região: …"). Quem já tinha progresso nas zonas antigas não recebe comemoração repetida na troca. Cada região tem uma pintura (`features/habits/assets/regions/`, `regionScenes`); a luz e as bolhas são desenhadas por cima, em código. A Lagoa ainda é desenhada em código.

### Mapa e comemoração (etapa 12d)

**Perfil → Regiões** (`/profile/regions`, também pelo cartão "Região" do Início e por Personalizar): o oceano visto de cima, da Lagoa à Fossa das Marianas, com a trilha entre as regiões. As alcançadas ficam em cor; a do lago tem o anel areia; as outras dizem quantos pontos faltam. Tocar numa região mostra a pintura, o que ela é e, se já alcançada, **Usar no meu lago**.

Ao chegar numa região nova, a comemoração mostra a pintura e o enfeite ganho e **espera a resposta**: "Usar no meu lago" ou "Depois" (a região fica para escolher no mapa ou em Personalizar).

### Enfeites

Cada região dá **um enfeite**, ganho junto com ela: vitória-régia (Lagoa), coral (Recife de Coral), kelp dourado (Floresta de Kelp), âncora (Mar Aberto), lanterna que brilha (Fossa Bioluminescente) e baú do fundo (Fossa das Marianas). Em Personalizar → Enfeites do lago, cada enfeite ganho tem um interruptor; os ligados aparecem nas bordas de qualquer cenário (dá para misturar). São só beleza: não mudam nenhuma regra. Desenhados em vetor (`components/Ornaments.tsx`, cores em `tokens/pond.ts`), preferência `aquarium.ornaments`.

## Evolução das criaturas (consistência, não perfeição)

O estágio vem do **total de dias feitos** do hábito, desde sempre. Perder um dia nunca faz a criatura regredir.

| Estágio    | Ovíparos*       | Mamíferos e tubarão** | Tamanho |
| ---------- | --------------- | --------------------- | ------: |
| 🥚 Ovo     | 0–2 dias feitos | —                     |     70% |
| 🍼 Filhote | 3–9             | 0–9                   |     85% |
| 🌱 Jovem   | 10–29           | 10–29                 |    100% |
| ⭐ Adulto  | 30+             | 30+                   |    115% |

\* Tartaruga, peixe, polvo, caranguejo, baiacu, lula, lagosta, camarão.
\*\* Golfinho, baleia, foca e tubarão: começam como filhote (não existe "ovo de baleia").

### Nível da criatura (Fase 6, etapa 12c)

Cada dia feito dá **XP** à criatura do hábito: **15** num dia previsto e **8** num dia de folga (os mesmos pontos do dia). O nível sai do XP (`levelFor` em `stages.ts`): níveis 1–10 em 0, 15, 45, 75, 110, 150, 200, 260, 340 e 450 XP, e depois **+150 XP por nível**, então a criatura adulta continua subindo. Os níveis 3, 6 e 10 caem onde os estágios mudam (3, 10 e 30 dias previstos), então nível e estágio contam a mesma história. Nunca cai por perder um dia; desmarcar um dia tira o XP daquele dia.

Aparece na tela da criatura (etiqueta "Nível 9" e a barra "345 XP · faltam 105 para o nível 10"), no cartão do hábito ("Jovem · Nív. 9") e no cartão do Seu aquário.

## Onde aparece

- **Hoje:** medidor de profundidade (zona atual, metros e quanto falta para a próxima) e os pontos do dia.
- **Hábitos:** o selo do estágio em cada cartão; a criatura cresce de tamanho.
- **Detalhe do hábito:** "Faltam N dias para virar Jovem".
- **Comemoração** ao mudar de zona e quando uma criatura evolui.

## Como está implementado

| Parte                                          | Onde                                                                              |
| ---------------------------------------------- | --------------------------------------------------------------------------------- |
| Regras puras (pontos, limite, zonas)           | `src/core/progress/rules.ts`                                                      |
| Fatos por dia vindos das tarefas e dos hábitos | `progressFacts()` nos repositórios de To Do e Hábitos                             |
| Junção dos fatos + regras                      | `src/shell/progress/computeProgress.ts`, `useProgress.ts`                         |
| Medidor na tela Hoje                           | `src/shell/progress/DepthGauge.tsx`                                               |
| Estágios das criaturas                         | `src/features/habits/domain/stages.ts`; `CreatureBubble` mostra o ovo e o tamanho |
| Comemorações (zona nova, criatura que evoluiu) | `src/shell/progress/useCelebrations.ts`, `CelebrationBanner.tsx`                  |

As comemorações são **por aparelho** (`app_settings`). Na primeira vez que rodam, só registram onde as coisas estão, para não comemorar progresso antigo ao atualizar o app.

## Fora desta etapa

Loja, moedas, conquistas, ranqueado e ilustrações próprias: etapas 11, 16 e 17.
