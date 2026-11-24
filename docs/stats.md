# Estatísticas

A tela **Estatísticas** (`/profile/stats`) mostra a semana (domingo a sábado) ou o mês, com setas para voltar no tempo. A escolha Semana/Mês fica salva em `stats.mode`. O painel Início tem o cartão **"Esta semana"**, que abre a tela; o Perfil também tem o atalho.

## O que a tela mostra (Fase 6, simplificada)

Uma pergunta só no topo: **quanto do planejado eu cumpri?**

1. **Consistência da semana / do mês**: o anel grande (o mesmo do Início, `ConsistencyRing`), "6 de 9 hábitos e rotinas feitos" e a comparação com o período anterior numa etiqueta curta ("Subiu · era 52%", "Igual à semana passada", "Semana passada: 90%"). Nunca uma bronca: quando cai, só diz quanto foi antes.
2. **Concluídos** (tarefas, hábitos e itens de rotina) e **Maior sequência** (com o hábito).
3. **Dia a dia**, nos mesmos termos do anel: quanto do plano de cada dia foi feito. A semana em sete cápsulas que enchem; o mês num calendário. Dia com tudo feito fica em areia; hoje tem o anel; dia sem nada planejado fica tracejado (semana) ou sem cor (mês). Vem de `byDay[].due/kept`.
4. **Hábitos** (com a criatura; tocar abre o hábito) e **Rotinas**.
5. **Ver mais detalhes** (lembrado em `stats.details`): os gráficos de antes, concluídos por dia e tipo (com tabela), Profundidade, dias de maré cheia (mês), do planejado por dia da semana e quando você mais conclui.

## De onde vêm os números

Nada é guardado à parte: tudo é calculado no aparelho, na hora, a partir do que já sincroniza. Por isso esta etapa não tem migração nem SQL.

| Dado                     | Origem                                                                  |
| ------------------------ | ----------------------------------------------------------------------- |
| Tarefas concluídas       | `tasks.completed_at` (só tarefas, não subtarefas) — `completionTimes`   |
| Hábitos feitos           | `habit_checks` (dia + `updated_at`) — `habitsRepository.statsFacts`     |
| Itens de rotina marcados | `routine_checks` (dia + `updated_at`) — `routinesRepository.statsFacts` |
| Profundidade             | os pontos por dia das regras de gamificação (`computeProgress`)         |

O cálculo puro está em `src/shell/stats/computeStats.ts` (com testes em `src/shell/__tests__/stats.test.ts`); `useStats` busca os fatos e calcula o período e o anterior (para "▲ 12 vs. semana passada").

## Regras

- **Do planejado:** hábitos e itens de rotina devidos nos dias do período até hoje, só a partir do dia em que cada hábito ou rotina foi criado. Antes disso não conta como perdido. Hábito feito em dia de descanso entra no total, não no planejado.
- **Rotinas:** usa a lista de itens atual para os dias passados (a mesma aproximação da maré).
- **Quando você mais conclui:** a hora em que cada coisa foi marcada (madrugada 0–6 h, manhã 6–12 h, tarde 12–18 h, noite 18–24 h).
- **Maior sequência:** a sequência atual mais longa entre os hábitos.
- Dias depois de hoje não contam nada.

## Gráficos

Componentes em `src/design-system/components/Charts.tsx` (`Columns`, `AreaLine`, `Heatmap`, `Sparkline`, `Legend`), desenhados com `react-native-svg`. Seguem as regras de visualização: marcas finas com ponta arredondada, 2 px entre partes empilhadas, grade discreta, texto sempre em cores de texto, legenda com 2+ séries, área de toque maior que a marca e um resumo falado por coluna. O gráfico por dia tem **"Ver como tabela"**.

As cores das três áreas são o token `chartColors` (tarefas azul, hábitos coral, rotinas roxo), validadas para os três tipos de daltonismo nos modos claro e escuro.
