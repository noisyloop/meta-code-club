import type {Challenge, Member, Project} from './types';

export type FieldErrors<K extends string> = Partial<Record<K, string>>;
export type MemberDraft = Omit<Member, 'id'>;
export type MemberField = 'name' | 'languages' | 'joinedAt' | 'attendanceStreak' | 'mentorId';

/** True when `candidateId` is `memberId` or already (transitively) mentored by them, which would make a cycle. */
export function wouldCreateMentorCycle(members: Member[], memberId: string, candidateId: string): boolean {
  const byId = new Map(members.map(m => [m.id, m]));
  const seen = new Set<string>();
  let cur: string | undefined = candidateId;
  while (cur && !seen.has(cur)) {
    if (cur === memberId) return true;
    seen.add(cur);
    cur = byId.get(cur)?.mentorId;
  }
  return false;
}

export function validateMember(
  draft: MemberDraft,
  others: Member[],
  editingId?: string,
  today: Date = new Date(),
): FieldErrors<MemberField> {
  const errors: FieldErrors<MemberField> = {};
  const name = draft.name.trim();
  if (!name) errors.name = 'Name is required.';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters.';
  else if (name.length > 60) errors.name = 'Name must be 60 characters or fewer.';
  else if (others.some(m => m.id !== editingId && m.name.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = 'A member with this name already exists.';
  }

  if (draft.languages.length === 0) errors.languages = 'Add at least one language.';

  if (!draft.joinedAt) errors.joinedAt = 'Join date is required.';
  else if (Number.isNaN(Date.parse(draft.joinedAt))) errors.joinedAt = 'Enter a valid date.';
  else if (Date.parse(draft.joinedAt) > today.getTime() + 86_400_000) errors.joinedAt = 'Join date cannot be in the future.';

  if (!Number.isInteger(draft.attendanceStreak) || draft.attendanceStreak < 0) {
    errors.attendanceStreak = 'Streak must be a whole number, 0 or more.';
  }

  if (draft.mentorId) {
    if (draft.mentorId === editingId) errors.mentorId = 'A member cannot mentor themselves.';
    else if (editingId && wouldCreateMentorCycle(others, editingId, draft.mentorId)) {
      errors.mentorId = 'That would create a mentoring loop.';
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------
export type ChallengeDraft = Omit<Challenge, 'id'>;
export type ChallengeField = 'title' | 'prompt' | 'dueDate' | 'hints';
export const MAX_HINTS = 5;

export function validateChallenge(
  draft: ChallengeDraft,
  all: Challenge[],
  editingId?: string,
): FieldErrors<ChallengeField> {
  const errors: FieldErrors<ChallengeField> = {};
  const title = draft.title.trim();
  if (!title) errors.title = 'Title is required.';
  else if (title.length < 3) errors.title = 'Title must be at least 3 characters.';
  else if (title.length > 80) errors.title = 'Title must be 80 characters or fewer.';
  else if (all.some(c => c.id !== editingId && c.title.trim().toLowerCase() === title.toLowerCase())) {
    errors.title = 'A challenge with this title already exists.';
  }

  const prompt = draft.prompt.trim();
  if (!prompt) errors.prompt = 'Prompt is required.';
  else if (prompt.length < 10) errors.prompt = 'Describe the challenge in at least 10 characters.';
  else if (prompt.length > 2000) errors.prompt = 'Prompt must be 2000 characters or fewer.';

  if (!draft.dueDate) errors.dueDate = 'Due date is required.';
  else if (Number.isNaN(Date.parse(draft.dueDate))) errors.dueDate = 'Enter a valid date.';

  const hints = draft.hints.map(h => h.trim()).filter(Boolean);
  if (hints.length > MAX_HINTS) errors.hints = `Use at most ${MAX_HINTS} hints.`;
  else if (hints.some(h => h.length > 300)) errors.hints = 'Each hint must be 300 characters or fewer.';
  return errors;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export type ProjectDraft = Omit<Project, 'id'>;
export type ProjectField = 'memberId' | 'title' | 'description' | 'techStack' | 'repoUrl' | 'demoUrl';

export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return (u.protocol === 'https:' || u.protocol === 'http:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

export function validateProject(draft: ProjectDraft, members: Member[]): FieldErrors<ProjectField> {
  const errors: FieldErrors<ProjectField> = {};
  if (!draft.memberId) errors.memberId = 'Choose who owns this project.';
  else if (!members.some(m => m.id === draft.memberId)) errors.memberId = 'That member no longer exists.';

  const title = draft.title.trim();
  if (!title) errors.title = 'Title is required.';
  else if (title.length < 2) errors.title = 'Title must be at least 2 characters.';
  else if (title.length > 80) errors.title = 'Title must be 80 characters or fewer.';

  const description = draft.description.trim();
  if (!description) errors.description = 'Description is required.';
  else if (description.length < 10) errors.description = 'Describe the project in at least 10 characters.';
  else if (description.length > 400) errors.description = 'Description must be 400 characters or fewer.';

  if (draft.techStack.length === 0) errors.techStack = 'Add at least one technology.';

  if (!draft.repoUrl.trim()) errors.repoUrl = 'Repository URL is required.';
  else if (!isHttpUrl(draft.repoUrl)) errors.repoUrl = 'Enter a full URL starting with https://';

  if (draft.demoUrl?.trim() && !isHttpUrl(draft.demoUrl)) errors.demoUrl = 'Enter a full URL starting with https://';
  return errors;
}
