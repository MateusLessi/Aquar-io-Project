# Estatísticas

A tela **Estatísticas** (`/profile/stats`) mostra a semana (domingo a sábado) ou o mês, com setas para voltar no tempo. A escolha Semana/Mês fica salva em `stats.mode`. O painel Início tem o cartão **"Esta semana"**, que abre a tela; o Perfil também tem o atalho.

## O que a tela mostra (Fase 6)

Gráficos e tabelas do progresso, desenhados pelas regras de visualização (marcas finas, grade discreta, texto em cores de texto, legenda para 2+ séries, tabela ou rótulo falado para cada gráfico). A primeira versão simplificada escondia os gráficos; a pedido, eles voltaram para a frente.

1. **Consistência** (o destaque): o número grande do período ("67%"), "6 de 9 hábitos e rotinas feitos" e a **linha dia a dia** (`TrendLine`, 0–100%) com o período anterior como uma linha cinza discreta. O último valor fica escrito na ponta da linha; tocar ou passar o mouse num dia mostra os dois valores (tooltip). Comparação com o período anterior em palavras, sem bronca ("Semana passada: 52%"). Tem tabela (Dia, Planejado, Feito, %).
2. **Três números**: Concluídos (com a diferença para o período anterior e uma sparkline por dia), Dias com tudo feito e Maior sequência.
3. **O que você concluiu**: colunas por dia empilhadas por tipo (tarefas, hábitos, rotinas), com o total de cada tipo na legenda, tooltip e tabela.
4. **O mês em dias** (no Mês): o calendário, cada dia mais forte quanto mais do plano foi feito; tudo feito em areia.
5. **Hábitos** (tabela): a criatura, a faixa com os dias do período (feito, não feito, sem plano; hoje com o anel areia), feitos/planejados, % e a sequência. Tocar abre o hábito.
6. **Rotinas** (tabela): dias completos, itens e % com um medidor fino.
7. **Por dia da semana** (do planejado) e **Quando você conclui** (partes do dia × dias, uma cor só, com a escala "menos → mais").

Os metros saíram desta tela (as regiões vão no lugar da profundidade, etapa 12).

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

As cores das três áreas são o token `chartColors` (tarefas azul, hábitos verde-água, rotinas lilás), validadas com o script de paleta da skill de visualização no cartão grafite (#233038): faixa de luminosidade, croma, separação para daltonismo (pior par vizinho ΔE 11,0), piso de visão normal (ΔE 17,5) e contraste ≥ 3:1. O laranja fica de fora: é a cor das ações.
