'use client';

import Konva from 'konva';
import { useEffect, useState } from 'react';
import { Group, Layer, Line, Stage, Text } from 'react-konva';
import { polygonCentroid, type Viewport } from '@/domain/geometry';
import type { Project, Wall } from '@/domain/types';
import { PointGlyph } from '@/features/points/PointGlyph';
import { SYMBOLS } from '@/features/symbols/catalog';
import { GridLayer } from './GridLayer';
import { WallsLayerContent } from './WallsLayer';

export interface PlanStageProps {
  project: Project;
  width: number;
  height: number;
  viewport: Viewport;
}

function wallRotation(wall: Wall | undefined): number {
  if (!wall) return 0;
  let deg = (Math.atan2(wall.b.y - wall.a.y, wall.b.x - wall.a.x) * 180) / Math.PI;
  if (deg > 90) deg -= 180;
  if (deg <= -90) deg += 180;
  return deg;
}

/** Konva stage: Grid → Rooms → Walls → Points (docs/ARCHITECTURE.md §4.1). Drawing tools arrive in Phase 3. */
export default function PlanStage({ project, width, height, viewport }: PlanStageProps) {
  const [fontFamily, setFontFamily] = useState('sans-serif');
  useEffect(() => {
    Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    setFontFamily(getComputedStyle(document.body).fontFamily);
  }, []);

  // Decorations keep a readable on-screen size: scale with the plan, but within limits.
  const k = Math.min(Math.max(viewport.scale, 0.45), 1.2) / viewport.scale;
  const rooms = project.rooms.filter((r) => r.deletedAt === null);
  const walls = project.walls.filter((w) => w.deletedAt === null);
  const points = project.points.filter((p) => p.deletedAt === null);

  return (
    <Stage width={width} height={height} listening={false}>
      <GridLayer width={width} height={height} viewport={viewport} gridSize={project.settings.gridSize} />
      <Layer listening={false}>
        <Group x={viewport.x} y={viewport.y} scaleX={viewport.scale} scaleY={viewport.scale}>
          {rooms.map((r) => (
            <Line
              key={r.id}
              points={r.vertices.flatMap((v) => [v.x, v.y])}
              closed
              fill={r.color}
              opacity={0.55}
              perfectDrawEnabled={false}
            />
          ))}
          <WallsLayerContent walls={walls} openings={project.openings} />
          {rooms.map((r) => {
            const c = polygonCentroid(r.vertices);
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
              />
            );
          })}
          {points.map((p) => (
            <PointGlyph
              key={p.id}
              point={p}
              size={25 * k}
              rotation={
                SYMBOLS[p.symbolId].category === 'socket'
                  ? wallRotation(walls.find((w) => w.id === p.wallId))
                  : 0
              }
            />
          ))}
        </Group>
      </Layer>
    </Stage>
  );
}
