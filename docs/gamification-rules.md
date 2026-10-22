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
| **Maré cheia** (tudo do dia feito, com pelo menos 3 itens) |    +25 | o próprio dia    |

- **Limite diário: 150 pontos.** Evita "farmar" criando tarefas falsas. Um dia excelente vale no máximo 150.
- Desmarcar devolve os pontos daquele dia; marcar de novo não conta em dobro.
- Corrigir um hábito de ontem conta para ontem (respeitando o limite de ontem).
- Excluir uma tarefa que já foi concluída **não** tira os pontos: o esforço aconteceu.

## Profundidade (nunca diminui)

**1 ponto = 1 metro.** A profundidade é a soma de todos os dias, e cada dia respeita o limite.

| Zona                  | A partir de | Com ~100 pontos/dia          |
| --------------------- | ----------: | ---------------------------- |
| 🌤️ Superfície         |         0 m | dia 1                        |
| 🏝️ Águas Costeiras    |       100 m | ~1 dia                       |
| 🪸 Recife de Coral    |       300 m | ~3 dias                      |
| 🌊 Mar Aberto         |       700 m | ~1 semana                    |
| 🌆 Zona do Crepúsculo |     1.500 m | ~2 semanas                   |
| 🌑 Zona da Meia-Noite |     3.000 m | ~1 mês                       |
| 🕳️ Abismo             |     6.000 m | ~2 meses                     |
| 🔱 Zona Hadal         |     8.000 m | ~3 meses                     |
| 🏁 Fossa das Marianas |    10.994 m | ~4 meses (marco final da V1) |

Mudar de zona mostra uma comemoração uma vez. Os nomes seguem a ordem do [gamification.md](gamification.md).

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
