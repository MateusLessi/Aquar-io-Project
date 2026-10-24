# To Do

Primeiro módulo funcional do Aquar.io. **Status: V1 REAL** (Etapa 4).

## O que a V1 faz

| Recurso                                           | Onde                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Criar, editar (nome, emoji, cor) e excluir listas | Listas → "Nova lista"; dentro da lista → lápis                                                   |
| Criar tarefas                                     | Campo "Adicionar tarefa" na lista (Enter adiciona e mantém o foco), ou o botão coral "+"         |
| Concluir e desmarcar                              | Checkbox (mola, ondulação e vibração)                                                            |
| Editar tarefa                                     | Toque na tarefa: título, prazo, prioridade, subtarefas e notas, salvos ao editar                 |
| Subtarefas                                        | Um nível, dentro do detalhe da tarefa; a linha mostra "1/3"                                      |
| Prazo                                             | Atalhos Hoje · Amanhã · Próxima semana, ou calendário                                            |
| Prioridade                                        | Nenhuma · Baixa · Média · Alta ("Alta" aparece destacada)                                        |
| Excluir tarefa                                    | No detalhe, com confirmação; leva junto as subtarefas                                            |
| Hoje                                              | Tarefas com prazo hoje, mais as **atrasadas** ainda abertas; a maré do dia sobe a cada conclusão |

Ficam para a **V2**: Meu Dia manual, Importantes, Planejadas, tags, recorrência, lembretes, busca, filtros, ordenação e timer.

## Regras

- **Prazo é um dia do calendário** (`YYYY-MM-DD`), não um instante: "dia 20" continua sendo dia 20 em qualquer fuso.
- **Hoje** = prazo hoje (abertas ou concluídas) + prazo anterior a hoje ainda aberto. Atrasadas aparecem primeiro.
- **Maré do dia** = concluídas ÷ total de Hoje. Um dia sem tarefas é "mar calmo"; a água nunca fica vazia.
- Concluir gera `TASK_COMPLETED` e desmarcar gera `TASK_UNCOMPLETED`, gravados na mesma transação da mudança. Repetir o mesmo estado não gera evento duplicado.
- Excluir é **soft delete** (`deleted_at`), preparando a sincronização futura.
- Validação: nome da lista até 60 caracteres, título da tarefa até 300, notas até 5000; espaços extras são removidos.

## Código

```
src/features/todo/
├── domain/        tipos, datas, validação (funções puras)
├── data/          todoRepository.ts (todo o SQL do módulo), rows.ts
├── hooks/         useTodo() para ações; useLists/useList/useListTasks/useTask/useSubtasks/useToday (leituras ao vivo)
├── components/    ListCard, TaskRow, AddTaskField, ListEditorSheet, TaskDetailSheet, DueDatePicker, QuickAddSheet
└── screens/       TodayScreen, ListsScreen, ListScreen
```

As rotas em `src/app/(tabs)/` só apontam para as telas. A raiz de composição (`src/shell/AppData.tsx`) abre o banco, roda as migrations e entrega o repositório às telas.

## Testes

| Nível            | Onde                                                             | O que cobre                                                                                          |
| ---------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Unitário         | `features/todo/__tests__/dates.test.ts`, `AddTaskField.test.tsx` | Datas, rótulos, campo de adição                                                                      |
| Integração       | `features/todo/__tests__/todoRepository.test.ts`                 | Migrations e todo o SQL, em SQLite real (Node)                                                       |
| Integração de UI | `src/__tests__/app-shell.test.tsx`                               | Criar a primeira lista e uma tarefa para hoje, concluir e ver a maré, pela interface                 |
| E2E (navegador)  | `e2e/todo.spec.ts` (`npm run e2e`)                               | O mesmo fluxo na versão web, **recarregando a página** para provar a persistência; celular e desktop |

## Limitações conhecidas

- **Sem sincronização** entre aparelhos ainda (ADR-002): iPhone, tablet e notebook têm dados separados.
- Reordenar tarefas arrastando não existe na V1 (a ordem é a de criação).
- Falhas inesperadas ao concluir uma tarefa são registradas no console; um aviso visual (toast) virá depois.

## Pastas (First Dive, etapa 2)

Proposta aprovada no checkpoint 038: `docs/design/proposals/folders.png`.

- **Pastas** (`task_folders`) guardam listas e outras pastas, até **4 níveis** (`MAX_FOLDER_DEPTH`). Cada lista guarda `folder_id`; sem pasta, ela fica no topo ("Listas soltas").
- **Árvore** (`data/folders.ts`, `loadTree`): conta listas, subpastas e tarefas abertas/concluídas de tudo o que está dentro (anel de progresso). Uma pasta cuja mãe sumiu (apagada ou ainda não sincronizada), ou um laço criado por dois aparelhos movendo pastas ao mesmo tempo, aparece **no topo**: nada some.
- **Mover** (`moveFolder`, `moveList`): uma pasta nunca vai para dentro dela mesma, nem tão fundo que suas subpastas passem do limite. A folha "Mover para…" escurece esses lugares.
- **Apagar pasta**: `keep` sobe o conteúdo para a pasta de cima; `all` apaga pastas, listas e tarefas de dentro (sempre soft delete, com confirmação).
- **Visualizações** (`ListsBrowser.tsx`, lembradas por aparelho): **Grade** (pastas como cartas empilhadas), **Lista** (linhas compactas) e **Tudo junto** (`folderTasks`: tarefas de todas as listas de dentro, por prazo, concluídas escondidas no fim).
- **Trilha** `Listas › UnB › Semestre 3` (`FolderScreen.tsx`, `Crumbs`); a tela de uma lista mostra o caminho dela.
- **Criar**: o card "Nova lista ou pasta" e o botão Criar do app sabem em que pasta você está.
- **Painel Início**: tarefas de hoje mostram de onde vêm (`listPath`) e pastas **fixadas** (`pinned`) aparecem com anel e próximas tarefas (`PinnedFolders.tsx`).
- **Pendente**: arrastar e soltar no tablet/PC (hoje: segurar → "Mover para…", que funciona em qualquer aparelho e com leitor de tela).
