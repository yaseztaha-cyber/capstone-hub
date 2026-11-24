export type UserRole = 'student' | 'team_leader' | 'advisor';

export type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'blocked' | 'submitted' | 'completed';
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

export type ProjectStage =
  | 'research'
  | 'design'
  | 'prototype'
  | 'testing'
  | 'analysis'
  | 'documentation'
  | 'presentation';

export type ProjectHealth = 'on_track' | 'needs_attention' | 'at_risk';

export type RubricStatus = 'complete' | 'partial' | 'missing';

export type IssueCategory =
  | 'deadline'
  | 'materials'
  | 'technical'
  | 'team'
  | 'mentor'
  | 'documentation'
  | 'prototype'
  | 'research'
  | 'other';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export type FileCategory =
  | 'research'
  | 'design'
  | 'prototype'
  | 'testing'
  | 'data'
  | 'portfolio'
  | 'poster'
  | 'logbook'
  | 'references'
  | 'other';

export type ConceptRelevance = 'directly_relevant' | 'relevant' | 'partially_relevant' | 'weakly_relevant' | 'not_relevant';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  school?: string;
  grade?: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  projectId: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: UserRole;
  customRole?: string;
  joinedAt: string;
  user: User;
}

export interface Project {
  id: string;
  teamId: string;
  title: string;
  problemStatement: string;
  grandChallenge: string;
  grandChallengeConnection: string;
  scientificPrinciples: string;
  engineeringObjective: string;
  expectedSolution: string;
  constraints: string;
  importantMaterials: string;
  initialDeadline: string;
  concept: string;
  school?: string;
  semester?: string;
  grade?: string;
  capstoneCategory?: string;
  currentStage: ProjectStage;
  health: ProjectHealth;
  healthReasons: string[];
  testingPlan: string;
  testingResults: string;
  resultsAnalysis: string;
  conclusion: string;
  createdAt: string;
  updatedAt: string;
  // Showcase / Portfolio fields
  isPublic?: boolean;
  showcaseDescription?: string;
  showcaseImage?: string;
  likes?: number;
  views?: number;
  category?: string;
  year?: string;
  featured?: boolean;
}

export interface ShowcaseProject extends Project {
  isPublic: boolean;
  showcaseDescription: string;
  likes: number;
  views: number;
  category: string;
  year: string;
  featured: boolean;
}

export type IdeaStatus = 'draft' | 'under_review' | 'approved' | 'archived';

export interface ProjectIdea {
  id: string;
  title: string;
  problem: string;
  solution: string;
  science: string;
  difficulty: string;
  risks: string;
  source: 'ai' | 'own';
  status: IdeaStatus;
  validation?: string;
  createdAt: string;
}

export interface TimeEntry {
  id: string;
  start: string;
  end?: string;
  duration?: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assignedTo: string[];
  createdDate: string;
  officialDeadline?: string;
  teamDeadline?: string;
  status: TaskStatus;
  priority: TaskPriority;
  stage: ProjectStage;
  rubricCriteria?: string[];
  dependencies: string[];
  files: string[];
  comments: Comment[];
  evidence: string[];
  logbookEntryId?: string;
  completionDate?: string;
  createdBy: string;
  timeSpent?: number;
  timeEntries?: TimeEntry[];
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  type: 'blocks' | 'required_before';
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  officialDeadline: string;
  teamDeadline?: string;
  stage: ProjectStage;
  isCompleted: boolean;
  completedDate?: string;
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  date: string;
  endDate?: string;
  type: 'milestone' | 'task' | 'meeting' | 'deadline' | 'other';
  taskId?: string;
  milestoneId?: string;
  color?: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  category: FileCategory;
  uploaderId: string;
  uploadDate: string;
  version: number;
  size: number;
  mimeType: string;
  storagePath?: string;
  linkedTaskId?: string;
  linkedProjectSection?: string;
  linkedRubricCriteria?: string[];
  versions: FileVersion[];
}

export interface FileVersion {
  version: number;
  uploaderId: string;
  uploadDate: string;
  size: number;
  fileId: string;
}

export interface Rubric {
  id: string;
  projectId: string;
  name: string;
  criteria: RubricCriterion[];
}

export interface RubricCriterion {
  id: string;
  rubricId: string;
  name: string;
  description: string;
  status: RubricStatus;
  evidence: string[];
  missingInfo: string[];
  relatedTasks: string[];
  relatedLogbookEntries: string[];
  section: string;
}

export interface LogbookEntry {
  id: string;
  projectId: string;
  date: string;
  studentId: string;
  activity: string;
  stage: ProjectStage;
  whatWasDone: string;
  whyItWasDone: string;
  result: string;
  problemsEncountered: string;
  nextStep: string;
  evidence: string[];
  isAutomatic: boolean;
  linkedTaskId?: string;
  linkedPortfolioSection?: string;
}

export interface Contribution {
  id: string;
  userId: string;
  projectId: string;
  stage: ProjectStage;
  entryCount: number;
  tasksCompleted: number;
  filesUploaded: number;
}

export interface ProjectDecision {
  id: string;
  projectId: string;
  decision: string;
  date: string;
  decisionMakers: string[];
  reason: string;
  alternativesConsidered: string[];
  whyAlternativesRejected: string;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: IssueSeverity;
  date: string;
  responsiblePerson?: string;
  relatedTaskId?: string;
  resolution?: string;
  evidence?: string[];
  status: 'open' | 'in_progress' | 'resolved';
}

export interface ResearchSource {
  id: string;
  projectId: string;
  title: string;
  authors: string;
  year: string;
  url: string;
  sourceType: string;
  notes: string;
  projectSection: string;
  relevantConcept: string;
  tags: string[];
  apaCitation: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  mentions?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task_assigned' | 'task_due' | 'task_overdue' | 'file_updated' | 'comment_mention' | 'rubric_attention' | 'dependency_blocked' | 'deadline_approaching';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface Evidence {
  id: string;
  projectId: string;
  claim: string;
  files: string[];
  logbookEntries: string[];
  tasks: string[];
  createdAt: string;
}

export interface QualityScore {
  overall: number;
  rubricCoverage: number;
  taskCompletion: number;
  evidenceCoverage: number;
  documentation: number;
  timeline: number;
}

export interface BudgetItem {
  id: string;
  projectId: string;
  name: string;
  category: string;
  amount: number;
  quantity: number;
  date: string;
  notes: string;
  receiptFileId?: string;
}

export interface Meeting {
  id: string;
  projectId: string;
  title: string;
  date: string;
  duration: number;
  attendees: string[];
  agenda: string;
  notes: string;
  actionItems: string[];
  summary?: string;
  createdBy: string;
}

export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  timestamp: string;
}

export interface ShareLink {
  id: string;
  projectId: string;
  token: string;
  permission: 'view' | 'comment';
  createdAt: string;
  expiresAt?: string;
  advisorName: string;
  advisorEmail: string;
}

export interface AdvisorFeedback {
  id: string;
  shareLinkId: string;
  projectId: string;
  authorName: string;
  authorRole: 'advisor' | 'student';
  content: string;
  createdAt: string;
  resolved: boolean;
  section?: string;
}

export interface ProjectArchive {
  project: Project;
  team: Team;
  members: TeamMember[];
  tasks: Task[];
  contributions: Contribution[];
  research: ResearchSource[];
  decisions: ProjectDecision[];
  issues: ProjectIssue[];
  logbook: LogbookEntry[];
  files: ProjectFile[];
  rubric: Rubric;
}

export type Locale = 'en' | 'ar';

export interface VersionEntry {
  id: string;
  sectionId: string;
  content: string;
  changedBy: string;
  changedAt: string;
  changeDescription?: string;
}

export type ExperimentStatus = 'planned' | 'running' | 'completed';

export type BuildStageStatus = 'todo' | 'doing' | 'done';

export interface BuildStage {
  id: string;
  title: string;
  objective: string;
  status: BuildStageStatus;
}

export interface ExperimentTrial {
  id: string;
  label: string;
  measurements: string;
  result: string;
  date: string;
}

export interface Experiment {
  id: string;
  projectId: string;
  title: string;
  objective: string;
  hypothesis: string;
  variables: string;
  procedure: string;
  conditions: string;
  expectedResult: string;
  actualResult: string;
  status: ExperimentStatus;
  trials: ExperimentTrial[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}


