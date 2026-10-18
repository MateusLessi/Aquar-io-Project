# Arquitetura

Visão geral técnica do Aquar.io. Decisões e seus motivos ficam em [decisions.md](decisions.md).

## Plataforma

| Camada    | Tecnologia                                        | Status    |
| --------- | ------------------------------------------------- | --------- |
| Linguagem | TypeScript (modo `strict` + checagens extras)     | REAL      |
| Framework | React Native + Expo SDK 57                        | REAL      |
| Navegação | Expo Router (rotas por arquivo em `src/app/`)     | REAL      |
| Testes    | Jest (`jest-expo`) + React Native Testing Library | REAL      |
| Qualidade | ESLint (`eslint-config-expo`) + Prettier          | REAL      |
| CI        | GitHub Actions (`.github/workflows/ci.yml`)       | REAL      |
| Dados     | Local-first: SQLite no aparelho (ADR-002)         | PLANEJADO |
| Design    | Aquatic Glass (`src/design-system`)               | REAL      |
| Animação  | Reanimated 4 (molas respeitam Reduzir movimento)  | REAL      |

## Estrutura de pastas

```
src/
├── app/              Rotas (Expo Router). Cada arquivo é uma tela; _layout.tsx define navegadores.
│                     Só código de rota mora aqui.
├── __tests__/        Testes de telas de rota (não podem ficar dentro de src/app/).
├── design-system/    tokens, tema, componentes e catálogo (ver design-system.md)
├── core/             (quando necessário) eventos, banco, identidade
├── features/         (a partir da Etapa 4) um diretório por módulo: todo/, routines/, ...
└── shared/           (quando necessário) utilitários genéricos
```

As pastas marcadas com etapa ainda **não existem**. Elas são criadas quando o primeiro código real precisar delas, para não termos placeholders vazios.

> Ajuste em relação à proposta da Etapa 0: as rotas ficam em `src/app/` (convenção do template atual do Expo), e não em `app/` na raiz.

## Regras de dependência

```
features/*  ──►  core, design-system, shared     ✅ permitido
features/a  ──►  features/b                      ❌ proibido (use eventos do core)
core, design-system, shared  ──►  features       ❌ proibido
```

Essas regras são **verificadas automaticamente** pelo ESLint (`import/no-restricted-paths`, configurado em `eslint.config.js`). As zonas de cada feature são geradas a partir das pastas em `src/features/`. Ao criar um novo módulo, a regra passa a valer para ele sem nenhuma configuração extra.

## Regras automáticas de lint

- **Fronteiras entre módulos** (acima).
- **Sem cores soltas:** `#hex`, `rgb()` e `hsl()` só são permitidos em `src/design-system/tokens/`.
- **React Compiler:** valores animados do Reanimated são lidos e alterados com `.get()` / `.set()`, não com `.value`.

## Imports

Use o alias `@/` para importar a partir de `src/`:

```ts
import HomeScreen from '@/app/index';
```

## Comandos

| Comando                | O que faz                                   |
| ---------------------- | ------------------------------------------- |
| `npm start`            | Inicia o servidor de desenvolvimento (Expo) |
| `npm run web`          | Abre o app no navegador                     |
| `npm test`             | Roda os testes                              |
| `npm run lint`         | Verifica o código com ESLint                |
| `npm run typecheck`    | Verifica os tipos com TypeScript            |
| `npm run format`       | Formata o código com Prettier               |
| `npm run format:check` | Verifica a formatação sem alterar arquivos  |

A CI roda `format:check`, `lint`, `typecheck` e `test` a cada push na `main` e em cada pull request.

## Convenções de status

Código provisório deve ser marcado com um comentário no topo do arquivo:

- `TEMPORARY` — será substituído em uma etapa conhecida;
- `MOCK` — dados ou comportamento simulados;
- `TODO` — trabalho pendente identificado.
