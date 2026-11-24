'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import {
  cn, formatDate, getStageLabel
} from '@/lib/utils';
import {
  Users, Settings, Copy, Check, Shield, User as UserIcon,
  Crown, Wrench, BookOpen, FileText, BarChart3, Presentation, AlertTriangle,
  FlaskConical
} from 'lucide-react';
import { computeContributions } from '@/lib/contributions';

const ROLE_SUGGESTIONS = [
  'Team Leader',
  'Researcher',
  'Prototyper',
  'Data Analyst',
  'Technical Writer',
  'Documentation',
  'Presentation',
  'Safety Officer',
];

export default function TeamPage() {
  const { team, members, currentUser, tasks, logbook, files, experiments, project } = useAppStore();
  const contributions = computeContributions({ members, tasks, logbook, files, experiments });
  const [copied, setCopied] = useState(false);
  const [showEditRole, setShowEditRole] = useState<string | null>(null);
  const [editRole, setEditRole] = useState('');

  if (!team || !currentUser) return null;

  const getMemberTasks = (userId: string) => {
    return tasks.filter(t => t.assignedTo.includes(userId));
  };

  const getMemberCompletedTasks = (userId: string) => {
    return tasks.filter(t => t.assignedTo.includes(userId) && t.status === 'completed');
  };

  const getMemberEntries = (userId: string) => {
    return logbook.filter(e => e.studentId === userId);
  };

  const copyTeamCode = () => {
    navigator.clipboard.writeText(team.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleIcon = (role?: string) => {
    if (role?.toLowerCase().includes('leader')) return Crown;
    if (role?.toLowerCase().includes('research')) return BookOpen;
    if (role?.toLowerCase().includes('proto')) return Wrench;
    if (role?.toLowerCase().includes('data')) return BarChart3;
    if (role?.toLowerCase().includes('document') || role?.toLowerCase().includes('writer')) return FileText;
    if (role?.toLowerCase().includes('present')) return Presentation;
    return UserIcon;
  };

  // Team workload
  const workload = members.map(m => ({
    member: m,
    activeTasks: getMemberTasks(m.userId).filter(t => t.status !== 'completed' && t.status !== 'submitted').length,
    completedTasks: getMemberCompletedTasks(m.userId).length,
    entries: getMemberEntries(m.userId).length,
  }));

  const maxActive = Math.max(...workload.map(w => w.activeTasks));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">{team.name} — {project?.title}</p>
        </div>
        <Button variant="ghost" size="sm">
          <Settings size={16} className="mr-1" /> Settings
        </Button>
      </div>

      {/* Team Code */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Team Code</h3>
            <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">{team.code}</p>
          </div>
          <Button variant="outline" size="sm" onClick={copyTeamCode}>
            {copied ? <Check size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Share this code with teammates to join the project</p>
      </Card>

      {/* Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map(member => {
          const memberTasks = getMemberTasks(member.userId);
          const completedTasks = getMemberCompletedTasks(member.userId);
          const memberEntries = getMemberEntries(member.userId);
          const isActive = member.userId === currentUser.id;
          const RoleIcon = getRoleIcon(member.customRole);

          return (
            <Card key={member.id} className={cn(isActive && 'ring-2 ring-teal-200')}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-semibold text-lg shrink-0">
                  {member.user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{member.user.name}</h3>
                    {isActive && <Badge variant="info" size="sm">You</Badge>}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <RoleIcon size={12} />
                    {member.customRole || member.role}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-gray-900">{memberTasks.length}</div>
                      <div className="text-xs text-gray-500">Tasks</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-emerald-600">{completedTasks.length}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">{memberEntries.length}</div>
                      <div className="text-xs text-gray-500">Logbook</div>
                    </div>
                  </div>

                  {/* Recent tasks */}
                  {memberTasks.filter(t => t.status !== 'completed').slice(0, 2).map(task => (
                    <div key={task.id} className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        task.status === 'in_progress' ? 'bg-blue-500' :
                        task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-300'
                      )} />
                      <span className="truncate">{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Team Workload */}
      <Card>
        <CardHeader>
          <CardTitle>Team Workload</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {workload.map(w => (
            <div key={w.member.userId} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-700 truncate">
                {w.member.user.name.split(' ')[0]}
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      w.activeTasks >= maxActive && maxActive > 0 ? 'bg-amber-500' : 'bg-teal-500'
                    )}
                    style={{ width: `${maxActive > 0 ? (w.activeTasks / maxActive) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 w-16 text-right">
                {w.activeTasks} active
              </div>
            </div>
          ))}
        </div>
        {workload.some(w => w.activeTasks >= maxActive && maxActive > 3) && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Some team members have significantly more active tasks. Consider redistributing work.
            </p>
          </div>
        )}
      </Card>

      {/* Contributions — derived from project records, never invented */}
      <Card>
        <CardHeader>
          <CardTitle>Contributions</CardTitle>
        </CardHeader>
        <p className="text-xs text-gray-500 mb-3">
          Counted from completed tasks, logbook entries, uploaded files, and recorded experiments.
        </p>
        <div className="space-y-3">
          {contributions.map(c => (
            <div key={c.userId} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-700 truncate">
                {c.name.split(' ')[0]}
              </div>
              <div className="flex-1 grid grid-cols-5 gap-1.5">
                <div className="text-center px-1 py-1.5 bg-gray-50 rounded-md" title="Tasks completed">
                  <div className="text-sm font-semibold text-emerald-600">{c.tasksCompleted}</div>
                  <div className="text-[10px] text-gray-500">Done</div>
                </div>
                <div className="text-center px-1 py-1.5 bg-gray-50 rounded-md" title="Tasks assigned">
                  <div className="text-sm font-semibold text-gray-900">{c.tasksAssigned}</div>
                  <div className="text-[10px] text-gray-500">Tasks</div>
                </div>
                <div className="text-center px-1 py-1.5 bg-gray-50 rounded-md" title="Logbook entries">
                  <div className="text-sm font-semibold text-blue-600">{c.logbookEntries}</div>
                  <div className="text-[10px] text-gray-500">Logs</div>
                </div>
                <div className="text-center px-1 py-1.5 bg-gray-50 rounded-md" title="Files uploaded">
                  <div className="text-sm font-semibold text-purple-600">{c.filesUploaded}</div>
                  <div className="text-[10px] text-gray-500">Files</div>
                </div>
                <div className="text-center px-1 py-1.5 bg-gray-50 rounded-md" title="Experiments recorded">
                  <div className="text-sm font-semibold text-amber-600 flex items-center justify-center gap-0.5">
                    <FlaskConical size={12} />{c.experimentsRecorded}
                  </div>
                  <div className="text-[10px] text-gray-500">Tests</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 w-14 text-right shrink-0">
                {c.total} total
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
