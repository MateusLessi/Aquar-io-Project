import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  Button,
  Chip,
  EmptyState,
  Sheet,
  Text,
  TextInput,
  listColors,
  spacing,
  useTheme,
} from '@/design-system';

import { toDateKey } from '../domain/dates';
import { ValidationError } from '../domain/validation';
import { useLists } from '../hooks/queries';
import { useTodo } from '../hooks/todoContext';
import { ListEditorSheet } from './ListEditorSheet';

type QuickAddSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Preselected list (e.g. the list on screen). */
  defaultListId?: string;
  /** Start with "Hoje" selected (e.g. when adding from Today). */
  dueToday?: boolean;
};

/** The coral "+": a title and a list, and it's saved. Details are optional. */
export function QuickAddSheet({ visible, onClose, defaultListId, dueToday }: QuickAddSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Nova tarefa">
      {visible ? (
        <QuickAddForm onClose={onClose} defaultListId={defaultListId} dueToday={dueToday} />
      ) : null}
    </Sheet>
  );
}

function QuickAddForm({
  onClose,
  defaultListId,
  dueToday = false,
}: Omit<QuickAddSheetProps, 'visible'>) {
  const todo = useTodo();
  const { scheme } = useTheme();
  const { data: lists = [], loading } = useLists();
  const [title, setTitle] = useState('');
  const [chosenListId, setListId] = useState<string | undefined>(defaultListId);
  const [today, setToday] = useState(dueToday);
  const [error, setError] = useState<string | null>(null);
  const [creatingList, setCreatingList] = useState(false);

  const listId = lists.some((l) => l.id === chosenListId) ? chosenListId : lists[0]?.id;

  const save = async () => {
    if (!listId) return;
    try {
      await todo.createTask({ listId, title, dueDate: today ? toDateKey(new Date()) : null });
      onClose();
    } catch (e) {
      setError(
        e instanceof ValidationError ? e.message : 'Não foi possível salvar. Tente de novo.',
      );
    }
  };

  if (loading) return null;

  if (lists.length === 0) {
    return (
      <View>
        <EmptyState
          icon={CalendarDays}
          title="Crie sua primeira lista"
          message="Tarefas moram em listas, como Academia, Faculdade ou Casa."
          action={{ label: 'Criar lista', onPress: () => setCreatingList(true) }}
        />
        <ListEditorSheet
          visible={creatingList}
          onClose={() => setCreatingList(false)}
          onCreated={setListId}
        />
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <TextInput
        label="Tarefa"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          setError(null);
        }}
        placeholder="O que você quer fazer?"
        error={error ?? undefined}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={save}
      />

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary" style={styles.groupLabel}>
          Lista
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {lists.map((list) => (
            <Chip
              key={list.id}
              label={list.name}
              leadingText={list.emoji ?? undefined}
              dotColor={!list.emoji && list.color ? listColors[list.color][scheme] : undefined}
              selected={list.id === listId}
              onPress={() => setListId(list.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.chipsRow}>
        <Chip
          label="Para hoje"
          icon={CalendarDays}
          selected={today}
          onPress={() => setToday((t) => !t)}
        />
      </View>

      <Button label="Adicionar" variant="energy" block onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl, paddingBottom: spacing.sm },
  group: { gap: spacing.sm },
  groupLabel: { marginLeft: spacing.xs },
  chips: { gap: spacing.sm },
  chipsRow: { flexDirection: 'row' },
});
