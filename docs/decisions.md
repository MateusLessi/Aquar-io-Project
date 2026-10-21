# Architecture Decision Records (ADRs)

Registro das decisões importantes do Aquar.io: o que foi decidido, por quê e quais consequências esperamos.
ADRs não são apagados. Se uma decisão mudar, criamos um novo ADR que **substitui** o anterior e marcamos o antigo como `Substituído`.

| ADR             | Título                                                      | Status | Data       |
| --------------- | ----------------------------------------------------------- | ------ | ---------- |
| [001](#adr-001) | Plataforma de desenvolvimento: linguagem e framework mobile | Aceito | 2026-10-18 |
| [002](#adr-002) | Estratégia de dados: local-first                            | Aceito | 2026-10-18 |
| [003](#adr-003) | Acesso a dados: SQL direto com repositórios                 | Aceito | 2026-10-18 |
| [004](#adr-004) | Sincronização: Supabase, fila local e última escrita vence  | Aceito | 2026-10-20 |

---

## ADR-001

**Título:** Plataforma de desenvolvimento — TypeScript + React Native + Expo (Expo Router)

**Status:** Aceito — Checkpoint de Aprovação 001

**Data:** 2026-10-18

### Contexto

O Aquar.io é um aplicativo mobile-first que precisa:

- rodar em iOS e Android com uma equipe pequena;
- ter caminho realista para Web e tablet no futuro;
- entregar uma linguagem visual sofisticada (Aquatic Glass): blur, translucidez, profundidade e animações fluidas a 60/120 fps;
- acessar recursos do aparelho: haptics, notificações, armazenamento local (SQLite);
- ser um projeto de aprendizado de Engenharia de Software para o proprietário do produto.

Esta é a primeira decisão porque todas as demais (banco, testes, componentes, navegação) dependem dela.

### Alternativas

| Alternativa                          | Prós                                                                                                                                                           | Contras                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **React Native + Expo (TypeScript)** | Um código para iOS/Android; usa componentes e materiais nativos do sistema; caminho para Web; ecossistema enorme; TypeScript é transferível para web e backend | Blur no Android exige disciplina de performance; atualizações anuais de SDK                                                     |
| Flutter (Dart)                       | Animação excelente e consistente; um código                                                                                                                    | Redesenha a UI em vez de usar materiais nativos (o vidro seria imitação); Web mais fraca; Dart tem uso restrito fora do Flutter |
| Nativo (Swift + Kotlin)              | Máxima fidelidade visual e acesso total à plataforma                                                                                                           | Dois aplicativos, custo dobrado, inviável no momento                                                                            |
| PWA / Web                            | Barato, um código                                                                                                                                              | Fraco em haptics, notificações, widgets e efeitos; não sustenta um mobile-first premium                                         |

### Decisão

Adotar **TypeScript** como linguagem e **React Native com Expo** como framework, usando **Expo Router** para navegação baseada em arquivos.

### Motivo

É a opção que melhor equilibra qualidade visual (acesso a materiais nativos + Reanimated + Skia), alcance multiplataforma, velocidade de entrega, custo de manutenção e valor de aprendizado.

### Consequências

**Positivas**

- Bibliotecas das próximas etapas virão do ecossistema React Native/Expo (SQLite, cliente Supabase, testes, animações).
- O mesmo conhecimento de TypeScript servirá para funções de backend e para uma futura versão Web.

**Negativas / a monitorar**

- Efeitos de blur no Android precisarão de um orçamento de performance e fallback sólido (a ser definido na Etapa 2).
- O projeto exigirá atualização periódica de versões do Expo/React Native.
- Algum efeito visual muito específico poderá exigir um módulo nativo customizado.

**Atualização (2026-10-18): versão do SDK acompanha o Expo Go da App Store**

O projeto começou no Expo SDK 58, mas o Expo Go disponível na App Store (57.0.9) só abre projetos SDK 57, o que impedia o teste no iPhone do proprietário. Voltamos para o **SDK 57**.

Regra a partir de agora: enquanto o teste em aparelhos depender do Expo Go, usamos **o SDK suportado pelo Expo Go publicado nas lojas**, não o mais recente do npm. A atualização de SDK passa a ser uma tarefa deliberada, feita quando as lojas acompanharem.

---

## ADR-002

**Título:** Estratégia de dados: local-first (SQLite no aparelho, sincronização com Supabase no futuro)

**Status:** Aceito (Checkpoint de Aprovação 003)

**Data:** 2026-10-18

### Contexto

O To Do (Etapa 4) será o primeiro módulo com dados persistidos. Precisamos decidir onde esses dados vivem.

Requisitos:

- o app deve ser rápido e funcionar sem internet;
- o proprietário quer usar o app de forma privada no dia a dia antes de qualquer lançamento;
- módulos futuros (Social, Família, multi-dispositivo) vão exigir dados na nuvem;
- custo e complexidade iniciais devem ser baixos.

### Alternativas

| Alternativa                                               | Prós                                                                         | Contras                                                                             |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Local-first** (SQLite agora, Supabase como sync depois) | Offline total, instantâneo, sem conta nem servidor no início, dados privados | A sincronização futura exige regras de conflito                                     |
| Cloud-first (Supabase desde o início)                     | Multi-dispositivo imediato, backup automático                                | Exige login e rede desde o primeiro uso, mais estados de erro e cache offline extra |
| Só local, para sempre                                     | Mais simples possível                                                        | Inviabiliza Social, Família e multi-dispositivo                                     |

### Decisão

Os dados vivem em **SQLite no aparelho** (`expo-sqlite`), com a estrutura do banco evoluída por **migrations versionadas**. A nuvem (Supabase/PostgreSQL) será introduzida mais tarde como **sincronização e backup**, em checkpoint próprio, junto com a autenticação.

### Motivo

Entrega a melhor experiência agora (instantâneo, offline, sem cadastro) e o menor custo, sem fechar o caminho para a nuvem.

### Consequências

**Desde já, o esquema é preparado para sincronizar:**

- IDs são **UUIDs gerados no aparelho**, sem conflito com o servidor;
- toda tabela sincronizável tem `created_at`, `updated_at` e `deleted_at` (**soft delete**: o registro é marcado como apagado, para que outros aparelhos saibam da exclusão);
- datas e horas são armazenadas em **UTC (ISO 8601)**; datas sem hora (ex.: prazo de uma tarefa) são armazenadas como `YYYY-MM-DD`.

**A monitorar:**

- até existir sync, perder o aparelho significa perder os dados. Uma exportação manual simples pode ser oferecida na fase de testes;
- regra inicial de conflito planejada para o sync: _a edição mais recente vence_ (`updated_at`);
- a autenticação fica adiada até a etapa de sincronização.

---

## ADR-003

**Título:** Acesso a dados: SQL direto (expo-sqlite) com repositórios, sem ORM

**Status:** Aceito (Checkpoint de Aprovação 009)

**Data:** 2026-10-18

### Contexto

O To Do V1 é o primeiro módulo a gravar dados (ADR-002: SQLite local). Era preciso decidir como o código conversa com o banco.

### Alternativas

| Alternativa                   | Prós                                                                      | Contras                                           |
| ----------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| **SQL direto + repositórios** | Sem dependências extras; SQL visível e didático; testável com SQLite real | Mais código escrito à mão                         |
| ORM (Drizzle)                 | Consultas tipadas, menos código                                           | Mais uma ferramenta e configuração; esconde o SQL |
| Estado em memória + JSON      | Simples                                                                   | Não escala para sync, relatórios e gamificação    |

### Decisão

`expo-sqlite` atrás de um contrato mínimo `Database` (`src/core/database/types.ts`). Cada módulo tem um repositório com o seu SQL (ex.: `src/features/todo/data/todoRepository.ts`). Migrations numeradas usam o `PRAGMA user_version` do SQLite.

### Consequências

- Os testes de integração rodam **o mesmo SQL** no SQLite embutido do Node (`createMemoryDatabase`).
- As telas leem por `useLiveQuery`, que refaz a consulta quando um repositório avisa que os dados mudaram (`DataChanges`).
- Na web, o SQLite roda em WebAssembly e exige isolamento de origem (cabeçalhos COOP/COEP), configurado em `metro.config.js` e no servidor de E2E.
- Se o SQL manual pesar no futuro, trocar por um ORM fica restrito aos repositórios.

---

## ADR-004

**Título:** Sincronização entre aparelhos: Supabase, fila local por gatilhos e "última escrita vence"

**Status:** Aceito (Checkpoint de Aprovação 012)

**Data:** 2026-10-20

### Contexto

O proprietário usa o Aquar.io em 3 aparelhos (iPhone 11, Galaxy Tab S8+ e notebook via web). Cada um tinha os próprios dados (ADR-002: local-first). Era preciso uma conta e uma cópia na nuvem, sem perder o funcionamento offline.

### Alternativas

| Alternativa                                  | Prós                                                                 | Contras                                                         |
| -------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Supabase + motor de sync próprio**         | Postgres com regras de acesso (RLS); login por e-mail pronto; grátis | Escrevemos o motor de sync (pequeno e testado)                  |
| Firebase / Firestore                         | Sync offline pronto                                                  | Banco de documentos, não SQL; outro modelo de dados no servidor |
| Bibliotecas de sync (PowerSync, ElectricSQL) | Sync completo e robusto                                              | Mais serviços e custo; cedo demais para o tamanho do projeto    |

### Decisão

- **Nuvem:** Supabase (Postgres + Auth). O esquema está em `supabase/migrations/`; cada linha tem `user_id`, e o **RLS** só deixa cada pessoa ler e gravar as próprias linhas.
- **Login:** e-mail e senha, com a confirmação por e-mail desligada no painel. O plano gratuito do Supabase não deixa editar os modelos de e-mail sem um SMTP próprio, então o código por e-mail (OTP), que era o plano inicial, fica para quando o app for aberto a outras pessoas (com SMTP e confirmação ligada).
- **Fila local:** gatilhos (triggers) do SQLite registram toda mudança em `sync_outbox`. Os repositórios não sabem que a sincronização existe.
- **Ciclo:** primeiro envia a fila, depois baixa o que mudou na nuvem desde o último cursor (`server_updated_at`).
- **Conflitos:** por linha, vence o `updated_at` mais recente, nos dois lados (gatilho `sync_guard` no Postgres e comparação no aparelho).
- **Exclusões:** continuam "suaves" (`deleted_at`) e viajam como qualquer edição.
- **Quando sincroniza:** ao entrar, 1,5 s depois de uma edição, ao voltar para o app e a cada minuto com o app aberto.

### Consequências

- O app continua 100% funcional offline; as mudanças ficam na fila até a conexão voltar.
- "Última escrita vence" compara os relógios dos aparelhos. Se um relógio estiver muito errado, uma edição antiga pode vencer. Para uma pessoa com aparelhos sincronizados pela rede, isso é aceitável.
- A edição é por linha inteira: se dois aparelhos mudarem campos diferentes da mesma tarefa ao mesmo tempo, fica só a versão mais recente.
- `domain_events` e `app_settings` **não** sincronizam por enquanto: eventos são histórico local, e o tema é por aparelho. A gamificação vai rever os eventos.
- Listas criadas em aparelhos diferentes antes do primeiro login não se juntam: as duas aparecem.
- Com a confirmação desligada, qualquer e-mail cria conta sem prova de que é da pessoa. Serve para a fase de testes pessoais; **antes de abrir o app**, ligar SMTP + confirmação.
- **TODO:** trocar de conta no mesmo aparelho ainda não separa os dados locais de cada pessoa.
- A chave "publishable" do Supabase fica no app (`.env`) por design; a segurança vem do RLS. A chave secreta **nunca** entra no repositório.
