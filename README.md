# Aquar.io

> Uma plataforma de organização da vida — tarefas, rotinas, hábitos, treinos e objetivos — em um único ecossistema onde **tudo importa**.

## Status

🚧 **Etapa 1 — Fundação técnica concluída.** O app compila e é verificado automaticamente, mas ainda não tem funcionalidades de produto.

| Item                                          | Estado                                            |
| --------------------------------------------- | ------------------------------------------------- |
| Visão do produto                              | ✓ definida                                        |
| Plataforma (TypeScript + React Native + Expo) | ✓ aprovada — [ADR-001](docs/decisions.md#adr-001) |
| Fundação técnica (Etapa 1)                    | ✓ concluída                                       |

## Filosofia

- **Útil** — ajuda de verdade a organizar a vida.
- **Prazeroso** — o usuário gosta de usar.
- **Vivo** — transmite evolução, continuidade e progresso.

Cada ação relevante (concluir uma tarefa, uma rotina, um hábito, um treino) gera um evento de domínio que, no futuro, alimentará um sistema global de progressão.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org/) 22 ou superior.

```bash
npm install
npm start        # servidor de desenvolvimento; escaneie o QR code com o app Expo Go
npm run web      # versão no navegador
npm test         # testes
```

## Documentação

- [Arquitetura](docs/architecture.md)
- [Banco de dados](docs/database.md)
- [Gamificação](docs/gamification.md)
- [Decisões de arquitetura (ADRs)](docs/decisions.md)
- [Roadmap](docs/roadmap.md)

## Processo de desenvolvimento

O Aquar.io é desenvolvido por etapas. Toda mudança importante passa por:
análise → proposta → checkpoint de aprovação → implementação → testes → documentação → commit.

Commits seguem [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
