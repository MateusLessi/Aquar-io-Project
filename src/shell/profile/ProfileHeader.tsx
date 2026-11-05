import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import {
  PRIVACY_FIELDS,
  PROFILE_LIMITS,
  type Privacy,
  type PrivacyField,
  type Profile,
  type Visibility,
} from '@/core/profile/profileRepository';
import { useProfile, useProfileRepository } from '@/core/profile/useProfile';
import {
  Button,
  Sheet,
  Text,
  TextInput,
  listColorNames,
  listColors,
  radius,
  spacing,
  useSvgId,
  useTheme,
  withAlpha,
  type ListColorName,
} from '@/design-system';
import { CreatureBubble } from '@/features/habits/components/CreatureBubble';
import {
  creatureIds,
  creatures,
  isCreatureId,
  type CreatureId,
} from '@/features/habits/domain/creatures';

import { useProgress } from '../progress/useProgress';
import { useGamePrefs } from '../settings/prefs';

const COLOR_NAMES: Record<ListColorName, string> = {
  lagoon: 'Lagoa',
  tide: 'Maré',
  coral: 'Coral',
  kelp: 'Alga',
  sand: 'Areia',
  anemone: 'Anêmona',
};

export const VISIBILITY: Record<Visibility, { emoji: string; label: string }> = {
  me: { emoji: '🔒', label: 'Só eu' },
  friends: { emoji: '👥', label: 'Amigos' },
  public: { emoji: '🌐', label: 'Público' },
};
const NEXT: Record<Visibility, Visibility> = { me: 'friends', friends: 'public', public: 'me' };
const FIELD_LABELS: Record<PrivacyField, string> = {
  name: 'Nome',
  bio: 'Frase',
  depth: 'Zona e Profundidade',
  showcase: 'Vitrine e selos',
  stats: 'Estatísticas',
};

const isColor = (c: string | null): c is ListColorName =>
  c !== null && (listColorNames as string[]).includes(c);

/** The profile color: the person's pick, or their creature's own color. */
export function profileTone(profile: Profile | undefined, scheme: 'light' | 'dark'): string {
  const creature: CreatureId =
    profile?.creature && isCreatureId(profile.creature) ? profile.creature : 'dolphin';
  const name = isColor(profile?.color ?? null)
    ? (profile!.color as ListColorName)
    : creatures[creature].color;
  return listColors[name][scheme];
}

/**
 * Who you are in the ocean: a band in your color, your creature, your name and line, and how
 * deep you have gone. The color paints only this card; the app keeps the brand's accent.
 */
export function ProfileHeader() {
  const { colors, scheme } = useTheme();
  const repository = useProfileRepository();
  const { data: profile } = useProfile();
  const { data: progress } = useProgress();
  const { showDepth } = useGamePrefs();
  const [editing, setEditing] = useState(false);
  const gradientId = useSvgId('profile-band');
  const name = profile?.name ?? '';
  const creature: CreatureId =
    profile?.creature && isCreatureId(profile.creature) ? profile.creature : 'dolphin';
  const tone = profileTone(profile, scheme);
  const depth = progress?.depth;

  return (
    <>
      <View
        style={[styles.card, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
      >
        <View style={styles.band} importantForAccessibility="no-hide-descendants">
          <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 400 96">
            <Defs>
              <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={tone} stopOpacity={0.95} />
                <Stop offset="1" stopColor={tone} stopOpacity={0.35} />
              </LinearGradient>
            </Defs>
            <Rect width="400" height="96" fill={`url(#${gradientId})`} />
            {/* The band ends in a soft wave, like the waterline elsewhere in the app. */}
            <Path
              d="M0 78 Q50 64 100 78 T200 78 T300 78 T400 78 V96 H0 Z"
              fill={colors.surfaceRaised}
            />
          </Svg>
        </View>
        <View style={styles.top}>
          <View style={[styles.avatar, { borderColor: colors.surfaceRaised }]}>
            <CreatureBubble creature={creature} size={80} done />
          </View>
          <Pressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            style={[styles.edit, { backgroundColor: withAlpha(colors.surfaceDeep, 0.35) }]}
          >
            <Pencil size={16} color={colors.onDeep} />
            <Text variant="footnote" tone="onDeep" style={styles.bold}>
              Editar
            </Text>
          </Pressable>
        </View>
        <View style={styles.texts}>
          <Text variant="title1" numberOfLines={1}>
            {name || 'Mergulhador'}
          </Text>
          {profile?.bio ? (
            <Text variant="callout" tone="secondary">
              {profile.bio}
            </Text>
          ) : null}
          {depth && showDepth ? (
            <View style={[styles.zone, { backgroundColor: withAlpha(tone, 0.18) }]}>
              <Text variant="footnote" style={styles.bold}>
                {depth.zone.emoji} {depth.zone.name} ·{' '}
                {new Intl.NumberFormat('pt-BR').format(depth.meters)} m
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Sheet visible={editing} onClose={() => setEditing(false)} title="Seu perfil">
        {editing && profile ? (
          <ProfileForm
            profile={profile}
            creature={creature}
            onSave={async (next) => {
              await repository.set(next);
              setEditing(false);
            }}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function VisibilityChip({
  field,
  value,
  onChange,
}: {
  field: PrivacyField;
  value: Visibility;
  onChange: (value: Visibility) => void;
}) {
  const { colors } = useTheme();
  const v = VISIBILITY[value];
  return (
    <Pressable
      onPress={() => onChange(NEXT[value])}
      accessibilityRole="button"
      accessibilityLabel={`${FIELD_LABELS[field]}: visível para ${v.label}. Tocar para mudar`}
      style={[
        styles.chip,
        { backgroundColor: value === 'me' ? colors.surfacePressed : colors.accentSoft },
      ]}
    >
      <Text variant="caption" tone={value === 'me' ? 'secondary' : 'accent'}>
        {v.emoji} {v.label}
      </Text>
    </Pressable>
  );
}

function ProfileForm({
  profile,
  creature,
  onSave,
}: {
  profile: Profile;
  creature: CreatureId;
  onSave: (next: Partial<Profile>) => Promise<void>;
}) {
  const { colors, scheme } = useTheme();
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [color, setColor] = useState<string | null>(profile.color);
  const [avatar, setAvatar] = useState<CreatureId>(creature);
  const [privacy, setPrivacy] = useState<Privacy>(profile.privacy);
  const [saving, setSaving] = useState(false);
  const setField = (field: PrivacyField) => (value: Visibility) =>
    setPrivacy((p) => ({ ...p, [field]: value }));

  return (
    <View style={styles.form}>
      <View style={styles.group}>
        <View style={styles.labelRow}>
          <VisibilityChip field="name" value={privacy.name} onChange={setField('name')} />
        </View>
        <TextInput
          label="Nome"
          value={name}
          onChangeText={setName}
          maxLength={PROFILE_LIMITS.name}
          placeholder="Como quer ser chamado?"
        />
      </View>
      <View style={styles.group}>
        <View style={styles.labelRow}>
          <VisibilityChip field="bio" value={privacy.bio} onChange={setField('bio')} />
        </View>
        <TextInput
          label={`Frase · ${bio.length}/${PROFILE_LIMITS.bio}`}
          accessibilityLabel="Frase"
          value={bio}
          onChangeText={setBio}
          maxLength={PROFILE_LIMITS.bio}
          placeholder="Uma linha sobre você"
        />
      </View>

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary">
          Cor do perfil · {isColor(color) ? COLOR_NAMES[color] : 'a da sua criatura'}
        </Text>
        <View style={styles.wrap} accessibilityRole="radiogroup">
          {listColorNames.map((c) => {
            const selected = color === c;
            return (
              <Pressable
                key={c}
                onPress={() => setColor(selected ? null : c)}
                accessibilityRole="radio"
                accessibilityLabel={`Cor ${COLOR_NAMES[c]}`}
                accessibilityState={{ checked: selected }}
                aria-checked={selected}
                style={[
                  styles.swatch,
                  { backgroundColor: listColors[c][scheme] },
                  selected && { borderColor: colors.textPrimary, borderWidth: 3 },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary">
          Seu avatar · {creatures[avatar].name}
        </Text>
        <View style={styles.wrap} accessibilityRole="radiogroup">
          {creatureIds.map((id) => {
            const selected = id === avatar;
            return (
              <Pressable
                key={id}
                onPress={() => setAvatar(id)}
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

      <View style={styles.group}>
        <Text variant="footnote" tone="secondary">
          Quem vê o quê
        </Text>
        <View style={[styles.privacy, { backgroundColor: colors.surfaceRaised }]}>
          {PRIVACY_FIELDS.filter((f) => f !== 'name' && f !== 'bio').map((field, i) => (
            <View
              key={field}
              style={[
                styles.privacyRow,
                i > 0 && {
                  borderTopColor: colors.separator,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text variant="body" style={styles.flex}>
                {FIELD_LABELS[field]}
              </Text>
              <VisibilityChip field={field} value={privacy[field]} onChange={setField(field)} />
            </View>
          ))}
        </View>
        <Text variant="footnote" tone="tertiary">
          Tocar no cadeado alterna entre Só eu, Amigos e Público. Hoje ninguém mais vê seu perfil:
          vale quando a comunidade abrir.
        </Text>
      </View>

      <Button
        label="Salvar"
        block
        loading={saving}
        onPress={() => {
          setSaving(true);
          void onSave({ name, bio, color, creature: avatar, privacy }).finally(() =>
            setSaving(false),
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  band: { position: 'absolute', top: 0, left: 0, right: 0, height: 96 },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 44,
  },
  avatar: { borderRadius: 999, borderWidth: 4 },
  edit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginTop: -spacing.xl,
  },
  bold: { fontWeight: '700' },
  texts: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xs },
  zone: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xs,
  },
  form: { gap: spacing.xl },
  group: { gap: spacing.sm },
  // The visibility chip sits above the field, on the right; the field carries its own label.
  labelRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: -spacing.xl },
  chip: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 40, height: 40, borderRadius: 20 },
  option: { padding: 4, borderRadius: radius.lg, borderWidth: 2, borderColor: 'transparent' },
  privacy: { borderRadius: radius.lg },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  flex: { flex: 1 },
});
