import { describe, expect, it } from 'vitest';
import { cableFor, nearestStandard, BREAKERS } from '@/domain/wiring/catalog';
import { designLine, recommendPanel, type PanelInput } from '@/domain/wiring/panel';
import { allOn, flow, initialState, step, testRcd } from '@/domain/wiring/panelSim';
import { clampsFor, designBox, type BoxInput } from '@/domain/wiring/junctionBox';
import { boxStatus, checkBox } from '@/domain/wiring/boxCheck';

const flat: PanelInput = {
  phases: 1,
  allocatedKw: 10,
  lines: [
    { id: 'l1', type: 'lighting', name: 'Chiroqlar', powerW: 800 },
    { id: 's1', type: 'sockets', name: 'Zal', powerW: 2500 },
    { id: 's2', type: 'sockets', name: 'Yotoqxona', powerW: 2500 },
    { id: 'k1', type: 'kitchen-sockets', name: 'Oshxona', powerW: 3000 },
    { id: 'ov', type: 'oven', name: 'Duxovka', powerW: 3500 },
    { id: 'ac1', type: 'ac', name: 'Konditsioner', powerW: 2500 },
    { id: 'ac2', type: 'ac', name: 'Konditsioner 2', powerW: 2500 },
    { id: 'wm', type: 'washer', name: 'Kir yuvish', powerW: 2200 },
    { id: 'bo', type: 'boiler', name: 'Boyler', powerW: 2000 },
    { id: 'st', type: 'stove', name: 'Plita', powerW: 7000 },
  ],
};

describe('wiring catalog', () => {
  it('cable follows the breaker (copper, hidden wiring)', () => {
    expect(cableFor(10)).toBe(1.5);
    expect(cableFor(16)).toBe(2.5);
    expect(cableFor(25)).toBe(4);
    expect(cableFor(32)).toBe(6);
    expect(cableFor(40)).toBe(10);
    expect(nearestStandard(BREAKERS, 45.8)).toBe(50);
  });
});

describe('distribution board', () => {
  it('each circuit gets the right breaker, curve and cable', () => {
    const by = (id: string) => designLine(flat.lines.find((l) => l.id === id)!);
    expect(by('l1')).toMatchObject({ breakerA: 10, curve: 'B', cableMm2: 1.5, protection: 'none' });
    expect(by('s1')).toMatchObject({ breakerA: 16, curve: 'C', cableMm2: 2.5, protection: 'rcd' });
    expect(by('ov')).toMatchObject({ breakerA: 16, cableMm2: 2.5 }); // 3.5 kW / 230 V = 15.2 A
    expect(by('st')).toMatchObject({ breakerA: 32, cableMm2: 6 }); // 7 kW = 30.4 A
    expect(by('wm')).toMatchObject({ breakerA: 16, protection: 'rcbo' });
    expect(by('ac1')).toMatchObject({ breakerA: 16, protection: 'none' });
  });

  it('RCDs: at most 4 circuits each, rated for what can flow; main, relay, SPD, enclosure, materials', () => {
    const d = recommendPanel(flat);
    const behindRcd = d.lines.filter((l) => l.protection === 'rcd');
    expect(behindRcd.every((l) => l.rcdId)).toBe(true);
    expect(d.rcds.every((r) => r.lineIds.length <= 4)).toBe(true);
    expect(d.rcds.reduce((s, r) => s + r.lineIds.length, 0)).toBe(behindRcd.length);
    for (const r of d.rcds) {
      const sum = r.lineIds.reduce((s, id) => s + d.lines.find((l) => l.id === id)!.breakerA, 0);
      expect(r.ratingA).toBeGreaterThanOrEqual(Math.min(d.main.ratingA, sum));
    }
    expect(d.main).toMatchObject({ ratingA: 50, poles: 2, cableMm2: 10, relayA: 50 });
    expect(d.lines.every((l) => l.breakerA < d.main.ratingA)).toBe(true);
    expect(d.enclosure).toBeGreaterThanOrEqual(d.modules);
    expect(d.totals.connectedKw).toBe(28.5);
    expect(d.totals.demandKw).toBeLessThan(d.totals.connectedKw);
    expect(d.bom.find((b) => b.kind === 'rcbo')).toMatchObject({ qty: 2, ratingA: 16 });
    expect(d.bom.filter((b) => b.kind === 'bus')).toHaveLength(2);
  });

  it('3-phase board spreads the circuits over L1-L3', () => {
    const d = recommendPanel({ ...flat, phases: 3, allocatedKw: 15 });
    expect(d.main).toMatchObject({ ratingA: 25, poles: 4 });
    const loads = Object.values(d.phaseLoadA);
    expect(Math.max(...loads) - Math.min(...loads)).toBeLessThan(20);
    expect(new Set(d.lines.map((l) => l.phase)).size).toBe(3);
  });

  it('too much for the allocation is flagged', () => {
    const d = recommendPanel({ ...flat, allocatedKw: 5 });
    expect(d.totals.overAllocation).toBe(true);
  });
});

describe('board simulation', () => {
  const d = recommendPanel(flat);
  const s0 = initialState(d);

  it('switching a load on makes current flow; off main kills everything', () => {
    const s = { ...s0, load: { ...s0.load, ov: true } };
    expect(flow(d, flat, s).current.ov).toBeCloseTo(15.2, 1);
    expect(flow(d, flat, { ...s, main: false }).live.ov).toBe(false);
  });

  it('a short trips the circuit breaker instantly; overload trips it thermally', () => {
    const short = step(d, flat, { ...s0, load: { ...s0.load, s1: true }, fault: { ...s0.fault, s1: 'short' } });
    expect(short.state.breaker.s1).toBe(false);
    expect(short.events[0]).toMatchObject({ kind: 'mcb-short', lineId: 's1' });
    const over = step(d, flat, { ...s0, load: { ...s0.load, s2: true }, fault: { ...s0.fault, s2: 'overload' } });
    expect(over.state.breaker.s2).toBe(false);
    expect(over.events[0]).toMatchObject({ kind: 'mcb-overload', ratingA: 16 });
  });

  it('a leak trips the RCD (or the RCBO); an unprotected leak is reported as a danger', () => {
    const leak = step(d, flat, { ...s0, fault: { ...s0.fault, k1: 'leak' } });
    const rcd = d.lines.find((l) => l.id === 'k1')!.rcdId!;
    expect(leak.state.rcd[rcd]).toBe(false);
    const wm = step(d, flat, { ...s0, fault: { ...s0.fault, wm: 'leak' } });
    expect(wm.state.breaker.wm).toBe(false);
    const ac = step(d, flat, { ...s0, fault: { ...s0.fault, ac1: 'leak' } });
    expect(ac.events[0]).toMatchObject({ kind: 'leak-unprotected', lineId: 'ac1' });
  });

  it('everything on at once overloads the main breaker of a 10 kW flat', () => {
    const r = step(d, flat, allOn(d, s0));
    expect(r.state.main).toBe(false);
    expect(r.events[0]).toMatchObject({ kind: 'main-overload', ratingA: 50 });
  });

  it('the RCD test button trips it', () => {
    const r = testRcd(s0, d.rcds[0]!.id, d);
    expect(r.state.rcd[d.rcds[0]!.id]).toBe(false);
    expect(testRcd(r.state, d.rcds[0]!.id, d).events).toEqual([]);
  });
});

describe('junction box', () => {
  const box: BoxInput = {
    switches: [
      { id: 'a', keys: 2, lamps: [1, 1] },
      { id: 'b', keys: 2, lamps: [2, 1] },
      { id: 'c', keys: 1, lamps: [1] },
    ],
  };

  it('clamp sizes, including chains above five', () => {
    expect([2, 3, 4, 5, 6, 8, 9].map((n) => clampsFor(n))).toEqual([[2], [3], [5], [5], [5, 5], [5, 5], [5, 5, 5]]);
  });

  it('designed joins: L to every switch, N and PE to every lamp, each key to its lamps', () => {
    const d = designBox(box);
    expect(d.cables).toHaveLength(1 + 3 + 6);
    expect(d.groups.find((g) => g.kind === 'L')!.ends).toHaveLength(4);
    expect(d.groups.find((g) => g.kind === 'N')!.ends).toHaveLength(7);
    expect(d.groups.filter((g) => g.kind === 'key')).toHaveLength(5);
    expect(checkBox(box, d.groups.map((g) => g.ends))).toEqual({ ok: true, issues: [] });
  });

  it('a lamp lights only when its key is on', () => {
    const d = designBox(box);
    const joins = d.groups.map((g) => g.ends);
    const off = boxStatus(box, joins, { a: [false, false], b: [false, false], c: [false] });
    expect(Object.values(off.lit).every((v) => !v)).toBe(true);
    const on = boxStatus(box, joins, { a: [false, true], b: [false, false], c: [false] });
    expect(on.lit['lamp-a-2-1']).toBe(true);
    expect(on.lit['lamp-a-1-1']).toBe(false);
    expect(on.live.has('lamp-a-2-1:L')).toBe(true);
    expect(on.live.has('lamp-a-1-1:L')).toBe(false);
  });

  it('finds the classic mistakes', () => {
    const small: BoxInput = { switches: [{ id: 'a', keys: 2, lamps: [1, 1] }] };
    const good = designBox(small).groups.map((g) => g.ends);
    const without = (j: string[][], core: string) => j.map((g) => g.filter((e) => e !== core)).filter((g) => g.length);
    // phase straight to the lamp: always on, switch key unused
    const always = without(good, 'lamp-a-1-1:L').map((g) => (g.includes('in:L') ? [...g, 'lamp-a-1-1:L'] : g));
    const r1 = checkBox(small, always);
    expect(r1.issues.map((i) => i.code)).toEqual(['lamp-always']);
    // keys swapped
    const swapped = good.map((g) =>
      g.includes('sw-a:K1') ? g.map((e) => (e === 'sw-a:K1' ? 'sw-a:K2' : e)) : g.includes('sw-a:K2') ? g.map((e) => (e === 'sw-a:K2' ? 'sw-a:K1' : e)) : g,
    );
    expect(checkBox(small, swapped).issues).toContainEqual({ code: 'lamp-wrong-key', cableId: 'lamp-a-1-1', switchId: 'a', key: 2 });
    // switch fed from the neutral, lamps from the phase: works, but dangerous
    const swappedFeed = good.map((g) => g.map((e) => (e === 'in:L' ? 'in:N' : e === 'in:N' ? 'in:L' : e)));
    expect(checkBox(small, swappedFeed).issues.map((i) => i.code)).toContain('neutral-switched');
    // phase and neutral in one clamp
    const short = [...good.filter((g) => !g.includes('in:N')), [...good.find((g) => g.includes('in:N'))!, 'in:L']];
    expect(checkBox(small, short).issues[0]).toMatchObject({ code: 'short' });
    // earth forgotten on a lamp
    const noPe = without(good, 'lamp-a-2-1:PE');
    expect(checkBox(small, noPe).issues).toContainEqual({ code: 'no-earth', cableId: 'lamp-a-2-1' });
  });
});

describe('circuits from the drawn plan', async () => {
  const { linesFromProject } = await import('@/domain/wiring/fromProject');
  const { createEmptyProject } = await import('@/domain/project');
  const NOW = '2026-11-05T00:00:00.000Z';
  const room = (id: string, name: string, order: number) => ({
    id, name, order, color: '#000', shape: 'rect' as const, vertices: [], labelOffset: { x: 0, y: 0 },
    createdAt: NOW, updatedAt: NOW, deletedAt: null,
  });
  let n = 0;
  const pt = (roomId: string, symbolId: string) => ({
    id: `p${++n}`, symbolId, roomId, wallId: null, t: null, side: 1, x: 0, y: 0, mountHeightCm: 30,
    distanceFromCornerCm: null, description: '', color: '#000', label: null, status: 'pending', statusChangedAt: null,
    createdAt: NOW, updatedAt: NOW, deletedAt: null,
  });
  it('kitchen and bath get own circuits, rooms share up to 8 outlets, AC each, lights grouped', () => {
    const p = {
      ...createEmptyProject('x', 'X', NOW),
      rooms: [room('k', 'Oshxona', 0), room('b', 'Hammom', 1), room('z', 'Zal', 2), room('y', 'Yotoqxona', 3), room('m', 'Mehmonxona', 4)],
      points: [
        pt('k', 'socket-quad'), pt('k', 'socket-double'),
        pt('b', 'socket-single'),
        pt('z', 'socket-double'), pt('z', 'socket-double'), pt('z', 'socket-triple'),
        pt('y', 'socket-double'), pt('y', 'socket-double'),
        pt('m', 'socket-single'),
        pt('z', 'ac'), pt('y', 'ac'),
        ...Array.from({ length: 13 }, () => pt('z', 'ceiling-light')),
      ],
    } as unknown as import('@/domain/types').Project;
    let i = 0;
    const lines = linesFromProject(p, (t, d) => `${t}:${d}`, () => `id${i++}`);
    expect(lines.map((l) => l.name)).toEqual([
      'kitchen-sockets:Oshxona',
      'bathroom-sockets:Hammom',
      'sockets:Zal', // 7 outlets; Yotoqxona would make 11
      'sockets:Yotoqxona, Mehmonxona',
      'ac:Zal',
      'ac:Yotoqxona',
      'lighting:1',
      'lighting:2',
    ]);
  });
});
