import { z } from 'zod';

/**
 * Zod schemas for every external input (forms, IndexedDB reads, later API bodies).
 * Error messages are stable CODES (not text) so the domain stays UI-free;
 * the UI maps them through `uz.validation`.
 */
export const VALIDATION_CODES = [
  'name_required',
  'name_too_long',
  'customer_too_long',
  'address_too_long',
] as const;
export type ValidationCode = (typeof VALIDATION_CODES)[number];

export const LIMITS = { name: 120, customer: 120, address: 200 } as const;

export const ProjectInfoSchema = z.object({
  name: z.string().trim().min(1, { error: 'name_required' }).max(LIMITS.name, { error: 'name_too_long' }),
  customerName: z.string().trim().max(LIMITS.customer, { error: 'customer_too_long' }),
  address: z.string().trim().max(LIMITS.address, { error: 'address_too_long' }),
});
export type ProjectInfo = z.infer<typeof ProjectInfoSchema>;

const isoDate = z.string().min(1);
const timestamps = { createdAt: isoDate, updatedAt: isoDate, deletedAt: isoDate.nullable() };
const finite = z.number().refine(Number.isFinite);

export const Vec2Schema = z.object({ x: finite, y: finite });

export const SymbolIdSchema = z.enum([
  'socket-single',
  'socket-double',
  'socket-triple',
  'switch-single',
  'switch-double',
  'internet',
  'tv',
  'ceiling-light',
  'led',
  'ac',
  'custom',
]);

export const RoomSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  color: z.string(),
  shape: z.enum(['rect', 'square', 'polygon']),
  vertices: z.array(Vec2Schema),
  labelOffset: Vec2Schema,
  order: z.number().int(),
  ...timestamps,
});

export const WallSchema = z.object({
  id: z.string().min(1),
  a: Vec2Schema,
  b: Vec2Schema,
  thickness: finite,
  roomIds: z.array(z.string()).max(2),
  name: z.string().nullable(),
  ...timestamps,
});

export const OpeningSchema = z.object({
  id: z.string().min(1),
  wallId: z.string().min(1),
  kind: z.enum(['door', 'window']),
  t: z.number().min(0).max(1),
  width: finite,
  swing: z.union([z.literal(1), z.literal(-1)]),
});

export const PointSchema = z.object({
  id: z.string().min(1),
  symbolId: SymbolIdSchema,
  roomId: z.string().min(1),
  wallId: z.string().nullable(),
  t: z.number().min(0).max(1).nullable(),
  side: z.union([z.literal(1), z.literal(-1)]),
  x: finite,
  y: finite,
  mountHeightCm: finite.nullable(),
  distanceFromCornerCm: finite.nullable(),
  description: z.string(),
  color: z.string(),
  label: z.string().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed']),
  statusChangedAt: isoDate.nullable(),
  ...timestamps,
});

const StatusSchema = z.enum(['pending', 'in_progress', 'completed']);

export const InstallationTaskSchema = z.object({
  id: z.string().min(1),
  pointId: z.string().min(1),
  userId: z.string().nullable(),
  fromStatus: StatusSchema,
  toStatus: StatusSchema,
  createdAt: isoDate,
});

export const ProjectSettingsSchema = z.object({
  gridSize: z.number().positive(),
  snapToGrid: z.boolean(),
  defaultSocketHeightCm: finite,
  defaultSwitchHeightCm: finite,
  wallDisplayHeightCm: z.number().positive(),
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().nullable(),
  name: z.string(),
  customerName: z.string(),
  address: z.string(),
  revision: z.number().int().nonnegative(),
  rooms: z.array(RoomSchema),
  walls: z.array(WallSchema),
  points: z.array(PointSchema),
  openings: z.array(OpeningSchema).default([]),
  installLog: z.array(InstallationTaskSchema).default([]),
  settings: ProjectSettingsSchema,
  ...timestamps,
});

export type FieldErrors = Partial<Record<keyof ProjectInfo, ValidationCode>>;

/** Validates the project form. Returns trimmed data or one error code per field. */
export function validateProjectInfo(
  input: unknown,
): { ok: true; data: ProjectInfo } | { ok: false; errors: FieldErrors } {
  const r = ProjectInfoSchema.safeParse(input);
  if (r.success) return { ok: true, data: r.data };
  const errors: FieldErrors = {};
  for (const issue of r.error.issues) {
    const field = issue.path[0];
    const code = VALIDATION_CODES.find((c) => c === issue.message);
    if ((field === 'name' || field === 'customerName' || field === 'address') && code && !errors[field]) {
      errors[field] = code;
    }
  }
  return { ok: false, errors };
}

/** Per-device preferences (IndexedDB meta, not synced). */
export const DeviceSettingsSchema = z.object({
  /** Apple Pencil / stylus draws; one finger only selects and pans */
  penOnly: z.boolean().default(false),
  /** straighten freehand room sketches automatically */
  autoStraighten: z.boolean().default(true),
  /** PHASE 18: wall lengths on the plan (always shown while drawing) */
  showDimensions: z.boolean().default(true),
});
export type DeviceSettings = z.infer<typeof DeviceSettingsSchema>;
export const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  penOnly: false,
  autoStraighten: true,
  showDimensions: true,
};
