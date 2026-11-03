import { toX, toY, type ElevationLayout } from '@/domain/elevation';
import type { ElevationPoint, WallElevation } from '@/domain/selectors';
import { uz } from '@/i18n/uz';

export function ElevationDefs() {
  return (
    <defs>
      <linearGradient id="wall-face" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#d9dde3" />
        <stop offset="100%" stopColor="#b9bec7" />
      </linearGradient>
      <radialGradient id="wall-light" cx="0.5" cy="0.2" r="0.8">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="tv-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1d2230" />
        <stop offset="100%" stopColor="#05070b" />
      </linearGradient>
    </defs>
  );
}

const cm = (n: number) => `${Math.round(n)} ${uz.point.cm}`;

/**
 * Distance labels under the floor line (pushed apart when close), the height ruler on the right
 * (selected point, else the highest), and for the selected point a dashed distance line from the left corner.
 */
export function ElevationDimensions({
  elevation,
  layout: l,
  selected,
}: {
  elevation: WallElevation;
  layout: ElevationLayout;
  selected: ElevationPoint | null;
}) {
  const labels: Array<{ d: number; x: number }> = [];
  for (const d of Array.from(new Set(elevation.points.map((p) => Math.round(p.distance)))).sort(
    (a, b) => a - b,
  )) {
    const prev = labels[labels.length - 1];
    labels.push({ d, x: prev && toX(l, d) - prev.x < 60 ? prev.x + 60 : toX(l, d) });
  }
  const rulerH = selected ? selected.height : l.maxHeight;
  const rx = l.x1 + 18;
  return (
    <>
      {labels.map(({ d, x }) => (
        <g key={d}>
          <circle cx={toX(l, d)} cy={l.y1} r={2.2} fill="#3b8bff" />
          <text
            x={x}
            y={l.y1 + 23}
            textAnchor="middle"
            fontSize={14.5}
            fill={selected && Math.round(selected.distance) === d ? '#7fb2ff' : '#eef3ff'}
            fontWeight={selected && Math.round(selected.distance) === d ? 600 : 400}
            className="tabular"
          >
            {cm(d)}
          </text>
        </g>
      ))}
      {rulerH > 0 ? (
        <g stroke="#c6cfdd" strokeWidth={1.2}>
          <line x1={rx} y1={l.y1} x2={rx} y2={toY(l, rulerH)} />
          <line x1={rx - 6} y1={l.y1} x2={rx + 6} y2={l.y1} />
          <line x1={rx - 6} y1={toY(l, rulerH)} x2={rx + 6} y2={toY(l, rulerH)} />
          <text
            x={rx + 12}
            y={(l.y1 + toY(l, rulerH)) / 2 + 5}
            fontSize={14.5}
            fill="#eef3ff"
            stroke="none"
            className="tabular"
          >
            {cm(rulerH)}
          </text>
        </g>
      ) : null}
      {selected ? (
        <g stroke="#3b8bff" strokeWidth={1.4} strokeDasharray="5 4" fill="none">
          <line
            x1={l.x0}
            y1={toY(l, selected.height)}
            x2={toX(l, selected.distance)}
            y2={toY(l, selected.height)}
          />
          <line
            x1={toX(l, selected.distance)}
            y1={toY(l, selected.height)}
            x2={rx}
            y2={toY(l, selected.height)}
            strokeOpacity={0.35}
          />
        </g>
      ) : null}
    </>
  );
}
