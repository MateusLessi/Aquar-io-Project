# Lembretes e tarefas que se repetem

## Tarefas que se repetem (`src/features/todo/domain/repeat.ts`)

- Opções: todo dia, dias úteis, toda semana, todo mês. Guardado como texto em `tasks.repeat` (`daily`, `weekly`, `monthly`, `days:<máscara>`).
- Precisa de prazo. Tirar o prazo tira a repetição e o lembrete.
- **Ao concluir**, nasce a próxima cópia (mesmo título, notas, prioridade, lista, repetição e lembrete) na próxima data **depois de hoje e do prazo atual**: uma tarefa diária feita com atraso não volta já atrasada. A repetição passa para a cópia; desmarcar e marcar de novo não cria outra.
- O id da cópia é derivado do id original (`idFrom` em `src/core/ids.ts`): se dois aparelhos concluírem a mesma tarefa, criam **a mesma** cópia, e a sincronização junta as duas.
- Subtarefas não são copiadas (V1).

## Lembretes

| O quê  | Onde fica                       | Quando toca                                         |
| ------ | ------------------------------- | --------------------------------------------------- |
| Hábito | `habits.reminder_times` (até 5) | Nos dias do hábito; hoje, só se ainda não foi feito |
| Tarefa | `tasks.remind_at` (um horário)  | No dia do prazo, se a tarefa estiver aberta         |

- **Agendados em cada aparelho** com `expo-notifications` (notificações locais, funcionam no Expo Go). Não há servidor de push.
- `src/shell/reminders/plan.ts` calcula os próximos 7 dias (no máximo 60 notificações, pelo limite de 64 do iOS). `useReminderScheduler` refaz tudo depois de cada mudança (deste ou de outro aparelho, via sincronização) e quando o app volta a abrir.
- **Permissão** é pedida no contexto: quando a pessoa salva o primeiro lembrete, nunca ao abrir o app.
- **Por aparelho:** Ajustes → Lembretes liga ou desliga os lembretes **só neste aparelho** (configuração local, não sincroniza). Assim dá para receber no celular e silenciar no tablet.
- Tocar na notificação abre o hábito ou a lista da tarefa.
- Na web não há lembretes; as telas avisam.

## Limites conhecidos

- Se o app ficar mais de 7 dias sem abrir, os lembretes param até a próxima abertura.
- O horário escolhe quartos de hora (:00, :15, :30, :45), para o seletor ser simples.
