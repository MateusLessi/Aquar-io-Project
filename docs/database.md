# Banco de dados

Estratégia: **local-first** ([ADR-002](decisions.md#adr-002)). SQLite no aparelho, sincronização com a nuvem no futuro.

**Status:** **REAL** desde a Etapa 4 (To Do V1). O esquema é criado pela migration 1 em `src/core/database/migrations.ts`. Acesso a dados: [ADR-003](decisions.md#adr-003).

## Convenções

| Convenção      | Regra                                                 | Por quê                                                      |
| -------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| Chave primária | `id TEXT` com UUID v4 gerado no aparelho              | Criar dados offline sem colisão com o servidor               |
| Auditoria      | `created_at`, `updated_at` em UTC ISO 8601            | Ordenação, sincronização e conflitos                         |
| Exclusão       | `deleted_at` (soft delete); `NULL` = ativo            | Outros aparelhos precisam saber o que foi apagado            |
| Datas sem hora | `TEXT` no formato `YYYY-MM-DD`                        | Um prazo "dia 20" não muda com o fuso horário                |
| Nomes          | `snake_case` no banco, `camelCase` no TypeScript      | Convenção de cada mundo; a conversão fica na camada de dados |
| Evolução       | Migrations numeradas e imutáveis depois de publicadas | Cada aparelho evolui o banco de forma segura e previsível    |

> **Migration:** um script que altera a estrutura do banco (cria tabela, adiciona coluna). Cada uma é numerada e roda uma única vez em cada aparelho, na ordem. Assim, o app instalado há meses e o app recém-instalado chegam à mesma estrutura.

## Modelo atual (migration 1)

```
task_lists
  id            TEXT PK
  name          TEXT NOT NULL
  emoji         TEXT NULL
  color         TEXT NULL          -- token do Design System, não hex livre
  sort_order    REAL NOT NULL      -- REAL permite inserir entre dois itens sem renumerar
  created_at    TEXT NOT NULL
  updated_at    TEXT NOT NULL
  deleted_at    TEXT NULL

tasks
  id              TEXT PK
  list_id         TEXT NOT NULL  → task_lists.id
  parent_task_id  TEXT NULL      → tasks.id   (subtarefa; apenas 1 nível na V1)
  title           TEXT NOT NULL
  notes           TEXT NULL
  priority        INTEGER NOT NULL DEFAULT 0   -- 0 nenhuma · 1 baixa · 2 média · 3 alta
  due_date        TEXT NULL      -- YYYY-MM-DD
  completed_at    TEXT NULL      -- NULL = aberta; guarda QUANDO foi concluída
  sort_order      REAL NOT NULL
  source_type     TEXT NULL      -- futuro: 'routine_occurrence', 'workout'...
  source_id       TEXT NULL
  created_at      TEXT NOT NULL
  updated_at      TEXT NOT NULL
  deleted_at      TEXT NULL

domain_events
  id            TEXT PK
  type          TEXT NOT NULL    -- ex.: TASK_COMPLETED
  entity_type   TEXT NOT NULL    -- ex.: task
  entity_id     TEXT NOT NULL
  payload       TEXT NOT NULL    -- JSON
  occurred_at   TEXT NOT NULL
```

```
app_settings
  key    TEXT PK     -- ex.: 'theme'
  value  TEXT
```

### Notas de design

- **Sem `owner_id` no aparelho.** O banco local é de quem usa o aparelho; o `user_id` existe só na nuvem e é preenchido pelo servidor (ver [sync.md](sync.md)).
- **`domain_events` é um log, não a fonte da verdade.** O estado atual vive em `tasks`; os eventos existem para o futuro Progress Engine ter histórico real. Isso não é Event Sourcing.
- **Desmarcar uma tarefa** (`completed_at` volta a `NULL`) gera um evento próprio (`TASK_UNCOMPLETED`), para a gamificação futura não contar a mesma conclusão duas vezes.
- **Subtarefas** reutilizam a tabela `tasks` com `parent_task_id`. A V1 limita a um nível de profundidade.

## Sincronização (migration 2)

```
sync_outbox     table_name, row_id, seq   -- mudanças locais esperando para subir
sync_applying   row_id                    -- linhas sendo gravadas pelo próprio sync
sync_state      key, value                -- cursores de download e lastSyncedAt
```

Gatilhos `AFTER INSERT/UPDATE` em `task_lists` e `tasks` enfileiram cada mudança em `sync_outbox`, exceto as que vieram da nuvem (marcadas em `sync_applying`). O `seq` serve para não apagar da fila uma linha que mudou de novo durante o envio. Detalhes em [sync.md](sync.md) e no ADR-004.

## Hábitos (migration 3)

```
habits        id, name, creature, days (bitmask: bit 0 = domingo … bit 6 = sábado),
              sort_order, created_at, updated_at, deleted_at
habit_checks  id ("<habit_id>:<YYYY-MM-DD>"), habit_id, date, created_at, updated_at, deleted_at
```

- Um check-in por hábito e por dia. O id é **determinístico**: marcar o mesmo dia no celular e no tablet grava a mesma linha, sem duplicar.
- Desmarcar é um soft delete (`deleted_at`); marcar de novo "revive" a linha. Assim a sincronização trata tudo como edição, com "última escrita vence".
- Sequência, melhor sequência e consistência são **calculadas** a partir dos check-ins (`src/features/habits/domain/progress.ts`), não guardadas.

### Índices

- `tasks(list_id, deleted_at)`: listar tarefas de uma lista;
- `tasks(parent_task_id)`: carregar subtarefas;
- `tasks(due_date)`: futuras visões "Planejado" e "Meu Dia";
- `domain_events(type, occurred_at)`: consultas do futuro Progress Engine;
- `habit_checks(habit_id, date)`: check-ins de um hábito.

> **Índice:** uma estrutura auxiliar que o banco mantém para encontrar linhas rapidamente, como o índice remissivo de um livro. Acelera leituras e deixa as escritas um pouco mais lentas, por isso só criamos os que serão usados.
