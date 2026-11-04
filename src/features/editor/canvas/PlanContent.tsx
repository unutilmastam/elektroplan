'use client';

import { memo } from 'react';
import { Line, Text } from 'react-konva';
import { labelAnchor } from '@/domain/geometry';
import type { Project, Wall } from '@/domain/types';
import { PointGlyph } from '@/features/points/PointGlyph';
import { SYMBOLS } from '@/features/symbols/catalog';
import { DEFAULT_ROOM_COLOR } from '@/domain/rooms';
import { POINT_BADGE } from './decoration';
import { WallsLayerContent } from './WallsLayer';

function wallRotation(wall: Wall | undefined): number {
  if (!wall) return 0;
  let deg = (Math.atan2(wall.b.y - wall.a.y, wall.b.x - wall.a.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg <= -90) deg += 180;
  return deg;
}

interface PlanContentProps {
  project: Project;
  /** decoration multiplier for labels (see decoration.ts) */
  k: number;
  /** decoration multiplier for point badges */
  kp: number;
  fontFamily: string;
}

/** Rooms → walls → labels → points, in world units. Memoised: panning does not re-render it. */
export const PlanContent = memo(function PlanContent({ project, k, kp, fontFamily }: PlanContentProps) {
  const rooms = project.rooms.filter((r) => r.deletedAt === null);
  const walls = project.walls.filter((w) => w.deletedAt === null);
  const points = project.points.filter((p) => p.deletedAt === null);
  const wallById = new Map(walls.map((w) => [w.id, w]));
  return (
    <>
      {rooms.map((r) => (
        <Line
          key={r.id}
          points={r.vertices.flatMap((v) => [v.x, v.y])}
          closed
          fill={r.color}
          opacity={r.color === DEFAULT_ROOM_COLOR ? 0.55 : 0.16}
          perfectDrawEnabled={false}
          listening={false}
        />
      ))}
      <WallsLayerContent walls={walls} openings={project.openings} />
      {rooms.map((r) => {
        const c = labelAnchor(r.vertices);
        const fs = 19 * k;
        const w = 220 * k;
        return (
          <Text
            key={`l-${r.id}`}
            text={r.name}
            x={c.x + r.labelOffset.x - w / 2}
            y={c.y + r.labelOffset.y - fs / 2}
            width={w}
            align="center"
            fontSize={fs}
            fontFamily={fontFamily}
            fill="#f2f5fb"
            listening={false}
          />
        );
      })}
      {points.map((p) => (
        <PointGlyph
          key={p.id}
          point={p}
          size={POINT_BADGE * kp}
          rotation={SYMBOLS[p.symbolId].rotatable ? wallRotation(p.wallId ? wallById.get(p.wallId) : undefined) : 0}
        />
      ))}
    </>
  );
});
