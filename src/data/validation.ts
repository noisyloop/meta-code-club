import type {Member} from './types';

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
