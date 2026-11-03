'use client';

import Konva from 'konva';
import { useEffect, useState } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import type { Bounds, Viewport } from '@/domain/geometry';
import type { Selection } from '@/domain/selection';
import type { Project } from '@/domain/types';
import { decorationK } from './decoration';
import { GridLayer } from './GridLayer';
import { PlanContent } from './PlanContent';
import { SelectionContent } from './SelectionLayer';

export interface PlanStageProps {
  project: Project;
  width: number;
  height: number;
  viewport: Viewport;
  selection: Selection;
  marquee: Bounds | null;
}

/**
 * Konva stage (ARCHITECTURE §4.1): Grid → Plan (memo) → Selection/marquee overlay.
 * Input is handled outside Konva (useCanvasInput) with our own hit testing, so nothing here listens.
 */
export default function PlanStage({ project, width, height, viewport, selection, marquee }: PlanStageProps) {
  const [fontFamily, setFontFamily] = useState('sans-serif');
  useEffect(() => {
    Konva.pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    setFontFamily(getComputedStyle(document.body).fontFamily);
  }, []);
  const k = decorationK(viewport.scale);
  const t = { x: viewport.x, y: viewport.y, scaleX: viewport.scale, scaleY: viewport.scale };

  return (
    <Stage width={width} height={height} listening={false}>
      <GridLayer width={width} height={height} viewport={viewport} gridSize={project.settings.gridSize} />
      <Layer listening={false}>
        <Group {...t}>
          <PlanContent project={project} k={k} fontFamily={fontFamily} />
        </Group>
      </Layer>
      <Layer listening={false}>
        <Group {...t}>
          <SelectionContent
            project={project}
            selection={selection}
            marquee={marquee}
            k={k}
            scale={viewport.scale}
          />
        </Group>
      </Layer>
    </Stage>
  );
}
