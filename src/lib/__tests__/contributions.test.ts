import { describe, it, expect } from 'vitest';
import { computeContributions } from '@/lib/contributions';
import type { TeamMember, Task, LogbookEntry, ProjectFile, Experiment } from '@/lib/types';

const member = (userId: string, name: string): TeamMember => ({
  id: `m-${userId}`, userId, teamId: 't1', role: 'student',
  joinedAt: '', user: { id: userId, name, email: '' },
});

describe('computeContributions', () => {
  it('counts only records attributable to each member', () => {
    const out = computeContributions({
      members: [member('u1', 'Ahmed'), member('u2', 'Sara')],
      tasks: [
        { id: 't1', assignedTo: ['u1'], status: 'completed' },
        { id: 't2', assignedTo: ['u1', 'u2'], status: 'in_progress' },
      ] as Task[],
      logbook: [{ studentId: 'u1' }, { studentId: 'u1' }, { studentId: 'u2' }] as LogbookEntry[],
      files: [{ uploaderId: 'u2' }] as ProjectFile[],
      experiments: [{ createdBy: 'u1' }] as Experiment[],
    });

    const ahmed = out.find((c) => c.userId === 'u1')!;
    expect(ahmed.tasksAssigned).toBe(2);
    expect(ahmed.tasksCompleted).toBe(1);
    expect(ahmed.logbookEntries).toBe(2);
    expect(ahmed.filesUploaded).toBe(0);
    expect(ahmed.experimentsRecorded).toBe(1);

    const sara = out.find((c) => c.userId === 'u2')!;
    expect(sara.tasksAssigned).toBe(1);
    expect(sara.filesUploaded).toBe(1);
  });

  it('sorts by total descending and handles empty data', () => {
    const out = computeContributions({
      members: [member('u1', 'A'), member('u2', 'B')],
      tasks: [], logbook: [], files: [], experiments: [],
    });
    expect(out).toHaveLength(2);
    expect(out[0].total).toBe(0);
  });
});
