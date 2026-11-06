'use client';

import { useRef, useState, type PointerEvent } from 'react';
import type { CoreCurrent } from '@/domain/wiring/boxFlow';
import type { BoxInput, Cable } from '@/domain/wiring/junctionBox';
import { fmt } from '@/i18n/format';
import { uz } from '@/i18n/uz';
import { RealBoxShell, RealLamp, RealSwitch } from './RealDevices';
import { RealDefs } from './RealDefs';
import { RealWago, wagoEntry } from './RealWago';
import { CopperTip, Flow, Insulation, Sheath, route, type P } from './RealWire';
import type { BoxGeo } from './realBoxLayout';

interface Props {
  input: BoxInput;
  geo: BoxGeo;
  keys: Record<string, boolean[]>;
  lit: Record<string, boolean>;
  currents: Map<string, CoreCurrent>;
  short: boolean;
  onKey: (switchId: string, key: number) => void;
  /** manual mode */
  editable?: boolean;
  onInsert?: (coreId: string, clamp: number, slot: number) => void;
  onRemove?: (coreId: string) => void;
}

/** The junction box as it looks on the wall with the lid off: real cables, cores, lever clamps, switch, lamps. */
export function BoxRealView({
  input,
  geo,
  keys,
  lit,
  currents,
  short,
  onKey,
  editable = false,
  onInsert,
  onRemove,
}: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ id: string; at: P; moved: boolean } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  const where = new Map<string, { clamp: number; slot: number; at: P; out: P }>();
  geo.clamps.forEach((c, ci) =>
    c.ends.forEach((id, si) => {
      if (id) where.set(id, { clamp: ci, slot: si, ...wagoEntry(c.c, c.ways, si, c.up) });
    }),
  );
  const toSvg = (e: { clientX: number; clientY: number }): P => {
    const m = svg.current?.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const freeEntryNear = (p: P, max = 40) => {
    let best: { clamp: number; slot: number; d: number } | null = null;
    geo.clamps.forEach((c, ci) =>
      c.ends.forEach((id, si) => {
        if (id) return;
        const e = wagoEntry(c.c, c.ways, si, c.up).at;
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d <= max && (!best || d < best.d)) best = { clamp: ci, slot: si, d };
      }),
    );
    return best as { clamp: number; slot: number; d: number } | null;
  };

  const coreFor = new Map<string, { color: string }>();
  for (const g of geo.cables) for (const k of g.cable.cores) coreFor.set(k.id, { color: k.color });

  const wire = (id: string) => {
    const start = geo.coreStart.get(id)!;
    const color = coreFor.get(id)!.color;
    const clamped = where.get(id);
    let end: P;
    let endOut: P;
    if (drag?.id === id) {
      end = drag.at;
      endOut = { x: -start.dir.x, y: -start.dir.y };
    } else if (clamped) {
      end = clamped.at;
      endOut = clamped.out;
    } else {
      end = geo.rest.get(id)!;
      endOut = { x: -start.dir.x, y: -start.dir.y };
    }
    const r = route(start.at, start.dir, end, endOut);
    const cur = currents.get(id);
    return { id, d: r.d, end, endDir: r.endDir, color, clamped: !!clamped && drag?.id !== id, cur };
  };
  const wires = geo.cables.flatMap((g) => g.cable.cores.map((k) => wire(k.id)));

  // links between the clamps of a chain
  const jumpers: Array<{ d: string; a: P; b: P; ad: P; bd: P; color: string }> = [];
  const jumperEnds = new Map<string, Array<{ at: P; out: P; color: string }>>();
  geo.clamps.forEach((c) =>
    c.ends.forEach((id, si) => {
      if (!id?.startsWith('jumper:')) return;
      const e = wagoEntry(c.c, c.ways, si, c.up);
      jumperEnds.set(id, [...(jumperEnds.get(id) ?? []), { ...e, color: c.color }]);
    }),
  );
  for (const [, ends] of jumperEnds) {
    if (ends.length !== 2) continue;
    const [a, b] = ends as [{ at: P; out: P; color: string }, { at: P; out: P; color: string }];
    const r = route(a.at, a.out, b.at, b.out);
    jumpers.push({ d: r.d, a: a.at, b: b.at, ad: a.out, bd: b.out, color: a.color });
  }

  const startDrag = (id: string, e: PointerEvent) => {
    if (!editable) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDrag({ id, at: toSvg(e), moved: false });
  };
  const endDrag = (e: PointerEvent) => {
    if (!drag) return;
    const p = toSvg(e);
    const target = freeEntryNear(p);
    const wasClamped = where.has(drag.id);
    if (target && drag.moved) onInsert?.(drag.id, target.clamp, target.slot);
    else if (!drag.moved) {
      if (wasClamped) onRemove?.(drag.id);
      else setPicked((x) => (x === drag.id ? null : drag.id));
    } else if (wasClamped) onRemove?.(drag.id);
    setDrag(null);
  };

  const lampCables = geo.cables.filter((g) => g.cable.kind === 'lamp');
  const switchCables = geo.cables.filter((g) => g.cable.kind === 'switch');
  const supply = geo.cables.find((g) => g.cable.kind === 'supply')!;
  const sheathD = (g: (typeof geo.cables)[number]) =>
    `M${g.outside.x} ${g.outside.y} ${g.side === 'l' ? '' : `L${g.entry.x} ${g.entry.y + (g.side === 't' ? -40 : 40)}`} L${g.entry.x} ${g.entry.y} L${g.sheathEnd.x} ${g.sheathEnd.y}`;
  const cableCurrent = (c: Cable) => c.cores.some((k) => currents.has(k.id));

  return (
    <svg
      ref={svg}
      viewBox={`0 0 ${geo.view.w} ${geo.view.h}`}
      className="h-auto w-full touch-none select-none"
      role="img"
      aria-label={uz.wiring.tabs.box}
      data-testid="box-real"
      onPointerMove={(e) =>
        drag &&
        setDrag({
          ...drag,
          at: toSvg(e),
          moved: drag.moved || Math.hypot(toSvg(e).x - drag.at.x, toSvg(e).y - drag.at.y) > 6,
        })
      }
      onPointerUp={endDrag}
      onPointerCancel={() => setDrag(null)}
    >
      <RealDefs />
      <rect width={geo.view.w} height={geo.view.h} fill="#1a1d22" />
      {/* plastered wall */}
      <rect x={10} y={10} width={geo.view.w - 20} height={geo.view.h - 20} rx={18} fill="#2b2f36" />
      <RealBoxShell {...geo.box} entries={geo.cables.map((g) => ({ ...g.entry, side: g.side }))} />
      {geo.cables.map((g) => (
        <g key={`sh-${g.cable.id}`}>
          <Sheath d={sheathD(g)} />
          {cableCurrent(g.cable) ? (
            <Flow d={sheathD(g)} forward={g.cable.kind === 'supply'} kind="L" busy={1} />
          ) : null}
        </g>
      ))}
      {/* insulated cores, then the bare ends, then the clamps over them */}
      {wires.map((w) => (
        <g key={`w-${w.id}`}>
          <Insulation d={w.d} color={w.color} />
        </g>
      ))}
      {jumpers.map((j, i) => (
        <g key={`j-${i}`}>
          <Insulation d={j.d} color={j.color} />
          <CopperTip at={j.a} dir={{ x: -j.ad.x, y: -j.ad.y }} len={20} />
          <CopperTip at={j.b} dir={{ x: -j.bd.x, y: -j.bd.y }} len={20} />
        </g>
      ))}
      {wires.map((w) => (
        <g
          key={`t-${w.id}`}
          onPointerDown={editable ? (e) => startDrag(w.id, e) : undefined}
          style={editable ? { cursor: 'grab' } : undefined}
          data-core={w.id}
          role={editable ? 'button' : undefined}
          aria-label={editable ? w.id : undefined}
        >
          <CopperTip at={w.end} dir={w.endDir} len={w.clamped ? 22 : 26} />
          {editable ? (
            <circle
              cx={w.end.x + w.endDir.x * 12}
              cy={w.end.y + w.endDir.y * 12}
              r={22}
              fill={picked === w.id ? 'rgba(250,204,21,0.35)' : 'transparent'}
            />
          ) : null}
        </g>
      ))}
      {geo.clamps.map((c, ci) => (
        <RealWago
          key={c.id}
          c={c.c}
          ways={c.ways}
          up={c.up}
          filled={c.ends.map((e) => e !== null)}
          label={c.label}
          highlight={editable && (picked !== null || drag !== null)}
          onEntry={
            editable
              ? (si) => {
                  if (!picked) return;
                  onInsert?.(picked, ci, si);
                  setPicked(null);
                }
              : undefined
          }
        />
      ))}
      {wires
        .filter((w) => w.cur)
        .map((w) => (
          <Flow key={`f-${w.id}`} d={w.d} forward={w.cur!.inward} kind={w.cur!.kind} busy={w.cur!.load} />
        ))}
      {/* the devices at the other ends of the cables */}
      <text x={24} y={supply.outside.y - 30} fontSize={16} fill="#e2e8f0" fontWeight={600}>
        {uz.wiring.box.supply}
      </text>
      <text x={24} y={supply.outside.y + 44} fontSize={13} fill="#94a3b8">
        VVGng 3×1,5
      </text>
      {lampCables.map((g) => (
        <RealLamp
          key={g.cable.id}
          c={{ x: g.outside.x, y: g.outside.y - 72 }}
          lit={lit[g.cable.id] === true}
          label={`${input.switches.findIndex((s) => s.id === g.cable.switchId) + 1}.${g.cable.key}.${g.cable.lamp}`}
        />
      ))}
      {switchCables.map((g) => {
        const s = input.switches.find((x) => x.id === g.cable.switchId)!;
        return (
          <RealSwitch
            key={g.cable.id}
            c={{ x: g.outside.x, y: g.outside.y + 46 }}
            keys={s.keys}
            on={keys[s.id] ?? []}
            label={fmt(uz.wiring.box.switchN, { n: input.switches.indexOf(s) + 1 })}
            onKey={(k) => onKey(s.id, k)}
          />
        );
      })}
      {short ? (
        <g>
          <rect
            x={geo.box.x}
            y={geo.box.y}
            width={geo.box.w}
            height={geo.box.h}
            rx={34}
            fill="#ef4444"
            opacity={0.25}
            className="trip-flash"
          />
          <text
            x={geo.view.w / 2}
            y={geo.box.y - 18}
            textAnchor="middle"
            fontSize={22}
            fontWeight={800}
            fill="#f87171"
          >
            {uz.wiring.box.shortNow}
          </text>
        </g>
      ) : null}
    </svg>
  );
}
