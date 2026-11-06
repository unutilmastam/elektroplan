'use client';

/**
 * PHASE 22 — modular DIN-rail devices drawn like real ones (3 px/mm: one module 18 mm = 54 px, 80 mm tall).
 * Terminal screws top and bottom, raised front, the toggle with its red/green flag, printed ratings.
 */
export const MOD = 54;
export const DIN_H = 240;

export type DinKind = 'main' | 'relay' | 'spd' | 'rcd' | 'rcbo' | 'mcb';

/** x offsets (from the device's left edge) of each pole's terminal. */
export const poleXs = (modules: number, poles: number) =>
  Array.from({ length: poles }, (_, i) => ((i + 0.5) * modules * MOD) / poles);

function Screw({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 13} y={y - 13} width={26} height={26} rx={4} fill="#3d434b" />
      <circle cx={x} cy={y} r={9.5} fill="url(#r-screw)" stroke="#5f6874" strokeWidth={0.8} />
      <path d={`M${x - 6} ${y} H${x + 6} M${x} ${y - 6} V${y + 6}`} stroke="#59616c" strokeWidth={2} />
    </g>
  );
}

export function RealDin({
  kind,
  x,
  y,
  modules,
  poles,
  on,
  rating,
  sub,
  flash,
  onToggle,
  onTest,
  label,
}: {
  kind: DinKind;
  x: number;
  y: number;
  modules: number;
  poles: number;
  on: boolean;
  rating: string;
  sub: string;
  flash: number;
  onToggle: (() => void) | null;
  onTest: (() => void) | null;
  label: string;
}) {
  const w = modules * MOD - 4;
  const px = poleXs(modules, poles);
  const leverW = Math.min(w - 16, poles > 1 ? w - 22 : 28);
  const leverX = x + 2 + w / 2 - leverW / 2;
  const leverY = on ? y + 92 : y + 126;
  const body = kind === 'relay' || kind === 'spd' ? 'url(#r-white)' : 'url(#r-white)';
  return (
    <g data-testid={`board-${kind}`} data-on={on}>
      <rect
        x={x + 2}
        y={y}
        width={w}
        height={DIN_H}
        rx={7}
        fill={body}
        stroke="#9aa3ae"
        strokeWidth={1.2}
        filter="url(#r-soft)"
      />
      {/* terminal shoulders */}
      <rect x={x + 2} y={y} width={w} height={44} rx={7} fill="#eef1f4" stroke="#aab2bd" strokeWidth={0.8} />
      <rect
        x={x + 2}
        y={y + DIN_H - 44}
        width={w}
        height={44}
        rx={7}
        fill="#eef1f4"
        stroke="#aab2bd"
        strokeWidth={0.8}
      />
      {px.map((p, i) => (
        <g key={i}>
          <Screw x={x + p} y={y + 22} />
          <Screw x={x + p} y={y + DIN_H - 22} />
        </g>
      ))}
      {/* raised front */}
      <rect x={x + 7} y={y + 50} width={w - 10} height={DIN_H - 100} rx={5} fill="#f6f7f9" stroke="#c4cad2" />
      {kind === 'relay' ? (
        <g>
          <rect x={x + 12} y={y + 62} width={w - 20} height={42} rx={4} fill="#06140a" stroke="#1e3a24" />
          <text
            x={x + 2 + w / 2}
            y={y + 94}
            textAnchor="middle"
            fontSize={28}
            fontWeight={700}
            fill={on ? '#36f27a' : '#0f3a1d'}
            fontFamily="monospace"
          >
            {on ? '230' : '---'}
          </text>
          <circle cx={x + 26} cy={y + 124} r={7} fill="#cbd2da" stroke="#8792a0" />
          <circle cx={x + w - 22} cy={y + 124} r={7} fill="#cbd2da" stroke="#8792a0" />
        </g>
      ) : kind === 'spd' ? (
        <g>
          {px.map((p, i) => (
            <g key={i}>
              <rect
                x={x + p - MOD / 2 + 8}
                y={y + 60}
                width={MOD - 16}
                height={96}
                rx={4}
                fill="#e1e5ea"
                stroke="#aab2bd"
              />
              <rect
                x={x + p - 9}
                y={y + 72}
                width={18}
                height={14}
                rx={2}
                fill={on ? '#22c55e' : '#ef4444'}
              />
            </g>
          ))}
        </g>
      ) : (
        <g>
          {/* trip flag window */}
          <rect
            x={x + 2 + w / 2 - 10}
            y={y + 62}
            width={20}
            height={16}
            rx={3}
            fill={on ? '#e11d2e' : '#16a34a'}
            stroke="#7a1019"
            strokeWidth={0.6}
          />
          {/* toggle */}
          <rect
            x={x + 2 + w / 2 - leverW / 2 - 4}
            y={y + 86}
            width={leverW + 8}
            height={76}
            rx={6}
            fill="#c9cfd6"
          />
          <g
            role={onToggle ? 'switch' : undefined}
            aria-checked={onToggle ? on : undefined}
            aria-label={onToggle ? `${label}` : undefined}
            tabIndex={onToggle ? 0 : undefined}
            onClick={onToggle ?? undefined}
            onKeyDown={
              onToggle
                ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onToggle())
                : undefined
            }
            style={onToggle ? { cursor: 'pointer' } : undefined}
          >
            <rect
              x={leverX}
              y={leverY}
              width={leverW}
              height={34}
              rx={5}
              fill="#2a2e35"
              stroke="#0e1013"
              style={{ transition: 'y 140ms ease-out' }}
            />
            <path
              d={`M${leverX + 5} ${leverY + 10} H${leverX + leverW - 5} M${leverX + 5} ${leverY + 17} H${leverX + leverW - 5} M${leverX + 5} ${leverY + 24} H${leverX + leverW - 5}`}
              stroke="#4b525c"
              strokeWidth={1.4}
              style={{ transition: 'all 140ms ease-out' }}
            />
            <rect x={x + 2} y={y + 80} width={w} height={90} fill="transparent" />
          </g>
          <text x={x + 2 + w / 2} y={y + 82} textAnchor="middle" fontSize={9} fill="#6b7480">
            I
          </text>
          <text x={x + 2 + w / 2} y={y + 174} textAnchor="middle" fontSize={9} fill="#6b7480">
            O
          </text>
        </g>
      )}
      {onTest ? (
        <g
          role="button"
          aria-label={`${label} T`}
          tabIndex={0}
          onClick={onTest}
          onKeyDown={(e) => e.key === 'Enter' && onTest()}
          style={{ cursor: 'pointer' }}
        >
          <rect x={x + w - 22} y={y + 52} width={20} height={20} rx={4} fill="#facc15" stroke="#8a6a00" />
          <text x={x + w - 12} y={y + 66} textAnchor="middle" fontSize={12} fontWeight={800} fill="#3a2c00">
            T
          </text>
        </g>
      ) : null}
      <text
        x={x + 2 + w / 2}
        y={y + DIN_H - 56}
        textAnchor="middle"
        fontSize={modules > 1 ? 17 : 15}
        fontWeight={800}
        fill="#111827"
      >
        {rating}
      </text>
      <text x={x + 2 + w / 2} y={y + DIN_H - 66 + 26} textAnchor="middle" fontSize={9} fill="#4b5563">
        {sub}
      </text>
      <rect
        key={flash}
        x={x + 2}
        y={y}
        width={w}
        height={DIN_H}
        rx={7}
        fill="#ef4444"
        opacity={0}
        className={flash ? 'trip-flash' : undefined}
        pointerEvents="none"
      />
    </g>
  );
}

/** Electricity meter (above the board): LCD with the power now and an impulse LED blinking with the load. */
export function RealMeter({ x, y, kw, phases }: { x: number; y: number; kw: number; phases: 1 | 3 }) {
  const blink = kw > 0.05 ? Math.max(0.12, 2.4 / kw) : 0;
  return (
    <g filter="url(#r-shadow)">
      <rect x={x} y={y} width={230} height={250} rx={12} fill="url(#r-white)" stroke="#9aa3ae" />
      <rect x={x + 22} y={y + 30} width={186} height={64} rx={6} fill="#a7b89a" stroke="#556b48" />
      <text
        x={x + 198}
        y={y + 74}
        textAnchor="end"
        fontSize={30}
        fontFamily="monospace"
        fontWeight={700}
        fill="#1d2a17"
      >
        {kw.toFixed(2)}
      </text>
      <text x={x + 32} y={y + 50} fontSize={11} fill="#1d2a17">
        kW
      </text>
      <circle cx={x + 40} cy={y + 122} r={7} fill="#ef4444">
        {blink ? (
          <animate attributeName="opacity" values="1;0.1;1" dur={`${blink}s`} repeatCount="indefinite" />
        ) : null}
      </circle>
      <text x={x + 54} y={y + 126} fontSize={10} fill="#4b5563">
        imp/kWh
      </text>
      <text x={x + 115} y={y + 160} textAnchor="middle" fontSize={13} fontWeight={700} fill="#374151">
        {phases === 1 ? '230 V · 5(60) A' : '3×230/400 V · 5(100) A'}
      </text>
      <rect x={x + 22} y={y + 190} width={186} height={40} rx={4} fill="#d6dbe1" />
    </g>
  );
}
