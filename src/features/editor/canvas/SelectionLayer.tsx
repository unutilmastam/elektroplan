'use client';

import { Circle, Line, Rect } from 'react-konva';
import type { Bounds } from '@/domain/geometry';
import { liveSelection, type Selection } from '@/domain/selection';
import type { Project } from '@/domain/types';
import { POINT_BADGE } from './decoration';

const BLUE = '#3b8bff';

interface SelectionLayerProps {
  project: Project;
  selection: Selection;
  marquee: Bounds | null;
  k: number;
  scale: number;
}

/** Highlights for selected rooms / walls / points and the marquee rectangle (world units). */
export function SelectionContent({ project, selection, marquee, k, scale }: SelectionLayerProps) {
  const sel = liveSelection(project, selection);
  const px = 1 / scale;
  return (
    <>
      {sel.map((r) => {
        if (r.kind === 'room') {
          const room = project.rooms.find((x) => x.id === r.id)!;
          return (
            <Line
              key={`r-${r.id}`}
              points={room.vertices.flatMap((v) => [v.x, v.y])}
              closed
              fill="rgba(59,139,255,0.12)"
              stroke={BLUE}
              strokeWidth={2.5 * px}
              dash={[8 * px, 5 * px]}
              listening={false}
            />
          );
        }
        if (r.kind === 'wall') {
          const w = project.walls.find((x) => x.id === r.id)!;
          return (
            <Line
              key={`w-${r.id}`}
              points={[w.a.x, w.a.y, w.b.x, w.b.y]}
              stroke={BLUE}
              strokeWidth={w.thickness + 4 * px}
              opacity={0.6}
              lineCap="round"
              listening={false}
            />
          );
        }
        if (r.kind === 'opening') {
          const op = project.openings.find((x) => x.id === r.id)!;
          const w = project.walls.find((x) => x.id === op.wallId);
          if (!w) return null;
          const len = Math.hypot(w.b.x - w.a.x, w.b.y - w.a.y) || 1;
          const h = op.width / 2 / len;
          const a = { x: w.a.x + (w.b.x - w.a.x) * (op.t - h), y: w.a.y + (w.b.y - w.a.y) * (op.t - h) };
          const b = { x: w.a.x + (w.b.x - w.a.x) * (op.t + h), y: w.a.y + (w.b.y - w.a.y) * (op.t + h) };
          return (
            <Line
              key={`o-${r.id}`}
              points={[a.x, a.y, b.x, b.y]}
              stroke={BLUE}
              strokeWidth={w.thickness + 6 * px}
              opacity={0.55}
              listening={false}
            />
          );
        }
        const p = project.points.find((x) => x.id === r.id)!;
        return (
          <Circle
            key={`p-${r.id}`}
            x={p.x}
            y={p.y}
            radius={POINT_BADGE * k * 0.82}
            stroke="#ffffff"
            strokeWidth={2 * px}
            shadowColor={BLUE}
            shadowBlur={10}
            shadowOpacity={0.9}
            listening={false}
          />
        );
      })}
      {marquee ? (
        <Rect
          x={marquee.minX}
          y={marquee.minY}
          width={marquee.maxX - marquee.minX}
          height={marquee.maxY - marquee.minY}
          fill="rgba(59,139,255,0.08)"
          stroke={BLUE}
          strokeWidth={1.5 * px}
          dash={[6 * px, 4 * px]}
          listening={false}
        />
      ) : null}
    </>
  );
}
