import type {Challenge, Meetup, Member, Project, Submission} from './types';

/** Earliest meetup that has not started yet. */
export function nextMeetup(meetups: Meetup[], now = new Date()): Meetup | undefined {
  return meetups
    .filter(m => new Date(m.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

/** "Active" = currently on an attendance streak. */
export const activeMembers = (members: Member[]) => members.filter(m => m.attendanceStreak > 0);

export const openChallenges = (challenges: Challenge[], now = new Date()) =>
  challenges.filter(c => new Date(c.dueDate) >= now);

export const shippedProjects = (projects: Project[]) => projects.filter(p => p.status === 'shipped');

export const submissionCount = (submissions: Submission[], challengeId: string) =>
  submissions.filter(s => s.challengeId === challengeId).length;

export const byId = <T extends {id: string}>(rows: T[]) => new Map(rows.map(r => [r.id, r] as const));
