import { describe, it, expect } from 'vitest';
import { evaluateReadiness, type ReadinessInputs } from '@/lib/readiness';

function fullInputs(overrides: Partial<ReadinessInputs> = {}): ReadinessInputs {
  const now = new Date().toISOString();
  return {
    project: {
      id: 'p1', expectedSolution: 'Solar still.', problemStatement: 'No water.',
      engineeringObjective: 'Build still.', testingPlan: 'Measure TDS.',
      resultsAnalysis: 'Works.', conclusion: 'Viable.',
    } as any,
    tasks: [],
    sources: [{ id: 's1' }] as any,
    experiments: [{ id: 'e1', trials: [{ id: 't1' }] }] as any,
    files: [{ id: 'f1' }] as any,
    rubric: { criteria: [
      { status: 'complete' }, { status: 'complete' }, { status: 'complete' },
      { status: 'complete' }, { status: 'partial' },
    ] } as any,
    challengeText: 'Reduce water waste.',
    ideas: [{ id: 'i1', status: 'approved' }] as any,
    blueprint: 'Objective...',
    ...overrides,
    unused: undefined,
  } as ReadinessInputs;
}

describe('evaluateReadiness', () => {
  it('reports READY when everything is covered', () => {
    const r = evaluateReadiness(fullInputs());
    expect(r.overall).toBe('READY');
    expect(r.passCount).toBe(r.totalCount);
  });

  it('reports NOT READY with reasons when basics are missing', () => {
    const r = evaluateReadiness(fullInputs({
      challengeText: '', ideas: [], blueprint: '',
      experiments: [], sources: [], files: [],
      project: { expectedSolution: '' } as any,
      rubric: { criteria: [{ status: 'missing' }, { status: 'missing' }] } as any,
    }));
    expect(r.overall).toBe('NOT READY');
    const byId = Object.fromEntries(r.checks.map((c) => [c.id, c]));
    expect(byId.challenge.status).toBe('fail');
    expect(byId.challenge.reasons[0]).toMatch(/Challenge/);
    expect(byId.testing.status).toBe('fail');
    expect(byId.rubric.status).toBe('fail');
  });

  it('reports NEEDS ATTENTION for partial states and unknown rubric', () => {
    const r = evaluateReadiness(fullInputs({
      ideas: [{ id: 'i1', status: 'draft' }, { id: 'i2', status: 'approved' }] as any,
      blueprint: '',
      rubric: { criteria: [] } as any,
      tasks: [{ title: 'Late sensor', status: 'in_progress', teamDeadline: '2020-01-01' }] as any,
    }));
    expect(r.overall).toBe('NEEDS ATTENTION');
    const byId = Object.fromEntries(r.checks.map((c) => [c.id, c]));
    expect(byId.idea.status).toBe('pass');
    expect(byId.plan.status).toBe('warn');
    expect(byId.rubric.status).toBe('unknown');
    expect(byId.timeline.status).toBe('warn');
    expect(byId.timeline.reasons[0]).toMatch(/Late sensor/);
  });
});
