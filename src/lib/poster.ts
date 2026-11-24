import type {
  Project, Team, TeamMember, BudgetItem, Experiment,
  ResearchSource, ProjectIssue,
} from '@/lib/types';

export type PosterBlockId =
  | 'abstract'
  | 'introduction'
  | 'materials'
  | 'results'
  | 'analysis'
  | 'conclusion'
  | 'recommendations'
  | 'references';

export interface PosterBlockMeta {
  id: PosterBlockId;
  label: string;
}

export const POSTER_BLOCKS: PosterBlockMeta[] = [
  { id: 'abstract', label: 'Abstract' },
  { id: 'introduction', label: 'Introduction' },
  { id: 'materials', label: 'Materials & Methods' },
  { id: 'results', label: 'Results' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'conclusion', label: 'Conclusion' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'references', label: 'Literature Cited' },
];

export interface PosterTable {
  head: string[];
  rows: string[][];
}

export interface PosterBlock {
  id: PosterBlockId;
  title: string;
  paragraphs: string[];
  table?: PosterTable;
  hasContent: boolean;
}

export interface PosterHeader {
  title: string;
  school: string;
  grade: string;
  semester: string;
  year: string;
  teamName: string;
  teamCode: string;
  members: { name: string; email: string }[];
  keywords: string[];
}

export interface PosterData {
  header: PosterHeader;
  blocks: PosterBlock[];
}

export function formatAPA(s: ResearchSource): string {
  if (s.apaCitation?.trim()) return s.apaCitation.trim();
  const parts = [
    s.authors && `${s.authors}`,
    s.year && `(${s.year})`,
    s.title && `${s.title}.`,
    s.url && `Retrieved from ${s.url}`,
  ].filter(Boolean);
  return parts.join(' ');
}

function money(n: unknown): string {
  return typeof n === 'number' && !isNaN(n) ? `${n} EGP` : '—';
}

export interface PosterInputs {
  project: Project;
  team: Team | null;
  members: TeamMember[];
  budgetItems: BudgetItem[];
  experiments: Experiment[];
  sources: ResearchSource[];
  issues: ProjectIssue[];
}

export function buildPosterData(inputs: PosterInputs): PosterData {
  const { project, team, members, budgetItems, experiments, sources, issues } = inputs;

  const header: PosterHeader = {
    title: project.title || 'Untitled Project',
    school: project.school || members[0]?.user.school || '',
    grade: project.grade || members[0]?.user.grade || '',
    semester: project.semester || '',
    year: new Date().getFullYear().toString(),
    teamName: team?.name || '',
    teamCode: team?.code || '',
    members: members.map((m) => ({ name: m.user.name, email: m.user.email || '' })),
    keywords: [project.capstoneCategory || project.category || '', project.grandChallenge || ''].filter(Boolean),
  };

  const openIssues = issues.filter((i) => i.status !== 'resolved');

  const blocks: PosterBlock[] = [
    {
      id: 'abstract',
      title: 'Abstract',
      paragraphs: [project.problemStatement, project.expectedSolution].filter(Boolean),
      hasContent: !!project.problemStatement,
    },
    {
      id: 'introduction',
      title: 'Introduction',
      paragraphs: [project.grandChallenge, project.grandChallengeConnection].filter(Boolean),
      hasContent: !!(project.grandChallenge || project.grandChallengeConnection),
    },
    {
      id: 'materials',
      title: 'Materials & Methods',
      paragraphs: [project.importantMaterials, project.testingPlan].filter(Boolean),
      table: budgetItems.length > 0 ? {
        head: ['Material', 'Quantity', 'Cost', 'Usage'],
        rows: budgetItems.map((b) => [b.name, String(b.quantity ?? 1), money(b.amount), b.notes || b.category || '']),
      } : undefined,
      hasContent: budgetItems.length > 0 || !!project.importantMaterials || !!project.testingPlan,
    },
    {
      id: 'results',
      title: 'Results',
      paragraphs: [
        ...(project.testingResults ? [project.testingResults] : []),
        ...experiments.flatMap((e) => {
          const lines = [`${e.title} (${e.status})`];
          if (e.actualResult) lines.push(e.actualResult);
          for (const tr of e.trials) {
            lines.push(`${tr.label}: ${tr.measurements}${tr.result ? ` — ${tr.result}` : ''}`);
          }
          return lines;
        }),
      ],
      hasContent: !!project.testingResults || experiments.length > 0,
    },
    {
      id: 'analysis',
      title: 'Analysis',
      paragraphs: [project.resultsAnalysis].filter(Boolean),
      hasContent: !!project.resultsAnalysis,
    },
    {
      id: 'conclusion',
      title: 'Conclusion',
      paragraphs: [project.conclusion].filter(Boolean),
      hasContent: !!project.conclusion,
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      paragraphs: openIssues.map((i) => `${i.title}${i.description ? `: ${i.description}` : ''}`),
      hasContent: openIssues.length > 0,
    },
    {
      id: 'references',
      title: 'Literature Cited',
      paragraphs: sources.map((s) => formatAPA(s)).filter(Boolean),
      hasContent: sources.length > 0,
    },
  ];

  return { header, blocks };
}

export function blockHasContent(data: PosterData, id: PosterBlockId): boolean {
  return data.blocks.find((b) => b.id === id)?.hasContent ?? false;
}
