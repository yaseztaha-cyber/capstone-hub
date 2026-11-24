import type {
  Project, Task, ResearchSource, Experiment, ProjectFile,
  Rubric, ProjectIdea,
} from '@/lib/types';

export type ReadinessStatus = 'pass' | 'warn' | 'fail' | 'unknown';
export type OverallReadiness = 'READY' | 'NEEDS ATTENTION' | 'NOT READY';

export interface ReadinessCheck {
  id: string;
  label: string;
  status: ReadinessStatus;
  reasons: string[];
}

export interface ReadinessInputs {
  project: Project | null;
  tasks: Task[];
  sources: ResearchSource[];
  experiments: Experiment[];
  files: ProjectFile[];
  rubric: Rubric | null;
  challengeText: string;
  ideas: ProjectIdea[];
  blueprint: string;
}

export interface ReadinessReport {
  overall: OverallReadiness;
  checks: ReadinessCheck[];
  passCount: number;
  totalCount: number;
}

function overdueTasks(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.filter((t) => {
    if (t.status === 'completed' || t.status === 'submitted') return false;
    const d = t.teamDeadline || t.officialDeadline;
    return !!d && new Date(d) < now;
  });
}

// Explainable readiness: every state carries its reasons.
// Nothing is hidden behind a single unexplained score.
export function evaluateReadiness(inputs: ReadinessInputs): ReadinessReport {
  const { project, tasks, sources, experiments, files, rubric, challengeText, ideas, blueprint } = inputs;
  const checks: ReadinessCheck[] = [];

  checks.push(
    challengeText.trim()
      ? { id: 'challenge', label: 'Challenge alignment', status: 'pass', reasons: [] }
      : { id: 'challenge', label: 'Challenge alignment', status: 'fail', reasons: ['No challenge entered — add it in Project → Challenge.'] }
  );

  const approved = ideas.find((i) => i.status === 'approved');
  if (approved) {
    checks.push({ id: 'idea', label: 'Approved idea', status: 'pass', reasons: [] });
  } else if (ideas.length > 0) {
    checks.push({ id: 'idea', label: 'Approved idea', status: 'warn', reasons: [`${ideas.length} idea(s) drafted, none approved as the baseline.`] });
  } else {
    checks.push({ id: 'idea', label: 'Approved idea', status: 'fail', reasons: ['No project idea yet — generate or add one in Project → Ideas.'] });
  }

  if (blueprint.trim()) {
    checks.push({ id: 'plan', label: 'Buildable plan', status: 'pass', reasons: [] });
  } else if (approved) {
    checks.push({ id: 'plan', label: 'Buildable plan', status: 'warn', reasons: ['Approved idea has no blueprint yet.'] });
  } else {
    checks.push({ id: 'plan', label: 'Buildable plan', status: 'fail', reasons: ['No blueprint — approve an idea first.'] });
  }

  checks.push(
    sources.length > 0
      ? { id: 'research', label: 'Research', status: 'pass', reasons: [] }
      : { id: 'research', label: 'Research', status: 'warn', reasons: ['No research sources saved.'] }
  );

  checks.push(
    project?.expectedSolution?.trim()
      ? { id: 'prototype', label: 'Prototype documented', status: 'pass', reasons: [] }
      : { id: 'prototype', label: 'Prototype documented', status: 'warn', reasons: ['Prototype section is empty.'] }
  );

  const trials = experiments.flatMap((e) => e.trials);
  if (trials.length > 0) {
    checks.push({ id: 'testing', label: 'Testing', status: 'pass', reasons: [] });
  } else if (experiments.length > 0) {
    checks.push({ id: 'testing', label: 'Testing', status: 'warn', reasons: [`${experiments.length} experiment(s) have no recorded trials.`] });
  } else {
    checks.push({ id: 'testing', label: 'Testing', status: 'fail', reasons: ['No experiments recorded — testing has no evidence.'] });
  }

  checks.push(
    files.length > 0
      ? { id: 'evidence', label: 'Evidence', status: 'pass', reasons: [] }
      : { id: 'evidence', label: 'Evidence', status: 'warn', reasons: ['No files attached as evidence.'] }
  );

  const docFields: Array<[string, string | undefined]> = [
    ['Problem statement', project?.problemStatement],
    ['Engineering objective', project?.engineeringObjective],
    ['Testing plan', project?.testingPlan],
    ['Results analysis', project?.resultsAnalysis],
    ['Conclusion', project?.conclusion],
  ];
  const filled = docFields.filter(([, v]) => !!v?.trim());
  if (filled.length >= 4) {
    checks.push({ id: 'documentation', label: 'Documentation', status: 'pass', reasons: [] });
  } else if (filled.length >= 2) {
    const missing = docFields.filter(([, v]) => !v?.trim()).map(([label]) => label);
    checks.push({ id: 'documentation', label: 'Documentation', status: 'warn', reasons: [`Missing: ${missing.join(', ')}.`] });
  } else {
    checks.push({ id: 'documentation', label: 'Documentation', status: 'fail', reasons: ['Core documentation sections are empty.'] });
  }

  const criteria = rubric?.criteria || [];
  if (criteria.length === 0) {
    checks.push({ id: 'rubric', label: 'Rubric', status: 'unknown', reasons: ['No rubric criteria defined.'] });
  } else {
    const complete = criteria.filter((c) => c.status === 'complete').length;
    const pct = Math.round((complete / criteria.length) * 100);
    if (pct >= 80) {
      checks.push({ id: 'rubric', label: 'Rubric', status: 'pass', reasons: [] });
    } else if (pct >= 50) {
      checks.push({ id: 'rubric', label: 'Rubric', status: 'warn', reasons: [`Rubric coverage ${pct}% (${complete}/${criteria.length} complete).`] });
    } else {
      checks.push({ id: 'rubric', label: 'Rubric', status: 'fail', reasons: [`Rubric coverage only ${pct}% (${complete}/${criteria.length} complete).`] });
    }
  }

  const overdue = overdueTasks(tasks);
  checks.push(
    overdue.length === 0
      ? { id: 'timeline', label: 'Timeline', status: 'pass', reasons: [] }
      : { id: 'timeline', label: 'Timeline', status: 'warn', reasons: [`${overdue.length} overdue task(s): ${overdue.slice(0, 3).map((t) => t.title).join('; ')}${overdue.length > 3 ? '…' : ''}`] }
  );

  const fails = checks.filter((c) => c.status === 'fail').length;
  const warns = checks.filter((c) => c.status === 'warn').length;
  const overall: OverallReadiness = fails > 0 ? 'NOT READY' : warns > 0 ? 'NEEDS ATTENTION' : 'READY';
  return {
    overall,
    checks,
    passCount: checks.filter((c) => c.status === 'pass').length,
    totalCount: checks.length,
  };
}
