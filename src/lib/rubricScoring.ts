import type { Rubric } from '@/lib/types';

export type RubricLevel = 'excellent' | 'good' | 'developing' | 'beginning';

export interface RubricScore {
  total: number;
  maxTotal: number;
  percentage: number;
  level: RubricLevel;
  criteriaScores: { id: string; name: string; score: number; max: number; status: string }[];
  missingCriteria: string[];
}

/**
 * Map rubric criterion status to numeric score.
 * complete = 4, partial = 2, missing = 0 (max 4 per criterion)
 */
function statusToScore(status: string): number {
  switch (status) {
    case 'complete':
      return 4;
    case 'partial':
      return 2;
    case 'missing':
    default:
      return 0;
  }
}

function calculateLevel(percentage: number): RubricLevel {
  if (percentage >= 85) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'developing';
  return 'beginning';
}

export function calculateRubricScore(rubric: Rubric | null): RubricScore {
  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    return {
      total: 0,
      maxTotal: 0,
      percentage: 0,
      level: 'beginning',
      criteriaScores: [],
      missingCriteria: [],
    };
  }

  const criteriaScores = rubric.criteria.map((c) => ({
    id: c.id,
    name: c.name,
    score: statusToScore(c.status),
    max: 4,
    status: c.status,
  }));

  const total = criteriaScores.reduce((sum, c) => sum + c.score, 0);
  const maxTotal = rubric.criteria.length * 4;
  const percentage = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  const level = calculateLevel(percentage);
  const missingCriteria = rubric.criteria
    .filter((c) => c.status === 'missing')
    .map((c) => c.name);

  return {
    total,
    maxTotal,
    percentage,
    level,
    criteriaScores,
    missingCriteria,
  };
}

export function getNextSteps(rubric: Rubric | null): string[] {
  const genericSteps = [
    'Attach evidence files and link tasks to each criterion to support your claims',
    'Review feedback on partial criteria and update documentation with missing details',
    'Schedule a team review session to validate rubric coverage before submission',
    'Ensure logbook entries are linked to rubric criteria as supporting evidence',
    'Double-check prototype and testing documentation aligns with rubric expectations',
  ];

  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    return genericSteps.slice(0, 3);
  }

  const missing = rubric.criteria.filter((c) => c.status === 'missing');
  const partial = rubric.criteria.filter((c) => c.status === 'partial');
  const completeCount = rubric.criteria.filter((c) => c.status === 'complete').length;

  const steps: string[] = [];

  // If everything is complete, return celebratory / maintenance steps
  if (missing.length === 0 && partial.length === 0 && completeCount > 0) {
    return [
      'All criteria marked complete — do a final peer review to ensure evidence quality',
      'Prepare presentation and portfolio to showcase completed criteria',
      'Archive supporting files and logbook entries for advisor review',
    ];
  }

  // Prioritize missing criteria (up to 3)
  for (const c of missing.slice(0, 3)) {
    const detail =
      c.missingInfo && c.missingInfo.length > 0
        ? ` - Address: ${c.missingInfo[0]}`
        : c.description
          ? ` - ${c.description.slice(0, 80)}`
          : '';
    steps.push(`Complete "${c.name}"${detail}`);
    if (steps.length >= 5) break;
  }

  // Then partial criteria
  for (const c of partial) {
    if (steps.length >= 5) break;
    const detail =
      c.missingInfo && c.missingInfo.length > 0
        ? ` - Address: ${c.missingInfo[0]}`
        : '';
    steps.push(`Improve "${c.name}" from partial to complete${detail} — link evidence and related tasks`);
  }

  // Fill up to at least 3 steps using generic advice that hasn't been used
  let genericIdx = 0;
  while (steps.length < 3 && genericIdx < genericSteps.length) {
    const candidate = genericSteps[genericIdx];
    if (!steps.includes(candidate)) {
      steps.push(candidate);
    }
    genericIdx++;
  }

  // If we still have less than 3 (edge case), push remaining generics
  while (steps.length < 3) {
    steps.push(genericSteps[steps.length % genericSteps.length]);
  }

  // Cap at 5
  return steps.slice(0, 5);
}

export function getScoreColor(level: RubricLevel): string {
  switch (level) {
    case 'excellent':
      return 'text-emerald-600';
    case 'good':
      return 'text-blue-600';
    case 'developing':
      return 'text-amber-600';
    case 'beginning':
    default:
      return 'text-red-600';
  }
}

export function getLevelLabel(level: RubricLevel): string {
  switch (level) {
    case 'excellent':
      return 'Excellent';
    case 'good':
      return 'Good';
    case 'developing':
      return 'Developing';
    case 'beginning':
    default:
      return 'Beginning';
  }
}

// Additional helper to get background/border classes for level badge styling
export function getLevelBadgeVariant(level: RubricLevel): 'success' | 'info' | 'warning' | 'danger' {
  switch (level) {
    case 'excellent':
      return 'success';
    case 'good':
      return 'info';
    case 'developing':
      return 'warning';
    case 'beginning':
    default:
      return 'danger';
  }
}
