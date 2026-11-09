import type {Challenge, Meetup, Member, Project, Submission} from './types';

/**
 * Runtime shape checks for rows read back from storage. Storage (today localStorage, tomorrow a
 * backend) is an untrusted boundary: a corrupted, hand-edited or outdated row is dropped instead
 * of crashing the UI or reaching an href/React tree with the wrong type.
 */
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === 'string';
const strs = (v: unknown): v is string[] => Array.isArray(v) && v.every(str);
const oneOf = <T extends string>(v: unknown, set: readonly T[]): v is T => str(v) && (set as readonly string[]).includes(v);
const optStr = (v: unknown) => v === undefined || str(v);
const validDate = (v: unknown) => str(v) && !Number.isNaN(Date.parse(v));

export const isMember = (v: unknown): v is Member =>
  isObj(v) && str(v.id) && str(v.name) && oneOf(v.skillLevel, ['beginner', 'intermediate', 'advanced']) && strs(v.languages) &&
  validDate(v.joinedAt) && typeof v.attendanceStreak === 'number' && Number.isFinite(v.attendanceStreak) && optStr(v.mentorId);

export const isChallenge = (v: unknown): v is Challenge =>
  isObj(v) && str(v.id) && str(v.title) && str(v.prompt) && oneOf(v.difficulty, ['easy', 'medium', 'hard']) && validDate(v.dueDate) && strs(v.hints);

export const isSubmission = (v: unknown): v is Submission =>
  isObj(v) && str(v.id) && str(v.challengeId) && str(v.memberId) && str(v.repoUrl) && validDate(v.submittedAt);

export const isProject = (v: unknown): v is Project =>
  isObj(v) && str(v.id) && str(v.memberId) && str(v.title) && str(v.description) && strs(v.techStack) && str(v.repoUrl) &&
  optStr(v.demoUrl) && oneOf(v.status, ['idea', 'building', 'shipped']);

export const isMeetup = (v: unknown): v is Meetup =>
  isObj(v) && str(v.id) && validDate(v.date) && str(v.topic) && str(v.hostId) && strs(v.agenda) && strs(v.attendeeIds);
