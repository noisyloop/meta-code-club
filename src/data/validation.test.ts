import {describe, expect, it} from 'vitest';
import {validateMember, wouldCreateMentorCycle, type MemberDraft} from './validation';
import {createSeed} from './seed';

const NOW = new Date('2026-11-09T12:00:00Z');
const {members} = createSeed(NOW);
const ok: MemberDraft = {name: 'Zed Zane', skillLevel: 'beginner', languages: ['Go'], joinedAt: '2026-10-01', attendanceStreak: 0};

describe('validateMember', () => {
  it('accepts a valid draft', () => expect(validateMember(ok, members, undefined, NOW)).toEqual({}));
  it('requires name, languages and a sane streak', () => {
    const e = validateMember({...ok, name: ' ', languages: [], attendanceStreak: -1}, members, undefined, NOW);
    expect(Object.keys(e).sort()).toEqual(['attendanceStreak', 'languages', 'name']);
  });
  it('rejects duplicate names except for the member being edited', () => {
    expect(validateMember({...ok, name: 'ada okafor'}, members, undefined, NOW).name).toMatch(/already exists/);
    expect(validateMember({...ok, name: 'Ada Okafor'}, members, 'mem-1', NOW).name).toBeUndefined();
  });
  it('rejects future join dates and fractional streaks', () => {
    expect(validateMember({...ok, joinedAt: '2027-01-01'}, members, undefined, NOW).joinedAt).toMatch(/future/);
    expect(validateMember({...ok, attendanceStreak: 1.5}, members, undefined, NOW).attendanceStreak).toBeDefined();
  });
  it('blocks self-mentoring and mentor loops', () => {
    expect(validateMember({...ok, mentorId: 'mem-1'}, members, 'mem-1', NOW).mentorId).toMatch(/themselves/);
    // mem-2 is mentored by mem-1 and mem-3 by mem-2, so mem-1 may take neither as mentor
    expect(wouldCreateMentorCycle(members, 'mem-1', 'mem-2')).toBe(true);
    expect(wouldCreateMentorCycle(members, 'mem-1', 'mem-4')).toBe(false);
    expect(wouldCreateMentorCycle(members, 'mem-1', 'mem-3')).toBe(true);
    expect(validateMember({...ok, name: 'Ada Okafor', mentorId: 'mem-3'}, members, 'mem-1', NOW).mentorId).toMatch(/loop/);
  });
});
