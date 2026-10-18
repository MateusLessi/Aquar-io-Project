// TEMPORARY content: lists arrive in Etapa 4.
import { ListTodo } from 'lucide-react-native';

import { EmptyState, Screen } from '@/design-system';

export default function ListsScreen() {
  return (
    <Screen title="Listas">
      <EmptyState
        icon={ListTodo}
        title="Nenhuma lista ainda"
        message="Academia, Faculdade, Casa: suas listas vão morar aqui, cada uma com a sua cor."
      />
    </Screen>
  );
}
