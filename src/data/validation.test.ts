import {describe, expect, it} from 'vitest';
import {
  isHttpUrl,
  validateChallenge,
  validateMember,
  validateProject,
  validateSubmission,
  wouldCreateMentorCycle,
  type ChallengeDraft,
  type MemberDraft,
  type ProjectDraft,
} from './validation';
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

const {challenges} = createSeed(NOW);

describe('validateChallenge', () => {
  const okC: ChallengeDraft = {title: 'New Puzzle', prompt: 'Solve the puzzle in any language.', difficulty: 'easy', dueDate: '2026-12-01T23:59:59.000Z', hints: ['Think small']};
  it('accepts a valid draft', () => expect(validateChallenge(okC, challenges)).toEqual({}));
  it('requires title, prompt and a due date', () => {
    const e = validateChallenge({...okC, title: '', prompt: '', dueDate: ''}, challenges);
    expect(Object.keys(e).sort()).toEqual(['dueDate', 'prompt', 'title']);
  });
  it('rejects duplicate titles except when editing that challenge', () => {
    expect(validateChallenge({...okC, title: 'fizzbuzz reloaded'}, challenges).title).toMatch(/already exists/);
    expect(validateChallenge({...okC, title: 'FizzBuzz Reloaded'}, challenges, 'chal-1').title).toBeUndefined();
  });
  it('limits hints and ignores blank ones', () => {
    expect(validateChallenge({...okC, hints: ['', '  ']}, challenges)).toEqual({});
    expect(validateChallenge({...okC, hints: ['a', 'b', 'c', 'd', 'e', 'f']}, challenges).hints).toMatch(/at most 5/);
    expect(validateChallenge({...okC, hints: ['x'.repeat(301)]}, challenges).hints).toMatch(/300/);
  });
});

describe('validateProject', () => {
  const okP: ProjectDraft = {memberId: 'mem-1', title: 'Thing', description: 'A thing that does stuff.', techStack: ['Go'], repoUrl: 'https://github.com/a/b', status: 'idea'};
  it('accepts a valid draft with and without a demo URL', () => {
    expect(validateProject(okP, members)).toEqual({});
    expect(validateProject({...okP, demoUrl: 'https://demo.example.com'}, members)).toEqual({});
    expect(validateProject({...okP, demoUrl: ''}, members)).toEqual({});
  });
  it('flags every missing/invalid field', () => {
    const e = validateProject({...okP, memberId: '', title: '', description: 'short', techStack: [], repoUrl: 'nope', demoUrl: 'ftp://x.y'}, members);
    expect(Object.keys(e).sort()).toEqual(['demoUrl', 'description', 'memberId', 'repoUrl', 'techStack', 'title']);
  });
  it('rejects unknown owners', () => expect(validateProject({...okP, memberId: 'ghost'}, members).memberId).toMatch(/no longer/));
  it('isHttpUrl only accepts http(s) URLs with a dotted host', () => {
    expect(isHttpUrl('https://github.com/x')).toBe(true);
    expect(['javascript:alert(1)', 'github.com/x', 'https://localhost', ''].some(isHttpUrl)).toBe(false);
  });
});

import {errorsForStep, validateMeetup, type MeetupDraft} from './validation';
describe('validateMeetup', () => {
  const okM: MeetupDraft = {date: '2026-12-01T18:00:00.000Z', topic: 'Intro to SQL', hostId: 'mem-4', agenda: ['Welcome'], attendeeIds: []};
  it('accepts a valid draft', () => expect(validateMeetup(okM, members)).toEqual({}));
  it('flags every missing field', () => {
    const e = validateMeetup({...okM, date: '', topic: '', hostId: '', agenda: ['', ' ']}, members);
    expect(Object.keys(e).sort()).toEqual(['agenda', 'date', 'hostId', 'topic']);
  });
  it('rejects unknown hosts and oversized agendas', () => {
    expect(validateMeetup({...okM, hostId: 'ghost'}, members).hostId).toMatch(/no longer/);
    expect(validateMeetup({...okM, agenda: Array.from({length: 11}, (_, i) => `Item ${i}`)}, members).agenda).toMatch(/at most 10/);
    expect(validateMeetup({...okM, agenda: ['x'.repeat(121)]}, members).agenda).toMatch(/120/);
  });
  it('scopes errors to wizard steps', () => {
    const e = validateMeetup({...okM, topic: '', agenda: []}, members);
    expect(errorsForStep(e, 0)).toEqual(['topic']);
    expect(errorsForStep(e, 1)).toEqual(['agenda']);
    expect(errorsForStep(e, 2).sort()).toEqual(['agenda', 'topic']);
  });
});

describe('validateSubmission', () => {
  const {submissions} = createSeed(NOW);
  const okS = {memberId: 'mem-3', repoUrl: 'https://github.com/a/b'};
  it('accepts a new member with a valid repo URL', () => expect(validateSubmission(okS, 'chal-4', members, submissions)).toEqual({}));
  it('requires a member and a repo URL', () => {
    const e = validateSubmission({memberId: '', repoUrl: ' '}, 'chal-4', members, submissions);
    expect(Object.keys(e).sort()).toEqual(['memberId', 'repoUrl']);
  });
  it('rejects unsafe or malformed URLs', () => {
    for (const bad of ['javascript:alert(1)', 'github.com/x', 'ftp://x.y']) {
      expect(validateSubmission({...okS, repoUrl: bad}, 'chal-4', members, submissions).repoUrl).toMatch(/full URL/);
    }
  });
  it('blocks a second submission by the same member, except when editing that submission', () => {
    // mem-8 already submitted chal-4 (sub-17)
    expect(validateSubmission({...okS, memberId: 'mem-8'}, 'chal-4', members, submissions).memberId).toMatch(/already submitted/);
    expect(validateSubmission({...okS, memberId: 'mem-8'}, 'chal-4', members, submissions, 'sub-17')).toEqual({});
    // the same member may submit a different challenge
    expect(validateSubmission({...okS, memberId: 'mem-8'}, 'chal-6', members, submissions)).toEqual({});
  });
  it('rejects unknown members', () => expect(validateSubmission({...okS, memberId: 'ghost'}, 'chal-4', members, submissions).memberId).toMatch(/no longer/));
});
