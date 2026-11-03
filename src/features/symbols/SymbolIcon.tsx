import type { SymbolId } from '@/domain/types';
import { SYMBOLS } from './catalog';

interface SymbolIconProps {
  id: SymbolId;
  /** px size of the whole icon */
  size?: number;
  /** 'badge' = coloured rounded square (plan look), 'glyph' = glyph only in `glyphColor` */
  variant?: 'badge' | 'glyph';
  color?: string;
  glyphColor?: string;
  className?: string;
  title?: string;
}

/** Electrical symbol as inline SVG. Single source of truth: `catalog.ts`. */
export function SymbolIcon({
  id,
  size = 24,
  variant = 'badge',
  color,
  glyphColor,
  className,
  title,
}: SymbolIconProps) {
  const def = SYMBOLS[id];
  const fillColor = color ?? def.defaultColor;
  const showBadge = variant === 'badge' && def.badge === 'badge';
  const ink = glyphColor ?? (showBadge ? '#ffffff' : variant === 'badge' ? fillColor : 'currentColor');
  const pad = showBadge ? 4 : 0;
  const inner = 24 - pad * 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {showBadge ? (
        <rect
          x={0.5}
          y={0.5}
          width={23}
          height={23}
          rx={5.5}
          fill={fillColor}
          fillOpacity={0.85}
          stroke={fillColor}
          strokeOpacity={1}
        />
      ) : null}
      <g transform={`translate(${pad} ${pad}) scale(${inner / 24})`}>
        {def.glyph.map((part, i) =>
          part.mode === 'fill' ? (
            <path key={i} d={part.d} fill={ink} />
          ) : (
            <path
              key={i}
              d={part.d}
              fill="none"
              stroke={ink}
              strokeWidth={showBadge ? 1.9 : 1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ),
        )}
      </g>
    </svg>
  );
}
