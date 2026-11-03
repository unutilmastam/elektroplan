'use client';

import { Circle, Line, Rect } from 'react-konva';
import type { Vec2 } from '@/domain/geometry';
import { PointGlyph } from '@/features/points/PointGlyph';
import { SYMBOLS } from '@/features/symbols/catalog';
import type { DraftShape } from '@/store/editorStore';
import { pointK, POINT_BADGE } from './decoration';

const BLUE = '#3b8bff';
const flat = (pts: readonly Vec2[]) => pts.flatMap((p) => [p.x, p.y]);

/** Previews of what is being drawn + the snap marker (world units; `scale` keeps strokes 1-2 px). */
export function DraftContent({
  draft,
  hover,
  scale,
}: {
  draft: DraftShape | null;
  hover: Vec2 | null;
  scale: number;
}) {
  const px = 1 / scale;
  const k = pointK(scale);
  return (
    <>
      {draft?.kind === 'rect' ? (
        <Rect
          x={Math.min(draft.a.x, draft.b.x)}
          y={Math.min(draft.a.y, draft.b.y)}
          width={Math.abs(draft.b.x - draft.a.x)}
          height={Math.abs(draft.b.y - draft.a.y)}
          fill="rgba(59,139,255,0.12)"
          stroke={BLUE}
          strokeWidth={2 * px}
          dash={[8 * px, 5 * px]}
          listening={false}
        />
      ) : null}
      {draft?.kind === 'wall' ? (
        <Line
          points={flat([draft.a, draft.b])}
          stroke="rgba(230,235,243,0.75)"
          strokeWidth={16}
          lineCap="square"
          listening={false}
        />
      ) : null}
      {draft?.kind === 'stroke' ? (
        <Line
          points={flat(draft.points)}
          stroke={BLUE}
          strokeWidth={3 * px}
          lineCap="round"
          lineJoin="round"
          tension={0.3}
          listening={false}
        />
      ) : null}
      {draft?.kind === 'polygon' ? (
        <>
          <Line
            points={flat(draft.points)}
            closed={false}
            stroke={BLUE}
            strokeWidth={2.5 * px}
            listening={false}
          />
          {draft.cursor ? (
            <Line
              points={flat([draft.points[draft.points.length - 1]!, draft.cursor])}
              stroke={BLUE}
              strokeWidth={2 * px}
              dash={[6 * px, 5 * px]}
              listening={false}
            />
          ) : null}
          {draft.points.map((p, i) => (
            <Circle
              key={i}
              x={p.x}
              y={p.y}
              radius={(i === 0 && draft.closable ? 9 : 5) * px}
              fill={i === 0 && draft.closable ? 'rgba(59,139,255,0.35)' : BLUE}
              stroke="#ffffff"
              strokeWidth={1.5 * px}
              listening={false}
            />
          ))}
        </>
      ) : null}
      {draft?.kind === 'symbol' ? (
        <PointGlyph
          point={{
            x: draft.at.x,
            y: draft.at.y,
            symbolId: draft.symbolId,
            color: SYMBOLS[draft.symbolId].defaultColor,
          }}
          size={POINT_BADGE * k}
          rotation={SYMBOLS[draft.symbolId].rotatable ? draft.rotation : 0}
          opacity={draft.valid ? 0.75 : 0.3}
        />
      ) : null}
      {hover ? (
        <Circle
          x={hover.x}
          y={hover.y}
          radius={5 * px}
          stroke={BLUE}
          strokeWidth={2 * px}
          fill="rgba(59,139,255,0.25)"
          listening={false}
        />
      ) : null}
    </>
  );
}
