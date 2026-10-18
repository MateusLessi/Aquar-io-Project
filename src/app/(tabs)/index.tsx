// TEMPORARY content: the Today screen gets real tasks in Etapa 4.
import { Waves } from 'lucide-react-native';

import { EmptyState, Screen, TideHero } from '@/design-system';

function todayLabel(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function TodayScreen() {
  return (
    <Screen title="Hoje" eyebrow={todayLabel(new Date())}>
      <TideHero
        label="Maré do dia"
        completed={0}
        total={0}
        caption="tarefas concluídas"
        emptyMessage="Mar calmo. Nada planejado para hoje."
      />
      <EmptyState
        icon={Waves}
        title="Suas tarefas vão aparecer aqui"
        message="Cada tarefa concluída faz a maré do dia subir."
      />
    </Screen>
  );
}
