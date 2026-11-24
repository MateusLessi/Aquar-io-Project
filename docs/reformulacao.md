# Reformulação de design (Fase 6)

Registro de tudo o que foi decidido e de tudo o que falta fazer na nova linha visual do Aquar.io. Estamos em fase de **teste e reteste** de imagem, marca e desenvolvimento: as decisões abaixo valem para testar, e cada peça é feita para ser trocada sem refazer o resto.

Proposta visual: [design/proposals/fase-6-nova-linha.html](design/proposals/fase-6-nova-linha.html) (e `.png`).

## Decisões tomadas

| Tema                | Decisão                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Temas               | **Acabam todos** (Claro, Escuro, Crystal e Meia-noite). O app passa a ter **um visual só**, escuro, com a paleta nova. O seletor de tema sai de Personalizar e de Ajustes.                                                                                                                                                                                                                                                                                                         |
| Paleta              | Laranja `#FF5B04`, Verde-meia-noite `#075056`, Grafite `#233038`, Marfim `#FDF6E3`, Areia `#F4D47C`, Prata `#D3DBDD`, mais cores marinhas de apoio (turquesa, azul, roxo das criaturas).                                                                                                                                                                                                                                                                                           |
| Aquário             | **Visto de cima (top-down)**: como olhar a parte de cima dos peixes num lago. 2D animado agora (caminho + balanço do corpo); 3D completo depois, como evolução.                                                                                                                                                                                                                                                                                                                    |
| Referência de clima | GoldFish: água em degradê verde, folhas orgânicas emoldurando as bordas, poucas criaturas e grandes, criaturas escuras e desfocadas ao fundo (profundidade).                                                                                                                                                                                                                                                                                                                       |
| Criaturas           | **6 no começo**, no estilo da folha enviada (degradê, visto de cima): peixe (koi), tubarão, tartaruga, água-viva, polvo, raia. Hábitos que usam as criaturas antigas continuam funcionando até a migração.                                                                                                                                                                                                                                                                         |
| Pastas              | Sistema de pastas **com aba** (cartão cheio de cor, ícone em círculo escuro, número grande), inspirado na referência, sem copiar. Nas Pastas fixadas do Início, um maço.                                                                                                                                                                                                                                                                                                           |
| Início              | Rápido de olhar, entender e usar: o aquário, os hábitos do dia, as tarefas de hoje, a semana (trocável pelo mês), uma estatística simples (consistência) e o progresso. Nada de métricas complicadas. No PC, sem rolagem (já feito).                                                                                                                                                                                                                                               |
| Progressão          | **Regiões do oceano** no lugar das profundezas (Caminho B, etapa 12): os pontos de sempre levam o aquário a 6 regiões (Lagoa, Recife de Coral, Floresta de Kelp, Mar Aberto, Fossa Bioluminescente, Fossa das Marianas); a pessoa **escolhe qual região o lago mostra**; cada região dá **um enfeite** (liga e desliga); cada criatura tem **nível/XP** (o estágio acompanha o nível); **os metros somem**. Proposta: [fase-6-regioes.html](design/proposals/fase-6-regioes.html). |
| Logo                | Proposta: o **peixe laranja visto de cima** (combina com o laranja da paleta). A confirmar.                                                                                                                                                                                                                                                                                                                                                                                        |
| Cuidado             | Não mudar tudo de uma vez: cada parte vem com checkpoint, e o que estiver em teste fica fácil de trocar.                                                                                                                                                                                                                                                                                                                                                                           |

## O que fazer (em ordem sugerida)

1. **Proposta da nova linha** (este passo): telas-chave no celular e no PC, paleta, formas e componentes. Aprovação antes de codar.
2. **Tema único**: tokens novos com a paleta; remover os quatro temas, o seletor, o Crystal (fundo vivo, vidro fosco) e as cores por zona de profundidade; limpar testes de contraste para um tema só.
3. **Componentes base**: cartões (sem contorno, cantos generosos, a "aba" como forma da marca), botões (laranja só na ação principal), chips, linhas de lista, check, barra de abas do celular, barra lateral do PC.
4. **Catálogo das criaturas**: as 6 artes registradas num lugar só (trocar arte = trocar arquivo); água-viva e raia como criaturas novas; escolha só entre as 6; migração das 12 antigas para a mais parecida.
5. **Lago visto de cima**: componente animado (criaturas seguindo caminhos, balanço do corpo, folhas, bolhas, camada de fundo desfocada), leve no celular e respeitando "Reduzir movimento".
6. **Início novo**: lago no topo, consistência da semana, hábitos do dia, tarefas de hoje, agenda; celular e PC (PC sem rolagem).
7. **Aquário (Hábitos, Agenda, Listas)** no novo visual: cartões de hábito com a criatura, linhas de tarefa, a agenda.
8. **Pastas com aba**: grade de pastas e o maço nas Pastas fixadas.
9. **A criatura (detalhe do hábito)**: a criatura grande vista de cima, estágio, barra até o próximo, evolução em passos, a semana, "Marcar hoje".
10. **Seu aquário (tela explorável)**: todas as criaturas nadando; tocar numa abre o cartão do hábito.
11. **Estatísticas simplificadas**: consistência como número principal, semana e mês.
12. **Regiões e níveis** (decidido: Caminho B, com nível por criatura e enfeites, sem metros). Em quatro partes, cada uma com checkpoint:
    - 12a · Regiões: as 6 no lugar das zonas, a água de cada uma no lago, escolher em Personalizar, cartão "Região" no Início, sem metros.
    - 12b · Enfeites: um por região, ligar e desligar, nas bordas do lago.
    - 12c · Nível da criatura: XP (15 por dia previsto, 8 por dia de folga) e nível na tela da criatura, nos cartões e no Seu aquário; o estágio acompanha o nível.
    - 12d · Mapa e comemoração: a tela do mapa e o "Usar no meu lago".
13. **Marca**: logo, ícone do app, tela de abertura.
14. **Acesso para testes**: publicar a versão web (EAS Hosting ou outra hospedagem com os cabeçalhos de isolamento que o banco web exige) para outra IA e testadores verem o app. Só com autorização.
15. **Fechamento**: docs, testes, E2E, CI, por etapa.

## Em aberto

- Os números das regiões (300, 1.000, 2.500, 5.500, 10.994 pontos) e a curva de XP: proposta, ajustar com o uso real.
- O peixe laranja como logo.
- Como mostrar o crescimento na arte vista de cima: proposta é tamanho + brilho (uma imagem por criatura).
- Arte final das criaturas: hoje recortada da folha de referência; idealmente arquivos com fundo transparente em alta resolução.
- Acesso web para outra IA: qual hospedagem e quem faz o login.

## Já feito nesta fase

- Início do PC sem rolagem, sem saudação, data na Agenda.
- Personalizar no lugar da Loja (o seletor de tema sai na etapa 2).
- **Etapa 2 feita: tema único.** `appColors` no lugar dos quatro temas; sem seletor de tema; sem Crystal (fundo vivo e vidro fosco); a zona só muda a água do tanque; contraste testado para o visual único; `app.json` em modo escuro.
- **Etapa 3 feita: componentes base.** Botão principal laranja (cantos arredondados), secundário grafite, link turquesa; "escolhido" em verde-meia-noite em todo lugar (`selected`); `TabCard` (a aba) e `Tag`; Criar como quadrado arredondado laranja; catálogo atualizado. O Criar continua ao lado da cápsula no celular (só no Início e no Aquário), não no meio.
- **Etapa 4 feita: catálogo das criaturas.** As 6 vistas de cima (imagem por criatura), água-viva e raia novas; as antigas viram apelidos da mais parecida (sem mexer nos dados); só as 6 para escolher e nos modelos; crescimento por tamanho, ovo apagado e halo no adulto. O tanque antigo ainda mostra as criaturas nadando de lado, até o lago (etapa 5).
- **Etapa 5 feita: o lago visto de cima** (`HabitPond`) no Início e em Aquário → Hábitos: criaturas em caminhos em oito, cabeça para onde nadam, água-viva e polvo pulsando, descanso como sombras no fundo, folhas, luz e bolhas; parado com Reduzir movimento. Chave Lago/Tanque em Ajustes → Início.
- **Etapa 6 feita: Início novo.** Consistência da semana (anel) no lugar de "Esta semana"; hábitos de hoje em linhas com a criatura e o botão de ação; celular sem mini-cartões e com o lago mais baixo; ordem padrão consistência, hábitos, tarefas, agenda.
- **Etapa 7 feita (Hábitos e Agenda):** cartão de hábito com a criatura num quadrado verde, estágio, barra e botão redondo; a rotina de agora em verde-meia-noite com borda areia (Início e Aquário). Listas ficam com as pastas, na etapa 8.
- Etapa 8 (pastas com aba e listas) feita e **desfeita a pedido**: pastas e listas ficam como estavam por enquanto; voltam a ser repensadas depois.
- **Etapa 9 feita: a criatura (detalhe do hábito).** A criatura grande vista de cima sobre a água, flutuando com a sombra no fundo; nome com o estágio; barra até o próximo estágio; Hoje com "Marcar hoje" (ou a ação do tipo) logo abaixo, para aparecer sem rolar no celular; Evolução em passos; Esta semana dia a dia. Números, recife e calendário continuam abaixo. As letras da semana no cartão de hábito agora seguem o primeiro dia da semana escolhido.
- **Etapa 10 feita: Seu aquário.** O lago em tela cheia (`/pond`), aberto pelo lago do Início e pelo de Aquário → Hábitos: todas as criaturas nadando, tocar numa mostra o cartão do hábito dela (estágio, barra, a ação de hoje, "Ver hábito"), tocar na água solta; uma fileira com todas embaixo faz o mesmo para leitores de tela e teclado.
- **Etapa 11 feita: Estatísticas simplificadas.** A consistência do período como número principal (anel grande, comparação curta com o anterior, sem bronca), Concluídos e Maior sequência, o Dia a dia (semana em cápsulas, mês em calendário; tudo feito em areia), hábitos com a criatura e rotinas; os gráficos técnicos ficam em "Ver mais detalhes".
- **Etapa 12 decidida** (Caminho B): regiões que se ganham e se escolhem, enfeites, nível por criatura, sem metros. A proposta visual vai para aprovação antes de qualquer código.
- Arte das 6 criaturas recortada (branch `feat/criaturas-de-cima`, ainda não usada nas telas).
