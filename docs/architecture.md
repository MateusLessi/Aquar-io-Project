# Arquitetura

Visão geral técnica do Aquar.io. Decisões e seus motivos ficam em [decisions.md](decisions.md).

## Plataforma

| Camada    | Tecnologia                                         | Status |
| --------- | -------------------------------------------------- | ------ |
| Linguagem | TypeScript (modo `strict` + checagens extras)      | REAL   |
| Framework | React Native + Expo SDK 57                         | REAL   |
| Navegação | Expo Router (rotas por arquivo em `src/app/`)      | REAL   |
| Testes    | Jest (`jest-expo`) + React Native Testing Library  | REAL   |
| Qualidade | ESLint (`eslint-config-expo`) + Prettier           | REAL   |
| CI        | GitHub Actions (`.github/workflows/ci.yml`)        | REAL   |
| Dados     | SQLite no aparelho (ADR-002), SQL direto (ADR-003) | REAL   |
| E2E       | Playwright na versão web (`npm run e2e`)           | REAL   |
| Design    | Aquatic Glass (`src/design-system`)                | REAL   |
| Animação  | Reanimated 4 (molas respeitam Reduzir movimento)   | REAL   |

## Estrutura de pastas

```
src/
├── app/              Rotas (Expo Router). Cada arquivo é uma tela; _layout.tsx define navegadores.
│                     Só código de rota mora aqui.
├── __tests__/        Testes de telas de rota (não podem ficar dentro de src/app/).
├── design-system/    tokens, tema, componentes e catálogo (ver design-system.md)
├── shell/            moldura do app: barra de abas (celular), barra lateral (tablet/desktop), destinos
├── core/             banco (contrato, migrations, useLiveQuery), eventos de domínio, ids, ajustes
├── features/         um diretório por módulo; hoje: todo/ (ver todo.md)
└── shared/           (quando necessário) utilitários genéricos
```

As pastas marcadas com etapa ainda **não existem**. Elas são criadas quando o primeiro código real precisar delas, para não termos placeholders vazios.

> Ajuste em relação à proposta da Etapa 0: as rotas ficam em `src/app/` (convenção do template atual do Expo), e não em `app/` na raiz.

## Navegação (Etapa 3)

```
src/app/
├── _layout.tsx          raiz: fontes, tema, Stack
├── (tabs)/_layout.tsx   AppShell (abas headless do Expo Router)
├── (tabs)/index.tsx     Hoje
├── (tabs)/lists.tsx     Listas
├── (tabs)/settings.tsx  Ajustes
└── dev/design-system.tsx  catálogo (somente desenvolvimento)
```

- **Celular (`compact`):** barra flutuante de águas profundas (72 pt): a aba ativa é uma pílula clara com o nome, as outras são círculos; ao lado, a gota coral "+".
- **Tablet e desktop (`medium`/`expanded`):** barra lateral de águas profundas com os destinos e o botão coral "Nova tarefa".
- Os destinos ficam em `src/shell/destinations.ts`. Só aparecem módulos que já existem.
- A navegação usa as abas "headless" de `expo-router/ui`: o roteamento é do Expo Router, e o visual é todo nosso.

## Matriz de layouts (planejada)

Requisito do proprietário: o Aquar.io deve se adaptar a todos estes formatos.

| Formato                                        | Largura típica              | Breakpoint                   | Navegação                                        | Conteúdo                                     |
| ---------------------------------------------- | --------------------------- | ---------------------------- | ------------------------------------------------ | -------------------------------------------- |
| Celular em pé (iPhone 11)                      | ~390 pt                     | `compact`                    | Barra de abas inferior                           | Uma coluna                                   |
| Celular deitado                                | —                           | interface travada em retrato | Ícones giram; **Modo Maré** (painel de ambiente) | Planejado                                    |
| Foldable fechado (tela externa do Galaxy Fold) | ~340–410 dp                 | `compact`                    | Barra de abas inferior                           | Uma coluna                                   |
| Foldable aberto (Galaxy Fold, iPhone dobrável) | ~670–900 dp, quase quadrado | `medium`                     | Trilho lateral compacto (planejado)              | Uma coluna larga ou lista + detalhe          |
| Tablet em pé (Tab S8+)                         | ~800 dp                     | `medium`                     | Trilho lateral compacto (planejado)              | Uma coluna larga                             |
| Tablet deitado                                 | ~1280 dp                    | `expanded`                   | Barra lateral completa                           | Lista + detalhe; painel em "bento" no futuro |
| Notebook (web)                                 | ≥ 1280 px                   | `expanded`                   | Barra lateral completa                           | Lista + detalhe; painel em "bento" no futuro |

Hoje existem `compact` (barra de abas) e `medium`/`expanded` (barra lateral). Ainda faltam: o trilho compacto para `medium`, a rotação no tablet (o `app.json` trava tudo em retrato) e o Modo Maré. Eles serão feitos numa etapa própria de **layouts adaptativos**, que já precisa ter telas reais do To Do para ser testada.

## Regras de dependência

```
app (rotas) ──►  shell, features, design-system  ✅ permitido
shell       ──►  design-system, core              ✅ permitido
features/*  ──►  core, design-system, shared     ✅ permitido
features/a  ──►  features/b                      ❌ proibido (use eventos do core)
core, design-system, shared  ──►  features       ❌ proibido
qualquer camada  ──►  shell (exceto rotas)        ❌ proibido
```

Essas regras são **verificadas automaticamente** pelo ESLint (`import/no-restricted-paths`, configurado em `eslint.config.js`). As zonas de cada feature são geradas a partir das pastas em `src/features/`. Ao criar um novo módulo, a regra passa a valer para ele sem nenhuma configuração extra.

## Fluxo de dados

```
Tela ──ação──► repositório (SQL) ──► SQLite
  ▲                │
  │                ├─► DataChanges.notify('tasks')  ──► useLiveQuery refaz a leitura ──► Tela
  │                └─► EventLog (TASK_COMPLETED…)   ──► domain_events (futuro Progress Engine)
```

A raiz de composição `src/shell/AppData.tsx` abre o banco ao iniciar, roda as migrations e conecta os módulos. Se o banco não abrir, o app mostra uma tela de erro com "Tentar de novo".

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
