'use client';

import { INSULATION } from './RealDefs';

export interface P {
  x: number;
  y: number;
}

const norm = (v: P): P => {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
};

/**
 * Smooth conductor from `a` (leaving in direction `da`) to `b` (arriving against `db`, i.e. `db` points
 * out of the terminal). Returns the SVG path and the direction the conductor has when it reaches `b`.
 */
export function route(a: P, da: P, b: P, db: P): { d: string; endDir: P } {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const k1 = Math.min(220, Math.max(40, dist * 0.45));
  const k2 = Math.min(180, Math.max(36, dist * 0.4));
  const c1 = { x: a.x + da.x * k1, y: a.y + da.y * k1 };
  const c2 = { x: b.x + db.x * k2, y: b.y + db.y * k2 };
  return {
    d: `M${a.x.toFixed(1)} ${a.y.toFixed(1)} C${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
    endDir: norm({ x: b.x - c2.x, y: b.y - c2.y }),
  };
}

/** Insulated conductor drawn like a real one: dark edge, colour, a highlight; PE gets its green stripes. */
export function Insulation({ d, color, width = 11 }: { d: string; color: string; width?: number }) {
  const c = INSULATION[color] ?? INSULATION.L!;
  return (
    <g pointerEvents="none">
      <path d={d} stroke={c.dark} strokeWidth={width + 2.4} fill="none" strokeLinecap="round" />
      <path d={d} stroke={c.base} strokeWidth={width} fill="none" strokeLinecap="round" />
      {color === 'PE' ? (
        <path d={d} stroke="#1c8f3a" strokeWidth={width} fill="none" strokeDasharray="7 9" />
      ) : null}
      <path
        d={d}
        stroke={c.light}
        strokeWidth={width * 0.22}
        fill="none"
        strokeLinecap="round"
        opacity={0.75}
        transform="translate(-1.4 -1.6)"
      />
    </g>
  );
}

/** Stripped end: bare copper strands, `len` long, starting at `at` and pointing along `dir`. */
export function CopperTip({ at, dir, len = 24, width = 7 }: { at: P; dir: P; len?: number; width?: number }) {
  const angle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI;
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${angle})`} pointerEvents="none">
      <rect
        x={-1}
        y={-width / 2}
        width={len}
        height={width}
        rx={width / 2.4}
        fill="url(#r-copper)"
        stroke="#6b3510"
        strokeWidth={0.8}
      />
      <path
        d={`M2 ${-width / 4} H${len - 3} M2 ${width / 5} H${len - 4}`}
        stroke="#ffd9ad"
        strokeWidth={0.7}
        opacity={0.8}
      />
    </g>
  );
}

/**
 * Current along a conductor: glowing particles moving the way the current goes
 * (`forward` = from the path start to its end). Phase = orange, neutral = blue.
 */
export function Flow({
  d,
  forward,
  kind,
  busy = 1,
}: {
  d: string;
  forward: boolean;
  kind: 'L' | 'N';
  busy?: number;
}) {
  const color = kind === 'L' ? '#ffb347' : '#7cc4ff';
  const dur = Math.max(0.9, 2.6 / busy);
  return (
    <g pointerEvents="none" filter="url(#r-spark)">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} r={4.6} fill={color}>
          <animateMotion
            dur={`${dur}s`}
            begin={`${-(dur / 6) * i}s`}
            repeatCount="indefinite"
            path={d}
            keyPoints={forward ? '0;1' : '1;0'}
            keyTimes="0;1"
            calcMode="linear"
          />
        </circle>
      ))}
    </g>
  );
}

/** A cable sheath (VVGng, black) from outside the box to where it was stripped. */
export function Sheath({ d, width = 22 }: { d: string; width?: number }) {
  return (
    <g pointerEvents="none">
      <path d={d} stroke="#08090b" strokeWidth={width + 2.5} fill="none" strokeLinecap="round" />
      <path d={d} stroke="#25282d" strokeWidth={width} fill="none" strokeLinecap="round" />
      <path
        d={d}
        stroke="#5d636c"
        strokeWidth={width * 0.18}
        fill="none"
        strokeLinecap="round"
        opacity={0.7}
        transform="translate(-2 -3)"
      />
    </g>
  );
}

/** A neatly laid conductor through waypoints: straight runs with rounded bends (as in a tidy board). */
export function ortho(points: P[], r = 12): string {
  if (points.length < 2) return '';
  let d = `M${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    const c = points[i + 1]!;
    const l1 = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const l2 = Math.hypot(c.x - b.x, c.y - b.y) || 1;
    const k = Math.min(r, l1 / 2, l2 / 2);
    const p1 = { x: b.x - ((b.x - a.x) / l1) * k, y: b.y - ((b.y - a.y) / l1) * k };
    const p2 = { x: b.x + ((c.x - b.x) / l2) * k, y: b.y + ((c.y - b.y) / l2) * k };
    d += ` L${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q${b.x.toFixed(1)} ${b.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  const z = points[points.length - 1]!;
  return `${d} L${z.x.toFixed(1)} ${z.y.toFixed(1)}`;
}
