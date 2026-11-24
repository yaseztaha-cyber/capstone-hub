import { describe, it, expect } from 'vitest';
import { calculateRubricScore, getNextSteps, getLevelLabel, getScoreColor } from '@/lib/rubricScoring';
import type { Rubric } from '@/lib/types';

function makeRubric(statuses: string[]): Rubric {
  return {
    id: 'r1',
    projectId: 'p1',
    name: 'Test Rubric',
    criteria: statuses.map((status, i) => ({
      id: `c${i}`,
      rubricId: 'r1',
      name: `Criterion ${i + 1}`,
      description: `Description ${i + 1}`,
      status: status as any,
      evidence: [],
      missingInfo: [],
      relatedTasks: [],
      relatedLogbookEntries: [],
      section: 'research',
    })),
  };
}

describe('calculateRubricScore', () => {
  it('returns beginning for null', () => {
    const r = calculateRubricScore(null);
    expect(r.level).toBe('beginning');
    expect(r.percentage).toBe(0);
    expect(r.total).toBe(0);
  });

  it('returns beginning for empty criteria', () => {
    const r = calculateRubricScore({ id: 'r1', projectId: 'p1', name: 'Empty', criteria: [] } as any);
    expect(r.level).toBe('beginning');
    expect(r.percentage).toBe(0);
  });

  it('all missing => 0% beginning', () => {
    const rubric = makeRubric(['missing', 'missing', 'missing']);
    const r = calculateRubricScore(rubric);
    expect(r.percentage).toBe(0);
    expect(r.level).toBe('beginning');
    expect(r.missingCriteria).toHaveLength(3);
  });

  it('all complete => 100% excellent', () => {
    const rubric = makeRubric(['complete', 'complete', 'complete', 'complete']);
    const r = calculateRubricScore(rubric);
    expect(r.percentage).toBe(100);
    expect(r.level).toBe('excellent');
    expect(r.total).toBe(16);
    expect(r.maxTotal).toBe(16);
  });

  it('threshold: 50% => developing', () => {
    // 2 complete (8pts) + 0 partial out of 4 criteria (16 max) = 50%
    const rubric = makeRubric(['complete', 'complete', 'missing', 'missing']);
    const r = calculateRubricScore(rubric);
    expect(r.percentage).toBe(50);
    expect(r.level).toBe('developing');
  });

  it('threshold: 70% => good', () => {
    // Need 70%+ . Let's craft 3 complete (12) + 1 partial (2) = 14/16 = 87.5 excellent, let's do 2 complete + 1 partial = 10/12? different length.
    // Use 4 criteria: 2 complete (8) + 1 partial (2) + 1 missing (0) =10/16=62.5 developing
    // Use 2 criteria: 1 complete (4) + 1 partial (2) =6/8=75 good
    const rubric = makeRubric(['complete', 'partial']);
    const r = calculateRubricScore(rubric);
    expect(r.percentage).toBe(75);
    expect(r.level).toBe('good');
  });

  it('threshold: 85% => excellent', () => {
    // 6 criteria: 5 complete (20) + 1 partial (2)=22/24=91.6 excellent
    // simpler: 5 complete 4pts each=20, 1 missing 0 =>20/24=83 => good not excellent. So 6 complete =24/24=100 excellent
    // Let's test boundary explicitly via 6 criteria with 6pts missing? Instead test 85% boundary via 4 criteria 3.4 complete? Need direct percentage check via criteriaScores.
    // Use direct: create 20 criteria? easier: mock 85% by mixing: 17/20 =85% => need 20 criteria: 17 complete? 17*4=68/80=85
    const statuses = Array(17).fill('complete').concat(Array(3).fill('missing')); // 17 complete, 3 missing => 68/80=85
    const rubric = makeRubric(statuses);
    const r = calculateRubricScore(rubric);
    expect(r.percentage).toBe(85);
    expect(r.level).toBe('excellent');
  });

  it('partial scores 2 per criterion', () => {
    const rubric = makeRubric(['partial', 'partial']);
    const r = calculateRubricScore(rubric);
    expect(r.total).toBe(4);
    expect(r.percentage).toBe(50);
    expect(r.criteriaScores[0].score).toBe(2);
  });

  it('missingCriteria lists only missing', () => {
    const rubric = makeRubric(['complete', 'missing', 'partial', 'missing']);
    const r = calculateRubricScore(rubric);
    expect(r.missingCriteria).toEqual(['Criterion 2', 'Criterion 4']);
  });
});

describe('getNextSteps', () => {
  it('returns generic steps for null rubric', () => {
    const steps = getNextSteps(null);
    expect(steps.length).toBe(3);
  });

  it('returns celebratory steps when all complete', () => {
    const rubric = makeRubric(['complete', 'complete']);
    const steps = getNextSteps(rubric);
    expect(steps[0]).toMatch(/All criteria marked complete/);
  });

  it('prioritizes missing criteria', () => {
    const rubric = makeRubric(['missing', 'partial', 'complete']);
    // Need names: Criterion 1 missing, Criterion 2 partial
    const steps = getNextSteps(rubric);
    expect(steps[0]).toMatch(/Criterion 1/);
  });
});

describe('getLevelLabel / getScoreColor', () => {
  it('maps levels correctly', () => {
    expect(getLevelLabel('excellent')).toBe('Excellent');
    expect(getLevelLabel('beginning')).toBe('Beginning');
    expect(getScoreColor('excellent')).toMatch(/emerald/);
    expect(getScoreColor('beginning')).toMatch(/red/);
  });
});
