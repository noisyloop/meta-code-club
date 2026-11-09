import {describe, expect, it} from 'vitest';
import {isChallenge, isMeetup, isMember, isProject, isSubmission} from './guards';
import {createSeed} from './seed';
import {createLocalStorageStore, type StorageLike} from './store';

const seed = createSeed(new Date('2026-11-09T12:00:00Z'));
const mem = (): StorageLike & {data: Map<string, string>} => {
  const data = new Map<string, string>();
  return {data, getItem: k => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: k => void data.delete(k)};
};

describe('guards', () => {
  it('accept every seed row', () => {
    expect(seed.members.every(isMember)).toBe(true);
    expect(seed.challenges.every(isChallenge)).toBe(true);
    expect(seed.submissions.every(isSubmission)).toBe(true);
    expect(seed.projects.every(isProject)).toBe(true);
    expect(seed.meetups.every(isMeetup)).toBe(true);
  });
  it('reject wrong shapes and types', () => {
    expect(isMember({...seed.members[0], skillLevel: 'wizard'})).toBe(false);
    expect(isMember({...seed.members[0], languages: 'Go'})).toBe(false);
    expect(isMember({...seed.members[0], attendanceStreak: NaN})).toBe(false);
    expect(isMember(null)).toBe(false);
    expect(isMember([])).toBe(false);
    expect(isProject({...seed.projects[0], techStack: [1, 2]})).toBe(false);
    expect(isMeetup({...seed.meetups[0], date: 'nope'})).toBe(false);
    expect(isChallenge({...seed.challenges[0], hints: undefined})).toBe(false);
  });
});

describe('store reads from untrusted storage', () => {
  it('drops malformed rows and survives non-array JSON', async () => {
    const storage = mem();
    const s = createLocalStorageStore(storage, () => new Date('2026-11-09T12:00:00Z'));
    const rows = JSON.parse(storage.getItem('code-club-hub:v1:members')!);
    storage.setItem('code-club-hub:v1:members', JSON.stringify([...rows.slice(0, 2), {id: 'x', name: 42}, 'junk', null]));
    expect((await s.members.list()).map(m => m.id)).toEqual(['mem-1', 'mem-2']);
    storage.setItem('code-club-hub:v1:projects', '{"not":"an array"}');
    expect(await s.projects.list()).toEqual([]);
    storage.setItem('code-club-hub:v1:meetups', '"a string"');
    expect(await s.meetups.list()).toEqual([]);
  });
});
