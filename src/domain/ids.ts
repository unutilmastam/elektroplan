/**
 * UUID v7 (RFC 9562): 48-bit Unix ms timestamp + random bits. Time-sortable and safe to create offline.
 * `now` and `random` are injectable for tests.
 */
export function uuidv7(
  now: number = Date.now(),
  random: (bytes: Uint8Array) => Uint8Array = defaultRandom,
): string {
  const b = random(new Uint8Array(16));
  const ts = Math.max(0, Math.floor(now));
  b[0] = Math.floor(ts / 2 ** 40) & 0xff;
  b[1] = Math.floor(ts / 2 ** 32) & 0xff;
  b[2] = Math.floor(ts / 2 ** 24) & 0xff;
  b[3] = Math.floor(ts / 2 ** 16) & 0xff;
  b[4] = Math.floor(ts / 2 ** 8) & 0xff;
  b[5] = ts & 0xff;
  b[6] = 0x70 | (b[6]! & 0x0f); // version 7
  b[8] = 0x80 | (b[8]! & 0x3f); // variant 10xx
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function defaultRandom(bytes: Uint8Array): Uint8Array {
  return globalThis.crypto.getRandomValues(bytes);
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
