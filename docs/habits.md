# Hábitos

Cada hábito é uma **criatura marinha** (ver [gamification.md](gamification.md)). A V1 cobre criar, marcar o dia, acompanhar a sequência e sincronizar entre aparelhos.

## O que existe

| Parte                                                       | Onde                                                                 | Estado |
| ----------------------------------------------------------- | -------------------------------------------------------------------- | ------ |
| Aba Hábitos (recife + cartões)                              | `src/features/habits/screens/HabitsScreen.tsx`                       | REAL   |
| Detalhe (estatísticas + calendário, corrigir dias passados) | `HabitDetailScreen.tsx`                                              | REAL   |
| Criar/editar/apagar (nome, criatura, dias)                  | `components/HabitEditorSheet.tsx`                                    | REAL   |
| Hábitos do dia na tela Hoje                                 | `components/TodayHabits.tsx`, composto em `src/app/(tabs)/index.tsx` | REAL   |
| Criaturas no Modo Maré                                      | `src/shell/AmbientDisplay.tsx`                                       | REAL   |
| Sincronização                                               | tabelas `habits` e `habit_checks` (ADR-004)                          | REAL   |
| Ilustrações e evolução das criaturas                        | Etapa 11                                                             | TODO   |
| Tipos de hábito, cápsulas, mergulho (Hábitos 2.0)           | ver abaixo                                                           | REAL   |

## Hábitos 2.0 (First Dive, etapa 1)

Proposta aprovada no checkpoint 036: `docs/design/proposals/habits-2.png`.

### Tipos (`domain/types.ts`, `domain/amount.ts`)

| Tipo        | Meta (`target`)     | Progresso do dia (`amount`) | Feito quando             |
| ----------- | ------------------- | --------------------------- | ------------------------ |
| `check`     | 1                   | —                           | marcado                  |
| `count`     | unidades (1–999)    | unidades, com `unit`        | `amount ≥ target`        |
| `time`      | minutos (1–600)     | **segundos**                | `amount ≥ target × 60`   |
| `checklist` | nº de passos (1–12) | passos feitos (`stepsDone`) | todos os passos marcados |

- O progresso parcial fica em `habit_progress` (um registro por hábito e dia, id `<hábito>:<dia>`). **`habit_checks` continua significando "dia feito"**: sequência, crescimento da criatura, pontos de Profundidade e lembretes não mudaram.
- Passar da meta conta nas estatísticas (`amount` guarda o total), mas **não dá pontos a mais** (regra de não premiar excesso).
- Os passos do checklist **recomeçam todo dia** e guardam o próprio id, então renomear um passo não o desmarca.
- Marcar ou desmarcar um dia no calendário enche a cápsula até a meta, ou a esvazia.
- Mudar a meta reavalia o dia de hoje (ex.: meta de 8 → 5 com 5 copos marca como feito).

### Cronômetro

`habit_timers` guarda só **a hora de início**, e só neste aparelho. Ele continua contando com o app fechado; pausar soma o tempo decorrido ao dia em que começou. Um aviso local toca quando a meta é atingida (`src/shell/reminders/plan.ts`) e abre o **mergulho** (`?dive=1`), que mantém a tela acesa.

### Telas

- **Cápsula** (`HabitCapsule.tsx`): o nível da água é o progresso de hoje; a criatura nada na superfície e sobe junto. Com "Reduzir movimento", a água não ondula.
- **Cartão** (`HabitCard.tsx`): cápsula, etiqueta (`3/8 copos`), **maré da semana** (7 mini-cápsulas) e o botão do tipo (✓, +1, ▶/❚❚, passos).
- **Painel Início** (`TodayHabits.tsx`): toque faz a ação principal; segurar abre o hábito.
- **Recife** (`ReefHero.tsx`): cada criatura nada na altura do seu progresso.
- **Detalhe**: cápsula grande com controles, passos, números, crescimento, mapa do recife (`ReefMap.tsx`) e calendário.

## Hábito conectado (Lapidação, Fase 1a)

Um hábito pode ser concluído por **uma lista, uma pasta ou uma rotina** (editor → "Como ele é concluído?"). O dia dele vem dos itens; o cartão mostra "Push · 1 de 2" e abre os itens ali mesmo, e o detalhe tem "Hoje · Push" com "Marcar tudo". Detalhes em [connections.md](connections.md).

## Regras de progresso (`domain/progress.ts`)

- **Hoje nunca é falha:** até a meia-noite ainda dá tempo.
- **Dias de folga** (fora da agenda do hábito) não quebram a sequência. Marcar num dia de folga conta como bônus.
- **Sequência atual** termina num dia devido que passou sem check-in. A **melhor sequência** e a **consistência dos últimos 30 dias** guardam o histórico (gamificação não punitiva).
- Os dias são chaves `YYYY-MM-DD` no fuso do aparelho, como os prazos das tarefas (`src/core/dates.ts`).

## Criaturas

**Seis criaturas, vistas de cima (Fase 6):** peixe, tubarão, tartaruga, água-viva, polvo e raia, cada uma com uma cor e um formato (`domain/creatures.ts`): a criatura define a cor, então criar um hábito é uma escolha só. A arte é uma imagem por criatura (`assets/creatures/`, registrada em `creatureImages` no `CreatureArt`): testar outra arte é trocar o arquivo.

- **Crescimento:** pelo tamanho; o ovo é pequeno e apagado, o adulto ganha um halo areia (`stageInfo`). Tubarão e raia nascem filhotes.
- **Criaturas antigas** (golfinho, baleia, foca, baiacu, camarão, caranguejo, lula, lagosta) continuam válidas nos dados e aparecem como a mais parecida das seis (`catalogCreature`): golfinho → tubarão, baleia → raia, foca → tartaruga, baiacu e camarão → peixe, caranguejo, lula e lagosta → polvo. Nada é reescrito no banco; ao editar, o hábito passa a guardar a nova.
- Para escolher (editor, perfil, Ajustes e mergulho de boas-vindas), só as seis. Os modelos do catálogo também.

## Eventos

`HABIT_CHECKED` e `HABIT_UNCHECKED` são gravados na mesma transação do check-in, para a futura Fundação da Gamificação (Etapa 9).

## Criar um hábito (Fase 3a)

- **Novo hábito** abre um **catálogo de modelos** (`domain/catalog.ts`, com testes). São 8 categorias (Saúde, Mente, Espiritualidade, Estudos, Trabalho, Casa, Finanças e Social) e 40 modelos, além de "Populares" e uma busca sem acento por nome, categoria ou palavras comuns ("bíblia", "inglês", "academia").
- Os modelos vêm com valores coerentes (Água = 8 copos de 250 ml; Ler = 20 páginas; Meditar = 10 min; Orar = 2 vezes, manhã e noite), criatura, dias e lembretes sugeridos. Um modelo **só preenche o editor**: nada liga o hábito ao modelo, então mudar o catálogo nunca muda os hábitos de ninguém. Um teste cria todos os modelos pelo repositório, para garantir que são hábitos válidos.
- **"Começar do zero"** e **"Ver os modelos"** (voltar) estão sempre à mão.
- O **editor** tem a criatura em destaque no topo, na cor dela, e o campo **"Por quê?"** (`description`, até 140 caracteres, migração 14; mostrado no detalhe). Para contador e tempo há um **mostrador circular** (`Dial` no design system): dá para arrastar o anel, que dá mais de uma volta (12 por volta no contador, 60 min no tempo), tocar em − / + ou ajustar pelo leitor de tela. Bebidas mostram o total ("2 litros por dia"), e trocar copo ↔ garrafa ↔ litro mantém a quantidade. Os dias ganharam o atalho "Fim de semana".

## Cronômetro flutuante (Fase 3b)

- Enquanto um cronômetro corre (hábito de tempo **ou** item de lista com tempo), ele **flutua por cima do app** (`src/shell/timers/`). No celular é uma pílula acima da barra, com o tempo, um anel que enche até a meta, **Pausar** e **Concluir**. No tablet e no PC é um cartão no canto de baixo com todos os que estão correndo.
- Mais de um no celular: a pílula mostra o primeiro (o mais antigo) e "+N correndo". Tocar nela abre os outros.
- Tocar no nome abre o mergulho do hábito ou a lista do item. Dentro do mergulho a pílula some, porque a tela já é o cronômetro.
- **Concluir** para o cronômetro e marca o dia (o hábito enche até a meta; o item fica feito). **Pausar** guarda o tempo, como o botão do cartão.
- Continua certo com o app fechado: o tempo vem de quando começou (`habit_timers` / `task_timers`), não de um contador na memória. O conteúdo das telas deixa espaço para a pílula.
