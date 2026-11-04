import { expect, test, type Page } from '@playwright/test';
import { createEmptyProject } from '../../src/domain/project';
import { reconcile } from '../../src/domain/topology';
import type { ElectricalPoint, Project, Room, SymbolId } from '../../src/domain/types';

/**
 * PHASE 13 performance budget: a 500-point project pans and zooms at ~60 fps.
 * Frame times are measured in the page while synthetic trackpad events drive the plan, one per frame.
 * Desktop + iPad landscape profiles (the others share the same renderer).
 */
test.skip(({ browserName }) => browserName !== 'chromium', 'frame timing measured in Chromium');

const NOW = '2026-11-04T00:00:00.000Z';
const SYMS: SymbolId[] = [
  'socket-single',
  'socket-double',
  'switch-single',
  'internet',
  'tv',
  'ceiling-light',
  'led',
  'ac',
];

export function bigProject(points = 500): Project {
  let n = 0;
  const id = () => `perf-${++n}`;
  const rooms: Room[] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 5; c++) {
      const x = c * 300;
      const y = r * 220;
      rooms.push({
        id: `room-${r}-${c}`,
        name: `Xona ${r * 5 + c + 1}`,
        color: '#0d1628',
        shape: 'rect',
        vertices: [
          { x, y },
          { x: x + 300, y },
          { x: x + 300, y: y + 220 },
          { x, y: y + 220 },
        ],
        labelOffset: { x: 0, y: 0 },
        order: r * 5 + c,
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null,
      });
    }
  const base = { ...createEmptyProject('perf-project', '500 nuqta', NOW), rooms };
  const topo = reconcile(base, { makeId: id, now: NOW });
  const pts: ElectricalPoint[] = Array.from({ length: points }, (_, i) => {
    const room = rooms[i % rooms.length]!;
    const k = Math.floor(i / rooms.length);
    const v = room.vertices[0]!;
    return {
      id: `pt-${i}`,
      symbolId: SYMS[i % SYMS.length]!,
      roomId: room.id,
      wallId: null,
      t: null,
      side: 1,
      x: v.x + 25 + (k % 5) * 60,
      y: v.y + 25 + Math.floor(k / 5) * 40,
      mountHeightCm: 30,
      distanceFromCornerCm: null,
      description: '',
      color: i % 3 ? '#3b8bff' : '#ef4444',
      label: null,
      status: i % 4 === 0 ? 'completed' : 'pending',
      statusChangedAt: null,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
  });
  return { ...base, ...topo, points: pts };
}

async function seed(page: Page, project: Project) {
  await page.goto('/projects/');
  await page.getByText('Hali loyiha yo‘q').waitFor();
  await page.evaluate(async (p) => {
    const db: IDBDatabase = await new Promise((res) => {
      const r = indexedDB.open('elektroplan');
      r.onsuccess = () => res(r.result);
    });
    await new Promise<void>((res) => {
      const tx = db.transaction('projects', 'readwrite');
      tx.objectStore('projects').put(p, p.id);
      tx.oncomplete = () => res();
    });
    db.close();
  }, project);
}

/** Main-thread work per frame (ms): our JavaScript + the canvas drawing it does (CDP CPU profile). */
async function scriptPerFrame(page: Page, kind: 'pan' | 'zoom', frames = 120) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start');
  await measure(page, kind, frames);
  const { profile } = (await cdp.send('Profiler.stop')) as {
    profile: {
      nodes: Array<{ id: number; callFrame: { functionName: string; url: string } }>;
      samples: number[];
      timeDeltas: number[];
    };
  };
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  let us = 0;
  profile.samples.forEach((id, i) => {
    const f = byId.get(id)!.callFrame;
    // page scripts and the canvas calls they make; not idle time or the browser's own raster work
    if (!['(idle)', '(program)', '(root)'].includes(f.functionName)) us += profile.timeDeltas[i] ?? 0;
  });
  await cdp.detach();
  return Math.round((us / 1000 / frames) * 10) / 10;
}

/** Drives the plan with one wheel event per animation frame; returns frame stats (ms). */
async function measure(page: Page, kind: 'pan' | 'zoom', frames = 120) {
  return page.evaluate(
    async ({ kind, frames }) => {
      const host = document.querySelector('[data-testid="plan-canvas"]') as HTMLElement;
      const box = host.getBoundingClientRect();
      const next = () => new Promise<number>((r) => requestAnimationFrame(r));
      const dts: number[] = [];
      const work: number[] = [];
      let prev = await next();
      for (let i = 0; i < frames; i++) {
        const t0 = performance.now();
        const dir = i < frames / 2 ? 1 : -1;
        host.dispatchEvent(
          new WheelEvent('wheel', {
            bubbles: true,
            cancelable: true,
            clientX: box.left + box.width / 2,
            clientY: box.top + box.height / 2,
            deltaX: kind === 'pan' ? 6 * dir : 0,
            deltaY: kind === 'pan' ? 4 * dir : -3 * dir,
            deltaMode: 0,
            ctrlKey: kind === 'zoom',
          }),
        );
        const t = await next();
        work.push(performance.now() - t0);
        dts.push(t - prev);
        prev = t;
      }
      const sorted = [...dts].sort((a, b) => a - b);
      const avg = dts.reduce((s, x) => s + x, 0) / dts.length;
      return {
        fps: Math.round(1000 / avg),
        avg: Math.round(avg * 10) / 10,
        p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]! * 10) / 10,
        maxWork: Math.round(Math.max(...work) * 10) / 10,
      };
    },
    { kind, frames },
  );
}

const baselineFps: Record<string, number> = {};
test.describe.configure({ mode: 'serial' }); // the baseline runs first in the same worker

test('baseline: same loop on a 1-room project (what this machine can do at all)', async ({ page }, info) => {
  test.skip(
    !['desktop-windows', 'ipad-landscape'].includes(info.project.name),
    'two representative profiles',
  );
  const project = { ...bigProject(0), rooms: bigProject(0).rooms.slice(0, 1), walls: [] };
  await seed(page, { ...project, id: 'perf-project' });
  await page.goto('/editor/?id=perf-project');
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.waitForTimeout(500);
  await measure(page, 'pan', 30);
  const pan = await measure(page, 'pan');
  console.log(`[perf-baseline ${info.project.name}] pan ${JSON.stringify(pan)}`);
  baselineFps[info.project.name] = pan.fps;
  info.annotations.push({ type: 'perf-baseline', description: JSON.stringify(pan) });
});

test('500 points: panning and zooming stay at ~60 fps', async ({ page }, info) => {
  test.skip(
    !['desktop-windows', 'ipad-landscape'].includes(info.project.name),
    'two representative profiles',
  );
  test.setTimeout(90_000);
  const project = bigProject(500);
  await seed(page, project);
  await page.goto('/editor/?id=perf-project');
  await page.locator('[data-testid="plan-canvas"][data-scale]').waitFor();
  await page.waitForTimeout(800);
  await measure(page, 'pan', 30); // warm-up
  const pan = await measure(page, 'pan');
  const zoom = await measure(page, 'zoom');
  const jsPan = await scriptPerFrame(page, 'pan');
  const jsZoom = await scriptPerFrame(page, 'zoom');
  const result = { pan, zoom, jsPerFrame: { pan: jsPan, zoom: jsZoom } };
  info.annotations.push({ type: 'perf', description: JSON.stringify(result) });
  console.log(`[perf ${info.project.name}] ${JSON.stringify(result)}`);
  // 60 fps = 16.7 ms per frame; our JavaScript must use well under half of it, the rest is the browser's.
  expect(jsPan).toBeLessThan(8);
  expect(jsZoom).toBeLessThan(8);
  // and the frame rate equals what this machine does with an (almost) empty plan
  expect(pan.fps).toBeGreaterThanOrEqual(Math.min(55, baselineFps[info.project.name]! * 0.85));
});
