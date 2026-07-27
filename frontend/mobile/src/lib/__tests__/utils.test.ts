import { initials, formatCurrency, appointmentLocalDate, formatAppointmentTime, formatDate, formatAppointmentDate, cn } from '../utils';

describe('initials', () => {
  it('takes the first letter of the first two words, uppercased', () => {
    expect(initials('Ahmet Yılmaz')).toBe('AY');
    expect(initials('doğan aras')).toBe('DA');
  });

  it('handles a single word', () => {
    expect(initials('Ahmet')).toBe('A');
  });

  it('ignores words past the second', () => {
    expect(initials('Ali Veli Deli')).toBe('AV');
  });

  it('returns a placeholder for empty input', () => {
    expect(initials('')).toBe('?');
    expect(initials(null)).toBe('?');
    expect(initials(undefined)).toBe('?');
  });
});

describe('formatCurrency', () => {
  it('prefixes the lira sign', () => {
    expect(formatCurrency(0)).toContain('₺');
    expect(formatCurrency(1500)).toContain('₺');
  });

  it('keeps whole numbers without forced decimals', () => {
    expect(formatCurrency(250)).toBe('₺250');
  });
});

describe('appointment time handling', () => {
  // Appointment times are Turkey wall-clock tagged as +00:00, so they must be
  // read as UTC components rather than converted to the device timezone.
  it('reads the stored hour regardless of device timezone', () => {
    const iso = '2026-07-26T14:30:00+00:00';
    const d = appointmentLocalDate(iso);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });

  it('formats to HH:mm', () => {
    expect(formatAppointmentTime('2026-07-26T09:05:00+00:00')).toBe('09:05');
    expect(formatAppointmentTime('2026-07-26T17:00:00+00:00')).toBe('17:00');
  });
});

describe('formatDate', () => {
  it('labels today, tomorrow and yesterday in Turkish', () => {
    const now = new Date();
    const iso = now.toISOString();
    expect(formatDate(iso)).toBe('Bugün');

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatDate(tomorrow.toISOString())).toBe('Yarın');

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDate(yesterday.toISOString())).toBe('Dün');
  });

  it('falls back to a day-month-year format further out', () => {
    // Far enough from "today" in any timezone the tests run in.
    expect(formatDate('2020-03-15T12:00:00.000Z')).toBe('15 Mar 2020');
  });
});

describe('formatAppointmentDate', () => {
  it('reads the stored date as UTC components, not the device timezone', () => {
    expect(formatAppointmentDate('2020-03-15T12:00:00+00:00')).toBe('15 Mar 2020');
  });
});

describe('cn', () => {
  it('joins truthy class names with a space', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(cn(undefined, null, false)).toBe('');
  });
});
