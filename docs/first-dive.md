# Aquar.io: First Dive (v1.0.0)

**Status:** em construção. Esta é a lista fechada do que entra no primeiro lançamento público. O que não estiver aqui vai para a atualização seguinte. Cada item passa por checkpoint, branch, testes e merge na `main`. **Nada é anunciado nem distribuído antes de todos os itens estarem ✓.**

Base: a V1 já pronta ([v1.md](v1.md)), com tarefas, hábitos-criaturas, rotinas, Profundidade, lembretes e sincronização.

## Etapas

**Regra de todas as etapas:** cada etapa também atualiza o **painel Início** (o dashboard interativo). Uma funcionalidade só está ✓ quando aparece, de forma resumida e tocável, no painel do celular, do tablet e do PC.

**Decisões do checkpoint 035:** pastas com no máximo 4 níveis; checklists de hábitos e de peças da rotina recomeçam todo dia (uma lista de tarefas normal anexada continua).

Ordem pensada por dependência: primeiro o que muda os dados (hábitos, pastas), depois as telas que usam esses dados, por último a recepção, que apresenta tudo.

| #   | Etapa                                                                                            | Estado |
| --- | ------------------------------------------------------------------------------------------------ | ------ |
| 1   | **Hábitos 2.0**: tipos de hábito, cronômetro, contador, nova visualização                        | ✓      |
| 2   | **Pastas e listas**: pastas dentro de pastas, visualizações de pasta                             | ✓      |
| 3   | **Tudo conectado**: hábitos dentro de rotinas, listas em hábitos e rotinas, peça que abre        | ✓      |
| 4   | **Visualizações de rotina**: escolher a visualização, semana em colunas, no painel e em Rotinas  | ✓      |
| 5   | **Estatísticas**: semanal e mensal, gráficos e tabelas                                           | ✓      |
| 6   | **Sons e toque**: recompensa sonora e vibração em cada conclusão                                 | ✓      |
| 7   | **Ajustes completos**: personalização ampla do app                                               | ☐      |
| 8   | **Perfil personalizável** com privacidade por informação                                         | ☐      |
| 9   | **Boas-vindas imersivas** e quiz inicial                                                         | ☐      |
| 10  | **Pronto para testadores**: marca, comunidade, Founding Diver, apagar conta, privacidade, GitHub | ☐      |
| 11  | **Lançamento**: tag `v1.0.0`, Release "First Dive", site fixo, APK, anúncio                      | ☐      |

## Detalhes por etapa

### 1. Hábitos 2.0

- **Tipos de hábito:**
  - **Sim/não**: o atual;
  - **Contador**: "8 copos de água", com a parte concluída visível (3/8);
  - **Tempo**: "ler 20 min", com cronômetro e meta escolhida num **slider de minutos**;
  - **Checklist**: um hábito composto de passos.
- **Nova visualização** do hábito, no painel e na página dedicada. Substitui as bolinhas por algo mais ousado: anel de progresso, a criatura reagindo ao progresso parcial, e um histórico mais rico.
- A criatura continua sendo o coração do hábito.

### 2. Pastas e listas

- Na aba Listas, o **Criar** oferece **Nova lista** ou **Nova pasta**.
- **Pastas dentro de pastas**, por exemplo `UnB › Semestre 3 › Cálculo 3`, com no máximo 4 níveis para ninguém se perder no celular.
- **Navegação por trilha** (breadcrumb) no topo: tocar em "UnB" volta direto para a pasta.
- **Visual:** a pasta é um bloco de vidro elevado, com as listas "aparecendo" atrás como cartas empilhadas; tem cor e emoji próprios e um anel com o progresso de tudo o que está dentro.
- **Visualizações da pasta:**
  - **Grade:** cartões de pastas e listas;
  - **Lista compacta;**
  - **Tudo junto:** as tarefas de todas as listas da pasta e das subpastas numa tela só, agrupadas por lista. Por exemplo: tudo o que vence nesta semana em "Semestre 3".
- **Organizar:** "Mover para…" (acessível, funciona em qualquer aparelho) e arrastar no modo Conectar (etapa 3).
- **Apagar pasta:** escolher entre mover o conteúdo para a pasta de cima ou apagar tudo, sempre com confirmação.
- **Dados:** tabela nova de pastas, sincronizada como as demais, e cada lista guarda em qual pasta está.

### 3. Tudo conectado

- **Hábito dentro da rotina:** um bloco da rotina pode ser um hábito com horário. Marcar na rotina marca o hábito, e vice-versa. **Uma fonte só de verdade.**
- **Listas em rotinas e hábitos:** anexar uma lista existente ou criar um checklist próprio.
- **Peça que abre:** tocar num bloco da rotina expande o bloco com uma animação, mostrando a lista. Ao sair, a animação fecha, e o bloco ganha um sinal (relevo ou ícone com a contagem) indicando que tem uma lista.
- **Visual:** aero, vidro, blocos elevados, marinho.

### 4. Visualizações de rotina

- A pessoa escolhe a visualização: **Linha do tempo** (a atual), **Semana em colunas** (referência: o modelo de rotina do Notion, com um dia por coluna e blocos com etiqueta colorida e horário) e **Agenda/lista**.
- Disponível no **painel** (compacta) e em **Rotinas** (detalhada).
- No celular, a semana vira um carrossel de dias. No tablet e no PC aparecem as 7 colunas.
- **Feito:** seletor **Hoje / Semana / Agenda** em Rotinas (a escolha fica salva); **etiqueta** opcional nas rotinas (migração 10); blocos com os hábitos e listas conectados; bandeja de arrastar na semana do tablet e do PC; cartão **"Sua semana"** no painel, que abre a Semana no dia tocado. Detalhes em [routines.md](routines.md).

### 5. Estatísticas

- Visões semanal e mensal, com gráficos e tabelas, cobrindo hábitos, tarefas, rotinas e Profundidade.
- Sequências, taxa de conclusão por dia da semana, horários em que você mais conclui e equilíbrio entre áreas.
- Gráficos desenhados com `react-native-svg`, que já está no projeto. Sem biblioteca nova.
- **Feito:** tela **Estatísticas** (`/profile/stats`, aberta pelo Perfil e pelo cartão **"Esta semana"** do painel), semana e mês, 4 números-resumo, concluídos por dia, Profundidade, calendário de maré cheia, taxa por dia da semana, horários e tabelas de hábitos e rotinas. Detalhes em [stats.md](stats.md).

### 6. Sons e toque

- Um som curto para cada conclusão (tarefa, subtarefa, hábito, item de rotina, maré completa e mudança de zona), mais vibração leve.
- Sons **próprios ou com licença livre (CC0)**. Nunca copiados de outro app.
- Liga e desliga em Ajustes. Os sons respeitam o modo silencioso do celular.
- **Feito:** 8 sons sintetizados (gota, bolhas, sino de madeira, onda), vibrações por momento e **Perfil → Sons e toque** (sons, volume, grupos, vibração). Detalhes em [sounds.md](sounds.md).

### 7. Ajustes completos

Ver [recomendações](#recomendações-de-ajustes-e-perfil) abaixo.

### 8. Perfil personalizável

- Avatar (criatura), cor/tema do perfil, frase, selos exibidos, destaques (zona de Profundidade, criatura favorita, sequência).
- **Privacidade por informação:** público / só amigos / só eu, já preparado para quando os perfis forem visíveis. **Padrão: só eu.**

### 9. Boas-vindas imersivas e quiz

- Estilo "primeiro uso de um iPhone": limpo, uma ideia por tela, e uma descida pelo oceano (luz da superfície → recife → profundezas) com criaturas e flora.
- Quiz curto e **opcional**: o que você quer organizar, rotina de estudo ou trabalho, hábitos que quer começar. Já **sugere hábitos e rotinas prontos** no final.
- Idade em **faixa etária**, opcional, nunca a data de nascimento.
- Respeita "Reduzir movimento".

### 10. Pronto para testadores

Ver [community.md](community.md): marca dentro do app, Comunidade e feedback, Founding Diver, apagar conta, aviso de privacidade, "Adicionar à Tela de Início" no iPhone, estados vazios com o mascote, e o "Sobre" do GitHub, modelos de issue e etiquetas.

## Recomendações de ajustes e perfil

**Ajustes:**

- **Aparência:** tema, cor de destaque, intensidade do vidro, tamanho do texto, densidade (compacta/confortável).
- **Início:** qual aba abre o app; quais cartões aparecem no painel, e em que ordem.
- **Calendário:** primeiro dia da semana, formato de hora 24h/12h, horário em que o "dia" vira (para quem dorme tarde).
- **Sons e toque:** volume, quais eventos tocam, vibração.
- **Hábitos:** criatura padrão, mostrar ou esconder os nomes no recife.
- **Gamificação:** mostrar ou esconder pontos e Profundidade, comemorações.
- **Lembretes:** horário silencioso.
- **Dados:** exportar (JSON/CSV), apagar conta.
- **Acessibilidade:** os toggles atuais mais alto contraste.

**Perfil:**

- **Identidade:** nome de exibição, @usuário, criatura-avatar, cor do perfil, frase/bio.
- **Vitrine:** selos (Founding Diver…), zona de Profundidade, criaturas favoritas, maior sequência.
- **Privacidade por campo:** público / amigos / só eu.

## Cuidados

- **Idade e dados pessoais (LGPD):** só pedir o que o app **usa agora**, para algo que a pessoa percebe (por exemplo, sugestões no quiz), e explicar para quê. Dados de crianças e adolescentes têm regras mais rígidas no Brasil (LGPD art. 14 e o ECA Digital). Antes de abrir para o público amplo, revisar a política de idade mínima.
- **Arte:** as criaturas e a flora das boas-vindas precisam de ilustrações. Dá para fazer com formas vetoriais estilizadas no código, ou com arte gerada e tratada, como a da marca. Decidir na etapa 8.
- **Tamanho:** são 10 etapas grandes. O First Dive só sai quando todas estiverem ✓. Ideias novas entram nesta lista por checkpoint, ou vão para a próxima atualização.
