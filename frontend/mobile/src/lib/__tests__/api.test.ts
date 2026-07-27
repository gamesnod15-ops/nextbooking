import { fixImageUrl } from '../api';

describe('fixImageUrl', () => {
  it('returns an empty string for null/undefined/empty input', () => {
    expect(fixImageUrl(null)).toBe('');
    expect(fixImageUrl(undefined)).toBe('');
    expect(fixImageUrl('')).toBe('');
  });

  it('leaves non-localhost URLs untouched', () => {
    expect(fixImageUrl('https://cdn.example.com/logo.png')).toBe('https://cdn.example.com/logo.png');
  });

  it('replaces a bare http://localhost origin', () => {
    const result = fixImageUrl('http://localhost/uploads/logo.png');
    expect(result).not.toContain('localhost');
    expect(result).toContain('/uploads/logo.png');
  });

  it('replaces a http://localhost:PORT origin, case-insensitively', () => {
    const result = fixImageUrl('HTTP://LOCALHOST:5280/uploads/a.jpg');
    expect(result.toLowerCase()).not.toContain('localhost');
    expect(result).toContain('/uploads/a.jpg');
  });
});
