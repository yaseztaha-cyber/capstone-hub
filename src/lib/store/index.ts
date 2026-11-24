import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { useEffect } from 'react';
import type {
  User, Team, TeamMember, Project, Task, Milestone, CalendarEvent,
  ProjectFile, Rubric, RubricCriterion, LogbookEntry, ProjectDecision,
  ProjectIssue, ResearchSource, Notification, BudgetItem, Meeting,
  ChatMessage, ShareLink, Locale, VersionEntry, ProjectStage, ProjectHealth, AdvisorFeedback,
  ProjectIdea, IdeaStatus, Experiment, ExperimentTrial, ExperimentStatus,
  BuildStage, BuildStageStatus
} from '@/lib/types';
import { callAI } from '@/lib/ai';
import { parseBuildStages } from '@/lib/roadmap';
import { checkDeadlines } from '@/lib/deadlines';
import { getTemplateById } from '@/lib/templates';
import { createClient, isCloudReachable } from '@/lib/supabase/client';
import {
  signUp, signIn, signOut, getCurrentUser, recordAudit,
  createTeam, joinTeam,
  getTasks, createTask, updateTask,
  getMilestones, createMilestone, updateMilestone,
  getCalendarEvents, createCalendarEvent, updateCalendarEvent,
  getFiles, uploadFile, deleteFile,
  getRubric, createRubric, updateRubricCriterion,
  getLogbook, createLogbookEntry, updateLogbookEntry,
  getDecisions, createDecision, updateDecision,
  getIssues, createIssue, updateIssue,
  getSources, createSource, updateSource,
  getProject, getProjectById, updateProject,
  getBudgetItems, createBudgetItem, deleteBudgetItem,
  getMeetings, createMeeting, updateMeeting, deleteMeeting,
  getChatMessages, sendChatMessage,
  getShareLinks, createShareLink, deleteShareLink,
  getNotifications, createNotification, markNotificationRead,
  getVersionHistory, saveVersion, revertVersion,
  getCurrentUserTeam,
  subscribeToProjectChanges,
} from '@/lib/supabase/queries';

function loadFeedbackFromStorage(): AdvisorFeedback[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('sch_feedback');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFeedbackToStorage(feedback: AdvisorFeedback[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sch_feedback', JSON.stringify(feedback));
  } catch {}
}

function persistTasksTime(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('sch_tasks', JSON.stringify(tasks));
  } catch {}
  try {
    const timeMap: Record<string, { timeSpent?: number; timeEntries?: any }> = {};
    tasks.forEach((t) => {
      if (t.timeSpent !== undefined || t.timeEntries) {
        timeMap[t.id] = { timeSpent: t.timeSpent, timeEntries: t.timeEntries };
      }
    });
    localStorage.setItem('sch_task_time', JSON.stringify(timeMap));
  } catch {}
}

// Idea engine (challenge -> ideas -> blueprint), persisted per project
function ideaStorageKey(projectId: string, part: string) {
  return `sch_idea_${part}_${projectId}`;
}

function loadIdeaEngineState(projectId: string): { challengeText: string; challengeSource: string; challengeAnalysis: string; ideas: ProjectIdea[]; blueprint: string } {
  const empty = { challengeText: '', challengeSource: '', challengeAnalysis: '', ideas: [] as ProjectIdea[], blueprint: '' };
  if (typeof window === 'undefined' || !projectId) return empty;
  try {
    const raw = localStorage.getItem(ideaStorageKey(projectId, 'all'));
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      challengeText: typeof parsed.challengeText === 'string' ? parsed.challengeText : '',
      challengeSource: typeof parsed.challengeSource === 'string' ? parsed.challengeSource : '',
      challengeAnalysis: typeof parsed.challengeAnalysis === 'string' ? parsed.challengeAnalysis : '',
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : [],
      blueprint: typeof parsed.blueprint === 'string' ? parsed.blueprint : '',
    };
  } catch {
    return empty;
  }
}

// Best-effort parse of AI ideas: prefers a JSON array, falls back to
// splitting "IDEA 1/2/3" style blocks so a messy reply still yields ideas.
function parseIdeasFromAI(raw: string): Array<{ title: string; problem: string; solution: string; science: string; difficulty: string; risks: string }> {
  const out: Array<{ title: string; problem: string; solution: string; science: string; difficulty: string; risks: string }> = [];
  try {
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    if (start >= 0 && end > start) {
      const arr = JSON.parse(raw.slice(start, end + 1));
      if (Array.isArray(arr)) {
        for (const o of arr.slice(0, 5)) {
          if (!o || typeof o !== 'object') continue;
          out.push({
            title: String((o as any).title || '').slice(0, 140),
            problem: String((o as any).problem || ''),
            solution: String((o as any).solution || ''),
            science: String((o as any).science || ''),
            difficulty: String((o as any).difficulty || ''),
            risks: String((o as any).risks || ''),
          });
        }
        if (out.length > 0) return out.filter((i) => i.title);
      }
    }
  } catch {}
  const blocks = raw.split(/(?=^#{0,3}\s*IDEA\s*\d+)/gim).map((b) => b.trim()).filter(Boolean).slice(0, 5);
  for (const b of blocks) {
    const lines = b.split('\n').map((l) => l.trim()).filter(Boolean);
    const title = (lines[0] || '').replace(/^#{0,3}\s*IDEA\s*\d+\s*[:\-–.]?\s*/i, '').slice(0, 140) || 'Untitled idea';
    out.push({ title, problem: '', solution: b.slice(0, 2000), science: '', difficulty: '', risks: '' });
  }
  return out;
}

// Tasks created while offline (Supabase unreachable) live in sch_tasks;
// surface the ones the cloud doesn't know about yet.
function loadLocalOnlyTasks(projectId: string, cloudTasks: Task[]): Task[] {
  if (typeof window === 'undefined' || !projectId) return [];
  try {
    const raw = localStorage.getItem('sch_tasks');
    if (!raw) return [];
    const local = JSON.parse(raw) as Task[];
    if (!Array.isArray(local)) return [];
    const cloudIds = new Set(cloudTasks.map((t) => t.id));
    return local.filter((t) => t && t.projectId === projectId && !cloudIds.has(t.id));
  } catch {
    return [];
  }
}

function mergeLocalTimeData(tasks: Task[]): Task[] {
  if (typeof window === 'undefined') return tasks;
  try {
    const rawTime = localStorage.getItem('sch_task_time');
    if (rawTime) {
      const map = JSON.parse(rawTime) as Record<string, { timeSpent?: number; timeEntries?: any[] }>;
      let hasData = false;
      for (const k in map) { hasData = true; break; }
      if (hasData) {
        return tasks.map((t) => {
          const local = map[t.id];
          if (local) {
            return { ...t, timeSpent: local.timeSpent ?? t.timeSpent, timeEntries: local.timeEntries ?? t.timeEntries };
          }
          return t;
        });
      }
    }
    const rawTasks = localStorage.getItem('sch_tasks');
    if (rawTasks) {
      const localTasks = JSON.parse(rawTasks) as Task[];
      const map2: Record<string, Task> = {};
      localTasks.forEach((lt) => {
        map2[lt.id] = lt;
      });
      return tasks.map((t) => {
        const lt = map2[t.id];
        if (lt && (lt.timeSpent !== undefined || lt.timeEntries)) {
          return { ...t, timeSpent: lt.timeSpent, timeEntries: lt.timeEntries };
        }
        return t;
      });
    }
  } catch {}
  return tasks;
}

function syncTaskTimeToSupabase(task: Task) {
  try {
    // Try supabase direct update - supports both snake_case and camelCase schemas
    const supabase = createClient();
    supabase
      .from('tasks')
      .update({
        time_spent: task.timeSpent,
        time_entries: task.timeEntries,
      } as any)
      .eq('id', task.id)
      .then(({ error }: any) => {
        if (error) {
          try {
            updateTask(task.id, { timeSpent: task.timeSpent, timeEntries: task.timeEntries } as any).catch(() => {});
          } catch {}
        }
      });
  } catch {
    try {
      updateTask(task.id, { timeSpent: task.timeSpent, timeEntries: task.timeEntries } as any).catch(() => {});
    } catch {}
  }
}

// Showcase gallery was removed; keep the helper as an empty stub.
function getMockShowcaseProjects(): Project[] {
  return [
  ];
}

interface AppState {
  currentUser: User | null;
  team: Team | null;
  members: TeamMember[];
  project: Project | null;
  tasks: Task[];
  milestones: Milestone[];
  calendarEvents: CalendarEvent[];
  files: ProjectFile[];
  rubric: Rubric | null;
  logbook: LogbookEntry[];
  decisions: ProjectDecision[];
  issues: ProjectIssue[];
  sources: ResearchSource[];
  notifications: Notification[];
  qualityScore: { overall: number; rubricCoverage: number; taskCompletion: number; evidenceCoverage: number; documentation: number; timeline: number } | null;
  loading: boolean;
  onboarded: boolean;
  sidebarOpen: boolean;
  searchOpen: boolean;
  locale: Locale;
  budgetItems: BudgetItem[];
  meetings: Meeting[];
  chatMessages: ChatMessage[];
  shareLinks: ShareLink[];
  versionHistory: VersionEntry[];
  realtimeUnsubscribe: (() => void) | null;
  feedback: AdvisorFeedback[];

  setSidebarOpen: (val: boolean) => void;
  setSearchOpen: (val: boolean) => void;
  setLocale: (val: Locale) => void;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;

  createTeamAction: (name: string, projectName: string, opts?: { school?: string; semester?: string; grade?: string }) => Promise<void>;
  joinTeamAction: (code: string) => Promise<void>;
  createTaskAction: (task: Partial<Task> & { title: string }) => Promise<void>;
  updateTaskStatusAction: (taskId: string, status: string) => Promise<void>;
  updateTaskAction: (taskId: string, updates: Partial<Task>) => Promise<void>;
  createLogbookEntryAction: (entry: Partial<LogbookEntry> & { activity: string }) => Promise<void>;
  updateLogbookEntryAction: (entryId: string, updates: Partial<LogbookEntry>) => Promise<void>;
  createDecisionAction: (decision: Partial<ProjectDecision> & { decision: string }) => Promise<void>;
  updateDecisionAction: (decisionId: string, updates: Partial<ProjectDecision>) => Promise<void>;
  createIssueAction: (issue: Partial<ProjectIssue> & { title: string }) => Promise<void>;
  updateIssueAction: (issueId: string, updates: Partial<ProjectIssue>) => Promise<void>;
  createSourceAction: (source: Partial<ResearchSource> & { title: string }) => Promise<void>;
  updateSourceAction: (sourceId: string, updates: Partial<ResearchSource>) => Promise<void>;
  updateProjectAction: (updates: Partial<Project>) => Promise<void>;
  uploadFileAction: (file: File, category: string, linkedTaskId?: string, linkedSection?: string) => Promise<{ storage_path?: string; id?: string } | null>;
  deleteFileAction: (fileId: string) => Promise<void>;
  markNotificationReadAction: (id: string) => Promise<void>;
  createBudgetItemAction: (item: Partial<BudgetItem> & { name: string; amount: number }) => Promise<void>;
  deleteBudgetItemAction: (id: string) => Promise<void>;
  createMeetingAction: (meeting: Partial<Meeting> & { title: string; date: string }) => Promise<void>;
  updateMeetingAction: (id: string, updates: Partial<Meeting>) => Promise<void>;
  deleteMeetingAction: (id: string) => Promise<void>;
  sendChatMessageAction: (content: string) => Promise<void>;
  createShareLinkAction: (advisorName: string, advisorEmail: string) => Promise<void>;
  deleteShareLinkAction: (id: string) => Promise<void>;
  saveVersionAction: (sectionId: string, content: string, changeDescription?: string) => Promise<void>;
  getSectionVersionsAction: (sectionId: string) => VersionEntry[];
  revertToVersionAction: (versionId: string) => Promise<void>;
  applyTemplateAction: (templateId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadProjectData: () => Promise<void>;
  addFeedback: (shareLinkId: string, content: string, section?: string) => void;
  toggleFeedbackResolved: (id: string) => void;
  deleteFeedback: (id: string) => void;

  startTimer: (taskId: string) => void;
  stopTimer: (taskId: string) => void;
  addManualTime: (taskId: string, minutes: number) => void;
  getTotalTime: (taskId: string) => number;

  // Idea engine: challenge -> ideas -> blueprint
  challengeText: string;
  challengeSource: string;
  challengeAnalysis: string;
  ideas: ProjectIdea[];
  blueprint: string;
  ideaEngineBusy: string | null;
  ideaEngineError: string | null;
  ideaEngineNotice: string | null;
  loadIdeaEngine: () => void;
  setChallenge: (text: string, source: string) => void;
  analyzeChallenge: () => Promise<void>;
  generateIdeas: () => Promise<void>;
  addOwnIdea: (input: { title: string; problem: string; solution: string }) => void;
  validateIdea: (id: string) => Promise<void>;
  setIdeaStatus: (id: string, status: IdeaStatus) => void;
  approveIdea: (id: string) => Promise<void>;
  generateBlueprint: () => Promise<void>;
  applyBlueprintTasks: () => Promise<string>;

  // Experiments (local-first; no cloud table yet)
  experiments: Experiment[];
  loadExperiments: () => void;
  createExperimentAction: (input: { title: string; objective?: string; hypothesis?: string }) => void;
  updateExperimentAction: (id: string, updates: Partial<Experiment>) => void;
  deleteExperimentAction: (id: string) => void;
  addTrialAction: (experimentId: string, input: { label?: string; measurements: string; result?: string }) => void;
  deleteTrialAction: (experimentId: string, trialId: string) => void;

  // Prototype build roadmap (local-first; no cloud table yet)
  buildStages: BuildStage[];
  roadmapBusy: boolean;
  roadmapError: string | null;
  loadBuildStages: () => void;
  addBuildStage: (input: { title: string; objective?: string }) => void;
  updateBuildStage: (id: string, updates: Partial<BuildStage>) => void;
  deleteBuildStage: (id: string) => void;
  generateBuildStages: () => Promise<void>;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function calculateQuality(tasks: Task[], rubric: Rubric | null, logbook: LogbookEntry[], files: ProjectFile[]) {
  const completed = tasks.filter(t => t.status === 'completed').length;
  const taskCompletion = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  const criteria = rubric?.criteria || [];
  const complete = criteria.filter(c => c.status === 'complete').length;
  const partial = criteria.filter(c => c.status === 'partial').length;
  const rubricCoverage = criteria.length > 0 ? Math.round(((complete + partial * 0.5) / criteria.length) * 100) : 0;

  const evidenceCount = logbook.filter(e => e.evidence.length > 0).length + files.length;
  const evidenceCoverage = tasks.length > 0 ? Math.min(100, Math.round((evidenceCount / Math.max(tasks.length, 1)) * 100)) : 0;

  const docTasks = tasks.filter(t => ['documentation', 'presentation'].includes(t.stage));
  const docCompleted = docTasks.filter(t => t.status === 'completed').length;
  const documentation = docTasks.length > 0 ? Math.round((docCompleted / docTasks.length) * 100) : 0;

  const overdue = tasks.filter(t => {
    const d = t.teamDeadline || t.officialDeadline;
    return d && new Date(d) < new Date() && t.status !== 'completed';
  }).length;
  const timeline = tasks.length > 0 ? Math.max(0, 100 - Math.round((overdue / tasks.length) * 100)) : 100;

  const overall = Math.round(rubricCoverage * 0.3 + taskCompletion * 0.25 + evidenceCoverage * 0.2 + documentation * 0.15 + timeline * 0.1);
  return { overall, rubricCoverage, taskCompletion, evidenceCoverage, documentation, timeline };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  team: null,
  members: [],
  project: null,
  tasks: [],
  milestones: [],
  calendarEvents: [],
  files: [],
  rubric: null,
  logbook: [],
  decisions: [],
  issues: [],
  sources: [],
  notifications: [],
  qualityScore: null,
  loading: true,
  onboarded: false,
  sidebarOpen: true,
  searchOpen: false,
  locale: 'en',
  budgetItems: [],
  meetings: [],
  chatMessages: [],
  shareLinks: [],
  versionHistory: [],
  realtimeUnsubscribe: null,
  feedback: loadFeedbackFromStorage(),
  challengeText: '',
  challengeSource: '',
  challengeAnalysis: '',
  ideas: [],
  blueprint: '',
  ideaEngineBusy: null,
  ideaEngineError: null,
  ideaEngineNotice: null,
  experiments: [],
  buildStages: [],
  roadmapBusy: false,
  roadmapError: null,

  setSidebarOpen: (val) => set({ sidebarOpen: val }),
  setSearchOpen: (val) => set({ searchOpen: val }),
  setLocale: (val) => { 
    if (typeof window !== 'undefined') localStorage.setItem('sch_locale', val); 
    set({ locale: val }); 
  },

  login: async (email: string, password: string) => {
    // Deterministic offline path: if the Supabase host doesn't answer,
    // sign in locally instead of depending on browser error wording.
    try {
      const online = await isCloudReachable();
      if (!online) {
        const demoUser: User = { id: 'demo-' + email, name: email.split('@')[0], email, school: '', grade: '' };
        set({ currentUser: demoUser });
        try { if (typeof window !== 'undefined') localStorage.setItem('sch_user', JSON.stringify(demoUser)); } catch {}
        return;
      }
    } catch {}
    try {
      const data = await signIn(email, password);
      const user = (data as any)?.user;
      if (user) {
        let profile: User | null = null;
        try { profile = await getCurrentUser(); } catch {}
        if (profile) {
          set({ currentUser: profile });
        } else {
          // fallback: build profile from auth user
          const fallback: User = { id: user.id, name: (user.user_metadata as any)?.full_name || email.split('@')[0], email: user.email || email, school: '', grade: '' };
          set({ currentUser: fallback });
          try { if (typeof window !== 'undefined') localStorage.setItem('sch_user', JSON.stringify(fallback)); } catch {}
        }
        try { await get().loadProjectDataEssential(); } catch {}
        try { void recordAudit('user_login', { detail: email }); } catch {}
        return;
      }
      throw new Error('Invalid credentials');
    } catch (err: any) {
      const msg = err?.message || '';
      // Fallback to demo/offline mode so user is never blocked
      if (msg.includes('Invalid login') || msg.includes('Email not confirmed') || msg.includes('Failed to fetch') || msg.includes('Load failed') || msg.includes('Network') || msg.includes('not configured')) {
        // still allow offline demo login
        const demoUser: User = { id: 'demo-' + email, name: email.split('@')[0], email, school: '', grade: '' };
        set({ currentUser: demoUser });
        try { if (typeof window !== 'undefined') localStorage.setItem('sch_user', JSON.stringify(demoUser)); } catch {}
        // don't throw for demo mode, let UI proceed - but store error for display if truly invalid
        if (msg.includes('Invalid login')) throw new Error('Email or password is incorrect. Tip: use Demo Login if you don\'t have an account.');
        return;
      }
      throw err;
    }
  },

  register: async (email: string, password: string, name: string) => {
    // Same deterministic offline path as login (see above)
    try {
      const online = await isCloudReachable();
      if (!online) {
        const newUser: User = { id: 'demo-' + email, name: name || email.split('@')[0], email, school: '', grade: '' };
        set({ currentUser: newUser, onboarded: false });
        try { if (typeof window !== 'undefined') localStorage.setItem('sch_user', JSON.stringify(newUser)); } catch {}
        return;
      }
    } catch {}
    try {
      const data = await signUp(email, password, name);
      const user = (data as any)?.user;
      if (user) {
        // Supabase may require email confirmation - still set local user so onboarding works
        const newUser: User = { id: user.id, name, email, school: '', grade: '' };
        set({ currentUser: newUser, onboarded: false });
        try { if (typeof window !== 'undefined') localStorage.setItem('sch_user', JSON.stringify(newUser)); } catch {}
        return;
      }
      throw new Error('Registration failed');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('already registered') || msg.includes('already exists')) throw new Error('This email is already registered. Please sign in.');
      // Fallback offline registration
      if (msg.includes('Failed to fetch') || msg.includes('Load failed') || msg.includes('Network') || msg.includes('not configured') || msg.includes('Auth')) {
        const newUser: User = { id: 'demo-' + email, name: name || email.split('@')[0], email, school: '', grade: '' };
        set({ currentUser: newUser, onboarded: false });
        try { if (typeof window !== 'undefined') localStorage.setItem('sch_user', JSON.stringify(newUser)); } catch {}
        return;
      }
      throw new Error(msg || 'Registration failed. Please try again.');
    }
  },

  logout: async () => {
    const { realtimeUnsubscribe } = get();
    if (realtimeUnsubscribe) realtimeUnsubscribe();
    try { await signOut(); } catch {}
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sch_user');
        localStorage.removeItem('sch_team');
        localStorage.removeItem('sch_project');
      }
    } catch {}
    set({
      currentUser: null, team: null, members: [], project: null,
      tasks: [], milestones: [], calendarEvents: [], files: [],
      rubric: null, logbook: [], decisions: [], issues: [],
      sources: [], notifications: [], qualityScore: null,
      onboarded: false, loading: true,
      budgetItems: [], meetings: [], chatMessages: [],
      shareLinks: [], versionHistory: [], realtimeUnsubscribe: null,
      challengeText: '', challengeSource: '', challengeAnalysis: '', ideas: [], blueprint: '',
      ideaEngineBusy: null, ideaEngineError: null, ideaEngineNotice: null, experiments: [],
      buildStages: [], roadmapBusy: false, roadmapError: null,
    });
  },

  initialize: async () => {
    set({ loading: true });
    try {
      // hydrate feedback from localStorage
      try { set({ feedback: loadFeedbackFromStorage() }); } catch {}
      // hydrate locale
      try { const loc = typeof window !== 'undefined' ? localStorage.getItem('sch_locale') : null; if (loc === 'ar' || loc === 'en') set({ locale: loc as any }); } catch {}
      let user: User | null = null;
      try { user = await getCurrentUser(); } catch {}
      if (!user && typeof window !== 'undefined') {
        try { const raw = localStorage.getItem('sch_user'); if (raw) user = JSON.parse(raw); } catch {}
      }
      if (user) {
        set({ currentUser: user });
        try { await get().loadProjectDataEssential(); } catch {}
        // full data loads lazily on first navigation; avoid blocking init
        // rehydrate offline workspace if Supabase has no team (e.g. RLS blocked)
        try {
          if (!get().team && typeof window !== 'undefined') {
            const tRaw = localStorage.getItem('sch_team');
            const pRaw = localStorage.getItem('sch_project');
            if (tRaw && pRaw) {
              const team = JSON.parse(tRaw) as Team;
              const project = JSON.parse(pRaw) as Project;
              const me = get().currentUser;
              const member: TeamMember | null = me ? {
                id: uuid(), userId: me.id, teamId: team.id, role: 'team_leader',
                customRole: 'Team Leader', joinedAt: new Date().toISOString(), user: me,
              } : null;
              set({
                team,
                project,
                members: member ? [member] : [],
                rubric: get().rubric ?? { id: uuid(), projectId: project.id, name: 'STEM Capstone Rubric', criteria: [] },
                onboarded: true,
              });
              try { get().loadIdeaEngine(); } catch {}
              try { get().loadExperiments(); } catch {}
              try { get().loadBuildStages(); } catch {}
            }
          }
        } catch {}
      }
    } catch (err) {
      console.error('Init error:', err);
    } finally {
      set({ loading: false });
    }
  },

// general refresh used after mutations — same bounded fetch as init
  loadProjectData: async () => {
    await get().loadProjectDataEssential();
  },

// essential data only on first load — rest lazy-loaded on navigation
  loadProjectDataEssential: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      set({ loading: true });
      // First get the user's team to get the projectId
      const { team, members } = await getCurrentUserTeam();
      const projectId = team?.id;

      if (!projectId) {
        set({ team: null, members, onboarded: false, loading: false });
        return;
      }

      // Fetch only essential data for dashboard — rest lazy on page visit
      const [project, tasks, milestones, files, rubric, decisions, issues, sources] = await Promise.all([
        getProjectById(projectId),
        getTasks(projectId),
        getMilestones(projectId),
        getFiles(projectId),
        getRubric(projectId),
        getDecisions(projectId),
        getIssues(projectId),
        getSources(projectId),
      ]);

      const onboarded = !!team;

      // Merge local time tracking data (fallback for supabase schema without time columns)
      const tasksWithTime = mergeLocalTimeData(tasks as Task[]);

      const localOnlyTasks = loadLocalOnlyTasks(projectId, tasksWithTime);

      set({
        team,
        members,
        project,
        tasks: [...tasksWithTime, ...localOnlyTasks],
        milestones,
        files,
        rubric,
        decisions,
        issues,
        sources,
        onboarded,
        loading: false,
      });
      try { get().loadIdeaEngine(); } catch {}
      try { get().loadExperiments(); } catch {}
      try { get().loadBuildStages(); } catch {}
    } catch (err: any) {
      console.error('loadProjectDataEssential error:', err);
      set({ loading: false });
    }
  },

  createTeamAction: async (name: string, projectName: string, opts?: { school?: string; semester?: string; grade?: string }) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const { team, project } = await createTeam(name, projectName, opts);
      const member: TeamMember = {
        id: uuid(), userId: currentUser.id, teamId: team.id, role: 'team_leader',
        customRole: 'Team Leader', joinedAt: new Date().toISOString(), user: currentUser,
      };
      const rubric: Rubric = { id: uuid(), projectId: project.id, name: 'STEM Capstone Rubric', criteria: [] };

      set({
        team, project, members: [member], rubric, onboarded: true,
        challengeText: '', challengeSource: '', challengeAnalysis: '', ideas: [], blueprint: '',
        ideaEngineError: null, ideaEngineNotice: null, experiments: [],
        buildStages: [], roadmapBusy: false, roadmapError: null,
      });
      try { void recordAudit('team_create', { teamId: team.id, projectId: project.id, resource: 'team', detail: name }); } catch {}
      await get().loadProjectData();
    } catch (err: any) {
      const msg = err?.message || 'Failed to create team';
      // Supabase RLS / network block: fall back to a local offline workspace
      // so the user is never stuck on onboarding.
      if (/row-level security|violates|RLS|policy|Failed to fetch|Network|JWT|permission|not authenticated/i.test(msg)) {
        const now = new Date().toISOString();
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        const teamId = uuid();
        const projectId = uuid();
        const team: Team = { id: teamId, name: name.trim(), code, projectId, createdAt: now };
        const project: Project = {
          id: projectId, teamId, title: projectName.trim(),
          school: opts?.school?.trim() || '', semester: opts?.semester?.trim() || '', grade: opts?.grade?.trim() || '',
          problemStatement: '', grandChallenge: '', grandChallengeConnection: '',
          scientificPrinciples: '', engineeringObjective: '', expectedSolution: '',
          constraints: '', importantMaterials: '', initialDeadline: '', concept: '',
          currentStage: 'research', health: 'on_track', healthReasons: [],
          testingPlan: '', testingResults: '', resultsAnalysis: '', conclusion: '',
          createdAt: now, updatedAt: now,
        };
        const member: TeamMember = {
          id: uuid(), userId: currentUser.id, teamId, role: 'team_leader',
          customRole: 'Team Leader', joinedAt: now, user: currentUser,
        };
        const rubric: Rubric = { id: uuid(), projectId, name: 'STEM Capstone Rubric', criteria: [] };
        set({
          team, project, members: [member], rubric, onboarded: true,
          challengeText: '', challengeSource: '', challengeAnalysis: '', ideas: [], blueprint: '',
          ideaEngineError: null, ideaEngineNotice: null, experiments: [],
          buildStages: [], roadmapBusy: false, roadmapError: null,
        });
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('sch_team', JSON.stringify(team));
            localStorage.setItem('sch_project', JSON.stringify(project));
          }
        } catch {}
        try { void recordAudit('team_create_offline', { teamId: teamId, projectId, resource: 'team', detail: name.trim() }); } catch {}
        return;
      }
      throw new Error(msg);
    }
  },

  joinTeamAction: async (code: string) => {
    const { currentUser } = get();
    if (!currentUser) return;

    const { team } = await joinTeam(code);
    const project = await getProjectById(team.id);
    const member: TeamMember = {
      id: uuid(), userId: currentUser.id, teamId: team.id, role: 'student',
      customRole: 'Student', joinedAt: new Date().toISOString(), user: currentUser,
    };

    set({ team, project, members: [member], onboarded: true });
    await get().loadProjectData();
  },

  loadIdeaEngine: () => {
    const { project } = get();
    if (!project) return;
    set({ ...loadIdeaEngineState(project.id), ideaEngineError: null, ideaEngineNotice: null });
  },

  setChallenge: (text: string, source: string) => {
    const { project } = get();
    set({ challengeText: text, challengeSource: source, ideaEngineError: null });
    if (project && typeof window !== 'undefined') {
      try {
        const cur = loadIdeaEngineState(project.id);
        localStorage.setItem(ideaStorageKey(project.id, 'all'), JSON.stringify({ ...cur, challengeText: text, challengeSource: source }));
      } catch {}
    }
  },

  analyzeChallenge: async () => {
    const { project, challengeText, challengeSource } = get();
    if (!project || !challengeText.trim()) return;
    set({ ideaEngineBusy: 'analyze', ideaEngineError: null, ideaEngineNotice: null });
    try {
      const result = await callAI(
        `Capstone challenge: "${challengeText.trim()}"${challengeSource ? ` (source: ${challengeSource})` : ''}. ` +
        `Analyze it under these headings: Summary, Problem, Target users, Required outcome, Constraints, ` +
        `Scientific principles, Engineering requirements, Success criteria, Risks, Unknowns. ` +
        `Mark every point as OFFICIAL (stated in the challenge), INFERRED (likely but not stated), or UNKNOWN. ` +
        `Never present an inference as an official requirement.`,
        'generate',
        'Challenge analysis'
      );
      set({ challengeAnalysis: result });
      try {
        if (typeof window !== 'undefined') {
          const cur = loadIdeaEngineState(project.id);
          localStorage.setItem(ideaStorageKey(project.id, 'all'), JSON.stringify({ ...cur, challengeAnalysis: result }));
        }
      } catch {}
    } catch (err: unknown) {
      set({ ideaEngineError: err instanceof Error ? err.message : 'Challenge analysis failed' });
    } finally {
      set({ ideaEngineBusy: null });
    }
  },

  generateIdeas: async () => {
    const { project, challengeText, challengeAnalysis } = get();
    if (!project || !challengeText.trim()) return;
    set({ ideaEngineBusy: 'ideas', ideaEngineError: null, ideaEngineNotice: null });
    try {
      const result = await callAI(
        `Capstone challenge: "${challengeText.trim()}".` +
        (challengeAnalysis ? ` Analysis: ${challengeAnalysis.slice(0, 1500)}.` : '') +
        ` Generate exactly 3 distinct project ideas. Reply ONLY as a JSON array, no other text, ` +
        `with objects shaped like {"title":"","problem":"","solution":"","science":"","difficulty":"Low|Medium|High","risks":""}.`,
        'generate',
        'Project ideas'
      );
      const parsed = parseIdeasFromAI(result);
      const now = new Date().toISOString();
      const fresh: ProjectIdea[] = parsed.map((p) => ({
        id: uuid(), title: p.title || 'Untitled idea', problem: p.problem || '', solution: p.solution || '',
        science: p.science || '', difficulty: p.difficulty || '', risks: p.risks || '',
        source: 'ai' as const, status: 'draft' as IdeaStatus, createdAt: now,
      }));
      if (fresh.length === 0) throw new Error('The AI returned no usable ideas. Please try again.');
      const ideas = [...get().ideas, ...fresh];
      set({ ideas });
      try {
        if (typeof window !== 'undefined') {
          const cur = loadIdeaEngineState(project.id);
          localStorage.setItem(ideaStorageKey(project.id, 'all'), JSON.stringify({ ...cur, ideas }));
        }
      } catch {}
      set({ ideaEngineNotice: `${fresh.length} ideas generated. Review, validate, then approve one.` });
    } catch (err: unknown) {
      set({ ideaEngineError: err instanceof Error ? err.message : 'Idea generation failed' });
    } finally {
      set({ ideaEngineBusy: null });
    }
  },

  addOwnIdea: (input: { title: string; problem: string; solution: string }) => {
    const { project } = get();
    if (!project || !input.title.trim()) return;
    const idea: ProjectIdea = {
      id: uuid(), title: input.title.trim(), problem: input.problem.trim(), solution: input.solution.trim(),
      science: '', difficulty: '', risks: '', source: 'own', status: 'draft', createdAt: new Date().toISOString(),
    };
    const ideas = [...get().ideas, idea];
    set({ ideas, ideaEngineError: null });
    try {
      if (typeof window !== 'undefined') {
        const cur = loadIdeaEngineState(project.id);
        localStorage.setItem(ideaStorageKey(project.id, 'all'), JSON.stringify({ ...cur, ideas }));
      }
    } catch {}
  },

  validateIdea: async (id: string) => {
    const { project, ideas, challengeText } = get();
    const idea = ideas.find((i) => i.id === id);
    if (!project || !idea) return;
    set({ ideaEngineBusy: id, ideaEngineError: null, ideaEngineNotice: null });
    try {
      const result = await callAI(
        `Validate this student capstone idea against the challenge "${challengeText || 'not specified'}". ` +
        `Idea: "${idea.title}". Problem: ${idea.problem || '—'}. Solution: ${idea.solution || '—'}. ` +
        `Cover: strengths, challenge alignment, feasibility risks, missing information, and one concrete next step. ` +
        `Do not invent test results or official requirements.`,
        'generate',
        'Idea validation'
      );
      const next = get().ideas.map((i) => i.id === id ? { ...i, validation: result, status: 'under_review' as IdeaStatus } : i);
      set({ ideas: next });
      try {
        if (typeof window !== 'undefined') {
          const cur = loadIdeaEngineState(project.id);
          localStorage.setItem(ideaStorageKey(project.id, 'all'), JSON.stringify({ ...cur, ideas: next }));
        }
      } catch {}
    } catch (err: unknown) {
      set({ ideaEngineError: err instanceof Error ? err.message : 'Idea validation failed' });
    } finally {
      set({ ideaEngineBusy: null });
    }
  },

  setIdeaStatus: (id: string, status: IdeaStatus) => {
    const { project } = get();
    const ideas = get().ideas.map((i) => i.id === id ? { ...i, status } : i);
    set({ ideas });
    try {
      if (project && typeof window !== 'undefined') {
        const cur = loadIdeaEngineState(project.id);
        localStorage.setItem(ideaStorageKey(project.id, 'all'), JSON.stringify({ ...cur, ideas }));
      }
    } catch {}
  },

  approveIdea: async (id: string) => {
    const { project } = get();
    const idea = get().ideas.find((i) => i.id === id);
    if (!project || !idea) return;
    const ideas = get().ideas.map((i) => i.id === id ? { ...i, status: 'approved' as IdeaStatus } : (i.status === 'approved' ? { ...i, status: 'archived' as IdeaStatus } : i));
    set({ ideas, ideaEngineError: null, ideaEngineNotice: `"${idea.title}" approved as the project baseline.` });
    try { void recordAudit('idea_approve', { teamId: get().team?.id, projectId: project.id, resource: 'idea', detail: idea.title }); } catch {}
    try {
      if (typeof window !== 'undefined') {
        const cur = loadIdeaEngineState(project.id);
        localStorage.setItem(ideaStorageKey(project.id, 'all'), JSON.stringify({ ...cur, ideas }));
      }
    } catch {}
    // Mirror the approved idea into the workspace so docs/exports use it
    try {
      await get().updateProjectAction({ concept: idea.title, problemStatement: idea.problem || get().project?.problemStatement || '', expectedSolution: idea.solution || get().project?.expectedSolution || '' });
    } catch {
      const cur = get().project;
      if (cur) {
        const updated = { ...cur, concept: idea.title, problemStatement: idea.problem || cur.problemStatement, expectedSolution: idea.solution || cur.expectedSolution, updatedAt: new Date().toISOString() };
        set({ project: updated });
        try { if (typeof window !== 'undefined') localStorage.setItem('sch_project', JSON.stringify(updated)); } catch {}
      }
    }
  },

  generateBlueprint: async () => {
    const { project, ideas, challengeText } = get();
    const approved = ideas.find((i) => i.status === 'approved') || ideas.find((i) => i.status === 'under_review') || ideas[0];
    if (!project || !approved) return;
    set({ ideaEngineBusy: 'blueprint', ideaEngineError: null, ideaEngineNotice: null });
    try {
      const result = await callAI(
        `Create a buildable project blueprint for "${approved.title}". Problem: ${approved.problem || '—'}. ` +
        `Solution: ${approved.solution || '—'}. Challenge: ${challengeText || '—'}. ` +
        `Cover: objective, requirements (measurable), constraints, architecture, components, prototype stages, ` +
        `testing plan, risks + mitigations, timeline in weeks. Mark suggested numbers as "suggested - team must review". ` +
        `End with a TASKS section: one per line as "Task: <title> | <stage: research|design|prototype|testing|analysis|documentation|presentation> | <priority: low|normal|high>". 6 to 10 tasks.`,
        'generate',
        'Project blueprint'
      );
      set({ blueprint: result });
      try {
        if (typeof window !== 'undefined') {
          const cur = loadIdeaEngineState(project.id);
          localStorage.setItem(ideaStorageKey(project.id, 'all'), JSON.stringify({ ...cur, blueprint: result }));
        }
      } catch {}
      set({ ideaEngineNotice: 'Blueprint generated. Review it, then apply its tasks to the board.' });
    } catch (err: unknown) {
      set({ ideaEngineError: err instanceof Error ? err.message : 'Blueprint generation failed' });
    } finally {
      set({ ideaEngineBusy: null });
    }
  },

  applyBlueprintTasks: async () => {
    const { project, blueprint, currentUser } = get();
    if (!project || !currentUser || !blueprint.trim()) return 'Nothing to apply yet. Generate a blueprint first.';
    const lines = blueprint.split('\n').map((l) => l.trim()).filter((l) => /^task\s*:/i.test(l));
    if (lines.length === 0) return 'No "Task:" lines found in the blueprint. Ask for a regeneration with a TASKS section.';
    set({ ideaEngineBusy: 'apply', ideaEngineError: null, ideaEngineNotice: null });
    let saved = 0;
    const localKept: Task[] = [];
    const stages: ProjectStage[] = ['research', 'design', 'prototype', 'testing', 'analysis', 'documentation', 'presentation'];
    try {
      for (const line of lines.slice(0, 12)) {
        const body = line.replace(/^task\s*:/i, '').trim();
        const [titleRaw, stageRaw, priorityRaw] = body.split('|').map((s) => s.trim());
        if (!titleRaw) continue;
        const stage = (stages.includes(stageRaw as ProjectStage) ? stageRaw : 'research') as ProjectStage;
        const priority = (['low', 'normal', 'high', 'critical'].includes(priorityRaw) ? priorityRaw : 'normal') as Task['priority'];
        const payload = {
          projectId: project.id, title: titleRaw, description: 'From project blueprint',
          assignedTo: [] as string[], createdDate: new Date().toISOString(),
          status: 'not_started' as const, priority, stage, createdBy: currentUser.id,
        };
        try {
          await createTask(payload);
          saved++;
        } catch {
          localKept.push({
            id: uuid(), ...payload, dependencies: [], files: [], comments: [], evidence: [],
          });
        }
      }
      if (localKept.length > 0) {
        const tasks = [...get().tasks, ...localKept];
        set({ tasks });
        persistTasksTime(tasks);
      }
      try { await get().loadProjectData(); } catch {}
      const msg = saved > 0 && localKept.length === 0
        ? `${saved} tasks created from the blueprint.`
        : saved > 0
          ? `${saved} tasks saved to the cloud, ${localKept.length} kept locally (offline).`
          : `${localKept.length} tasks kept locally (offline). They will sync on reload once the connection works.`;
      set({ ideaEngineNotice: msg });
      return msg;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not apply blueprint tasks';
      set({ ideaEngineError: msg });
      return msg;
    } finally {
      set({ ideaEngineBusy: null });
    }
  },

  loadExperiments: () => {
    const { project } = get();
    if (!project || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`sch_experiments_${project.id}`);
      set({ experiments: raw ? (JSON.parse(raw) as Experiment[]) : [] });
    } catch {
      set({ experiments: [] });
    }
  },

  createExperimentAction: (input: { title: string; objective?: string; hypothesis?: string }) => {
    const { project, currentUser } = get();
    if (!project || !input.title.trim() || typeof window === 'undefined') return;
    const now = new Date().toISOString();
    const exp: Experiment = {
      id: uuid(), projectId: project.id, title: input.title.trim(),
      objective: input.objective?.trim() || '', hypothesis: input.hypothesis?.trim() || '',
      variables: '', procedure: '', conditions: '', expectedResult: '', actualResult: '',
      status: 'planned', trials: [], createdBy: currentUser?.id, createdAt: now, updatedAt: now,
    };
    const experiments = [exp, ...get().experiments];
    set({ experiments });
    try { localStorage.setItem(`sch_experiments_${project.id}`, JSON.stringify(experiments)); } catch {}
  },

  updateExperimentAction: (id: string, updates: Partial<Experiment>) => {
    const { project } = get();
    if (!project) return;
    const experiments = get().experiments.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    set({ experiments });
    try { if (typeof window !== 'undefined') localStorage.setItem(`sch_experiments_${project.id}`, JSON.stringify(experiments)); } catch {}
  },

  deleteExperimentAction: (id: string) => {
    const { project } = get();
    if (!project) return;
    const experiments = get().experiments.filter((e) => e.id !== id);
    set({ experiments });
    try { if (typeof window !== 'undefined') localStorage.setItem(`sch_experiments_${project.id}`, JSON.stringify(experiments)); } catch {}
  },

  addTrialAction: (experimentId: string, input: { label?: string; measurements: string; result?: string }) => {
    const { project } = get();
    if (!project || !input.measurements.trim()) return;
    const experiments = get().experiments.map((e) => {
      if (e.id !== experimentId) return e;
      const trial: ExperimentTrial = {
        id: uuid(),
        label: input.label?.trim() || `Trial ${e.trials.length + 1}`,
        measurements: input.measurements.trim(),
        result: input.result?.trim() || '',
        date: new Date().toISOString(),
      };
      return { ...e, trials: [...e.trials, trial], updatedAt: new Date().toISOString() };
    });
    set({ experiments });
    try { if (typeof window !== 'undefined') localStorage.setItem(`sch_experiments_${project.id}`, JSON.stringify(experiments)); } catch {}
  },

  deleteTrialAction: (experimentId: string, trialId: string) => {
    const { project } = get();
    if (!project) return;
    const experiments = get().experiments.map((e) =>
      e.id === experimentId ? { ...e, trials: e.trials.filter((tr) => tr.id !== trialId), updatedAt: new Date().toISOString() } : e
    );
    set({ experiments });
    try { if (typeof window !== 'undefined') localStorage.setItem(`sch_experiments_${project.id}`, JSON.stringify(experiments)); } catch {}
  },

  loadBuildStages: () => {
    const { project } = get();
    if (!project || typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`sch_roadmap_${project.id}`);
      set({ buildStages: raw ? (JSON.parse(raw) as BuildStage[]) : [] });
    } catch {
      set({ buildStages: [] });
    }
  },

  addBuildStage: (input: { title: string; objective?: string }) => {
    const { project } = get();
    if (!project || !input.title.trim() || typeof window === 'undefined') return;
    const stage: BuildStage = {
      id: uuid(), title: input.title.trim(), objective: input.objective?.trim() || '', status: 'todo',
    };
    const buildStages = [...get().buildStages, stage];
    set({ buildStages });
    try { localStorage.setItem(`sch_roadmap_${project.id}`, JSON.stringify(buildStages)); } catch {}
  },

  updateBuildStage: (id: string, updates: Partial<BuildStage>) => {
    const { project } = get();
    if (!project) return;
    const buildStages = get().buildStages.map((s) => (s.id === id ? { ...s, ...updates } : s));
    set({ buildStages });
    try { if (typeof window !== 'undefined') localStorage.setItem(`sch_roadmap_${project.id}`, JSON.stringify(buildStages)); } catch {}
  },

  deleteBuildStage: (id: string) => {
    const { project } = get();
    if (!project) return;
    const buildStages = get().buildStages.filter((s) => s.id !== id);
    set({ buildStages });
    try { if (typeof window !== 'undefined') localStorage.setItem(`sch_roadmap_${project.id}`, JSON.stringify(buildStages)); } catch {}
  },

  generateBuildStages: async () => {
    const { project, ideas } = get();
    const approved = ideas.find((i) => i.status === 'approved');
    if (!project) return;
    set({ roadmapBusy: true, roadmapError: null });
    try {
      const result = await callAI(
        `Create a practical prototype build roadmap for "${approved?.title || project.title}". ` +
        `Solution: ${approved?.solution || project.expectedSolution || '—'}. ` +
        `Reply with 5 to 8 numbered build stages, one per line as "1. Stage title - one-line objective". ` +
        `Order them from first validation to final integration and testing. No other text.`,
        'generate',
        'Prototype roadmap'
      );
      const parsed = parseBuildStages(result);
      if (parsed.length === 0) throw new Error('The AI returned no usable stages. Please try again.');
      const buildStages: BuildStage[] = parsed.map((p) => ({ id: uuid(), title: p.title, objective: p.objective, status: 'todo' as BuildStageStatus }));
      set({ buildStages });
      try { if (typeof window !== 'undefined') localStorage.setItem(`sch_roadmap_${project.id}`, JSON.stringify(buildStages)); } catch {}
    } catch (err: unknown) {
      set({ roadmapError: err instanceof Error ? err.message : 'Roadmap generation failed' });
    } finally {
      set({ roadmapBusy: false });
    }
  },

  createTaskAction: async (taskData) => {
    const { project, currentUser } = get();
    if (!project || !currentUser) return;

    await createTask({
      projectId: project.id,
      title: taskData.title,
      description: taskData.description || '',
      assignedTo: taskData.assignedTo || [],
      createdDate: new Date().toISOString(),
      officialDeadline: taskData.officialDeadline,
      teamDeadline: taskData.teamDeadline,
      status: taskData.status || 'not_started',
      priority: taskData.priority || 'normal',
      stage: taskData.stage || 'research',
      createdBy: currentUser.id,
    });
    await get().loadProjectData();
    get().refreshNotifications();
  },

  updateTaskStatusAction: async (taskId: string, status: string) => {
    await updateTask(taskId, { 
      status: status as Task['status'], 
      completionDate: status === 'completed' ? new Date().toISOString() : undefined 
    });
    await get().loadProjectData();
    get().refreshNotifications();
  },

  updateTaskAction: async (taskId: string, updates: Partial<Task>) => {
    await updateTask(taskId, updates);
    await get().loadProjectData();
  },

  createLogbookEntryAction: async (entry) => {
    const { currentUser, project } = get();
    if (!currentUser || !project) return;

    await createLogbookEntry({
      projectId: project.id,
      studentId: currentUser.id,
      activity: entry.activity,
      stage: entry.stage || 'research',
      whatWasDone: entry.whatWasDone || '',
      whyItWasDone: entry.whyItWasDone || '',
      result: entry.result || '',
      problemsEncountered: entry.problemsEncountered || '',
      nextStep: entry.nextStep || '',
      evidence: entry.evidence || [],
      isAutomatic: false,
      linkedTaskId: entry.linkedTaskId,
    });
    await get().loadProjectData();
  },

  updateLogbookEntryAction: async (entryId: string, updates: Partial<LogbookEntry>) => {
    await updateLogbookEntry(entryId, updates);
    await get().loadProjectData();
  },

  createDecisionAction: async (decision) => {
    const { project } = get();
    if (!project) return;

    await createDecision({
      projectId: project.id,
      decision: decision.decision,
      date: new Date().toISOString(),
      decisionMakers: decision.decisionMakers || [],
      reason: decision.reason || '',
      alternativesConsidered: decision.alternativesConsidered || [],
      whyAlternativesRejected: decision.whyAlternativesRejected || '',
    });
    await get().loadProjectData();
  },

  updateDecisionAction: async (decisionId: string, updates: Partial<ProjectDecision>) => {
    await updateDecision(decisionId, updates);
    await get().loadProjectData();
  },

  createIssueAction: async (issue) => {
    const { project } = get();
    if (!project) return;

    await createIssue({
      projectId: project.id,
      title: issue.title,
      description: issue.description || '',
      category: issue.category || 'other',
      severity: issue.severity || 'medium',
      date: new Date().toISOString(),
      responsiblePerson: issue.responsiblePerson,
      relatedTaskId: issue.relatedTaskId,
      resolution: '',
      evidence: [],
      status: 'open',
    });
    await get().loadProjectData();
  },

  updateIssueAction: async (issueId: string, updates: Partial<ProjectIssue>) => {
    await updateIssue(issueId, updates);
    await get().loadProjectData();
  },

  createSourceAction: async (source) => {
    const { project } = get();
    if (!project) return;

    await createSource({
      projectId: project.id,
      title: source.title,
      authors: source.authors || '',
      year: source.year || '',
      url: source.url || '',
      sourceType: source.sourceType || '',
      notes: source.notes || '',
      projectSection: source.projectSection || '',
      relevantConcept: source.relevantConcept || '',
      tags: source.tags || [],
      apaCitation: source.apaCitation || '',
    });
    await get().loadProjectData();
  },

  updateSourceAction: async (sourceId: string, updates: Partial<ResearchSource>) => {
    await updateSource(sourceId, updates);
    await get().loadProjectData();
  },

  updateProjectAction: async (updates) => {
    const { project } = get();
    if (!project) return;
    await updateProject(project.id, { ...updates, updatedAt: new Date().toISOString() });
    await get().loadProjectData();
  },

  uploadFileAction: async (file, category, linkedTaskId, linkedSection) => {
    const { project, currentUser } = get();
    if (!project || !currentUser) return null;

    const row = await uploadFile(file, project.id, category, linkedTaskId, linkedSection);
    await get().loadProjectData();
    return row as { storage_path?: string; id?: string } | null;
  },

  deleteFileAction: async (fileId) => {
    await deleteFile(fileId);
    await get().loadProjectData();
  },

  markNotificationReadAction: async (id) => {
    await markNotificationRead(id);
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  },

  createBudgetItemAction: async (item) => {
    const { project } = get();
    if (!project) return;

    await createBudgetItem({
      projectId: project.id,
      name: item.name,
      category: item.category || 'other',
      amount: item.amount,
      quantity: item.quantity,
      date: new Date().toISOString(),
      notes: item.notes || '',
      receiptFileId: item.receiptFileId,
    });
    await get().loadProjectData();
  },

  deleteBudgetItemAction: async (id) => {
    await deleteBudgetItem(id);
    await get().loadProjectData();
  },

  createMeetingAction: async (meeting) => {
    const { project, currentUser } = get();
    if (!project || !currentUser) return;

    await createMeeting({
      projectId: project.id,
      title: meeting.title,
      date: meeting.date,
      duration: meeting.duration || 60,
      attendees: meeting.attendees || [],
      agenda: meeting.agenda || '',
      notes: meeting.notes || '',
      actionItems: meeting.actionItems || [],
      createdBy: currentUser.id,
    });
    await get().loadProjectData();
  },

  updateMeetingAction: async (id, updates) => {
    await updateMeeting(id, updates);
    await get().loadProjectData();
  },

  deleteMeetingAction: async (id) => {
    await deleteMeeting(id);
    await get().loadProjectData();
  },

  sendChatMessageAction: async (content) => {
    const { project, currentUser } = get();
    if (!project || !currentUser) return;

    await sendChatMessage({
      projectId: project.id,
      userId: currentUser.id,
      content,
      timestamp: new Date().toISOString(),
    });
    await get().loadProjectData();
  },

  createShareLinkAction: async (advisorName, advisorEmail) => {
    const { project } = get();
    if (!project) return;

    const token = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    await createShareLink({
      projectId: project.id,
      token,
      permission: 'view',
      advisorName,
      advisorEmail,
    });
    await get().loadProjectData();
  },

  deleteShareLinkAction: async (id) => {
    await deleteShareLink(id);
    await get().loadProjectData();
  },

  saveVersionAction: async (sectionId, content, changeDescription) => {
    const { currentUser } = get();
    if (!currentUser) return;

    await saveVersion({
      id: uuid(),
      sectionId,
      content,
      changedBy: currentUser.name,
      changedAt: new Date().toISOString(),
      changeDescription,
    });
    await get().loadProjectData();
  },

  getSectionVersionsAction: (sectionId) => {
    return get().versionHistory.filter(v => v.sectionId === sectionId);
  },

  revertToVersionAction: async (versionId) => {
    await revertVersion(versionId);
    await get().loadProjectData();
  },

  applyTemplateAction: async (templateId: string) => {
    const { project, milestones: existingMilestones, sources: existingSources, rubric } = get();
    if (!project) return;

    const template = getTemplateById(templateId);
    if (!template) return;

    const now = new Date();

    function parseOffset(offset: string): string {
      const match = offset.match(/^\+(?:(\d+)d)?(?:(\d+)w)?(?:(\d+)m)?$/);
      if (!match) return now.toISOString();
      const days = parseInt(match[1] || '0', 10);
      const weeks = parseInt(match[2] || '0', 10);
      const months = parseInt(match[3] || '0', 10);
      const result = new Date(now);
      result.setDate(result.getDate() + days + weeks * 7);
      result.setMonth(result.getMonth() + months);
      return result.toISOString();
    }

    const newMilestones: Milestone[] = template.milestones.map((m) => ({
      id: uuid(),
      projectId: project.id,
      name: m.name,
      stage: m.stage as ProjectStage,
      officialDeadline: parseOffset(m.officialDeadline),
      isCompleted: false,
    }));

    const newSources: ResearchSource[] = template.researchSources.map((s) => ({
      id: uuid(),
      projectId: project.id,
      title: s.title,
      authors: s.authors,
      year: s.year,
      url: '',
      sourceType: 'academic',
      notes: '',
      projectSection: 'research',
      relevantConcept: '',
      tags: [],
      apaCitation: '',
    }));

    const newCriteria: RubricCriterion[] = template.rubricCriteria.map((c) => ({
      id: uuid(),
      rubricId: rubric?.id || '',
      name: c,
      description: '',
      status: 'missing' as const,
      evidence: [],
      missingInfo: [],
      relatedTasks: [],
      relatedLogbookEntries: [],
      section: template.name,
    }));

    // Apply template via Supabase
    for (const m of newMilestones) {
      await createMilestone(m);
    }
    for (const s of newSources) {
      await createSource(s);
    }
    if (rubric) {
      for (const c of newCriteria) {
        await updateRubricCriterion(c.id, c);
      }
    }

    await updateProject(project.id, {
      capstoneCategory: template.name,
      updatedAt: now.toISOString(),
    });

    await get().loadProjectData();
  },

  refreshNotifications: async () => {
    const { tasks, milestones } = get();
    const deadlineNotifications = checkDeadlines(tasks, milestones);
    set((state) => {
      const existingIds = new Set(state.notifications.map(n => n.id));
      const merged = [
        ...state.notifications.filter(n => !deadlineNotifications.some(dn => dn.id === n.id)),
        ...deadlineNotifications,
      ];
      return { notifications: merged };
    });
  },

  startTimer: (taskId: string) => {
    const { tasks } = get();
    const now = new Date().toISOString();
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const entries = t.timeEntries || [];
      const running = entries.find((e) => !e.end);
      if (running) return t;
      const newEntry = { id: uuid(), start: now } as any;
      return { ...t, timeEntries: [...entries, newEntry] };
    });
    set({ tasks: updated });
    persistTasksTime(updated);
    const task = updated.find((t) => t.id === taskId);
    if (task) syncTaskTimeToSupabase(task);
  },

  stopTimer: (taskId: string) => {
    const { tasks } = get();
    const now = new Date().toISOString();
    const endMs = new Date(now).getTime();
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const entries = [...(t.timeEntries || [])];
      const idx = entries.findIndex((e) => !e.end);
      if (idx === -1) return t;
      const startMs = new Date(entries[idx].start).getTime();
      let duration = Math.round((endMs - startMs) / 60000);
      if (duration === 0 && endMs - startMs > 1000) duration = 1;
      entries[idx] = { ...entries[idx], end: now, duration };
      const timeSpent = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
      return { ...t, timeEntries: entries, timeSpent };
    });
    set({ tasks: updated });
    persistTasksTime(updated);
    const task = updated.find((t) => t.id === taskId);
    if (task) syncTaskTimeToSupabase(task);
  },

  addManualTime: (taskId: string, minutes: number) => {
    if (!minutes || minutes <= 0) return;
    const { tasks } = get();
    const now = new Date().toISOString();
    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;
      const entries = t.timeEntries || [];
      const newEntry = { id: uuid(), start: now, end: now, duration: Math.round(minutes) } as any;
      const newEntries = [...entries, newEntry];
      const timeSpent = newEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
      return { ...t, timeEntries: newEntries, timeSpent };
    });
    set({ tasks: updated });
    persistTasksTime(updated);
    const task = updated.find((t) => t.id === taskId);
    if (task) syncTaskTimeToSupabase(task);
  },

  getTotalTime: (taskId: string) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return 0;
    if (typeof task.timeSpent === 'number') return task.timeSpent;
    return (task.timeEntries || []).reduce((sum, e) => sum + (e.duration || 0), 0);
  },

  addFeedback: (shareLinkId: string, content: string, section?: string) => {
    const { project, currentUser, feedback, members } = get();
    if (!project || !currentUser || !content.trim()) return;
    const member = members.find(m => m.userId === currentUser.id);
    const authorRole: 'advisor' | 'student' = member?.role === 'advisor' ? 'advisor' : 'student';
    const newEntry: AdvisorFeedback = {
      id: uuid(),
      shareLinkId,
      projectId: project.id,
      authorName: currentUser.name,
      authorRole,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
      section: section || undefined,
    };
    const updated = [...feedback, newEntry];
    set({ feedback: updated });
    saveFeedbackToStorage(updated);
    try {
      const supabase = createClient();
      supabase.from('advisor_feedback').insert({
        id: newEntry.id,
        share_link_id: newEntry.shareLinkId,
        project_id: newEntry.projectId,
        author_name: newEntry.authorName,
        author_role: newEntry.authorRole,
        content: newEntry.content,
        created_at: newEntry.createdAt,
        resolved: newEntry.resolved,
        section: newEntry.section,
      }).then(({ error }: any) => {
        if (error) console.warn('supabase feedback sync failed', error.message);
      });
    } catch (e) {
      // supabase not configured or table missing - ignore
    }
  },

  toggleFeedbackResolved: (id: string) => {
    const { feedback } = get();
    const updated = feedback.map(f => f.id === id ? { ...f, resolved: !f.resolved } : f);
    set({ feedback: updated });
    saveFeedbackToStorage(updated);
    try {
      const supabase = createClient();
      const item = updated.find(f => f.id === id);
      if (item) {
        supabase.from('advisor_feedback').update({ resolved: item.resolved }).eq('id', id).then(({ error }: any) => {
          if (error) console.warn('supabase toggle sync failed', error.message);
        });
      }
    } catch {}
  },

  deleteFeedback: (id: string) => {
    const { feedback } = get();
    const updated = feedback.filter(f => f.id !== id);
    set({ feedback: updated });
    saveFeedbackToStorage(updated);
    try {
      const supabase = createClient();
      supabase.from('advisor_feedback').delete().eq('id', id).then(({ error }: any) => {
        if (error) console.warn('supabase delete sync failed', error.message);
      });
    } catch {}
  },

}));

// Auto-initialize on client
if (typeof window !== 'undefined') {
  useAppStore.getState().initialize();
}
