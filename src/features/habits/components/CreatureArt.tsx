import { memo } from 'react';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { abyss, listColors, mixHex, specular, useTheme } from '@/design-system';

import { creatures, type CreatureId } from '../domain/creatures';
import type { Stage } from '../domain/stages';

type CreatureArtProps = {
  creature: CreatureId;
  stage?: Stage;
  /** Width in points; the height is three quarters of it. */
  size?: number;
  /** Faces left instead of right. */
  flip?: boolean;
};

/**
 * Placeholder art for the creatures: simple vector shapes drawn here, original and free of
 * any rights. The animation project replaces them; everything else stays the same.
 * Every drawing lives in an 80 × 60 box centered on 0,0, facing right.
 */
export const CreatureArt = memo(function CreatureArt({
  creature,
  stage = 'young',
  size = 64,
  flip = false,
}: CreatureArtProps) {
  const { scheme } = useTheme();
  // The art keeps the bright tone in both themes: it lives in water, not on the page.
  const body = listColors[creatures[creature].color].dark;
  const fin = mixHex(body, abyss[900], scheme === 'dark' ? 0.32 : 0.28);
  const light = mixHex(body, specular, 0.45);
  const eye = abyss[950];
  const art =
    stage === 'egg' ? (
      <Egg body={body} light={light} />
    ) : (
      drawings[creature]({ body, fin, light, eye })
    );

  return (
    <Svg width={size} height={size * 0.75} viewBox="-40 -30 80 60">
      <G transform={flip ? 'scale(-1 1)' : undefined}>{art}</G>
    </Svg>
  );
});

type Paint = { body: string; fin: string; light: string; eye: string };

function Eye({ x, y, r = 2.6, color }: { x: number; y: number; r?: number; color: string }) {
  return (
    <>
      <Circle cx={x} cy={y} r={r} fill={color} />
      <Circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.35} fill={specular} />
    </>
  );
}

function Egg({ body, light }: { body: string; light: string }) {
  return (
    <G transform="translate(0 2) scale(1.35)">
      <Ellipse cx={0} cy={2} rx={15} ry={19} fill={light} />
      <Path
        d="M-15 4 C-8 0 -2 8 4 3 S12 6 15 3 L15 6 C14 16 7 21 0 21 C-7 21 -14 16 -15 6Z"
        fill={body}
        opacity={0.55}
      />
      <Ellipse cx={-5} cy={-8} rx={4} ry={6} fill={specular} opacity={0.55} />
    </G>
  );
}

const drawings: Record<CreatureId, (p: Paint) => React.ReactElement> = {
  fish: ({ body, fin, eye }) => (
    <G>
      <Path d="M-20 0 L-34 -11 Q-30 0 -34 11Z" fill={fin} />
      <Path d="M-2 -12 Q4 -21 11 -11Z" fill={fin} />
      <Path d="M-22 0 C-14 -14 10 -15 20 -2 C10 13 -14 14 -22 0Z" fill={body} />
      <Path d="M-6 0 C-2 -6 6 -6 10 0" stroke={fin} strokeWidth={1.6} fill="none" opacity={0.6} />
      <Eye x={12} y={-3} color={eye} />
    </G>
  ),
  turtle: ({ body, fin, light, eye }) => (
    <G>
      <Path
        d="M-14 6 L-25 16 L-11 12Z M10 7 L19 18 L4 12Z M-12 -7 L-23 -17 L-8 -11Z M8 -8 L17 -18 L2 -12Z"
        fill={fin}
      />
      <Ellipse cx={22} cy={-2} rx={8} ry={6} fill={light} />
      <Ellipse cx={0} cy={0} rx={18} ry={13} fill={body} />
      <Path
        d="M-8 -9 L0 -4 L8 -9 M-12 2 L0 -4 L12 2 M-6 10 L0 -4 L6 10"
        stroke={fin}
        strokeWidth={1.8}
        fill="none"
        opacity={0.7}
      />
      <Circle cx={25} cy={-3} r={1.6} fill={eye} />
    </G>
  ),
  octopus: ({ body, light, eye }) => (
    <G>
      {[-12, -7, -2, 3, 8, 13].map((x) => (
        <Path
          key={x}
          d={`M${x} 4 C${x - 4} 14 ${x + 6} 18 ${x - 2} 27`}
          stroke={body}
          strokeWidth={4.5}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <Ellipse cx={0} cy={-8} rx={15} ry={15} fill={body} />
      <Circle cx={-8} cy={-15} r={2} fill={light} />
      <Circle cx={6} cy={-17} r={1.6} fill={light} />
      <Eye x={-5} y={-6} color={eye} />
      <Eye x={5} y={-6} color={eye} />
    </G>
  ),
  dolphin: ({ body, fin, light, eye }) => (
    <G>
      <Path d="M-26 -2 L-36 -12 L-33 0 L-36 10Z" fill={fin} />
      <Path d="M-4 -12 L4 -23 L8 -11Z" fill={fin} />
      <Path
        d="M-28 0 C-20 -14 8 -16 22 -6 L33 -3 C34 0 30 1 22 1 C10 12 -18 10 -28 0Z"
        fill={body}
      />
      <Path d="M-14 4 C-4 8 10 6 20 1 C10 9 -6 10 -14 4Z" fill={light} />
      <Path d="M2 3 L-4 12 L8 5Z" fill={fin} />
      <Eye x={16} y={-4} r={2.2} color={eye} />
    </G>
  ),
  whale: ({ body, fin, light, eye }) => (
    <G>
      <Path
        d="M-24 -4 C-30 -10 -36 -14 -38 -8 C-34 -6 -32 -2 -30 0 C-34 2 -36 6 -36 10 C-32 8 -28 4 -24 2Z"
        fill={fin}
      />
      <Path d="M-26 0 C-24 -16 4 -20 22 -10 C30 -6 32 4 26 10 C14 18 -18 16 -26 0Z" fill={body} />
      <Path d="M-12 8 C0 14 16 13 26 8 C18 16 -2 18 -12 8Z" fill={light} />
      <Path
        d="M8 -18 C6 -24 2 -26 0 -28 M8 -18 C10 -24 14 -25 16 -27"
        stroke={light}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <Eye x={16} y={0} r={2.2} color={eye} />
    </G>
  ),
  crab: ({ body, fin, eye }) => (
    <G>
      {[-14, -8, 8, 14].map((x) => (
        <Path
          key={x}
          d={`M${x} 6 L${x + (x < 0 ? -8 : 8)} 16`}
          stroke={fin}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <Path
        d="M-14 -4 L-22 -14 M14 -4 L22 -14"
        stroke={fin}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M-28 -18 C-30 -26 -20 -28 -18 -20 L-22 -16Z M28 -18 C30 -26 20 -28 18 -20 L22 -16Z"
        fill={body}
      />
      <Ellipse cx={0} cy={2} rx={18} ry={11} fill={body} />
      <Path d="M-5 -8 L-5 -14 M5 -8 L5 -14" stroke={fin} strokeWidth={2} />
      <Eye x={-5} y={-15} r={2.4} color={eye} />
      <Eye x={5} y={-15} r={2.4} color={eye} />
    </G>
  ),
  blowfish: ({ body, fin, light, eye }) => (
    <G>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <Path
            key={i}
            d={`M${Math.cos(a) * 15} ${Math.sin(a) * 15} L${Math.cos(a) * 21} ${Math.sin(a) * 21}`}
            stroke={fin}
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })}
      <Path d="M-16 0 L-27 -8 L-25 0 L-27 8Z" fill={fin} />
      <Circle cx={0} cy={0} r={16} fill={body} />
      <Ellipse cx={0} cy={7} rx={11} ry={6} fill={light} />
      <Eye x={7} y={-4} r={3} color={eye} />
      <Path d="M13 4 C15 5 15 7 13 8" stroke={eye} strokeWidth={1.4} fill="none" />
    </G>
  ),
  shark: ({ body, fin, light, eye }) => (
    <G>
      <Path d="M-26 -2 L-36 -16 L-32 0 L-36 12Z" fill={fin} />
      <Path d="M-6 -10 L2 -25 L8 -9Z" fill={fin} />
      <Path d="M-28 0 C-18 -12 10 -14 26 -4 L34 0 L26 4 C10 12 -18 10 -28 0Z" fill={body} />
      <Path d="M-16 4 C-4 9 14 8 28 2 C14 11 -6 11 -16 4Z" fill={light} />
      <Path d="M0 4 L-8 14 L6 6Z" fill={fin} />
      <Path d="M12 -2 L12 3 M15 -2 L15 3 M18 -2 L18 3" stroke={fin} strokeWidth={1.2} />
      <Eye x={22} y={-3} r={2} color={eye} />
    </G>
  ),
  squid: ({ body, fin, light, eye }) => (
    <G transform="rotate(90)">
      <Path d="M0 -26 L-12 -14 L12 -14Z" fill={fin} />
      <Path
        d="M-9 -18 C-10 -4 -9 6 -7 10 L7 10 C9 6 10 -4 9 -18 C6 -24 -6 -24 -9 -18Z"
        fill={body}
      />
      {[-6, -2, 2, 6].map((x) => (
        <Path
          key={x}
          d={`M${x} 10 C${x - 2} 18 ${x + 2} 22 ${x} 27`}
          stroke={body}
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <Circle cx={-3} cy={-8} r={1.6} fill={light} />
      <Eye x={-4} y={4} r={2.2} color={eye} />
      <Eye x={4} y={4} r={2.2} color={eye} />
    </G>
  ),
  seal: ({ body, fin, light, eye }) => (
    <G>
      <Path d="M-24 6 L-34 0 L-32 10 L-24 10Z" fill={fin} />
      <Path d="M-26 6 C-24 -6 0 -12 14 -8 C26 -6 30 4 22 10 C8 16 -20 16 -26 6Z" fill={body} />
      <Path d="M-8 8 L-14 18 L0 11Z" fill={fin} />
      <Path d="M-14 10 C0 14 14 13 22 9 C12 16 -6 16 -14 10Z" fill={light} />
      <Circle cx={26} cy={2} r={2} fill={eye} />
      <Path d="M24 4 L30 3 M24 5 L30 6" stroke={fin} strokeWidth={0.9} />
      <Eye x={16} y={-3} r={2.4} color={eye} />
    </G>
  ),
  lobster: ({ body, fin, eye }) => (
    <G>
      <Path d="M-30 0 L-36 -6 L-36 6Z" fill={fin} />
      <Path
        d="M-28 0 C-26 -6 -14 -8 -8 -6 L10 -6 C16 -6 20 -3 20 0 C20 3 16 6 10 6 L-8 6 C-14 8 -26 6 -28 0Z"
        fill={body}
      />
      <Path d="M-20 -6 L-20 6 M-14 -7 L-14 7 M-8 -6 L-8 6" stroke={fin} strokeWidth={1.2} />
      <Path d="M14 -5 L22 -14 M14 5 L22 14" stroke={fin} strokeWidth={2.5} strokeLinecap="round" />
      <Path
        d="M20 -16 C28 -22 34 -16 28 -12 L22 -12Z M20 16 C28 22 34 16 28 12 L22 12Z"
        fill={body}
      />
      <Path
        d="M18 -2 C26 -8 32 -14 36 -22 M18 2 C26 8 32 14 36 22"
        stroke={fin}
        strokeWidth={1}
        fill="none"
      />
      <Eye x={15} y={-2} r={1.8} color={eye} />
    </G>
  ),
  shrimp: ({ body, fin, light, eye }) => (
    <G>
      <Path d="M-24 8 L-32 2 L-30 12Z" fill={fin} />
      <Path
        d="M-24 8 C-26 -6 -12 -14 4 -12 C16 -10 22 -2 20 4 C14 2 6 0 -4 4 C-12 8 -18 12 -24 8Z"
        fill={body}
      />
      <Path
        d="M-14 -8 C-12 -2 -12 4 -14 8 M-6 -11 C-4 -4 -4 2 -6 4 M2 -12 C4 -6 4 -2 2 2"
        stroke={light}
        strokeWidth={1.4}
        fill="none"
      />
      <Path
        d="M-8 6 L-10 14 M-2 4 L-3 12 M4 3 L4 10"
        stroke={fin}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M16 -6 C24 -14 30 -18 36 -18 M17 -4 C26 -8 32 -8 36 -6"
        stroke={fin}
        strokeWidth={1}
        fill="none"
      />
      <Eye x={14} y={-4} r={2} color={eye} />
    </G>
  ),
};
