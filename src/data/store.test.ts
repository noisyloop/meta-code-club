import {beforeEach, describe, expect, it} from 'vitest';
import {createLocalStorageStore, StoreError, type StorageLike} from './store';
import {createSeed} from './seed';
import {nextMeetup, openChallenges, shippedProjects, activeMembers} from './selectors';

const memoryStorage = (): StorageLike & {data: Map<string, string>} => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: k => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: k => void data.delete(k),
  };
};
const NOW = new Date('2026-11-09T12:00:00Z');

describe('seed data', () => {
  const s = createSeed(NOW);
  it('has the requested counts', () => {
    expect([s.members, s.challenges, s.submissions, s.projects, s.meetups].map(a => a.length)).toEqual([12, 6, 20, 8, 4]);
  });
  it('has unique ids and valid references', () => {
    for (const rows of Object.values(s) as {id: string}[][]) expect(new Set(rows.map(r => r.id)).size).toBe(rows.length);
    const m = new Set(s.members.map(x => x.id));
    const c = new Set(s.challenges.map(x => x.id));
    s.members.forEach(x => x.mentorId && expect(m.has(x.mentorId)).toBe(true));
    s.submissions.forEach(x => (expect(m.has(x.memberId)).toBe(true), expect(c.has(x.challengeId)).toBe(true)));
    s.projects.forEach(x => expect(m.has(x.memberId)).toBe(true));
    s.meetups.forEach(x => (expect(m.has(x.hostId)).toBe(true), x.attendeeIds.forEach(a => expect(m.has(a)).toBe(true))));
  });
  it('has no duplicate (challenge, member) submissions', () => {
    const keys = s.submissions.map(x => `${x.challengeId}:${x.memberId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
  it('covers every enum value and gives selectors something to show', () => {
    expect(new Set(s.members.map(x => x.skillLevel)).size).toBe(3);
    expect(new Set(s.challenges.map(x => x.difficulty)).size).toBe(3);
    expect(new Set(s.projects.map(x => x.status)).size).toBe(3);
    expect(nextMeetup(s.meetups, NOW)?.id).toBe('meet-3');
    expect(openChallenges(s.challenges, NOW).length).toBeGreaterThan(0);
    expect(shippedProjects(s.projects).length).toBe(3);
    expect(activeMembers(s.members).length).toBe(10);
  });
});

describe('store', () => {
  let storage: ReturnType<typeof memoryStorage>;
  beforeEach(() => void (storage = memoryStorage()));
  const make = () => createLocalStorageStore(storage, () => NOW);

  it('seeds once and persists across instances', async () => {
    const a = make();
    await a.members.create({name: 'New', skillLevel: 'beginner', languages: [], joinedAt: NOW.toISOString(), attendanceStreak: 0});
    expect((await make().members.list()).length).toBe(13);
  });
  it('creates, updates, gets and removes', async () => {
    const s = make();
    const created = await s.challenges.create({title: 'T', prompt: 'P', difficulty: 'easy', dueDate: NOW.toISOString(), hints: []});
    expect(created.id).toMatch(/^chal-/);
    expect((await s.challenges.update(created.id, {title: 'T2'})).title).toBe('T2');
    expect((await s.challenges.get(created.id))?.title).toBe('T2');
    await s.challenges.remove(created.id);
    expect(await s.challenges.get(created.id)).toBeUndefined();
    await expect(s.challenges.update('nope', {title: 'x'})).rejects.toBeInstanceOf(StoreError);
  });
  it('notifies subscribers on writes', async () => {
    const s = make();
    let n = 0;
    const off = s.subscribe(() => n++);
    await s.projects.update('proj-1', {title: 'X'});
    off();
    await s.projects.update('proj-1', {title: 'Y'});
    expect(n).toBe(1);
  });
  it('cascades member deletion and protects hosts', async () => {
    const s = make();
    await expect(s.members.remove('mem-4')).rejects.toThrow(/hosts a meetup/);
    await s.members.remove('mem-9'); // mentee with a project, a submission, an attendance
    expect((await s.projects.list()).some(p => p.memberId === 'mem-9')).toBe(false);
    expect((await s.submissions.list()).some(x => x.memberId === 'mem-9')).toBe(false);
    expect((await s.meetups.list()).some(m => m.attendeeIds.includes('mem-9'))).toBe(false);
  });
  it('clears mentor references when a mentor is removed', async () => {
    const s = make();
    await s.meetups.update('meet-2', {hostId: 'mem-4'});
    await s.meetups.update('meet-4', {hostId: 'mem-4'});
    await s.members.remove('mem-1');
    expect((await s.members.get('mem-2'))?.mentorId).toBeUndefined();
  });
  it('removes submissions with their challenge and recovers from corrupt storage', async () => {
    const s = make();
    await s.challenges.remove('chal-1');
    expect((await s.submissions.list()).some(x => x.challengeId === 'chal-1')).toBe(false);
    storage.setItem('code-club-hub:v1:members', '{not json');
    expect(await s.members.list()).toEqual([]);
    await s.reset();
    expect((await s.members.list()).length).toBe(12);
  });
});
