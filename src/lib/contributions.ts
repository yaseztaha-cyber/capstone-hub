import type {
  TeamMember, Task, LogbookEntry, ProjectFile, Experiment,
} from '@/lib/types';

export interface MemberContribution {
  userId: string;
  name: string;
  tasksAssigned: number;
  tasksCompleted: number;
  logbookEntries: number;
  filesUploaded: number;
  experimentsRecorded: number;
  total: number;
}

export interface ContributionInputs {
  members: TeamMember[];
  tasks: Task[];
  logbook: LogbookEntry[];
  files: ProjectFile[];
  experiments: Experiment[];
}

// Derived only — every count traces back to a real project record,
// so contributions can never be invented or go stale.
export function computeContributions(inputs: ContributionInputs): MemberContribution[] {
  const { members, tasks, logbook, files, experiments } = inputs;
  return members.map((m) => {
    const tasksAssigned = tasks.filter((t) => t.assignedTo.includes(m.userId)).length;
    const tasksCompleted = tasks.filter(
      (t) => t.assignedTo.includes(m.userId) && t.status === 'completed'
    ).length;
    const logbookEntries = logbook.filter((e) => e.studentId === m.userId).length;
    const filesUploaded = files.filter((f) => f.uploaderId === m.userId).length;
    const experimentsRecorded = experiments.filter((e) => e.createdBy === m.userId).length;
    return {
      userId: m.userId,
      name: m.user.name,
      tasksAssigned,
      tasksCompleted,
      logbookEntries,
      filesUploaded,
      experimentsRecorded,
      total: tasksCompleted + logbookEntries + filesUploaded + experimentsRecorded,
    };
  }).sort((a, b) => b.total - a.total);
}
