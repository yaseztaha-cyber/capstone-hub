import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Packer,
} from 'docx';
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

function safeText(value: unknown): string {
  if (value === null || value === undefined) return '—';
  const s = String(value).trim();
  return s.length > 0 ? s : '—';
}

function formatDateSafe(date?: string): string {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return safeText(date);
  }
}

function createParagraph(
  text: string,
  opts?: { bold?: boolean; italics?: boolean; size?: number; alignment?: (typeof AlignmentType)[keyof typeof AlignmentType]; spacingAfter?: number }
): Paragraph {
  return new Paragraph({
    alignment: opts?.alignment,
    spacing: opts?.spacingAfter !== undefined ? { after: opts.spacingAfter } : undefined,
    children: [
      new TextRun({
        text: safeText(text),
        bold: opts?.bold,
        italics: opts?.italics,
        size: opts?.size,
      }),
    ],
  });
}

function createHeading(text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: safeText(text), bold: true })],
  });
}

function createBullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    children: [new TextRun({ text: safeText(text) })],
  });
}

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'B0B0B0' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'B0B0B0' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'B0B0B0' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'B0B0B0' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'B0B0B0' },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'B0B0B0' },
};

function headerCell(text: string, widthPct?: number): TableCell {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    shading: { fill: '0F766E', color: 'auto', type: 'solid' as const },
    verticalAlign: 'center' as const,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: safeText(text), bold: true, color: 'FFFFFF', size: 18 })],
      }),
    ],
  });
}

function bodyCell(text: string, opts?: { bold?: boolean; widthPct?: number }): TableCell {
  return new TableCell({
    width: opts?.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: 'center' as const,
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: safeText(text),
            bold: opts?.bold,
            size: 18,
          }),
        ],
      }),
    ],
  });
}

function createTable(headers: string[], rows: string[][], colWidths?: number[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => headerCell(h, colWidths?.[i])),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map((cell, i) => bodyCell(cell, { widthPct: colWidths?.[i] })),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: tableBorders,
    rows: [headerRow, ...dataRows],
  });
}

function createKeyValueParagraph(label: string, value: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 20 }),
      new TextRun({ text: safeText(value), size: 20 }),
    ],
  });
}

export async function generateDocx(
  project: Project | null | undefined,
  tasks: Task[] | null | undefined,
  milestones: Milestone[] | null | undefined,
  logbook: LogbookEntry[] | null | undefined,
  decisions: ProjectDecision[] | null | undefined,
  files: ProjectFile[] | null | undefined,
  rubric: Rubric | null | undefined,
  sources: ResearchSource[] | null | undefined
): Promise<Blob> {
  const safeProject = project as Project | undefined;
  const safeTasks = tasks ?? [];
  const safeMilestones = milestones ?? [];
  const safeLogbook = logbook ?? [];
  const safeDecisions = decisions ?? [];
  const safeFiles = files ?? [];
  const safeSources = sources ?? [];

  const title = safeProject?.title || 'Untitled STEM Capstone Project';
  const school = safeProject?.school || 'School not specified';
  // team may not be in Project type; fallback to teamId or generic
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

  const children: (Paragraph | Table)[] = [];

  // ===== Cover Page =====
  children.push(
    new Paragraph({ spacing: { after: 400 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'STEM Capstone Hub', size: 22, color: '0F766E', bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      spacing: { after: 300 },
      children: [new TextRun({ text: title, size: 48, bold: true, color: '111827' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: `Team: ${safeText(teamName)}`, size: 24, color: '374151' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: `School: ${safeText(school)}`, size: 24, color: '374151' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: `Date: ${today}`, size: 22, color: '6B7280' })],
    }),
    ...(safeProject?.semester
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: `Semester: ${safeText(safeProject.semester)}`, size: 20, color: '6B7280' })],
          }),
        ]
      : []),
    ...(safeProject?.grade
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: `Grade: ${safeText(safeProject.grade)}`, size: 20, color: '6B7280' })],
          }),
        ]
      : []),
    createParagraph('', { spacingAfter: 400 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Capstone Project Report', size: 20, italics: true, color: '6B7280' })],
    }),
    // Page break after cover
    new Paragraph({
      children: [new TextRun({ text: '', break: 1 })],
      pageBreakBefore: true,
    })
  );

  // ===== Overview =====
  children.push(createHeading('1. Overview', HeadingLevel.HEADING_1));
  if (safeProject) {
    children.push(
      createKeyValueParagraph('Project Title', safeProject.title),
      createKeyValueParagraph('Current Stage', safeProject.currentStage ?? '—'),
      createKeyValueParagraph('Health', (safeProject.health ?? '—').toString().replace('_', ' ')),
      createKeyValueParagraph('Semester', safeProject.semester ?? '—'),
      createKeyValueParagraph('Grade', safeProject.grade ?? '—'),
      createKeyValueParagraph('Capstone Category', (safeProject as unknown as { capstoneCategory?: string })?.capstoneCategory ?? '—'),
      createKeyValueParagraph('Grand Challenge', safeProject.grandChallenge ?? '—'),
      createKeyValueParagraph('Concept', safeProject.concept ?? '—'),
      createParagraph(safeProject.constraints ? `Constraints: ${safeProject.constraints}` : 'Constraints: —'),
      createParagraph(safeProject.importantMaterials ? `Important Materials: ${safeProject.importantMaterials}` : 'Important Materials: —')
    );
  } else {
    children.push(createParagraph('No project data available.'));
  }

  // ===== Problem =====
  children.push(createHeading('2. Problem Statement', HeadingLevel.HEADING_1));
  if (safeProject?.problemStatement) {
    children.push(createParagraph(safeProject.problemStatement));
  } else {
    children.push(createParagraph('No problem statement provided.'));
  }
  if (safeProject?.grandChallengeConnection) {
    children.push(createHeading('Grand Challenge Connection', HeadingLevel.HEADING_3));
    children.push(createParagraph(safeProject.grandChallengeConnection));
  }
  if (safeProject?.constraints) {
    children.push(createHeading('Constraints', HeadingLevel.HEADING_3));
    children.push(createParagraph(safeProject.constraints));
  }

  // ===== Research (sources table) =====
  children.push(createHeading('3. Research', HeadingLevel.HEADING_1));
  if (safeSources.length === 0) {
    children.push(createParagraph('No research sources added.'));
  } else {
    const headers = ['#', 'Title', 'Authors', 'Year', 'Type', 'Notes'];
    const rows = safeSources.map((s, idx) => [
      String(idx + 1),
      s.title || '—',
      s.authors || '—',
      s.year || '—',
      s.sourceType || '—',
      s.notes || s.apaCitation || '—',
    ]);
    // Truncate notes for table readability
    const truncatedRows = rows.map((r) => {
      const notes = r[5];
      return [...r.slice(0, 5), notes.length > 120 ? notes.slice(0, 120) + '…' : notes];
    });
    children.push(createTable(headers, truncatedRows, [5, 30, 20, 10, 15, 20]));
    children.push(createParagraph('', { spacingAfter: 120 }));
    // Detailed list with APA citations
    children.push(createHeading('Detailed Citations', HeadingLevel.HEADING_2));
    safeSources.forEach((s, idx) => {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: `[${idx + 1}] ${safeText(s.title)}`, bold: true, size: 20 }),
          ],
        })
      );
      if (s.authors || s.year) {
        children.push(createParagraph(`${safeText(s.authors)} (${safeText(s.year)})`));
      }
      if (s.apaCitation) {
        children.push(createParagraph(`APA: ${s.apaCitation}`, { italics: true }));
      }
      if (s.url) {
        children.push(createParagraph(`URL: ${s.url}`));
      }
      if (s.notes) {
        children.push(createParagraph(`Notes: ${s.notes}`));
      }
    });
  }

  // ===== Design (decisions) =====
  children.push(createHeading('4. Design', HeadingLevel.HEADING_1));
  if (safeProject?.engineeringObjective) {
    children.push(createHeading('Engineering Objective', HeadingLevel.HEADING_2));
    children.push(createParagraph(safeProject.engineeringObjective));
  }
  if (safeProject?.scientificPrinciples) {
    children.push(createHeading('Scientific Principles', HeadingLevel.HEADING_2));
    children.push(createParagraph(safeProject.scientificPrinciples));
  }
  if (safeProject?.expectedSolution) {
    children.push(createHeading('Expected Solution / Prototype', HeadingLevel.HEADING_2));
    children.push(createParagraph(safeProject.expectedSolution));
  }
  if (safeProject?.importantMaterials) {
    children.push(createHeading('Important Materials', HeadingLevel.HEADING_2));
    children.push(createParagraph(safeProject.importantMaterials));
  }
  children.push(createHeading('Design Decisions', HeadingLevel.HEADING_2));
  if (safeDecisions.length === 0) {
    children.push(createParagraph('No design decisions recorded.'));
  } else {
    safeDecisions.forEach((d, idx) => {
      children.push(createHeading(`Decision ${idx + 1}: ${d.decision}`, HeadingLevel.HEADING_3));
      if (d.date) children.push(createParagraph(`Date: ${formatDateSafe(d.date)}`));
      if (d.decisionMakers?.length) children.push(createParagraph(`Decision Makers: ${d.decisionMakers.join(', ')}`));
      if (d.reason) children.push(createParagraph(`Reason: ${d.reason}`));
      if (d.alternativesConsidered?.length)
        children.push(createParagraph(`Alternatives Considered: ${d.alternativesConsidered.join(', ')}`));
      if (d.whyAlternativesRejected) children.push(createParagraph(`Why Alternatives Rejected: ${d.whyAlternativesRejected}`));
    });
  }

  // ===== Testing =====
  children.push(createHeading('5. Testing', HeadingLevel.HEADING_1));
  if (safeProject?.testingPlan) {
    children.push(createHeading('Testing Plan', HeadingLevel.HEADING_2));
    children.push(createParagraph(safeProject.testingPlan));
  } else {
    children.push(createParagraph('No testing plan provided.'));
  }
  if (safeProject?.testingResults) {
    children.push(createHeading('Testing Results', HeadingLevel.HEADING_2));
    children.push(createParagraph(safeProject.testingResults));
  }
  const testingTasks = safeTasks.filter((t) => t.stage === 'testing');
  if (testingTasks.length > 0) {
    children.push(createHeading('Testing Tasks', HeadingLevel.HEADING_2));
    const headers = ['Task', 'Status', 'Priority'];
    const rows = testingTasks.map((t) => [t.title, t.status.replace('_', ' '), t.priority]);
    children.push(createTable(headers, rows, [50, 25, 25]));
  }

  // ===== Results =====
  children.push(createHeading('6. Results', HeadingLevel.HEADING_1));
  if (safeProject?.resultsAnalysis) {
    children.push(createParagraph(safeProject.resultsAnalysis));
  } else if (safeProject?.testingResults) {
    children.push(createParagraph(safeProject.testingResults));
  } else {
    children.push(createParagraph('No results analysis provided.'));
  }

  // ===== Conclusion =====
  children.push(createHeading('7. Conclusion', HeadingLevel.HEADING_1));
  if (safeProject?.conclusion) {
    children.push(createParagraph(safeProject.conclusion));
  } else {
    children.push(createParagraph('No conclusion provided.'));
  }

  // ===== Tasks table =====
  children.push(createHeading('8. Tasks', HeadingLevel.HEADING_1));
  if (safeTasks.length === 0) {
    children.push(createParagraph('No tasks created.'));
  } else {
    const headers = ['Title', 'Status', 'Priority', 'Stage', 'Deadline'];
    const rows = safeTasks.map((t) => [
      t.title,
      t.status.replace('_', ' '),
      t.priority,
      t.stage,
      formatDateSafe(t.teamDeadline || t.officialDeadline || t.createdDate),
    ]);
    children.push(createTable(headers, rows, [30, 18, 15, 18, 19]));
    children.push(createParagraph(`Total tasks: ${safeTasks.length} • Completed: ${safeTasks.filter((t) => t.status === 'completed').length}`, { italics: true }));
  }

  // ===== Logbook table =====
  children.push(createHeading('9. Logbook', HeadingLevel.HEADING_1));
  if (safeLogbook.length === 0) {
    children.push(createParagraph('No logbook entries.'));
  } else {
    const headers = ['Date', 'Activity', 'Stage', 'Result'];
    const rows = safeLogbook.map((e) => [
      formatDateSafe(e.date),
      e.activity.length > 60 ? e.activity.slice(0, 60) + '…' : e.activity,
      e.stage,
      e.result ? (e.result.length > 60 ? e.result.slice(0, 60) + '…' : e.result) : '—',
    ]);
    children.push(createTable(headers, rows, [18, 32, 18, 32]));
    children.push(createParagraph('', { spacingAfter: 120 }));
    // Detailed entries
    children.push(createHeading('Detailed Logbook Entries', HeadingLevel.HEADING_2));
    safeLogbook.forEach((e, idx) => {
      children.push(createHeading(`${idx + 1}. ${e.activity} — ${formatDateSafe(e.date)}`, HeadingLevel.HEADING_3));
      if (e.whatWasDone) children.push(createParagraph(`What was done: ${e.whatWasDone}`));
      if (e.whyItWasDone) children.push(createParagraph(`Why: ${e.whyItWasDone}`));
      if (e.result) children.push(createParagraph(`Result: ${e.result}`));
      if (e.problemsEncountered) children.push(createParagraph(`Problems: ${e.problemsEncountered}`));
      if (e.nextStep) children.push(createParagraph(`Next Step: ${e.nextStep}`));
      if (e.stage) children.push(createParagraph(`Stage: ${e.stage}`));
    });
  }

  // ===== Milestones =====
  children.push(createHeading('10. Milestones', HeadingLevel.HEADING_1));
  if (safeMilestones.length === 0) {
    children.push(createParagraph('No milestones defined.'));
  } else {
    const headers = ['Milestone', 'Stage', 'Deadline', 'Completed'];
    const rows = safeMilestones.map((m) => [
      m.name,
      m.stage,
      formatDateSafe(m.officialDeadline),
      m.isCompleted ? `Yes${m.completedDate ? ` (${formatDateSafe(m.completedDate)})` : ''}` : 'No',
    ]);
    children.push(createTable(headers, rows, [35, 20, 22, 23]));
  }

  // ===== Files =====
  children.push(createHeading('11. Files', HeadingLevel.HEADING_1));
  if (safeFiles.length === 0) {
    children.push(createParagraph('No files uploaded.'));
  } else {
    const headers = ['File Name', 'Category', 'Size', 'Upload Date'];
    const rows = safeFiles.map((f) => [
      f.name,
      f.category,
      `${(f.size / 1024).toFixed(1)} KB`,
      formatDateSafe(f.uploadDate),
    ]);
    children.push(createTable(headers, rows, [40, 20, 15, 25]));
    // Bulleted list of files
    children.push(createParagraph('', { spacingAfter: 120 }));
    safeFiles.forEach((f) => {
      children.push(createBullet(`${f.name} (${f.category}, ${(f.size / 1024).toFixed(1)} KB)`));
    });
  }

  // ===== Rubric =====
  children.push(createHeading('12. Rubric', HeadingLevel.HEADING_1));
  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    children.push(createParagraph('No rubric defined.'));
  } else {
    children.push(createParagraph(`Rubric: ${safeText(rubric.name)}`));
    const headers = ['Criterion', 'Status', 'Evidence'];
    const rows = rubric.criteria.map((c) => [
      c.name,
      c.status,
      c.evidence?.length ? c.evidence.join(', ') : '—',
    ]);
    children.push(createTable(headers, rows, [35, 20, 45]));
    children.push(createParagraph('', { spacingAfter: 120 }));
    rubric.criteria.forEach((c) => {
      children.push(createHeading(c.name, HeadingLevel.HEADING_3));
      children.push(createParagraph(c.description || 'No description.'));
      children.push(createParagraph(`Status: ${c.status}`));
      if (c.evidence?.length) children.push(createParagraph(`Evidence: ${c.evidence.join(', ')}`));
      if (c.missingInfo?.length) children.push(createParagraph(`Missing: ${c.missingInfo.join(', ')}`));
    });
  }

  // ===== Footer / closing =====
  children.push(createHeading('Appendix', HeadingLevel.HEADING_1));
  children.push(createParagraph(`Generated by STEM Capstone Hub on ${today}`));
  children.push(createParagraph(`Project ID: ${safeProject?.id ?? '—'}`));

  const doc = new Document({
    creator: 'STEM Capstone Hub',
    title: title,
    description: `Capstone report for ${title}`,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
