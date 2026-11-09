import {Badge} from '@astryxdesign/core/Badge';
import type {SkillLevel} from '../data/types';

export const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];
export const SKILL_LABEL: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};
const SKILL_VARIANT = {beginner: 'green', intermediate: 'blue', advanced: 'purple'} as const;

export const SkillBadge = ({level}: {level: SkillLevel}) => (
  <Badge variant={SKILL_VARIANT[level]} label={SKILL_LABEL[level]} />
);

import type {Difficulty, ProjectStatus} from '../data/types';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {easy: 'Easy', medium: 'Medium', hard: 'Hard'};
const DIFFICULTY_VARIANT = {easy: 'green', medium: 'yellow', hard: 'red'} as const;
export const DifficultyBadge = ({level}: {level: Difficulty}) => (
  <Badge variant={DIFFICULTY_VARIANT[level]} label={DIFFICULTY_LABEL[level]} />
);

export const PROJECT_STATUSES: ProjectStatus[] = ['idea', 'building', 'shipped'];
export const STATUS_LABEL: Record<ProjectStatus, string> = {idea: 'Idea', building: 'Building', shipped: 'Shipped'};
const STATUS_VARIANT = {idea: 'neutral', building: 'blue', shipped: 'green'} as const;
export const StatusBadge = ({status}: {status: ProjectStatus}) => (
  <Badge variant={STATUS_VARIANT[status]} label={STATUS_LABEL[status]} />
);
