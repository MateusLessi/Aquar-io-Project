import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { ornament as o, useSvgId } from '@/design-system';

import type { OrnamentId } from '../hooks/aquariumRegion';

/**
 * The pond's ornaments (Fase 6, etapa 12b), one per region, drawn in vectors in the style of the
 * regions' paintings: soft gradients, a darker underside and a shadow on the bottom. Each one
 * has its place at the edge of the pond, away from where the creatures swim. Decorative.
 */
export function PondOrnaments({
  ids,
  width,
  height,
}: {
  ids: readonly OrnamentId[];
  width: number;
  height: number;
}) {
  if (ids.length === 0 || width === 0) return null;
  const unit = Math.min(width, height);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {ids.map((id) => {
        const place = PLACES[id];
        const size = Math.round(unit * place.size);
        return (
          <View
            key={id}
            style={[
              styles.place,
              {
                left: width * place.x - size / 2,
                top: height * place.y - size / 2,
                transform: [{ rotate: `${place.turn}deg` }],
              },
            ]}
          >
            <OrnamentArt id={id} size={size} />
          </View>
        );
      })}
    </View>
  );
}

/** Where each ornament sits (fractions of the pond) and how big it is (of the shorter side). */
const PLACES: Record<OrnamentId, { x: number; y: number; size: number; turn: number }> = {
  lily: { x: 0.86, y: 0.17, size: 0.34, turn: 0 },
  coral: { x: 0.12, y: 0.72, size: 0.36, turn: 0 },
  kelp: { x: 0.06, y: 0.38, size: 0.44, turn: 8 },
  anchor: { x: 0.88, y: 0.66, size: 0.3, turn: -18 },
  lantern: { x: 0.12, y: 0.15, size: 0.28, turn: 0 },
  chest: { x: 0.66, y: 0.78, size: 0.3, turn: -8 },
};

/** One ornament, in a square of `size` points. */
export const OrnamentArt = memo(function OrnamentArt({
  id,
  size,
}: {
  id: OrnamentId;
  size: number;
}) {
  const Art = ARTS[id];
  return (
    <View
      style={{ width: size, height: size }}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Art />
      </Svg>
    </View>
  );
});

/** A soft shadow under an ornament, on the bottom of the water. */
function Shadow({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  const id = useSvgId('ornament-shadow');
  return (
    <>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={o.shade} stopOpacity={0.45} />
          <Stop offset="1" stopColor={o.shade} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
    </>
  );
}

/** Vitória-régia (Lagoa): a big leaf with its rim and a flower. */
function Lily() {
  const leaf = useSvgId('lily-leaf');
  const petal = useSvgId('lily-petal');
  return (
    <G>
      <Defs>
        <RadialGradient id={leaf} cx="40%" cy="35%" r="70%">
          <Stop offset="0" stopColor={o.padLight} />
          <Stop offset="0.6" stopColor={o.padMid} />
          <Stop offset="1" stopColor={o.padDeep} />
        </RadialGradient>
        <LinearGradient id={petal} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={o.flower} />
          <Stop offset="1" stopColor={o.flowerDeep} />
        </LinearGradient>
      </Defs>
      <Shadow cx={54} cy={58} rx={44} ry={38} />
      <Circle cx={50} cy={52} r={42} fill={o.padRim} />
      <Path d="M50 52 L92 46 A42 42 0 1 1 86 30 Z" fill={`url(#${leaf})`} />
      {[0, 40, 80, 120, 160, 200, 240, 280].map((a) => (
        <Path
          key={a}
          d="M50 52 L50 16"
          stroke={o.padDeep}
          strokeOpacity={0.35}
          strokeWidth={1.2}
          transform={`rotate(${a} 50 52)`}
        />
      ))}
      <G transform="translate(30 36)">
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <Ellipse
            key={a}
            cx={0}
            cy={-8}
            rx={5.5}
            ry={10}
            fill={`url(#${petal})`}
            transform={`rotate(${a})`}
          />
        ))}
        <Circle r={5} fill={o.flowerCore} />
      </G>
    </G>
  );
}

/** Coral (Recife de Coral): branching coral, orange and pink. */
function Coral() {
  const warm = useSvgId('coral-warm');
  const pink = useSvgId('coral-pink');
  const branch = (d: string, color: string, w: number) => (
    <Path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
  );
  return (
    <G>
      <Defs>
        <LinearGradient id={warm} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={o.coralOrange} />
          <Stop offset="1" stopColor={o.coralLight} />
        </LinearGradient>
        <LinearGradient id={pink} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={o.coralDeep} />
          <Stop offset="1" stopColor={o.coralPink} />
        </LinearGradient>
      </Defs>
      <Shadow cx={52} cy={86} rx={42} ry={12} />
      <G>
        {branch('M30 92 C30 70 22 60 18 44', `url(#${pink})`, 9)}
        {branch('M26 66 C16 60 12 52 10 40', `url(#${pink})`, 7)}
        {branch('M20 52 C26 44 30 36 30 26', `url(#${pink})`, 6)}
      </G>
      <G>
        {branch('M58 92 C58 72 56 58 50 40 C46 30 46 22 50 12', `url(#${warm})`, 10)}
        {branch('M56 64 C66 56 72 46 74 30', `url(#${warm})`, 8)}
        {branch('M72 44 C80 40 86 32 88 20', `url(#${warm})`, 6)}
        {branch('M52 46 C42 40 38 32 36 22', `url(#${warm})`, 6)}
        {branch('M66 76 C76 72 84 66 90 56', `url(#${warm})`, 7)}
      </G>
      <Circle cx={74} cy={86} r={7} fill={o.coralPink} />
      <Circle cx={84} cy={88} r={5} fill={o.coralDeep} />
    </G>
  );
}

/** Kelp dourado (Floresta de Kelp): tall fronds, gold over green. */
function Kelp() {
  const gold = useSvgId('kelp-gold');
  const green = useSvgId('kelp-green');
  const leaf = (x: number, y: number, a: number, fill: string, s = 1) => (
    <Path
      d={`M0 0 C${6 * s} ${-4 * s} ${14 * s} ${-4 * s} ${20 * s} 0 C${14 * s} ${4 * s} ${6 * s} ${4 * s} 0 0 Z`}
      fill={fill}
      transform={`translate(${x} ${y}) rotate(${a})`}
    />
  );
  return (
    <G>
      <Defs>
        <LinearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={o.kelpLight} />
          <Stop offset="1" stopColor={o.kelpGold} />
        </LinearGradient>
        <LinearGradient id={green} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={o.kelpGreen} />
          <Stop offset="1" stopColor={o.kelpDeep} />
        </LinearGradient>
      </Defs>
      <Path
        d="M40 100 C30 80 52 62 38 40 C28 24 40 12 46 2"
        stroke={`url(#${green})`}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M56 100 C66 78 48 60 60 38 C68 22 60 10 54 0"
        stroke={`url(#${gold})`}
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
      />
      {leaf(44, 78, -150, `url(#${green})`, 1.1)}
      {leaf(40, 54, -30, `url(#${green})`)}
      {leaf(36, 34, -160, `url(#${green})`, 0.9)}
      {leaf(58, 84, -20, `url(#${gold})`, 1.2)}
      {leaf(56, 62, -160, `url(#${gold})`, 1.1)}
      {leaf(62, 44, -25, `url(#${gold})`)}
      {leaf(60, 24, -150, `url(#${gold})`, 0.9)}
      {leaf(56, 8, -40, `url(#${gold})`, 0.8)}
    </G>
  );
}

/** Âncora (Mar Aberto): an old brass anchor with a little moss. */
function Anchor() {
  const brass = useSvgId('anchor-brass');
  return (
    <G>
      <Defs>
        <LinearGradient id={brass} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={o.brassLight} />
          <Stop offset="0.55" stopColor={o.brass} />
          <Stop offset="1" stopColor={o.brassDeep} />
        </LinearGradient>
      </Defs>
      <Shadow cx={56} cy={60} rx={36} ry={40} />
      {/* Solid: a straight line has no width for a gradient to span. */}
      <G stroke={o.brass} strokeLinecap="round" fill="none">
        <Circle cx={50} cy={16} r={8} strokeWidth={6} />
        <Path d="M50 24 L50 84" strokeWidth={8} />
        <Path d="M34 36 L66 36" strokeWidth={7} />
        <Path d="M20 64 C22 80 36 88 50 88 C64 88 78 80 80 64" strokeWidth={8} />
      </G>
      <Path d="M14 66 L22 56 L28 68 Z" fill={`url(#${brass})`} />
      <Path d="M86 66 L78 56 L72 68 Z" fill={`url(#${brass})`} />
      <Ellipse cx={40} cy={84} rx={8} ry={4} fill={o.moss} opacity={0.8} />
      <Ellipse cx={52} cy={58} rx={3} ry={6} fill={o.moss} opacity={0.7} />
    </G>
  );
}

/** Lanterna que brilha (Fossa Bioluminescente): a lantern with a glowing core. */
function Lantern() {
  const halo = useSvgId('lantern-halo');
  const core = useSvgId('lantern-core');
  const metal = useSvgId('lantern-metal');
  return (
    <G>
      <Defs>
        <RadialGradient id={halo} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={o.glow} stopOpacity={0.5} />
          <Stop offset="1" stopColor={o.glow} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={core} cx="45%" cy="40%" r="60%">
          <Stop offset="0" stopColor={o.glowCore} />
          <Stop offset="0.5" stopColor={o.glow} />
          <Stop offset="1" stopColor={o.glow} stopOpacity={0.6} />
        </RadialGradient>
        <LinearGradient id={metal} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={o.metalLight} />
          <Stop offset="1" stopColor={o.metal} />
        </LinearGradient>
      </Defs>
      <Circle cx={50} cy={56} r={46} fill={`url(#${halo})`} />
      <Circle cx={50} cy={12} r={6} stroke={`url(#${metal})`} strokeWidth={3} fill="none" />
      <Rect x={36} y={18} width={28} height={10} rx={5} fill={`url(#${metal})`} />
      <Circle cx={50} cy={56} r={24} stroke={`url(#${metal})`} strokeWidth={4} fill="none" />
      <Circle cx={50} cy={56} r={14} fill={`url(#${core})`} />
      <Rect x={38} y={80} width={24} height={8} rx={4} fill={`url(#${metal})`} />
    </G>
  );
}

/** Baú do fundo (Fossa das Marianas): a wooden chest bound in gold, glowing at the lock. */
function Chest() {
  const wood = useSvgId('chest-wood');
  const gold = useSvgId('chest-gold');
  const glow = useSvgId('chest-glow');
  return (
    <G>
      <Defs>
        <LinearGradient id={wood} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={o.woodLight} />
          <Stop offset="0.6" stopColor={o.wood} />
          <Stop offset="1" stopColor={o.woodDeep} />
        </LinearGradient>
        <LinearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={o.goldLight} />
          <Stop offset="1" stopColor={o.gold} />
        </LinearGradient>
        <RadialGradient id={glow} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={o.goldLight} stopOpacity={0.55} />
          <Stop offset="1" stopColor={o.goldLight} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Shadow cx={52} cy={80} rx={44} ry={14} />
      <Circle cx={50} cy={58} r={44} fill={`url(#${glow})`} />
      <Rect x={14} y={44} width={72} height={36} rx={6} fill={`url(#${wood})`} />
      <Path d="M14 46 C14 26 30 20 50 20 C70 20 86 26 86 46 Z" fill={`url(#${wood})`} />
      <Rect x={26} y={20} width={8} height={60} rx={2} fill={`url(#${gold})`} />
      <Rect x={66} y={20} width={8} height={60} rx={2} fill={`url(#${gold})`} />
      <Rect x={14} y={44} width={72} height={5} fill={`url(#${gold})`} />
      <Circle cx={50} cy={54} r={8} fill={`url(#${gold})`} />
      <Path d="M48 52 L52 52 L51 58 L49 58 Z" fill={o.woodDeep} />
      <Circle cx={50} cy={52} r={2} fill={o.woodDeep} />
    </G>
  );
}

const ARTS: Record<OrnamentId, () => React.JSX.Element> = {
  lily: Lily,
  coral: Coral,
  kelp: Kelp,
  anchor: Anchor,
  lantern: Lantern,
  chest: Chest,
};

const styles = StyleSheet.create({
  place: { position: 'absolute' },
});
