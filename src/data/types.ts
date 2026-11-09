export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ProjectStatus = 'idea' | 'building' | 'shipped';

/** Dates are ISO-8601 strings. */
export interface Member {
  id: string;
  name: string;
  skillLevel: SkillLevel;
  languages: string[];
  joinedAt: string;
  attendanceStreak: number;
  mentorId?: string;
}

export interface Challenge {
  id: string;
  title: string;
  prompt: string;
  difficulty: Difficulty;
  dueDate: string;
  hints: string[];
}

export interface Submission {
  id: string;
  challengeId: string;
  memberId: string;
  repoUrl: string;
  submittedAt: string;
}

export interface Project {
  id: string;
  memberId: string;
  title: string;
  description: string;
  techStack: string[];
  repoUrl: string;
  demoUrl?: string;
  status: ProjectStatus;
}

export interface Meetup {
  id: string;
  date: string;
  topic: string;
  hostId: string;
  agenda: string[];
  attendeeIds: string[];
}

export type NewEntity<T extends {id: string}> = Omit<T, 'id'>;
