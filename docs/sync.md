# Sincronização

Como os dados do Aquar.io viajam entre o celular, o tablet e o computador. A decisão está no [ADR-004](decisions.md#adr-004).

## Visão geral

```
 Tela ──▶ Repositório ──▶ SQLite do aparelho ──(gatilho)──▶ sync_outbox
                                   ▲                              │
                                   │ baixa o que mudou            │ envia a fila
                                   │ (server_updated_at > cursor) ▼
                              Supabase (Postgres + RLS + sync_guard)
```

1. A tela grava no SQLite local, como sempre: funciona sem internet.
2. Um **gatilho** do SQLite anota a linha alterada na fila `sync_outbox`.
3. O motor (`src/core/sync/syncEngine.ts`) **envia** a fila para o Supabase e depois **baixa** o que outros aparelhos mudaram.
4. Em conflito, vence a edição com o `updated_at` mais recente.

> **Gatilho (trigger):** uma regra dentro do banco que roda sozinha quando algo acontece, por exemplo "depois de atualizar uma tarefa, anote o id dela na fila".
>
> **RLS (Row Level Security):** regras no Postgres que filtram as linhas por pessoa. Mesmo com a chave pública do app, ninguém lê os dados de outra pessoa.

## Arquivos

| Arquivo                                         | Papel                                                          |
| ----------------------------------------------- | -------------------------------------------------------------- |
| `src/core/database/migrations.ts` (migration 2) | Fila, estado e gatilhos no SQLite                              |
| `src/core/sync/tables.ts`                       | Quais tabelas sincronizam e suas colunas                       |
| `src/core/sync/syncEngine.ts`                   | Enviar, baixar, resolver conflitos                             |
| `src/core/sync/supabase.ts`, `account.ts`       | Cliente Supabase, login por e-mail e senha, adaptador da nuvem |
| `src/core/sync/testing.ts`                      | Nuvem e conta falsas, em memória, para os testes               |
| `src/shell/Account.tsx`, `AccountSection.tsx`   | Quando sincronizar; tela de entrar em Ajustes                  |
| `supabase/migrations/*.sql`                     | Tabelas, RLS e o gatilho `sync_guard` no Postgres              |
| `.env`                                          | URL e chave pública do projeto Supabase                        |

## Configurar o projeto Supabase (uma vez)

1. **Criar as tabelas:** no painel do Supabase, abra **SQL Editor → New query**, cole o **conteúdo** de cada arquivo de `supabase/migrations/`, em ordem, e clique em **Run** (deve aparecer "Success. No rows returned"):
   - `20261020000000_todo_sync.sql`: listas e tarefas;
   - `20261021000000_habits_sync.sql`: hábitos e check-ins.
   - `20261022000000_reminders.sql`: repetição e lembretes.
   - `20261023000000_routines_sync.sql`: rotinas, itens e checks.
   - `20261024000000_profile_sync.sql`: perfil (nome e avatar).
   - `20261025000000_habit_kinds.sql`: tipos de hábito e progresso parcial (First Dive).
   - `20261026000000_folders.sql`: pastas de listas (First Dive).

   Se uma tabela ainda não existir na nuvem, as outras continuam sincronizando; as mudanças dela ficam na fila e Ajustes mostra "Sem conexão" até o SQL ser rodado.

2. **Login sem confirmação por e-mail:** em **Authentication → Sign In / Providers → Email**, desligue **Confirm email** e salve. Sem um SMTP próprio, o Supabase não deixa editar os e-mails, então o app usa e-mail + senha (ADR-004).
3. **Antes de abrir o app para outras pessoas:** configure um SMTP (Authentication → SMTP) e ligue a confirmação de novo.

## Testes

- `src/__tests__/sync.test.ts`: dois "aparelhos" (dois SQLite em memória) sincronizando por uma nuvem falsa com as mesmas regras do servidor: envio, recebimento, conflito, exclusão, offline.
- `src/__tests__/app-shell.test.tsx`: criar conta, sair e entrar de novo em Ajustes.
- O servidor real ainda precisa ser verificado nos aparelhos depois do passo 1 acima.
