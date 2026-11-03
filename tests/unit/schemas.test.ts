import { describe, expect, expectTypeOf, it } from 'vitest';
import type { z } from 'zod';
import { createEmptyProject } from '@/domain/project';
import { ProjectSchema, validateProjectInfo } from '@/domain/schemas';
import type { Project } from '@/domain/types';
import { buildDemoProject } from '@/features/dashboard/demoProject';
import { uz } from '@/i18n/uz';

describe('validateProjectInfo', () => {
  it('trims and accepts a valid form', () => {
    expect(validateProjectInfo({ name: '  Uy  ', customerName: ' Ali ', address: '' })).toEqual({
      ok: true,
      data: { name: 'Uy', customerName: 'Ali', address: '' },
    });
  });
  it('requires a name (whitespace only is empty)', () => {
    expect(validateProjectInfo({ name: '   ', customerName: '', address: '' })).toEqual({
      ok: false,
      errors: { name: 'name_required' },
    });
  });
  it('reports length limits per field', () => {
    const r = validateProjectInfo({
      name: 'x'.repeat(121),
      customerName: 'y'.repeat(121),
      address: 'z'.repeat(201),
    });
    expect(r).toEqual({
      ok: false,
      errors: { name: 'name_too_long', customerName: 'customer_too_long', address: 'address_too_long' },
    });
  });
  it('rejects non-object input', () => {
    expect(validateProjectInfo(null).ok).toBe(false);
  });
  it('has an Uzbek message for every code', () => {
    for (const code of ['name_required', 'name_too_long', 'customer_too_long', 'address_too_long'] as const) {
      expect(uz.validation[code].length).toBeGreaterThan(0);
    }
  });
});

describe('ProjectSchema', () => {
  it('matches the domain Project type', () => {
    expectTypeOf<z.infer<typeof ProjectSchema>>().toEqualTypeOf<Project>();
  });
  it('accepts empty and demo projects', () => {
    expect(ProjectSchema.safeParse(createEmptyProject('p1', 'Uy', '2026-01-01T00:00:00.000Z')).success).toBe(
      true,
    );
    expect(ProjectSchema.safeParse(buildDemoProject()).success).toBe(true);
  });
  it('defaults missing openings (older records)', () => {
    const { openings: _drop, ...old } = createEmptyProject('p1', 'Uy', '2026-01-01T00:00:00.000Z');
    void _drop;
    const r = ProjectSchema.safeParse(old);
    expect(r.success && r.data.openings).toEqual([]);
  });
  it('rejects corrupted records', () => {
    const p = createEmptyProject('p1', 'Uy', '2026-01-01T00:00:00.000Z');
    expect(ProjectSchema.safeParse({ ...p, revision: -1 }).success).toBe(false);
    expect(ProjectSchema.safeParse({ ...p, rooms: [{ id: 'r' }] }).success).toBe(false);
    expect(
      ProjectSchema.safeParse({ ...p, points: [{ ...buildDemoProject().points[0], symbolId: 'x' }] }).success,
    ).toBe(false);
    expect(ProjectSchema.safeParse('nope').success).toBe(false);
  });
});
