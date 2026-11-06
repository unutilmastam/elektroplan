/**
 * PHASE 21 — reference data for the wiring module (residential, copper, hidden wiring, TN-C-S, 230/400 V).
 * Values follow common PUE practice for apartments and houses; the app recommends, the electrician decides.
 */

export type ConsumerType =
  | 'lighting'
  | 'sockets'
  | 'kitchen-sockets'
  | 'bathroom-sockets'
  | 'oven'
  | 'stove'
  | 'ac'
  | 'boiler'
  | 'washer'
  | 'dishwasher'
  | 'warm-floor'
  | 'outdoor'
  | 'fridge'
  | 'microwave'
  | 'pump'
  | 'heater'
  | 'ev-charger'
  | 'custom';

export interface ConsumerSpec {
  /** design power of one circuit, W */
  powerW: number;
  cosPhi: number;
  /** simultaneity (demand) factor for the whole-board estimate */
  demand: number;
  /** smallest breaker for this circuit (socket outlets are 16 A devices) */
  minBreaker: number;
  /** largest breaker before the circuit should be split */
  maxBreaker: number;
  curve: 'B' | 'C';
  /** 'rcd' = behind a shared 30 mA RCD; 'rcbo' = own differential breaker; 'none' */
  protection: 'rcd' | 'rcbo' | 'none';
}

export const CONSUMERS: Record<ConsumerType, ConsumerSpec> = {
  lighting: {
    powerW: 800,
    cosPhi: 0.95,
    demand: 0.9,
    minBreaker: 10,
    maxBreaker: 10,
    curve: 'B',
    protection: 'none',
  },
  sockets: {
    powerW: 2500,
    cosPhi: 0.95,
    demand: 0.35,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcd',
  },
  'kitchen-sockets': {
    powerW: 3000,
    cosPhi: 0.95,
    demand: 0.5,
    minBreaker: 16,
    maxBreaker: 20,
    curve: 'C',
    protection: 'rcd',
  },
  'bathroom-sockets': {
    powerW: 2000,
    cosPhi: 0.95,
    demand: 0.4,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcbo',
  },
  oven: {
    powerW: 3500,
    cosPhi: 1,
    demand: 0.7,
    minBreaker: 16,
    maxBreaker: 25,
    curve: 'C',
    protection: 'rcd',
  },
  stove: {
    powerW: 7000,
    cosPhi: 1,
    demand: 0.65,
    minBreaker: 25,
    maxBreaker: 40,
    curve: 'C',
    protection: 'rcd',
  },
  ac: {
    powerW: 2500,
    cosPhi: 0.85,
    demand: 0.8,
    minBreaker: 16,
    maxBreaker: 25,
    curve: 'C',
    protection: 'none',
  },
  boiler: {
    powerW: 2000,
    cosPhi: 1,
    demand: 0.8,
    minBreaker: 16,
    maxBreaker: 25,
    curve: 'C',
    protection: 'rcbo',
  },
  washer: {
    powerW: 2200,
    cosPhi: 0.9,
    demand: 0.6,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcbo',
  },
  dishwasher: {
    powerW: 2000,
    cosPhi: 0.95,
    demand: 0.6,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcd',
  },
  'warm-floor': {
    powerW: 1500,
    cosPhi: 1,
    demand: 0.8,
    minBreaker: 16,
    maxBreaker: 25,
    curve: 'C',
    protection: 'rcd',
  },
  outdoor: {
    powerW: 1500,
    cosPhi: 0.95,
    demand: 0.5,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcbo',
  },
  // PHASE 22
  fridge: {
    powerW: 400,
    cosPhi: 0.8,
    demand: 0.9,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcd',
  },
  microwave: {
    powerW: 1600,
    cosPhi: 0.95,
    demand: 0.4,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcd',
  },
  pump: {
    powerW: 1100,
    cosPhi: 0.8,
    demand: 0.7,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcbo',
  },
  heater: {
    powerW: 2000,
    cosPhi: 1,
    demand: 0.8,
    minBreaker: 16,
    maxBreaker: 16,
    curve: 'C',
    protection: 'rcd',
  },
  'ev-charger': {
    powerW: 7400,
    cosPhi: 1,
    demand: 1,
    minBreaker: 32,
    maxBreaker: 40,
    curve: 'C',
    protection: 'rcbo',
  },
  custom: {
    powerW: 2000,
    cosPhi: 0.95,
    demand: 0.6,
    minBreaker: 10,
    maxBreaker: 63,
    curve: 'C',
    protection: 'rcd',
  },
};

export const CONSUMER_TYPES = Object.keys(CONSUMERS) as ConsumerType[];

/** Standard MCB / RCD ratings, A. */
export const BREAKERS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100] as const;
export const RCD_RATINGS = [25, 40, 63, 80, 100] as const;
export const ENCLOSURES = [8, 12, 18, 24, 36, 48, 54, 72] as const;

/** Copper cable for a breaker (hidden wiring): the breaker protects the cable. */
const CABLE_FOR_BREAKER: Array<[number, number]> = [
  [10, 1.5],
  [20, 2.5],
  [25, 4],
  [32, 6],
  [50, 10],
  [63, 16],
  [80, 25],
  [100, 35],
];

export function cableFor(breakerA: number): number {
  for (const [a, mm2] of CABLE_FOR_BREAKER) if (breakerA <= a) return mm2;
  return 50;
}

export const nextStandard = (list: readonly number[], min: number) =>
  list.find((v) => v >= min - 1e-9) ?? list[list.length - 1]!;

/** Standard rating closest to `amps` (used for the supply: the utility's allocation sets it). */
export const nearestStandard = (list: readonly number[], amps: number) =>
  list.reduce((best, v) => (Math.abs(v - amps) < Math.abs(best - amps) ? v : best), list[0]!);

export const VOLT = 230;
export const VOLT_3P = 400;

/** Wire colours (IEC 60445). */
export const WIRE = {
  L: '#a0522d', // brown
  L2: '#1f1f1f', // black
  L3: '#9ca3af', // grey
  N: '#2f7bff', // blue
  PE: '#f2d21b', // yellow-green (stripes drawn by the view)
  S1: '#1f1f1f',
  S2: '#9ca3af',
  S3: '#e5e7eb', // white
} as const;
export type WireRole = keyof typeof WIRE;
