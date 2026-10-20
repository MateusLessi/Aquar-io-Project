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

| Arquivo                                         | Papel                                                  |
| ----------------------------------------------- | ------------------------------------------------------ |
| `src/core/database/migrations.ts` (migration 2) | Fila, estado e gatilhos no SQLite                      |
| `src/core/sync/tables.ts`                       | Quais tabelas sincronizam e suas colunas               |
| `src/core/sync/syncEngine.ts`                   | Enviar, baixar, resolver conflitos                     |
| `src/core/sync/supabase.ts`, `account.ts`       | Cliente Supabase, login por código, adaptador da nuvem |
| `src/core/sync/testing.ts`                      | Nuvem e conta falsas, em memória, para os testes       |
| `src/shell/Account.tsx`, `AccountSection.tsx`   | Quando sincronizar; tela de entrar em Ajustes          |
| `supabase/migrations/*.sql`                     | Tabelas, RLS e o gatilho `sync_guard` no Postgres      |
| `.env`                                          | URL e chave pública do projeto Supabase                |

## Configurar o projeto Supabase (uma vez)

1. **Criar as tabelas:** no painel do Supabase, abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/migrations/20261020000000_todo_sync.sql` e clique em **Run**. Deve aparecer "Success. No rows returned".
2. **Mandar o código no e-mail:** em **Authentication → Emails** (ou **Email Templates**), edite os modelos **Magic Link** e **Confirm signup**. Troque o corpo por algo como:

   ```html
   <h2>Seu código do Aquar.io</h2>
   <p>Digite este código no app: <strong>{{ .Token }}</strong></p>
   ```

   Sem o `{{ .Token }}`, o e-mail traz só um link, e o app precisa do código.

3. **Limite de e-mails:** o servidor de e-mail gratuito do Supabase envia poucos e-mails por hora. Para uso pessoal basta; para abrir a outras pessoas, configure um SMTP próprio (Authentication → SMTP).

## Testes

- `src/__tests__/sync.test.ts`: dois "aparelhos" (dois SQLite em memória) sincronizando por uma nuvem falsa com as mesmas regras do servidor: envio, recebimento, conflito, exclusão, offline.
- `src/__tests__/app-shell.test.tsx`: o fluxo de entrar por código em Ajustes.
- O servidor real ainda precisa ser verificado nos aparelhos depois do passo 1 acima.
