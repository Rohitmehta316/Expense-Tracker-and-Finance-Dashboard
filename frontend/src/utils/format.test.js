import { describe, expect, it } from 'vitest';
import { currency, day } from './format.js';

describe('finance formatting', () => {
  it('formats INR and does not add decimal places to whole values', () => {
    expect(currency(12345, 'INR')).toContain('12,345');
    expect(currency(0, 'INR')).toContain('0');
  });

  it('formats valid dates and handles missing dates', () => {
    expect(day('2026-11-21T12:00:00.000Z')).toMatch(/21 Nov 2026/);
    expect(day(null)).toBe('—');
  });
});
