# Aquar.io

> Uma plataforma de organização da vida — tarefas, rotinas, hábitos, treinos e objetivos — em um único ecossistema onde **tudo importa**.

## Status

🌊 **Versão 1.0.0 (V1).** Tarefas, hábitos-criaturas, rotinas, gamificação, lembretes e sincronização entre aparelhos. Veja [o que tem na V1](docs/v1.md).

| Parte                                                         | Estado                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------ |
| Tarefas (listas, subtarefas, prazos, repetição, lembretes)    | ✓ [todo.md](docs/todo.md), [reminders.md](docs/reminders.md) |
| Hábitos como criaturas marinhas                               | ✓ [habits.md](docs/habits.md)                                |
| Rotinas (blocos do dia com checklist)                         | ✓ [routines.md](docs/routines.md)                            |
| Gamificação (maré, pontos, profundidade, estágios)            | ✓ [gamification-rules.md](docs/gamification-rules.md)        |
| Sincronização entre aparelhos (Supabase)                      | ✓ [sync.md](docs/sync.md)                                    |
| Layouts para celular, tablet, notebook e foldables; Modo Maré | ✓ [architecture.md](docs/architecture.md)                    |
| Loja, assinaturas, social, família, treinos                   | Expansões — [roadmap.md](docs/roadmap.md)                    |

## Filosofia

- **Útil** — ajuda de verdade a organizar a vida.
- **Prazeroso** — o usuário gosta de usar.
- **Vivo** — transmite evolução, continuidade e progresso.

Cada ação relevante (concluir uma tarefa, uma rotina, um hábito, um treino) gera um evento de domínio que, no futuro, alimentará um sistema global de progressão.

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org/) 22 ou superior.

```bash
npm ci
npm start        # servidor de desenvolvimento; escaneie o QR code com o app Expo Go
npm run web      # versão no navegador
npm test         # testes unitários e de integração
npm run e2e      # testes ponta a ponta no navegador
```

Em modo de desenvolvimento, o catálogo e as prévias ficam em **Perfil → Desenvolvimento**.

Depois de trocar de branch ou fazer `git pull`, use `npm ci` (instala exatamente o que está no `package-lock.json`).

Instalar no celular, publicar a versão web e enviar atualizações: [releases.md](docs/releases.md).

## Documentação

- [Arquitetura](docs/architecture.md)
- [Design System](docs/design-system.md)
- [Banco de dados](docs/database.md)
- [O que tem na V1](docs/v1.md)
- [Versões e atualizações](docs/releases.md)
- [Sincronização](docs/sync.md)
- [To Do](docs/todo.md)
- [Hábitos](docs/habits.md)
- [Rotinas](docs/routines.md)
- [Lembretes](docs/reminders.md)
- [Regras da gamificação](docs/gamification-rules.md)
- [Gamificação](docs/gamification.md)
- [Decisões de arquitetura (ADRs)](docs/decisions.md)
- [Roadmap](docs/roadmap.md)

## Processo de desenvolvimento

O Aquar.io é desenvolvido por etapas. Toda mudança importante passa por:
análise → proposta → checkpoint de aprovação → implementação → testes → documentação → commit.

Commits seguem [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
