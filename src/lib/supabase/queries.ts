import { createClient } from '@/lib/supabase/client';
import type {
  User, Team, TeamMember, Project, Task, Milestone, CalendarEvent,
  ProjectFile, Rubric, RubricCriterion, LogbookEntry, ProjectDecision,
  ProjectIssue, ResearchSource, Notification, BudgetItem, Meeting,
  ChatMessage, ShareLink, VersionEntry
} from '@/lib/types';

function getSupabase() {
  return createClient();
}

// =============================================
// AUTH
// =============================================
export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await getSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getSupabase().auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await getSupabase().auth.getUser();
  if (error || !user) return null;
  try {
    const { data: profile } = await getSupabase().from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      return {
        id: profile.id,
        name: profile.full_name || profile.email?.split('@')[0] || user.email?.split('@')[0] || 'User',
        email: profile.email || user.email || '',
        school: profile.school || '',
        grade: profile.grade || '',
        avatar: profile.avatar_url,
      } as User;
    }
  } catch {}
  // fallback to auth user if profile missing / RLS
  return {
    id: user.id,
    name: (user.user_metadata as any)?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    school: '',
    grade: '',
  } as User;
}

// =============================================
// AUDIT TRAIL (best-effort, never blocks the UX)
// =============================================
export async function recordAudit(
  action: string,
  opts?: { teamId?: string; projectId?: string; resource?: string; detail?: string }
) {
  try {
    let user: User | null = null;
    try { user = await getCurrentUser(); } catch {}
    await getSupabase().from('audit_logs').insert({
      user_id: user?.id ?? null,
      team_id: opts?.teamId ?? null,
      project_id: opts?.projectId ?? null,
      action,
      resource: opts?.resource ?? null,
      detail: (opts?.detail ?? '').slice(0, 1000),
    });
  } catch {}
}

// =============================================
// TEAMS
// =============================================
export async function createTeam(
  name: string,
  projectName: string,
  opts?: { school?: string; semester?: string; grade?: string }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const code = generateCode();
  // Check if a team with this name already exists
  const { data: existingTeam } = await getSupabase()
    .from('teams')
    .select('id')
    .eq('name', name)
    .single();
  if (existingTeam) throw new Error(`Team name "${name}" is already taken. Please choose a different name.`);

  const { data: team, error: teamErr } = await getSupabase()
    .from('teams')
    .insert({ name, code, created_by: user.id })
    .select()
    .single();
  if (teamErr) throw teamErr;

  await getSupabase().from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'team_leader',
    custom_role: 'Team Leader',
  });

  const { data: project, error: projErr } = await getSupabase()
    .from('projects')
    .insert({
      team_id: team.id,
      title: projectName,
      school: opts?.school?.trim() || '',
      semester: opts?.semester?.trim() || '',
      grade: opts?.grade?.trim() || '',
    })
    .select()
    .single();
  if (projErr) throw projErr;

  await getSupabase().from('rubrics').insert({ project_id: project.id, name: 'STEM Capstone Rubric' });

  return { team, project };
}

export async function joinTeam(code: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data: team, error } = await getSupabase()
    .from('teams')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();
  if (error || !team) throw new Error('Team not found');

  const { data: existing } = await getSupabase()
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single();
  if (existing) return { team };

  await getSupabase().from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    role: 'student',
  });

  return { team };
}

export async function getUserTeam() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: membership } = await getSupabase()
    .from('team_members')
    .select('team_id, teams(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;
  return membership.teams as unknown as Team;
}

export async function getTeamMembers(teamId: string) {
  const { data, error } = await getSupabase()
    .from('team_members')
    .select('*, profiles(*)')
    .eq('team_id', teamId);
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    userId: m.user_id,
    teamId: m.team_id,
    role: m.role,
    customRole: m.custom_role,
    joinedAt: m.joined_at,
    user: {
      id: m.profiles.id,
      name: m.profiles.full_name,
      email: m.profiles.email,
      school: m.profiles.school,
      grade: m.profiles.grade,
      avatar: m.profiles.avatar_url,
    }
  })) as TeamMember[];
}

// =============================================
// PROJECTS
// =============================================
export async function getProject(teamId: string) {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('*')
    .eq('team_id', teamId)
    .single();
  if (error) throw error;
  return data as Project;
}

export async function updateProject(projectId: string, updates: Partial<Project>) {
  const { error } = await getSupabase()
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId);
  if (error) throw error;
}

// =============================================
// TASKS
// =============================================
export async function getTasks(projectId: string) {
  const { data, error } = await getSupabase()
    .from('tasks')
    .select('*, task_assignments(user_id)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    projectId: t.project_id,
    title: t.title,
    description: t.description,
    assignedTo: t.task_assignments?.map((a: { user_id: string }) => a.user_id) || [],
    createdDate: t.created_date,
    officialDeadline: t.official_deadline,
    teamDeadline: t.team_deadline,
    status: t.status,
    priority: t.priority,
    stage: t.stage,
    rubricCriteria: t.rubric_criteria || [],
    dependencies: t.dependencies || [],
    files: [],
    comments: [],
    evidence: [],
    completionDate: t.completion_date,
    createdBy: t.created_by,
    timeSpent: t.time_spent ?? t.timeSpent ?? 0,
    timeEntries: t.time_entries ?? t.timeEntries ?? [],
  })) as Task[];
}

export async function createTask(task: Partial<Task> & { title: string }) {
  const { data, error } = await getSupabase()
    .from('tasks')
    .insert({
      project_id: task.projectId,
      title: task.title,
      description: task.description || '',
      official_deadline: task.officialDeadline,
      team_deadline: task.teamDeadline,
      status: task.status || 'not_started',
      priority: task.priority || 'normal',
      stage: task.stage || 'research',
      created_by: task.createdBy,
    })
    .select()
    .single();
  if (error) throw error;

  if (task.assignedTo && task.assignedTo.length > 0) {
    const assignments = task.assignedTo.map((userId: any) => ({
      task_id: data.id,
      user_id: userId,
    }));
    await getSupabase().from('task_assignments').insert(assignments);
  }

  return data;
}

export async function updateTaskStatus(taskId: string, status: string) {
  const updates: Record<string, unknown> = { status };
  if (status === 'completed') updates.completion_date = new Date().toISOString();
  const { error } = await getSupabase().from('tasks').update(updates).eq('id', taskId);
  if (error) throw error;
}

// =============================================
// MILESTONES
// =============================================
export async function getMilestones(projectId: string) {
  const { data, error } = await getSupabase()
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('official_deadline', { ascending: true });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    projectId: m.project_id,
    name: m.name,
    officialDeadline: m.official_deadline,
    teamDeadline: m.team_deadline,
    stage: m.stage,
    isCompleted: m.is_completed,
    completedDate: m.completed_date,
  })) as Milestone[];
}

// =============================================
// CALENDAR
// =============================================
export async function getCalendarEvents(projectId: string) {
  const { data, error } = await getSupabase()
    .from('calendar_events')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    projectId: e.project_id,
    title: e.title,
    date: e.date,
    endDate: e.end_date,
    type: e.type,
    taskId: e.task_id,
    milestoneId: e.milestone_id,
    color: e.color,
  })) as CalendarEvent[];
}

// =============================================
// FILES
// =============================================
export async function getFiles(projectId: string) {
  const { data, error } = await getSupabase()
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .order('upload_date', { ascending: false });
  if (error) throw error;
  return (data || []).map((f: any) => ({
    id: f.id,
    projectId: f.project_id,
    name: f.name,
    category: f.category,
    uploaderId: f.uploader_id,
    uploadDate: f.upload_date,
    version: f.version,
    size: f.size,
    mimeType: f.mime_type,
    storagePath: f.storage_path,
    linkedTaskId: f.linked_task_id,
    linkedProjectSection: f.linked_project_section,
    linkedRubricCriteria: f.linked_rubric_criteria || [],
    versions: [{ version: f.version, uploaderId: f.uploader_id, uploadDate: f.upload_date, size: f.size, fileId: f.id }],
  })) as ProjectFile[];
}

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const BLOCKED_EXTENSIONS = new Set([
  'exe', 'bat', 'cmd', 'com', 'scr', 'msi', 'ps1', 'sh', 'jar',
  'html', 'htm', 'xhtml', 'svg', 'js', 'mjs',
]);

function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() || 'file';
  return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file';
}

export async function uploadFile(
  file: File,
  projectId: string,
  category: string,
  linkedTaskId?: string,
  linkedSection?: string
) {
  if (!file || file.size <= 0) throw new Error('Empty file. Please choose a valid file.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('File is larger than the 50 MB limit.');
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (BLOCKED_EXTENSIONS.has(ext)) {
    throw new Error(`Files of type ".${ext}" are blocked for security reasons.`);
  }
  const user = await getCurrentUser();
  const uploaderId = user?.id;
  const safeName = sanitizeFileName(file.name);
  const filePath = `${projectId}/${Date.now()}-${safeName}`;
  const { error: uploadErr } = await getSupabase().storage
    .from('project-files')
    .upload(filePath, file);
  if (uploadErr) throw uploadErr;

  const { data, error } = await getSupabase()
    .from('files')
    .insert({
      project_id: projectId,
      name: safeName,
      category,
      storage_path: filePath,
      mime_type: file.type,
      size: file.size,
      uploader_id: uploaderId,
      linked_task_id: linkedTaskId,
      linked_project_section: linkedSection,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// =============================================
// LOGBOOK
// =============================================
export async function getLogbook(projectId: string) {
  const { data, error } = await getSupabase()
    .from('logbook_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((e: any) => ({
    id: e.id,
    projectId: e.project_id,
    date: e.date,
    studentId: e.student_id,
    activity: e.activity,
    stage: e.stage,
    whatWasDone: e.what_was_done,
    whyItWasDone: e.why_it_was_done,
    result: e.result,
    problemsEncountered: e.problems_encountered,
    nextStep: e.next_step,
    evidence: e.evidence || [],
    isAutomatic: e.is_automatic,
    linkedTaskId: e.linked_task_id,
  })) as LogbookEntry[];
}

export async function createLogbookEntry(entry: Partial<LogbookEntry> & { activity: string }) {
  const { data, error } = await getSupabase()
    .from('logbook_entries')
    .insert({
      project_id: entry.projectId,
      student_id: entry.studentId,
      activity: entry.activity,
      stage: entry.stage || 'research',
      what_was_done: entry.whatWasDone || '',
      why_it_was_done: entry.whyItWasDone || '',
      result: entry.result || '',
      problems_encountered: entry.problemsEncountered || '',
      next_step: entry.nextStep || '',
      evidence: entry.evidence || [],
      is_automatic: entry.isAutomatic || false,
      linked_task_id: entry.linkedTaskId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// =============================================
// RUBRIC
// =============================================
export async function getRubric(projectId: string) {
  const { data: rubric, error: rErr } = await getSupabase()
    .from('rubrics')
    .select('*')
    .eq('project_id', projectId)
    .single();
  if (rErr) return null;

  const { data: criteria } = await getSupabase()
    .from('rubric_criteria')
    .select('*')
    .eq('rubric_id', rubric.id)
    .order('sort_order');

  return {
    id: rubric.id,
    projectId: rubric.project_id,
    name: rubric.name,
    criteria: (criteria || []).map((c: any) => ({
      id: c.id,
      rubricId: c.rubric_id,
      name: c.name,
      description: c.description,
      status: c.status,
      section: c.section,
      missingInfo: c.missing_info || [],
      relatedTasks: c.related_tasks || [],
      relatedLogbookEntries: [],
      evidence: [],
    })) as RubricCriterion[],
  } as Rubric;
}

// =============================================
// DECISIONS
// =============================================
export async function getDecisions(projectId: string) {
  const { data, error } = await getSupabase()
    .from('project_decisions')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((d: any) => ({
    id: d.id,
    projectId: d.project_id,
    decision: d.decision,
    date: d.date,
    decisionMakers: d.decision_makers || [],
    reason: d.reason,
    alternativesConsidered: d.alternatives_considered || [],
    whyAlternativesRejected: d.why_alternatives_rejected,
  })) as ProjectDecision[];
}

export async function createDecision(decision: Partial<ProjectDecision> & { decision: string }) {
  const { data, error } = await getSupabase()
    .from('project_decisions')
    .insert({
      project_id: decision.projectId,
      decision: decision.decision,
      decision_makers: decision.decisionMakers || [],
      reason: decision.reason || '',
      alternatives_considered: decision.alternativesConsidered || [],
      why_alternatives_rejected: decision.whyAlternativesRejected || '',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// =============================================
// ISSUES
// =============================================
export async function getIssues(projectId: string) {
  const { data, error } = await getSupabase()
    .from('project_issues')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((i: any) => ({
    id: i.id,
    projectId: i.project_id,
    title: i.title,
    description: i.description,
    category: i.category,
    severity: i.severity,
    date: i.date,
    responsiblePerson: i.responsible_person,
    relatedTaskId: i.related_task_id,
    resolution: i.resolution,
    evidence: i.evidence || [],
    status: i.status,
  })) as ProjectIssue[];
}

export async function createIssue(issue: Partial<ProjectIssue> & { title: string }) {
  const { data, error } = await getSupabase()
    .from('project_issues')
    .insert({
      project_id: issue.projectId,
      title: issue.title,
      description: issue.description || '',
      category: issue.category || 'other',
      severity: issue.severity || 'medium',
      responsible_person: issue.responsiblePerson,
      related_task_id: issue.relatedTaskId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// =============================================
// RESEARCH SOURCES
// =============================================
export async function getSources(projectId: string) {
  const { data, error } = await getSupabase()
    .from('research_sources')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: s.id,
    projectId: s.project_id,
    title: s.title,
    authors: s.authors,
    year: s.year,
    url: s.url,
    sourceType: s.source_type,
    notes: s.notes,
    projectSection: s.project_section,
    relevantConcept: s.relevant_concept,
    tags: s.tags || [],
    apaCitation: s.apa_citation,
  })) as ResearchSource[];
}

export async function createSource(source: Partial<ResearchSource> & { title: string }) {
  const { data, error } = await getSupabase()
    .from('research_sources')
    .insert({
      project_id: source.projectId,
      title: source.title,
      authors: source.authors || '',
      year: source.year || '',
      url: source.url || '',
      source_type: source.sourceType || '',
      notes: source.notes || '',
      project_section: source.projectSection || '',
      relevant_concept: source.relevantConcept || '',
      tags: source.tags || [],
      apa_citation: source.apaCitation || '',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// =============================================
// NOTIFICATIONS
// =============================================
export async function getNotifications(userId: string) {
  const { data, error } = await getSupabase()
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map((n: any) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    createdAt: n.created_at,
    link: n.link,
  })) as Notification[];
}

export async function markNotificationRead(id: string) {
  await getSupabase().from('notifications').update({ read: true }).eq('id', id);
}

// =============================================
// HELPERS
// =============================================
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// =============================================
// EXTENDED QUERIES
// =============================================

export async function getProjectById(projectId: string) {
  const { data, error } = await getSupabase()
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (error) throw error;
  return data as Project;
}

export async function getProjectForCurrentUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data: membership } = await getSupabase()
    .from('team_members')
    .select('team_id, teams(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return null;
  const team = membership.teams as any;
  return getProjectById(team.id);
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const mapped: Record<string, unknown> = { ...updates };
  if ('timeSpent' in updates) {
    mapped.time_spent = (updates as any).timeSpent;
    delete mapped.timeSpent;
  }
  if ('timeEntries' in updates) {
    mapped.time_entries = (updates as any).timeEntries;
    delete mapped.timeEntries;
  }
  const { error } = await getSupabase()
    .from('tasks')
    .update({ ...mapped, updated_at: new Date().toISOString() })
    .eq('id', taskId);
  if (error) throw error;
}

export async function updateLogbookEntry(entryId: string, updates: Partial<LogbookEntry>) {
  const { error } = await getSupabase()
    .from('logbook_entries')
    .update(updates)
    .eq('id', entryId);
  if (error) throw error;
}

export async function updateDecision(decisionId: string, updates: Partial<ProjectDecision>) {
  const { error } = await getSupabase()
    .from('project_decisions')
    .update(updates)
    .eq('id', decisionId);
  if (error) throw error;
}

export async function updateIssue(issueId: string, updates: Partial<ProjectIssue>) {
  const { error } = await getSupabase()
    .from('project_issues')
    .update(updates)
    .eq('id', issueId);
  if (error) throw error;
}

export async function updateSource(sourceId: string, updates: Partial<ResearchSource>) {
  const { error } = await getSupabase()
    .from('research_sources')
    .update(updates)
    .eq('id', sourceId);
  if (error) throw error;
}

export async function createMilestone(milestone: Partial<Milestone> & { projectId: string; name: string }) {
  const { data, error } = await getSupabase()
    .from('milestones')
    .insert({
      project_id: milestone.projectId,
      name: milestone.name,
      official_deadline: milestone.officialDeadline,
      team_deadline: milestone.teamDeadline,
      stage: milestone.stage || 'research',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMilestone(milestoneId: string, updates: Partial<Milestone>) {
  const { error } = await getSupabase()
    .from('milestones')
    .update(updates)
    .eq('id', milestoneId);
  if (error) throw error;
}

export async function createCalendarEvent(event: Partial<CalendarEvent> & { projectId: string; title: string }) {
  const { data, error } = await getSupabase()
    .from('calendar_events')
    .insert({
      project_id: event.projectId,
      title: event.title,
      date: event.date,
      end_date: event.endDate,
      type: event.type || 'other',
      task_id: event.taskId,
      milestone_id: event.milestoneId,
      color: event.color,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCalendarEvent(eventId: string, updates: Partial<CalendarEvent>) {
  const { error } = await getSupabase()
    .from('calendar_events')
    .update(updates)
    .eq('id', eventId);
  if (error) throw error;
}

export async function createRubric(rubric: Partial<Rubric> & { projectId: string; name: string }) {
  const { data, error } = await getSupabase()
    .from('rubrics')
    .insert({
      project_id: rubric.projectId,
      name: rubric.name,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRubricCriterion(criterionId: string, updates: Partial<RubricCriterion>) {
  const { error } = await getSupabase()
    .from('rubric_criteria')
    .update(updates)
    .eq('id', criterionId);
  if (error) throw error;
}

export async function deleteFile(fileId: string) {
  const { data: file } = await getSupabase()
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .single();
  
  if (file?.storage_path) {
    await getSupabase().storage.from('project-files').remove([file.storage_path]);
  }
  
  const { error } = await getSupabase()
    .from('files')
    .delete()
    .eq('id', fileId);
  if (error) throw error;
}

export async function getBudgetItems(projectId: string) {
  const { data, error } = await getSupabase()
    .from('budget_items')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((b: any) => ({
    id: b.id,
    projectId: b.project_id,
    name: b.name,
    category: b.category,
    amount: b.amount,
    quantity: typeof b.quantity === 'number' && b.quantity > 0 ? Math.floor(b.quantity) : 1,
    date: b.date,
    notes: b.notes,
    receiptFileId: b.receipt_file_id,
  })) as BudgetItem[];
}

export async function createBudgetItem(item: Partial<BudgetItem> & { projectId: string; name: string; amount: number }) {
  const { data, error } = await getSupabase()
    .from('budget_items')
    .insert({
      project_id: item.projectId,
      name: item.name,
      category: item.category || 'other',
      amount: item.amount,
      quantity: item.quantity && item.quantity > 0 ? Math.floor(item.quantity) : 1,
      date: item.date || new Date().toISOString(),
      notes: item.notes || '',
      receipt_file_id: item.receiptFileId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBudgetItem(id: string) {
  const { error } = await getSupabase()
    .from('budget_items')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getMeetings(projectId: string) {
  const { data, error } = await getSupabase()
    .from('meetings')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    projectId: m.project_id,
    title: m.title,
    date: m.date,
    duration: m.duration,
    attendees: m.attendees || [],
    agenda: m.agenda,
    notes: m.notes,
    actionItems: m.action_items || [],
    summary: m.summary,
    createdBy: m.created_by,
  })) as Meeting[];
}

export async function createMeeting(meeting: Partial<Meeting> & { projectId: string; title: string; date: string }) {
  const { data, error } = await getSupabase()
    .from('meetings')
    .insert({
      project_id: meeting.projectId,
      title: meeting.title,
      date: meeting.date,
      duration: meeting.duration || 60,
      attendees: meeting.attendees || [],
      agenda: meeting.agenda || '',
      notes: meeting.notes || '',
      action_items: meeting.actionItems || [],
      summary: meeting.summary,
      created_by: meeting.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMeeting(meetingId: string, updates: Partial<Meeting>) {
  const { error } = await getSupabase()
    .from('meetings')
    .update(updates)
    .eq('id', meetingId);
  if (error) throw error;
}

export async function deleteMeeting(id: string) {
  const { error } = await getSupabase()
    .from('meetings')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function getChatMessages(projectId: string) {
  const { data, error } = await getSupabase()
    .from('chat_messages')
    .select('*')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return (data || []).map((m: any) => ({
    id: m.id,
    projectId: m.project_id,
    userId: m.user_id,
    content: m.content,
    timestamp: m.timestamp,
  })) as ChatMessage[];
}

export async function sendChatMessage(message: Partial<ChatMessage> & { projectId: string; userId: string; content: string }) {
  const { data, error } = await getSupabase()
    .from('chat_messages')
    .insert({
      project_id: message.projectId,
      user_id: message.userId,
      content: message.content,
      timestamp: message.timestamp || new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getShareLinks(projectId: string) {
  const { data, error } = await getSupabase()
    .from('share_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: s.id,
    projectId: s.project_id,
    token: s.token,
    permission: s.permission,
    createdAt: s.created_at,
    expiresAt: s.expires_at,
    advisorName: s.advisor_name,
    advisorEmail: s.advisor_email,
  })) as ShareLink[];
}

export async function createShareLink(link: Partial<ShareLink> & { projectId: string; token: string; advisorName: string; advisorEmail: string }) {
  const { data, error } = await getSupabase()
    .from('share_links')
    .insert({
      project_id: link.projectId,
      token: link.token,
      permission: link.permission || 'view',
      advisor_name: link.advisorName,
      advisor_email: link.advisorEmail,
      expires_at: link.expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteShareLink(id: string) {
  const { error } = await getSupabase()
    .from('share_links')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function createNotification(notification: Partial<Notification> & { userId: string; title: string }) {
  const { data, error } = await getSupabase()
    .from('notifications')
    .insert({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message || '',
      type: notification.type || 'info',
      link: notification.link,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getVersionHistory(projectId: string) {
  const { data, error } = await getSupabase()
    .from('version_history')
    .select('*')
    .eq('project_id', projectId)
    .order('changed_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((v: any) => ({
    id: v.id,
    sectionId: v.section_id,
    content: v.content,
    changedBy: v.changed_by,
    changedAt: v.changed_at,
    changeDescription: v.change_description,
  })) as VersionEntry[];
}

export async function saveVersion(version: VersionEntry) {
  const { error } = await getSupabase()
    .from('version_history')
    .insert({
      project_id: version.sectionId.split('-')[0], // extract projectId
      section_id: version.sectionId,
      content: version.content,
      changed_by: version.changedBy,
      changed_at: version.changedAt,
      change_description: version.changeDescription,
    });
  if (error) throw error;
}

export async function revertVersion(versionId: string) {
  const { data: version } = await getSupabase()
    .from('version_history')
    .select('*')
    .eq('id', versionId)
    .single();
  
  if (!version) return;
  
  // The actual revert is handled in the store by updating the project section
  return version;
}

export async function getCurrentUserTeam() {
  const user = await getCurrentUser();
  if (!user) return { team: null, members: [] };
  
  const { data: memberships } = await getSupabase()
    .from('team_members')
    .select('*, teams(*), profiles(*)')
    .eq('user_id', user.id);
  
  if (!memberships || memberships.length === 0) return { team: null, members: [] };
  
  const firstMembership = memberships[0];
  if (!firstMembership.teams) return { team: null, members: [] };
  
  const team = firstMembership.teams;
  
  const members: TeamMember[] = (team.team_members || []).map((tm: any) => ({
    id: tm.id,
    userId: tm.user_id,
    teamId: tm.team_id,
    role: tm.role,
    customRole: tm.custom_role,
    joinedAt: tm.joined_at,
    user: {
      id: tm.profiles.id,
      name: tm.profiles.full_name,
      email: tm.profiles.email,
      school: tm.profiles.school,
      grade: tm.profiles.grade,
      avatar: tm.profiles.avatar_url,
    }
  }));
  
  return { 
    team: {
      id: team.id,
      name: team.name,
      code: team.code,
      projectId: team.project_id,
      createdAt: team.created_at,
    } as Team,
    members 
  };
}

export async function subscribeToProjectChanges(projectId: string, callback: (payload: any) => void) {
  const channel = getSupabase()
    .channel(`project-${projectId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', filter: `project_id=eq.${projectId}` },
      callback
    )
    .subscribe();
  
  return () => {
    getSupabase().removeChannel(channel);
  };
}
