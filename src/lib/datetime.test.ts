import {describe, expect, it} from 'vitest';
import {fromLocalInput, toLocalInput} from './datetime';

describe('datetime helpers', () => {
  it('round-trips an instant at minute precision', () => {
    const iso = '2026-11-13T18:30:00.000Z';
    expect(fromLocalInput(toLocalInput(iso))).toBe(iso);
  });
  it('formats as YYYY-MM-DDTHH:MM', () => expect(toLocalInput('2026-11-13T18:30:00.000Z')).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/));
  it('returns empty string for empty or invalid input', () => {
    expect(fromLocalInput(undefined)).toBe('');
    expect(fromLocalInput('')).toBe('');
    expect(fromLocalInput('not a date')).toBe('');
  });
});
