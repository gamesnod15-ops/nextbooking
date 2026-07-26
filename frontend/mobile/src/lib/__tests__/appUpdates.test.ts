import { isVersionOlder } from '../appUpdates';

describe('isVersionOlder', () => {
  it('treats an identical version as not older', () => {
    expect(isVersionOlder('1.2.3', '1.2.3')).toBe(false);
  });

  it('detects an older patch, minor and major', () => {
    expect(isVersionOlder('1.2.2', '1.2.3')).toBe(true);
    expect(isVersionOlder('1.1.9', '1.2.0')).toBe(true);
    expect(isVersionOlder('0.9.9', '1.0.0')).toBe(true);
  });

  it('detects a newer version as not older', () => {
    expect(isVersionOlder('1.3.0', '1.2.9')).toBe(false);
    expect(isVersionOlder('2.0.0', '1.9.9')).toBe(false);
  });

  it('compares numerically, not lexically', () => {
    // "10" < "9" as strings, so a naive compare would get this backwards.
    expect(isVersionOlder('1.9.0', '1.10.0')).toBe(true);
    expect(isVersionOlder('1.10.0', '1.9.0')).toBe(false);
    expect(isVersionOlder('1.2.10', '1.2.9')).toBe(false);
  });

  it('handles differing segment counts', () => {
    expect(isVersionOlder('1.2', '1.2.1')).toBe(true);
    expect(isVersionOlder('1.2.0', '1.2')).toBe(false);
    expect(isVersionOlder('1', '1.0.0')).toBe(false);
  });

  it('treats unparseable segments as zero rather than throwing', () => {
    expect(() => isVersionOlder('1.x.0', '1.0.0')).not.toThrow();
    expect(isVersionOlder('1.x.0', '1.1.0')).toBe(true);
  });
});
