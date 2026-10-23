# Comunidade — visão e estratégia

**Status:** visão em discussão (outubro de 2026). Nada aqui está implementado no app. Cada item vira decisão no checkpoint em que for executado.

Este documento guarda a perspectiva de uma conversa do Mateus com outra IA sobre a comunidade do Aquar.io, junto com os conselhos de engenharia e produto que ela recebeu aqui.

## A ideia central

A comunidade não é só um canal de suporte: ela faz parte do processo de desenvolvimento.

```
produto → atualização (evento) → reação da comunidade → feedback → decisões → roadmap → ↻
```

- **Discord:** comunidade próxima. O desenvolvedor aparece como pessoa, não como empresa sem rosto. Por exemplo: "Which one feels better, A or B?" e depois "You picked B. It's coming in the next update."
- **Reddit:** fórum público, a memória coletiva. Discussões longas que continuam pesquisáveis.
- **GitHub:** comunidade técnica (código, issues, PRs).
- **Dev Log:** o que estamos construindo, por quê, o que não funcionou, o que mudou e o que a comunidade pediu. Até decisões erradas viram conteúdo.

## Atualizações como eventos (inspiração: No Man's Sky)

Grandes atualizações têm **nome, narrativa e uma página própria**, e depois vêm patches menores guiados pelo feedback (x.01, x.02…). O que copiamos é a filosofia, não o conteúdo.

Nomes candidatos já existem em [naming.md](naming.md) (Current, Tide, Reef, Depth, Surge…).

**Ponto de atenção:** a V1 já entrega tarefas, rotinas, hábitos e profundidade juntos. Então os nomes desses módulos não podem virar "updates futuros" retroativamente. A proposta é que **a V1 seja a primeira atualização nomeada** e que **cada Expansão ganhe o próprio nome de evento**.

## Tese de produto

- O produto **não** é o oceano, nem os animais, nem a lista de tarefas. O produto é **um sistema que transforma o que você quer fazer da vida em progresso coerente e visível**. A gamificação dá emoção a esse progresso.
- **Risco principal: escopo.** Competir ao mesmo tempo com To Do, calendário, hábitos, academia, família e social. O diferencial é que tudo está conectado, não que existe tudo.
- **Recompensar equilíbrio, não só produtividade:** "uma vida saudável cria um ecossistema saudável". Isso já tem uma semente no limite diário de pontos ([gamification-rules.md](gamification-rules.md)).
- **Vínculo emocional (moat):** anos de histórico, criaturas e conquistas. Precisa ser saudável e **nunca manipulativo** (nada de culpa, punição por faltar ou dark patterns).

## Código aberto

**Situação real hoje:** o repositório é **público e não tem licença**. Juridicamente, sem licença, vale "todos os direitos reservados": qualquer pessoa pode ler o código, mas não tem permissão para copiar, modificar ou redistribuir. Na prática isso já é o modelo "desenvolvimento aberto, sem ser open source", que a outra IA recomendou.

- Nenhum segredo está no repositório. O `.env` só tem a URL e a chave publicável do Supabase, que são públicas por desenho; quem protege os dados é o RLS.
- Decisão adiada: escolher uma licença (ou declarar explicitamente "all rights reserved" no README) e separar marca e arte (criaturas, ilustrações) do código antes de divulgar amplamente.

## Portfólio

O Aquar.io já mostra: arquitetura em camadas com regras de importação, ADRs, sync local-first com resolução de conflitos, migrations, testes unitários e E2E em três tamanhos de tela, CI, design system e acessibilidade.

**Regra:** só mostrar números reais. Nunca inflar commits, usuários ou métricas.

## Regras para ouvir a comunidade

- A comunidade mostra a direção, mas **não projeta o produto**. Ela vê o roadmap, não o controla.
- Registrar o **problema** por trás da sugestão, não a solução literal. Exemplo: "calendário da faculdade" vira "importar muitos eventos recorrentes" (ICS, Google Calendar, modelo acadêmico…).
- Roadmap público por direção, **sem datas prometidas**.

## Primeiros membros

- Começar durante o desenvolvimento: 10 → 30 → 100 pessoas.
- Badge permanente **Founding Diver** para quem entrar na primeira fase. Só reconhecimento, sem vantagem financeira.
