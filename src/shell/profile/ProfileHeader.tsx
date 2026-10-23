import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useProfile, useProfileRepository } from '@/core/profile/useProfile';
import {
  Button,
  DeepSurface,
  Sheet,
  Text,
  TextInput,
  radius,
  spacing,
  useTheme,
} from '@/design-system';
import { CreatureBubble } from '@/features/habits/components/CreatureBubble';
import {
  creatureIds,
  creatures,
  isCreatureId,
  type CreatureId,
} from '@/features/habits/domain/creatures';

import { useProgress } from '../progress/useProgress';

/** Who you are in the ocean: your creature, your name and how deep you have gone. */
export function ProfileHeader() {
  const { colors } = useTheme();
  const repository = useProfileRepository();
  const { data: profile } = useProfile();
  const name = profile?.name ?? '';
  const creature: CreatureId =
    profile?.creature && isCreatureId(profile.creature) ? profile.creature : 'dolphin';
  const { data: progress } = useProgress();
  const [editing, setEditing] = useState(false);
  const depth = progress?.depth;

  return (
    <>
      <DeepSurface radius="xl" style={styles.card}>
        <CreatureBubble creature={creature} size={88} done />
        <View style={styles.texts}>
          <Text variant="title1" tone="onDeep" numberOfLines={1}>
            {name || 'Mergulhador'}
          </Text>
          {depth ? (
            <Text variant="callout" tone="onDeepSecondary">
              {depth.zone.emoji} {depth.zone.name} ·{' '}
              {new Intl.NumberFormat('pt-BR').format(depth.meters)} m
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => setEditing(true)}
          accessibilityRole="button"
          accessibilityLabel="Editar perfil"
          style={[styles.edit, { backgroundColor: colors.deepAccentSoft }]}
        >
          <Pencil size={20} color={colors.onDeep} />
        </Pressable>
      </DeepSurface>

      <Sheet visible={editing} onClose={() => setEditing(false)} title="Seu perfil">
        {editing ? (
          <ProfileForm
            name={name}
            creature={creature}
            onSave={async (next) => {
              await repository.set({ name: next.name, creature: next.creature });
              setEditing(false);
            }}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function ProfileForm({
  name,
  creature,
  onSave,
}: {
  name: string;
  creature: CreatureId;
  onSave: (next: { name: string; creature: CreatureId }) => Promise<void>;
}) {
  const { colors } = useTheme();
  const [draftName, setDraftName] = useState(name);
  const [draftCreature, setDraftCreature] = useState<CreatureId>(creature);
  return (
    <View style={styles.form}>
      <TextInput
        label="Nome"
        value={draftName}
        onChangeText={setDraftName}
        maxLength={40}
        placeholder="Como quer ser chamado?"
      />
      <View style={styles.group}>
        <Text variant="footnote" tone="secondary">
          Seu avatar · {creatures[draftCreature].name}
        </Text>
        <View style={styles.creatures} accessibilityRole="radiogroup">
          {creatureIds.map((id) => {
            const selected = id === draftCreature;
            return (
              <Pressable
                key={id}
                onPress={() => setDraftCreature(id)}
                accessibilityRole="radio"
                accessibilityLabel={creatures[id].name}
                accessibilityState={{ checked: selected }}
                style={[
                  styles.option,
                  selected && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
                ]}
              >
                <CreatureBubble creature={id} size={48} done={selected} />
              </Pressable>
            );
          })}
        </View>
      </View>
      <Button
        label="Salvar"
        block
        onPress={() => void onSave({ name: draftName, creature: draftCreature })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg },
  texts: { flex: 1, gap: spacing.xs },
  edit: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  form: { gap: spacing.xl },
  group: { gap: spacing.sm },
  creatures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: { padding: 4, borderRadius: radius.lg, borderWidth: 2, borderColor: 'transparent' },
});
