// TEMPORARY: the create button already lives in its final place; creating tasks arrives in Etapa 4.
import { StyleSheet, View } from 'react-native';

import { Button, Sheet, Text, spacing } from '@/design-system';

type NewTaskSheetProps = { visible: boolean; onClose: () => void };

export function NewTaskSheet({ visible, onClose }: NewTaskSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Nova tarefa">
      <View style={styles.body}>
        <Text variant="callout" tone="secondary">
          Criar tarefas chega na próxima etapa (To Do V1). Este botão já está no lugar onde vai
          ficar.
        </Text>
        <Button label="Entendi" block onPress={onClose} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.xl },
});
