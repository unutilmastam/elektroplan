import { describe, expect, it } from 'vitest';
import { UUID_RE, uuidv7 } from '@/domain/ids';

describe('uuidv7', () => {
  it('is a valid v7 uuid', () => {
    const id = uuidv7();
    expect(id).toMatch(UUID_RE);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });
  it('encodes the timestamp so ids sort by creation time', () => {
    const zero = (b: Uint8Array) => b.fill(0);
    const a = uuidv7(1_700_000_000_000, zero);
    const b = uuidv7(1_700_000_000_001, zero);
    expect(a < b).toBe(true);
    expect(a.slice(0, 13)).toBe('018bcfe5-6800');
  });
  it('is unique across many calls', () => {
    expect(new Set(Array.from({ length: 2000 }, () => uuidv7())).size).toBe(2000);
  });
});
