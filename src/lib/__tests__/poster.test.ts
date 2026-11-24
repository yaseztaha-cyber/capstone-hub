import { describe, it, expect } from 'vitest';
import { buildPosterData, formatAPA, POSTER_BLOCKS } from '@/lib/poster';
import type { Project, Team, TeamMember, BudgetItem, Experiment, ResearchSource, ProjectIssue } from '@/lib/types';

function baseProject(overrides: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: 'p1', teamId: 't1', title: 'Solar Water Purifier',
    problemStatement: 'No clean water.', grandChallenge: 'Provide clean water',
    grandChallengeConnection: 'Solar purification for villages.',
    scientificPrinciples: '', engineeringObjective: '', expectedSolution: 'Solar still.',
    constraints: '', importantMaterials: 'Acrylic, copper', initialDeadline: '', concept: '',
    currentStage: 'testing', health: 'on_track', healthReasons: [],
    testingPlan: 'Measure TDS before/after.', testingResults: '98% removal.',
    resultsAnalysis: 'Meets target.', conclusion: 'Viable.',
    createdAt: now, updatedAt: now,
    ...overrides,
  } as Project;
}

const team = { id: 't1', name: 'Team 7', code: 'ABC123', projectId: 'p1', createdAt: '' } as Team;
const members = [
  { id: 'm1', userId: 'u1', teamId: 't1', role: 'team_leader', joinedAt: '', user: { id: 'u1', name: 'Ahmed', email: 'a@stem.edu.eg', school: 'STEM Gharbiya', grade: '11' } },
] as TeamMember[];

describe('poster builder', () => {
  it('exposes the 8 reference-poster blocks', () => {
    expect(POSTER_BLOCKS.map((b) => b.id)).toEqual([
      'abstract', 'introduction', 'materials', 'results',
      'analysis', 'conclusion', 'recommendations', 'references',
    ]);
  });

  it('maps workspace data into header and blocks', () => {
    const data = buildPosterData({
      project: baseProject(), team, members,
      budgetItems: [{ id: 'b1', projectId: 'p1', name: 'Acrylic', category: 'materials', amount: 500, date: '', notes: 'Collector' }] as BudgetItem[],
      experiments: [{
        id: 'e1', projectId: 'p1', title: 'Calibration', objective: '', hypothesis: '',
        variables: '', procedure: '', conditions: '', expectedResult: '', actualResult: 'Within range.',
        status: 'completed', trials: [{ id: 'tr1', label: 'Trial 1', measurements: 'TDS 40ppm', result: 'Pass', date: '' }],
        createdAt: '', updatedAt: '',
      }] as Experiment[],
      sources: [{ id: 's1', projectId: 'p1', title: 'Solar stills', authors: 'Cuce, E.', year: '2020', url: '', sourceType: '', notes: '', projectSection: '', relevantConcept: '', tags: [], apaCitation: '' }] as ResearchSource[],
      issues: [{ id: 'i1', projectId: 'p1', title: 'Seal leak', description: 'Fix gasket', category: 'technical', severity: 'medium', date: '', status: 'open' }] as ProjectIssue[],
    });

    expect(data.header.title).toBe('Solar Water Purifier');
    expect(data.header.members).toHaveLength(1);
    expect(data.header.keywords).toContain('Provide clean water');

    const byId = Object.fromEntries(data.blocks.map((b) => [b.id, b]));
    expect(byId.abstract.hasContent).toBe(true);
    expect(byId.materials.table?.rows[0][0]).toBe('Acrylic');
    expect(byId.results.paragraphs.join(' ')).toContain('Trial 1');
    expect(byId.recommendations.paragraphs[0]).toContain('Seal leak');
    expect(byId.references.paragraphs[0]).toContain('Cuce, E. (2020)');
  });

  it('marks empty blocks as having no content', () => {
    const data = buildPosterData({
      project: baseProject({
        problemStatement: '', expectedSolution: '', grandChallenge: '', grandChallengeConnection: '',
        importantMaterials: '', testingPlan: '', testingResults: '', resultsAnalysis: '', conclusion: '',
      }),
      team: null, members: [], budgetItems: [], experiments: [], sources: [], issues: [],
    });
    for (const b of data.blocks) expect(b.hasContent).toBe(false);
  });

  it('prefers stored APA citations', () => {
    const s = { authors: 'A', year: '2020', title: 'T', url: '', apaCitation: 'Custom citation.' } as ResearchSource;
    expect(formatAPA(s)).toBe('Custom citation.');
  });
});
