import { ExternalLink } from 'lucide-react-native';
import { Image, Linking, StyleSheet, View } from 'react-native';

import {
  Glyph,
  ListItem,
  Surface,
  Text,
  radius,
  spacing,
  useTheme,
  type GlyphKey,
} from '@/design-system';

import { communityLinks, deviceInfo, issueUrl } from '../community/links';
import { Group } from './sections';

const icon = require('../../../assets/icon.png');

function open(url: string) {
  Linking.openURL(url).catch((error: unknown) => console.warn('Could not open the link.', error));
}

function LinkRow({
  icon: name,
  title,
  subtitle,
  url,
  separator,
}: {
  icon: GlyphKey;
  title: string;
  subtitle: string;
  url: string;
  separator?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <ListItem
      separator={separator}
      title={title}
      subtitle={subtitle}
      leading={<Glyph name={name} size={20} color={colors.accent} />}
      trailing={<ExternalLink size={18} color={colors.textTertiary} />}
      accessibilityHint="Abre fora do app"
      onPress={() => open(url)}
    />
  );
}

/** Ajustes → Comunidade e feedback: the Discord, and bug reports and ideas on GitHub. */
export function CommunitySettings() {
  const links = communityLinks();
  const device = deviceInfo();
  return (
    <>
      {links.discord ? (
        <Group note="Novidades, votações e conversa com quem faz o app.">
          <Surface>
            <LinkRow
              icon="users"
              title="Entrar no Discord"
              subtitle="Comunidade"
              url={links.discord}
            />
          </Surface>
        </Group>
      ) : null}
      {links.github ? (
        <Group
          title="Feedback"
          note={`Abre no GitHub, já com a versão ${device.version} e o aparelho (${device.platform}).`}
        >
          <Surface>
            <LinkRow
              icon="flag"
              title="Relatar um problema"
              subtitle="Algo não funcionou"
              url={issueUrl(links.github, 'bug', device)}
            />
            <LinkRow
              separator
              icon="lightbulb"
              title="Sugerir uma ideia"
              subtitle="O que faria falta"
              url={issueUrl(links.github, 'idea', device)}
            />
            <LinkRow
              separator
              icon="code"
              title="Ver o código"
              subtitle="Desenvolvimento aberto"
              url={links.github}
            />
          </Surface>
        </Group>
      ) : null}
    </>
  );
}

const PRIVACY: { icon: GlyphKey; title: string; text: string }[] = [
  {
    icon: 'house',
    title: 'Primeiro no seu aparelho',
    text: 'Listas, hábitos, rotinas e o perfil ficam no aparelho e funcionam sem internet.',
  },
  {
    icon: 'cloud',
    title: 'Na nuvem, só com conta',
    text: 'Entrando, seus dados vão para o Supabase para sincronizar. Só você acessa.',
  },
  {
    icon: 'lock',
    title: 'Só aqui',
    text: 'A faixa de idade do quiz e os ajustes deste aparelho nunca sobem.',
  },
  {
    icon: 'globe',
    title: 'Sem rastreio',
    text: 'Sem anúncios, sem análise de uso, sem venda de dados.',
  },
  {
    icon: 'check',
    title: 'Seus dados são seus',
    text: 'Exporte ou apague tudo em Conta e dados, quando quiser.',
  },
];

/** Ajustes → Privacidade: what is kept where, in plain words. */
export function PrivacySettings() {
  const { colors } = useTheme();
  const { github } = communityLinks();
  return (
    <>
      <Surface>
        {PRIVACY.map((item, i) => (
          <View
            key={item.title}
            style={[
              styles.privacy,
              i > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.separator,
              },
            ]}
          >
            <Glyph name={item.icon} size={20} color={colors.accent} />
            <View style={styles.flex}>
              <Text variant="bodyStrong">{item.title}</Text>
              <Text variant="footnote" tone="secondary">
                {item.text}
              </Text>
            </View>
          </View>
        ))}
      </Surface>
      {github ? (
        <Surface>
          <LinkRow
            icon="book-open"
            title="Aviso de privacidade completo"
            subtitle="No repositório do Aquar.io"
            url={`${github}/blob/main/docs/privacy.md`}
          />
        </Surface>
      ) : null}
    </>
  );
}

/** The brand at the top of "Sobre o Aquar.io". */
export function BrandHeader({ version }: { version: string }) {
  return (
    <View style={styles.brand} accessible accessibilityLabel={`Aquar.io, versão ${version}`}>
      <Image source={icon} style={styles.icon} />
      <View>
        <Text variant="title1">Aquar.io</Text>
        <Text variant="footnote" tone="secondary">
          Tudo importa. · versão {version}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  privacy: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, alignItems: 'flex-start' },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  icon: { width: 64, height: 64, borderRadius: radius.lg },
});
