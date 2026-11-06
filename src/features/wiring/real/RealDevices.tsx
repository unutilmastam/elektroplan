'use client';

import type { P } from './RealWire';

/** Surface junction box seen from above with the lid off: thick ABS walls, lid screw posts, rubber entries. */
export function RealBoxShell({
  x,
  y,
  w,
  h,
  entries,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  entries: Array<P & { side: 'l' | 't' | 'b' | 'r' }>;
}) {
  const wall = 24;
  return (
    <g filter="url(#r-shadow)" pointerEvents="none">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={34}
        fill="url(#r-box-wall)"
        stroke="#8c96a3"
        strokeWidth={2}
      />
      <rect
        x={x + wall}
        y={y + wall}
        width={w - wall * 2}
        height={h - wall * 2}
        rx={18}
        fill="url(#r-box-floor)"
        stroke="#9aa3ae"
        strokeWidth={1.5}
      />
      {/* moulded ribs of the floor */}
      {Array.from({ length: 5 }, (_, i) => (
        <path
          key={i}
          d={`M${x + wall + 20} ${y + wall + 40 + i * ((h - wall * 2 - 80) / 4)} H${x + w - wall - 20}`}
          stroke="#c3c9d1"
          strokeWidth={1}
          opacity={0.6}
        />
      ))}
      {/* lid screw posts */}
      {[
        [x + wall + 16, y + wall + 16],
        [x + w - wall - 16, y + wall + 16],
        [x + wall + 16, y + h - wall - 16],
        [x + w - wall - 16, y + h - wall - 16],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={15} fill="#e3e7ec" stroke="#9aa3ae" />
          <circle cx={cx} cy={cy} r={6} fill="#6b7480" />
        </g>
      ))}
      {/* rubber cable entries */}
      {entries.map((e, i) => (
        <g key={`e${i}`}>
          <ellipse
            cx={e.x}
            cy={e.y}
            rx={e.side === 'l' || e.side === 'r' ? 10 : 20}
            ry={e.side === 'l' || e.side === 'r' ? 20 : 10}
            fill="url(#r-rubber)"
          />
        </g>
      ))}
    </g>
  );
}

/** Wall switch (1–3 keys) like a common white rocker: frame, keys, the pressed side shaded. */
export function RealSwitch({
  c,
  keys,
  on,
  label,
  onKey,
}: {
  c: P;
  keys: number;
  on: boolean[];
  label: string;
  onKey: (k: number) => void;
}) {
  const size = 104;
  const kw = (size - 26) / keys;
  return (
    <g>
      <rect
        x={c.x - size / 2}
        y={c.y - size / 2}
        width={size}
        height={size}
        rx={16}
        fill="url(#r-white)"
        stroke="#aab2bd"
        strokeWidth={1.5}
        filter="url(#r-shadow)"
      />
      <rect
        x={c.x - size / 2 + 9}
        y={c.y - size / 2 + 9}
        width={size - 18}
        height={size - 18}
        rx={10}
        fill="#e6e9ed"
      />
      {Array.from({ length: keys }, (_, k) => {
        const x = c.x - size / 2 + 13 + k * kw;
        const isOn = on[k] === true;
        return (
          <g
            key={k}
            role="switch"
            aria-checked={isOn}
            aria-label={`${label}, ${k + 1}`}
            tabIndex={0}
            onClick={() => onKey(k)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onKey(k))}
            style={{ cursor: 'pointer' }}
            data-testid="real-key"
          >
            <rect
              x={x + 1}
              y={c.y - size / 2 + 13}
              width={kw - 2}
              height={size - 26}
              rx={7}
              fill={isOn ? 'url(#r-white-key-down)' : 'url(#r-white-key)'}
              stroke="#b9c0c9"
            />
            {/* the rocker edge: shadow on the pressed half */}
            <rect
              x={x + 3}
              y={isOn ? c.y - size / 2 + 15 : c.y + 2}
              width={kw - 6}
              height={(size - 30) / 2}
              rx={5}
              fill="#000"
              opacity={0.06}
            />
            <rect
              x={x + kw / 2 - 7}
              y={c.y - size / 2 + 20}
              width={14}
              height={4}
              rx={2}
              fill={isOn ? '#f97316' : '#cbd2da'}
            />
          </g>
        );
      })}
      <text x={c.x} y={c.y + size / 2 + 22} textAnchor="middle" fontSize={15} fill="#cbd5e1">
        {label}
      </text>
    </g>
  );
}

/** Ceiling lamp: rosette, E27 holder and a bulb; lit = warm glass, glowing filament and light around it. */
export function RealLamp({ c, lit, label }: { c: P; lit: boolean; label: string }) {
  return (
    <g data-testid="real-lamp" data-lit={lit}>
      {lit ? (
        <circle
          cx={c.x}
          cy={c.y + 30}
          r={92}
          fill="url(#r-light)"
          className="lamp-glow"
          pointerEvents="none"
        />
      ) : null}
      <ellipse cx={c.x} cy={c.y - 34} rx={30} ry={9} fill="url(#r-white)" stroke="#9aa3ae" />
      <rect x={c.x - 3} y={c.y - 30} width={6} height={18} fill="#6b7480" />
      <rect x={c.x - 13} y={c.y - 14} width={26} height={22} rx={4} fill="#f1f3f5" stroke="#9aa3ae" />
      <path
        d={`M${c.x - 10} ${c.y + 8} C${c.x - 30} ${c.y + 22} ${c.x - 30} ${c.y + 58} ${c.x} ${c.y + 66} C${c.x + 30} ${c.y + 58} ${c.x + 30} ${c.y + 22} ${c.x + 10} ${c.y + 8} Z`}
        fill={lit ? 'url(#r-glass-lit)' : 'url(#r-glass)'}
        stroke={lit ? '#ffcf5c' : '#8792a0'}
        strokeWidth={1.4}
      />
      <path
        d={`M${c.x - 6} ${c.y + 14} L${c.x - 6} ${c.y + 34} M${c.x + 6} ${c.y + 14} L${c.x + 6} ${c.y + 34} M${c.x - 6} ${c.y + 34} q3 -5 6 0 q3 5 6 0`}
        stroke={lit ? '#fff3c4' : '#6b7480'}
        strokeWidth={lit ? 2.2 : 1.4}
        fill="none"
        filter={lit ? 'url(#r-spark)' : undefined}
      />
      <text x={c.x} y={c.y - 50} textAnchor="middle" fontSize={14} fill="#cbd5e1">
        {label}
      </text>
    </g>
  );
}
