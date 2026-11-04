'use client';

import { Circle, Group, Path } from 'react-konva';
import type { Project } from '@/domain/types';
import { STATUS_COLOR } from './statusColors';
import { POINT_BADGE } from '@/features/editor/canvas/decoration';

/** Status ring around every point; completed points get a check badge (Montaj rejimi). World units. */
export function StatusLayer({ project, k, scale }: { project: Project; k: number; scale: number }) {
  const px = 1 / scale;
  const r = POINT_BADGE * k * 0.78;
  return (
    <>
      {project.points
        .filter((p) => p.deletedAt === null)
        .map((p) => (
          <Group key={p.id} x={p.x} y={p.y} listening={false}>
            <Circle
              radius={r}
              stroke={STATUS_COLOR[p.status]}
              strokeWidth={3 * px}
              dash={p.status === 'in_progress' ? [5 * px, 3 * px] : undefined}
            />
            {p.status === 'completed' ? (
              <Group x={r * 0.72} y={-r * 0.72}>
                <Circle radius={7 * k} fill="#22c55e" stroke="#0b1322" strokeWidth={1.5 * px} />
                <Path
                  data="M-3.2 0.2 L-1 2.4 L3.4 -2.2"
                  stroke="#ffffff"
                  strokeWidth={1.8}
                  lineCap="round"
                  lineJoin="round"
                  scaleX={k}
                  scaleY={k}
                />
              </Group>
            ) : null}
          </Group>
        ))}
    </>
  );
}
