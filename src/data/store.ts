import {createSeed} from './seed';
import {isChallenge, isMeetup, isMember, isProject, isSubmission} from './guards';
import type {Challenge, Meetup, Member, NewEntity, Project, Submission} from './types';

/**
 * Data layer. Pages depend only on the `Store` interface below, never on localStorage.
 * Every method is async so a real backend can replace `createLocalStorageStore` later
 * without touching any page code.
 */
export interface Repo<T extends {id: string}> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | undefined>;
  create(input: NewEntity<T>): Promise<T>;
  update(id: string, patch: Partial<NewEntity<T>>): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface Store {
  members: Repo<Member>;
  challenges: Repo<Challenge>;
  submissions: Repo<Submission>;
  projects: Repo<Project>;
  meetups: Repo<Meetup>;
  /** Called after any write. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Wipe and re-seed (dev/testing). */
  reset(): Promise<void>;
}

export class StoreError extends Error {}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PREFIX = 'code-club-hub:v1:';
type Collection = 'members' | 'challenges' | 'submissions' | 'projects' | 'meetups';
const COLLECTIONS: Collection[] = ['members', 'challenges', 'submissions', 'projects', 'meetups'];
const GUARDS: Record<Collection, (v: unknown) => boolean> = {
  members: isMember,
  challenges: isChallenge,
  submissions: isSubmission,
  projects: isProject,
  meetups: isMeetup,
};

function newId(prefix: string): string {
  const rand = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${rand.slice(0, 8)}`;
}

export function createLocalStorageStore(
  storage: StorageLike = window.localStorage,
  now: () => Date = () => new Date(),
): Store {
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach(l => l());

  const read = <T>(c: Collection): T[] => {
    // Storage is an untrusted boundary: tolerate bad JSON, non-arrays and malformed rows.
    try {
      const parsed: unknown = JSON.parse(storage.getItem(PREFIX + c) ?? '[]');
      return Array.isArray(parsed) ? (parsed.filter(GUARDS[c]) as T[]) : [];
    } catch {
      return [];
    }
  };
  const write = (c: Collection, rows: unknown[]) => storage.setItem(PREFIX + c, JSON.stringify(rows));

  const seedAll = () => {
    const seed = createSeed(now());
    COLLECTIONS.forEach(c => write(c, seed[c]));
    storage.setItem(PREFIX + 'seeded', '1');
  };
  if (!storage.getItem(PREFIX + 'seeded')) seedAll();

  function repo<T extends {id: string}>(
    c: Collection,
    idPrefix: string,
    hooks: {beforeRemove?: (id: string) => void} = {},
  ): Repo<T> {
    return {
      async list() {
        return read<T>(c);
      },
      async get(id) {
        return read<T>(c).find(r => r.id === id);
      },
      async create(input) {
        const row = {...input, id: newId(idPrefix)} as T;
        write(c, [...read<T>(c), row]);
        notify();
        return row;
      },
      async update(id, patch) {
        const rows = read<T>(c);
        const i = rows.findIndex(r => r.id === id);
        if (i < 0) throw new StoreError(`${c}/${id} not found`);
        const next = {...rows[i], ...patch, id} as T;
        rows[i] = next;
        write(c, rows);
        notify();
        return next;
      },
      async remove(id) {
        hooks.beforeRemove?.(id);
        write(c, read<T>(c).filter(r => r.id !== id));
        notify();
      },
    };
  }

  return {
    members: repo<Member>('members', 'mem', {
      beforeRemove(id) {
        if (read<Meetup>('meetups').some(m => m.hostId === id)) {
          throw new StoreError('This member hosts a meetup. Reassign the host first.');
        }
        // Cascade: their work goes with them; references to them are cleared.
        write('submissions', read<Submission>('submissions').filter(s => s.memberId !== id));
        write('projects', read<Project>('projects').filter(p => p.memberId !== id));
        write('members', read<Member>('members').map(m => (m.mentorId === id ? {...m, mentorId: undefined} : m)));
        write('meetups', read<Meetup>('meetups').map(m => ({...m, attendeeIds: m.attendeeIds.filter(a => a !== id)})));
      },
    }),
    challenges: repo<Challenge>('challenges', 'chal', {
      beforeRemove(id) {
        write('submissions', read<Submission>('submissions').filter(s => s.challengeId !== id));
      },
    }),
    submissions: repo<Submission>('submissions', 'sub'),
    projects: repo<Project>('projects', 'proj'),
    meetups: repo<Meetup>('meetups', 'meet'),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async reset() {
      seedAll();
      notify();
    },
  };
}

let singleton: Store | undefined;
/** App-wide store. Swap this one function to point the app at a real backend. */
export function getStore(): Store {
  return (singleton ??= createLocalStorageStore());
}
