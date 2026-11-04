'use client';

import Konva from 'konva';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import type { Bounds, Vec2, Viewport } from '@/domain/geometry';
import type { DraftShape } from '@/store/editorStore';
import { DraftContent } from './DraftContent';
import { StatusLayer } from '@/features/installation/StatusLayer';
import type { Selection } from '@/domain/selection';
import type { Project } from '@/domain/types';
import { decorationK, pointK } from './decoration';
import { GridLayer } from './GridLayer';
import { PlanContent } from './PlanContent';
import { SelectionContent } from './SelectionLayer';
import { usePlanCache } from './usePlanCache';

export interface PlanStageProps {
  project: Project;
  width: number;
  height: number;
  viewport: Viewport;
  selection: Selection;
  marquee: Bounds | null;
  draft: DraftShape | null;
  hover: Vec2 | null;
  /** Montaj rejimi: status rings */
  showStatus?: boolean;
}

/**
 * Konva stage (ARCHITECTURE §4.1): Grid → Plan (memo) → Selection/marquee overlay.
 * Input is handled outside Konva (useCanvasInput) with our own hit testing, so nothing here listens.
 */
export default function PlanStage({
  project,
  width,
  height,
  viewport,
  selection,
  marquee,
  draft,
  hover,
  showStatus = false,
}: PlanStageProps) {
  const [fontFamily, setFontFamily] = useState('sans-serif');
  useEffect(() => {
    Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    setFontFamily(getComputedStyle(document.body).fontFamily);
  }, []);
  const k = decorationK(viewport.scale);
  const kp = pointK(viewport.scale);
  const t = { x: viewport.x, y: viewport.y, scaleX: viewport.scale, scaleY: viewport.scale };
  const plan = useRef<Konva.Group>(null);
  const statusScale = showStatus ? viewport.scale : 0; // status rings are drawn in screen pixels
  const contentKey = useMemo(() => ({}), [project, k, kp, fontFamily, statusScale]); // eslint-disable-line react-hooks/exhaustive-deps
  usePlanCache(plan, viewport, { width, height }, contentKey);

  return (
    <Stage width={width} height={height} listening={false}>
      <GridLayer width={width} height={height} viewport={viewport} gridSize={project.settings.gridSize} />
      <Layer listening={false}>
        <Group {...t}>
          <Group ref={plan}>
            <PlanContent project={project} k={k} kp={kp} fontFamily={fontFamily} />
            {showStatus ? <StatusLayer project={project} k={kp} scale={viewport.scale} /> : null}
          </Group>
        </Group>
      </Layer>
      <Layer listening={false}>
        <Group {...t}>
          <SelectionContent
            project={project}
            selection={selection}
            marquee={marquee}
            k={kp}
            scale={viewport.scale}
          />
          <DraftContent draft={draft} hover={hover} scale={viewport.scale} />
        </Group>
      </Layer>
    </Stage>
  );
}
