/**
 * Labels and point badges keep a readable on-screen size: they scale with the plan only within limits.
 * k = world-units multiplier for decorations at a given zoom.
 */
export function decorationK(scale: number): number {
  return Math.min(Math.max(scale, 0.45), 1.2) / scale;
}

/** Point badges may shrink further than labels when zoomed far out (phones), so a whole plan stays readable. */
export function pointK(scale: number): number {
  return Math.min(Math.max(scale, 0.34), 1.2) / scale;
}

export const POINT_BADGE = 25;

/** Half badge size in world units (for hit testing). */
export function pointRadiusWorld(scale: number): number {
  return (POINT_BADGE * pointK(scale)) / 2;
}

/** Extra pick radius in screen px by input type. */
export const PICK_PX = { mouse: 6, pen: 10, touch: 22 } as const;
