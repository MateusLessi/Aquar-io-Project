// TEMPORARY content: the Today screen gets real tasks in Etapa 4.
import { Waves } from 'lucide-react-native';

import { EmptyState, Screen } from '@/design-system';

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
      <EmptyState
        icon={Waves}
        title="Um dia calmo por aqui"
        message="Suas tarefas de hoje vão aparecer aqui. Cada uma concluída vai encher a maré do dia."
      />
    </Screen>
  );
}
