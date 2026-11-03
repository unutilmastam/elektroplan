interface ProgressRingProps {
  percent: number;
  size?: number;
  stroke?: number;
  label?: string;
}

/** Circular progress (Loyiha holati). Animates on change; respects reduced motion via globals.css. */
export function ProgressRing({ percent, size = 104, stroke = 9, label }: ProgressRingProps) {
  const p = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gradId = `ring-${size}`;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(120,150,210,0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p / 100)}
          style={{
            transition: 'stroke-dashoffset 600ms ease-out',
            filter: 'drop-shadow(0 0 6px rgba(34,197,94,0.45))',
          }}
        />
      </svg>
      <div
        className="tabular absolute inset-0 flex items-center justify-center font-semibold text-text"
        style={{ fontSize: size * 0.24 }}
        role="img"
        aria-label={label ?? `${p}%`}
      >
        {p}%
      </div>
    </div>
  );
}
