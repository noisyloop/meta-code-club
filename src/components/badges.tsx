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
