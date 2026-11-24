'use client';

import { v4 as uuid } from 'uuid';
import { useAppStore } from '@/lib/store';

interface BackupPayload {
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportBackup(): string {
  const data: Record<string, unknown> = {};

  if (typeof window !== 'undefined') {
    // Collect all localStorage sch_* keys
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sch_')) {
          const raw = localStorage.getItem(key);
          if (raw !== null) {
            try {
              data[key] = JSON.parse(raw);
            } catch {
              data[key] = raw;
            }
          }
        }
      }
    } catch {}

    // Collect store data via useAppStore.getState()
    try {
      const state = useAppStore.getState();
      const storeSnapshot = {
        currentUser: state.currentUser,
        team: state.team,
        members: state.members,
        project: state.project,
        tasks: state.tasks,
        milestones: state.milestones,
        calendarEvents: state.calendarEvents,
        files: state.files,
        rubric: state.rubric,
        logbook: state.logbook,
        decisions: state.decisions,
        issues: state.issues,
        sources: state.sources,
        notifications: state.notifications,
        budgetItems: state.budgetItems,
        meetings: state.meetings,
        chatMessages: state.chatMessages,
        shareLinks: state.shareLinks,
        versionHistory: state.versionHistory,
        feedback: state.feedback,
        locale: state.locale,
      };
      // Store under a dedicated key so import can hydrate store directly
      data['_store'] = storeSnapshot;
    } catch {}
  }

  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };

  return JSON.stringify(payload, null, 2);
}

export function importBackup(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<BackupPayload>;
    if (!parsed || parsed.version !== 1 || !parsed.data || typeof parsed.data !== 'object') {
      return false;
    }

    const data = parsed.data as Record<string, unknown>;

    if (typeof window === 'undefined') return false;

    // Validate that data is not empty? Allow empty but still success if version correct
    // Validate contains at least version and data shape

    // Restore localStorage sch_* keys
    for (const [key, value] of Object.entries(data)) {
      if (key === '_store') continue;
      if (key.startsWith('sch_')) {
        try {
          const toStore = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, toStore);
        } catch {
          // ignore per-key errors but continue
        }
      } else if (key === 'version' || key === 'exportedAt') {
        continue;
      } else {
        // Unknown top-level key - ignore
      }
    }

    // Restore store snapshot if present
    const storeData = (data['_store'] as Record<string, unknown> | undefined);
    if (storeData && typeof storeData === 'object') {
      try {
        const updates: Record<string, unknown> = {};
        // Only restore known store slices to avoid overriding functions
        const allowedKeys = [
          'currentUser',
          'team',
          'members',
          'project',
          'tasks',
          'milestones',
          'calendarEvents',
          'files',
          'rubric',
          'logbook',
          'decisions',
          'issues',
          'sources',
          'notifications',
          'budgetItems',
          'meetings',
          'chatMessages',
          'shareLinks',
          'versionHistory',
          'feedback',
          'locale',
        ];
        for (const k of allowedKeys) {
          if (k in storeData) {
            updates[k] = (storeData as Record<string, unknown>)[k];
            // Also persist known localStorage representations where applicable
            try {
              if (k === 'project' && storeData[k]) {
                // keep compatibility - not required but useful
              }
              if (k === 'tasks' && Array.isArray(storeData[k])) {
                localStorage.setItem('sch_tasks', JSON.stringify(storeData[k]));
              }
              if (k === 'feedback' && Array.isArray(storeData[k])) {
                localStorage.setItem('sch_feedback', JSON.stringify(storeData[k]));
              }
              if (k === 'locale' && typeof storeData[k] === 'string') {
                localStorage.setItem('sch_locale', storeData[k] as string);
              }
            } catch {}
          }
        }
        if (Object.keys(updates).length > 0) {
          useAppStore.setState(updates as never);
        }
      } catch {
        // store restore failed but localStorage restore succeeded -> still return true?
        // We treat as success if localStorage part succeeded
      }
    }

    return true;
  } catch {
    return false;
  }
}

export function cloneProject(newName: string): void {
  try {
    const state = useAppStore.getState();
    const project = state.project;
    if (!project) return;

    const now = new Date().toISOString();
    const newProjectId = uuid();

    const newProject = {
      ...project,
      id: newProjectId,
      title: newName,
      createdAt: now,
      updatedAt: now,
    };

    // Clone tasks with new ids and projectId, remap dependencies
    const idMap = new Map<string, string>();
    const newTasks = state.tasks.map((t) => {
      const nid = uuid();
      idMap.set(t.id, nid);
      return {
        ...t,
        id: nid,
        projectId: newProjectId,
      };
    });

    const newTasksWithDeps = newTasks.map((t) => ({
      ...t,
      dependencies: Array.isArray((t as unknown as Record<string, unknown>).dependencies)
        ? ((t as unknown as Record<string, unknown>).dependencies as string[]).map((dep: string) => idMap.get(dep) || dep)
        : [],
    }));

    // Clone milestones
    const newMilestones = (state.milestones || []).map((m) => ({
      ...m,
      id: uuid(),
      projectId: newProjectId,
    }));

    // Clone calendar events
    const newCalendarEvents = (state.calendarEvents || []).map((e) => ({
      ...e,
      id: uuid(),
      projectId: newProjectId,
      taskId: e.taskId ? idMap.get(e.taskId) || e.taskId : undefined,
    }));

    // Clone other project-scoped entities where applicable
    const newLogbook = (state.logbook || []).map((e) => ({
      ...e,
      id: uuid(),
      projectId: newProjectId,
      linkedTaskId: e.linkedTaskId ? idMap.get(e.linkedTaskId) || e.linkedTaskId : undefined,
    }));

    const newDecisions = (state.decisions || []).map((d) => ({
      ...d,
      id: uuid(),
      projectId: newProjectId,
    }));

    const newIssues = (state.issues || []).map((iss) => ({
      ...iss,
      id: uuid(),
      projectId: newProjectId,
      relatedTaskId: iss.relatedTaskId ? idMap.get(iss.relatedTaskId) || iss.relatedTaskId : undefined,
    }));

    const newSources = (state.sources || []).map((s) => ({
      ...s,
      id: uuid(),
      projectId: newProjectId,
    }));

    const updates: Record<string, unknown> = {
      project: newProject,
      tasks: newTasksWithDeps,
      milestones: newMilestones,
      calendarEvents: newCalendarEvents,
      logbook: newLogbook,
      decisions: newDecisions,
      issues: newIssues,
      sources: newSources,
    };

    // If team exists, update its projectId to new one
    if (state.team) {
      updates.team = { ...state.team, projectId: newProjectId };
    }

    useAppStore.setState(updates as never);

    // Persist to localStorage for compatibility with offline/backup expectations
    try {
      localStorage.setItem('sch_tasks', JSON.stringify(newTasksWithDeps));
      // Storing project under generic key might help exportBackup capture it
      localStorage.setItem('sch_project', JSON.stringify(newProject));
      localStorage.setItem('sch_milestones', JSON.stringify(newMilestones));
      localStorage.setItem('sch_calendarEvents', JSON.stringify(newCalendarEvents));
    } catch {}
  } catch {
    // silently fail
  }
}
