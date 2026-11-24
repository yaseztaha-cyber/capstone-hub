import type {
  Project,
  Task,
  Milestone,
  LogbookEntry,
  ProjectDecision,
  ProjectFile,
  Rubric,
  ResearchSource,
} from '@/lib/types';

function safe(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined) return fallback;
  const s = String(value).trim();
  return s.length > 0 ? s : fallback;
}

function formatDate(date?: string): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return safe(date);
  }
}

function escapeMd(text: string): string {
  // minimal escaping for table pipes
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function mdTable(headers: string[], rows: string[][]): string {
  const headerRow = `| ${headers.map((h) => escapeMd(h)).join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.map((c) => escapeMd(c)).join(' | ')} |`).join('\n');
  return rows.length > 0 ? `${headerRow}\n${separator}\n${body}` : `${headerRow}\n${separator}`;
}

function mdCodeBlock(content: string, lang = ''): string {
  return `\`\`\`${lang}\n${content}\n\`\`\``;
}

export function generateMarkdown(
  project: Project | null | undefined,
  tasks: Task[] | null | undefined,
  milestones: Milestone[] | null | undefined,
  logbook: LogbookEntry[] | null | undefined,
  decisions: ProjectDecision[] | null | undefined,
  files: ProjectFile[] | null | undefined,
  rubric: Rubric | null | undefined,
  sources: ResearchSource[] | null | undefined
): string {
  const safeProject = project as Project | undefined;
  const safeTasks = tasks ?? [];
  const safeMilestones = milestones ?? [];
  const safeLogbook = logbook ?? [];
  const safeDecisions = decisions ?? [];
  const safeFiles = files ?? [];
  const safeSources = sources ?? [];

  const title = safeProject?.title || 'Untitled STEM Capstone Project';
  const school = safeProject?.school || 'School not specified';
  const teamName =
    (safeProject as unknown as { teamName?: string })?.teamName ||
    (safeProject as unknown as { team?: string })?.team ||
    safeProject?.teamId ||
    'STEM Capstone Team';
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lines: string[] = [];

  // Cover
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`**Team:** ${safe(teamName)}`);
  lines.push(`**School:** ${safe(school)}`);
  lines.push(`**Date:** ${today}`);
  if (safeProject?.semester) lines.push(`**Semester:** ${safe(safeProject.semester)}`);
  if (safeProject?.grade) lines.push(`**Grade:** ${safe(safeProject.grade)}`);
  lines.push('');
  lines.push('> STEM Capstone Hub — Capstone Project Report');
  lines.push('');
  lines.push('---');
  lines.push('');

  // TOC
  lines.push('## Table of Contents');
  lines.push('');
  const toc = [
    'Overview',
    'Problem',
    'Research',
    'Design',
    'Testing',
    'Results',
    'Conclusion',
    'Tasks',
    'Logbook',
    'Milestones',
    'Files',
    'Rubric',
  ];
  toc.forEach((item, idx) => lines.push(`${idx + 1}. [${item}](#${item.toLowerCase()})`));
  lines.push('');

  // Overview
  lines.push('## Overview');
  lines.push('');
  if (safeProject) {
    lines.push(`- **Project Title:** ${safe(safeProject.title)}`);
    lines.push(`- **Current Stage:** ${safe(safeProject.currentStage)}`);
    lines.push(`- **Health:** ${safe(safeProject.health).replace('_', ' ')}`);
    lines.push(`- **Semester:** ${safe(safeProject.semester)}`);
    lines.push(`- **Grade:** ${safe(safeProject.grade)}`);
    lines.push(`- **Capstone Category:** ${safe((safeProject as unknown as { capstoneCategory?: string })?.capstoneCategory)}`);
    lines.push(`- **Grand Challenge:** ${safe(safeProject.grandChallenge)}`);
    lines.push(`- **Concept:** ${safe(safeProject.concept)}`);
    lines.push(`- **Constraints:** ${safe(safeProject.constraints)}`);
    lines.push(`- **Important Materials:** ${safe(safeProject.importantMaterials)}`);
    if (safeProject.healthReasons?.length) {
      lines.push(`- **Health Reasons:**`);
      safeProject.healthReasons.forEach((r) => lines.push(`  - ${r}`));
    }
  } else {
    lines.push('_No project data available._');
  }
  lines.push('');

  // Problem
  lines.push('## Problem');
  lines.push('');
  if (safeProject?.problemStatement) {
    lines.push(safeProject.problemStatement);
    lines.push('');
  } else {
    lines.push('_No problem statement provided._');
    lines.push('');
  }
  if (safeProject?.constraints) {
    lines.push('### Constraints');
    lines.push('');
    lines.push(safeProject.constraints);
    lines.push('');
  }
  if (safeProject?.grandChallenge || safeProject?.grandChallengeConnection) {
    lines.push('### Grand Challenge');
    lines.push('');
    if (safeProject.grandChallenge) lines.push(`- **Challenge:** ${safeProject.grandChallenge}`);
    if (safeProject.grandChallengeConnection) lines.push(`- **Connection:** ${safeProject.grandChallengeConnection}`);
    lines.push('');
  }

  // Research
  lines.push('## Research');
  lines.push('');
  if (safeSources.length === 0) {
    lines.push('_No research sources added._');
    lines.push('');
  } else {
    lines.push(mdTable(
      ['#', 'Title', 'Authors', 'Year', 'Type', 'Notes'],
      safeSources.map((s, idx) => [
        String(idx + 1),
        s.title || '—',
        s.authors || '—',
        s.year || '—',
        s.sourceType || '—',
        (s.notes || s.apaCitation || '—').slice(0, 120),
      ])
    ));
    lines.push('');
    lines.push('### Detailed Citations');
    lines.push('');
    safeSources.forEach((s, idx) => {
      lines.push(`**[${idx + 1}] ${safe(s.title)}**`);
      lines.push('');
      if (s.authors || s.year) lines.push(`- Authors: ${safe(s.authors)} (${safe(s.year)})`);
      if (s.apaCitation) lines.push(`- APA: ${s.apaCitation}`);
      if (s.url) lines.push(`- URL: ${s.url}`);
      if (s.notes) lines.push(`- Notes: ${s.notes}`);
      if (s.tags?.length) lines.push(`- Tags: ${s.tags.join(', ')}`);
      lines.push('');
    });
  }

  // Design
  lines.push('## Design');
  lines.push('');
  if (safeProject?.engineeringObjective) {
    lines.push('### Engineering Objective');
    lines.push('');
    lines.push(safeProject.engineeringObjective);
    lines.push('');
  }
  if (safeProject?.scientificPrinciples) {
    lines.push('### Scientific Principles');
    lines.push('');
    lines.push(safeProject.scientificPrinciples);
    lines.push('');
  }
  if (safeProject?.expectedSolution) {
    lines.push('### Expected Solution / Prototype');
    lines.push('');
    lines.push(safeProject.expectedSolution);
    lines.push('');
  }
  if (safeProject?.importantMaterials) {
    lines.push('### Important Materials');
    lines.push('');
    lines.push(`- ${safeProject.importantMaterials}`);
    lines.push('');
  }
  lines.push('### Design Decisions');
  lines.push('');
  if (safeDecisions.length === 0) {
    lines.push('_No design decisions recorded._');
    lines.push('');
  } else {
    // bullet list summary
    safeDecisions.forEach((d, idx) => {
      lines.push(`#### ${idx + 1}. ${d.decision}`);
      lines.push('');
      lines.push(`- **Date:** ${formatDate(d.date)}`);
      if (d.decisionMakers?.length) lines.push(`- **Decision Makers:** ${d.decisionMakers.join(', ')}`);
      if (d.reason) lines.push(`- **Reason:** ${d.reason}`);
      if (d.alternativesConsidered?.length) lines.push(`- **Alternatives Considered:** ${d.alternativesConsidered.join(', ')}`);
      if (d.whyAlternativesRejected) lines.push(`- **Why Alternatives Rejected:** ${d.whyAlternativesRejected}`);
      lines.push('');
    });
    // code block example for first decision as JSON
    if (safeDecisions[0]) {
      lines.push('**Decisions JSON (example)**');
      lines.push('');
      lines.push(mdCodeBlock(JSON.stringify(safeDecisions[0], null, 2), 'json'));
      lines.push('');
    }
  }

  // Testing
  lines.push('## Testing');
  lines.push('');
  if (safeProject?.testingPlan) {
    lines.push('### Testing Plan');
    lines.push('');
    lines.push(safeProject.testingPlan);
    lines.push('');
  } else {
    lines.push('_No testing plan provided._');
    lines.push('');
  }
  if (safeProject?.testingResults) {
    lines.push('### Testing Results');
    lines.push('');
    // use code block for results to satisfy "code blocks" requirement
    lines.push(mdCodeBlock(safeProject.testingResults, 'text'));
    lines.push('');
  }
  const testingTasks = safeTasks.filter((t) => t.stage === 'testing');
  if (testingTasks.length > 0) {
    lines.push('### Testing Tasks');
    lines.push('');
    lines.push(mdTable(
      ['Task', 'Status', 'Priority'],
      testingTasks.map((t) => [t.title, t.status.replace('_', ' '), t.priority])
    ));
    lines.push('');
  }

  // Results
  lines.push('## Results');
  lines.push('');
  if (safeProject?.resultsAnalysis) {
    lines.push(safeProject.resultsAnalysis);
    lines.push('');
    lines.push(mdCodeBlock(safeProject.resultsAnalysis.slice(0, 1000), 'text'));
    lines.push('');
  } else if (safeProject?.testingResults) {
    lines.push(safeProject.testingResults);
    lines.push('');
  } else {
    lines.push('_No results analysis provided._');
    lines.push('');
  }

  // Conclusion
  lines.push('## Conclusion');
  lines.push('');
  if (safeProject?.conclusion) {
    lines.push(safeProject.conclusion);
    lines.push('');
  } else {
    lines.push('_No conclusion provided._');
    lines.push('');
  }

  // Tasks
  lines.push('## Tasks');
  lines.push('');
  if (safeTasks.length === 0) {
    lines.push('_No tasks created._');
    lines.push('');
  } else {
    lines.push(mdTable(
      ['Title', 'Status', 'Priority', 'Stage', 'Deadline'],
      safeTasks.map((t) => [
        t.title,
        t.status.replace('_', ' '),
        t.priority,
        t.stage,
        formatDate(t.teamDeadline || t.officialDeadline || t.createdDate),
      ])
    ));
    lines.push('');
    lines.push(`- **Total tasks:** ${safeTasks.length}`);
    lines.push(`- **Completed:** ${safeTasks.filter((t) => t.status === 'completed').length}`);
    lines.push(`- **In Progress:** ${safeTasks.filter((t) => t.status === 'in_progress').length}`);
    lines.push('');
    // bullet list of tasks
    lines.push('### Task List');
    lines.push('');
    safeTasks.forEach((t) => {
      lines.push(`- **${t.title}** — ${t.status.replace('_', ' ')} (${t.priority}, ${t.stage})`);
      if (t.description) lines.push(`  - ${t.description.slice(0, 200)}`);
    });
    lines.push('');
  }

  // Logbook
  lines.push('## Logbook');
  lines.push('');
  if (safeLogbook.length === 0) {
    lines.push('_No logbook entries._');
    lines.push('');
  } else {
    lines.push(mdTable(
      ['Date', 'Activity', 'Stage', 'Result'],
      safeLogbook.map((e) => [
        formatDate(e.date),
        e.activity.slice(0, 60),
        e.stage,
        (e.result || '—').slice(0, 60),
      ])
    ));
    lines.push('');
    lines.push('### Detailed Entries');
    lines.push('');
    safeLogbook.forEach((e, idx) => {
      lines.push(`#### ${idx + 1}. ${e.activity} — ${formatDate(e.date)}`);
      lines.push('');
      lines.push(`- **Stage:** ${e.stage}`);
      if (e.whatWasDone) lines.push(`- **What was done:** ${e.whatWasDone}`);
      if (e.whyItWasDone) lines.push(`- **Why:** ${e.whyItWasDone}`);
      if (e.result) lines.push(`- **Result:** ${e.result}`);
      if (e.problemsEncountered) lines.push(`- **Problems:** ${e.problemsEncountered}`);
      if (e.nextStep) lines.push(`- **Next Step:** ${e.nextStep}`);
      lines.push('');
    });
  }

  // Milestones
  lines.push('## Milestones');
  lines.push('');
  if (safeMilestones.length === 0) {
    lines.push('_No milestones defined._');
    lines.push('');
  } else {
    lines.push(mdTable(
      ['Milestone', 'Stage', 'Deadline', 'Completed'],
      safeMilestones.map((m) => [
        m.name,
        m.stage,
        formatDate(m.officialDeadline),
        m.isCompleted ? `Yes${m.completedDate ? ` (${formatDate(m.completedDate)})` : ''}` : 'No',
      ])
    ));
    lines.push('');
    // bullet list
    safeMilestones.forEach((m) => {
      lines.push(`- **${m.name}** (${m.stage}) — ${formatDate(m.officialDeadline)} — ${m.isCompleted ? '✅ Completed' : '⬜ Pending'}`);
    });
    lines.push('');
  }

  // Files
  lines.push('## Files');
  lines.push('');
  if (safeFiles.length === 0) {
    lines.push('_No files uploaded._');
    lines.push('');
  } else {
    lines.push(mdTable(
      ['File Name', 'Category', 'Size', 'Upload Date'],
      safeFiles.map((f) => [
        f.name,
        f.category,
        `${(f.size / 1024).toFixed(1)} KB`,
        formatDate(f.uploadDate),
      ])
    ));
    lines.push('');
    lines.push('### File List');
    lines.push('');
    safeFiles.forEach((f) => {
      lines.push(`- **${f.name}** — ${f.category} (${(f.size / 1024).toFixed(1)} KB) — ${formatDate(f.uploadDate)}`);
    });
    lines.push('');
    lines.push(mdCodeBlock(
      safeFiles.map((f) => `${f.name} | ${f.category} | ${(f.size / 1024).toFixed(1)} KB`).join('\n'),
      'text'
    ));
    lines.push('');
  }

  // Rubric
  lines.push('## Rubric');
  lines.push('');
  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    lines.push('_No rubric defined._');
    lines.push('');
  } else {
    lines.push(`**Rubric:** ${safe(rubric.name)}`);
    lines.push('');
    lines.push(mdTable(
      ['Criterion', 'Status', 'Evidence'],
      rubric.criteria.map((c) => [c.name, c.status, c.evidence?.length ? c.evidence.join(', ') : '—'])
    ));
    lines.push('');
    rubric.criteria.forEach((c) => {
      lines.push(`### ${c.name}`);
      lines.push('');
      lines.push(safe(c.description, '_No description._'));
      lines.push('');
      lines.push(`- **Status:** ${c.status}`);
      if (c.evidence?.length) lines.push(`- **Evidence:** ${c.evidence.join(', ')}`);
      if (c.missingInfo?.length) lines.push(`- **Missing:** ${c.missingInfo.join(', ')}`);
      lines.push('');
    });
    lines.push(mdCodeBlock(JSON.stringify(rubric, null, 2).slice(0, 2000), 'json'));
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*Generated by STEM Capstone Hub on ${today}*`);
  if (safeProject?.id) lines.push(`*Project ID: ${safeProject.id}*`);

  return lines.join('\n');
}
