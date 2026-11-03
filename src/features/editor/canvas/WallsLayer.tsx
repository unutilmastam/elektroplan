'use client';

import { Circle, Group, Line, Path } from 'react-konva';
import { lerp } from '@/domain/geometry';
import type { Opening, Wall } from '@/domain/types';
import { solidIntervals } from '@/domain/walls';

const WALL = '#e6ebf3';
const WINDOW = '#8a95a8';

function unit(w: Wall) {
  const len = Math.hypot(w.b.x - w.a.x, w.b.y - w.a.y) || 1;
  return { len, ux: (w.b.x - w.a.x) / len, uy: (w.b.y - w.a.y) / len };
}

function WallBody({ wall, openings }: { wall: Wall; openings: Opening[] }) {
  const { ux, uy } = unit(wall);
  const ext = wall.thickness / 2;
  return (
    <>
      {solidIntervals(wall, openings).map(([t0, t1]) => {
        const p0 = lerp(wall.a, wall.b, t0);
        const p1 = lerp(wall.a, wall.b, t1);
        const e0 = t0 === 0 ? ext : 0;
        const e1 = t1 === 1 ? ext : 0;
        const pts = [p0.x - ux * e0, p0.y - uy * e0, p1.x + ux * e1, p1.y + uy * e1];
        return (
          <Line
            key={`${t0}`}
            points={pts}
            stroke={WALL}
            strokeWidth={wall.thickness}
            perfectDrawEnabled={false}
            listening={false}
          />
        );
      })}
    </>
  );
}

function OpeningShape({ wall, o }: { wall: Wall; o: Opening }) {
  const { len, ux, uy } = unit(wall);
  const half = o.width / 2 / len;
  const p0 = lerp(wall.a, wall.b, Math.max(0, o.t - half));
  const p1 = lerp(wall.a, wall.b, Math.min(1, o.t + half));
  const nx = -uy;
  const ny = ux;
  if (o.kind === 'window') {
    const h = wall.thickness / 2 - 1.5;
    return (
      <Group listening={false}>
        {[-h, 0, h].map((d) => (
          <Line
            key={d}
            points={[p0.x + nx * d, p0.y + ny * d, p1.x + nx * d, p1.y + ny * d]}
            stroke={d === 0 ? '#5d6879' : WINDOW}
            strokeWidth={d === 0 ? 1.5 : 3}
          />
        ))}
      </Group>
    );
  }
  const r = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const s = o.swing;
  const leaf = { x: p0.x + nx * r * s, y: p0.y + ny * r * s };
  const sweep = (ux * (ny * s) - uy * (nx * s) > 0 ? 0 : 1) as 0 | 1;
  const d = `M${p0.x} ${p0.y} L${leaf.x} ${leaf.y} A${r} ${r} 0 0 ${sweep} ${p1.x} ${p1.y}`;
  return <Path data={d} stroke="#d9dfea" strokeWidth={2} listening={false} />;
}

export function WallsLayerContent({ walls, openings }: { walls: Wall[]; openings: Opening[] }) {
  return (
    <>
      {walls.map((w) => (
        <WallBody key={w.id} wall={w} openings={openings} />
      ))}
      {walls.flatMap((w) => [
        <Circle
          key={`${w.id}-a`}
          x={w.a.x}
          y={w.a.y}
          radius={w.thickness / 2}
          fill={WALL}
          listening={false}
        />,
        <Circle
          key={`${w.id}-b`}
          x={w.b.x}
          y={w.b.y}
          radius={w.thickness / 2}
          fill={WALL}
          listening={false}
        />,
      ])}
      {openings.map((o) => {
        const wall = walls.find((w) => w.id === o.wallId);
        return wall ? <OpeningShape key={o.id} wall={wall} o={o} /> : null;
      })}
    </>
  );
}
