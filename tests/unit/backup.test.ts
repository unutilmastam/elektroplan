import { describe, expect, it } from 'vitest';
import { backupFileName, buildBackup, parseBackup, planImport, BACKUP_FORMAT } from '@/domain/backup';
import { createProject, deleteProject } from '@/domain/commands';
import { detectPlatform, shouldShowIosHint } from '@/domain/platform';
import { buildDemoProject } from '@/features/dashboard/demoProject';

const T0 = '2026-11-03T10:00:00.000Z';
const T1 = '2026-11-03T11:00:00.000Z';
const T2 = '2026-11-03T12:00:00.000Z';
const mk = (id: string, name = id, at = T0) => ({
  ...createProject({ name, customerName: '', address: '' }, id, at),
});

describe('backup file', () => {
  it('round-trips projects (with plan, points, montaj log) through JSON + zod', () => {
    const demo = buildDemoProject();
    const file = buildBackup([demo, mk('b')], T1);
    const r = parseBackup(JSON.stringify(file));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.file.format).toBe(BACKUP_FORMAT);
    expect(r.file.projects).toEqual([demo, mk('b')]);
  });

  it('leaves soft-deleted projects out', () => {
    const file = buildBackup([mk('a'), deleteProject(mk('b'), T1)], T1);
    expect(file.projects.map((p) => p.id)).toEqual(['a']);
  });

  it('refuses non-JSON, foreign JSON, empty and tampered files', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, error: 'invalid_json' });
    expect(parseBackup('{"a":1}')).toEqual({ ok: false, error: 'invalid_file' });
    expect(parseBackup(JSON.stringify({ ...buildBackup([mk('a')], T1), projects: [] }))).toEqual({
      ok: false,
      error: 'empty',
    });
    const bad = buildBackup([mk('a')], T1) as unknown as { projects: Array<Record<string, unknown>> };
    bad.projects[0]!.rooms = [{ id: 1 }];
    expect(parseBackup(JSON.stringify(bad))).toEqual({ ok: false, error: 'invalid_file' });
    expect(parseBackup(JSON.stringify({ ...buildBackup([mk('a')], T1), version: 2 })).ok).toBe(false);
  });

  it('makes a safe file name and keeps Uzbek letters', () => {
    expect(backupFileName('Uy: Chilonzor / 5', T1)).toBe('Uy-Chilonzor-5-2026-11-03.elektroplan.json');
    expect(backupFileName('O‘zbekiston', T1)).toBe('O-zbekiston-2026-11-03.elektroplan.json');
    expect(backupFileName('***', T1)).toBe('ElektroPlan-2026-11-03.elektroplan.json');
  });
});

describe('planImport', () => {
  it('adds new projects, updates older local copies, never overwrites equal or newer local work', () => {
    const local = [mk('same', 'S', T1), mk('older', 'O', T0), mk('newer', 'N', T2)];
    const incoming = [
      mk('same', 'S', T1),
      mk('older', 'O2', T1),
      mk('newer', 'N-old', T1),
      mk('fresh', 'F', T1),
    ];
    const plan = planImport(local, incoming);
    expect(plan).toMatchObject({ added: 1, updated: 1, skipped: 2 });
    expect(plan.write.map((p) => [p.id, p.name])).toEqual([
      ['older', 'O2'],
      ['fresh', 'F'],
    ]);
  });

  it('brings back a project deleted on this device and keeps the higher revision', () => {
    const del = { ...deleteProject(mk('a', 'A', T0), T2), revision: 7 };
    const plan = planImport([del], [mk('a', 'A', T1)]);
    expect(plan.added).toBe(1);
    expect(plan.write[0]).toMatchObject({ id: 'a', deletedAt: null, revision: 7 });
  });

  it('ignores duplicates inside one file', () => {
    expect(planImport([], [mk('a'), mk('a')]).write).toHaveLength(1);
  });
});

describe('platform', () => {
  const ipadOs =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
  it('detects iPhone, iPadOS (desktop UA + touch), Android and desktop', () => {
    expect(detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5)).toBe('ios');
    expect(detectPlatform(ipadOs, 5)).toBe('ios');
    expect(detectPlatform(ipadOs, 0)).toBe('desktop'); // a real Mac
    expect(detectPlatform('Mozilla/5.0 (Linux; Android 14; Pixel 7)', 5)).toBe('android');
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130', 10)).toBe('desktop');
  });
  it('shows the iOS Home Screen hint once, only in the browser', () => {
    expect(shouldShowIosHint('ios', false, false)).toBe(true);
    expect(shouldShowIosHint('ios', true, false)).toBe(false);
    expect(shouldShowIosHint('ios', false, true)).toBe(false);
    expect(shouldShowIosHint('android', false, false)).toBe(false);
  });
});
