# Boas-vindas

Na primeira vez que o app abre num aparelho **sem nada**, aparece a descida (`src/shell/welcome/`): 6 telas, cada uma mais funda (as cores estão em `oceanDepths`, com texto branco ≥ 4,5:1), com raios de luz, algas, criaturas e bolhas desenhadas no app. Com "Reduzir movimento", as criaturas param e só sobra o esmaecer entre telas.

1. Superfície: "Começar o mergulho" ou "Já tenho conta" (vai para Ajustes → Conta e dados).
2. Como funciona.
3. O que organizar (vários).
4. Quando o dia rende mais e hábitos para começar.
5. Criatura, nome e faixa de idade (opcional).
6. O aquário inicial: cada sugestão tem uma caixa; só as marcadas são criadas, ao tocar em Mergulhar.

"Pular" em todas as telas do meio. A escolha fica em `welcome.done` (`quiz`, `skipped`, `account` ou `existing`).

## Regras

- **Quem já usa o app não vê:** se o aparelho já tem hábitos, rotinas ou listas, a marca é gravada como `existing` sem mostrar nada.
- **Sugestões** (`suggestions.ts`, testado em `src/shell/__tests__/welcome.test.ts`): os hábitos escolhidos com o tipo certo (copos, páginas, minutos), até 2 rotinas no horário em que o dia rende mais e uma lista por área.
- **Idade:** opcional, em faixa, com "Prefiro não dizer". Hoje só muda o nome da lista de estudos (Escola, Faculdade ou Estudos). Fica em `welcome.age`, **só no aparelho** (a tabela de ajustes não sincroniza).
- **Rever:** Ajustes → Sobre → "Ver as boas-vindas".
- **Testes:** os testes de ponta a ponta começam dentro do app (`e2e/fixtures.ts` marca o navegador como já visto, a mesma marca que o app deixa na web); `e2e/welcome.spec.ts` testa a descida.

## Limites conhecidos

- Na primeira abertura, o painel vazio aparece por um instante antes da descida, enquanto o app confere se o aparelho tem dados.
- Na web, o banco grava no disco um instante depois de cada mudança: recarregar a página no mesmo segundo pode perder a última alteração.
