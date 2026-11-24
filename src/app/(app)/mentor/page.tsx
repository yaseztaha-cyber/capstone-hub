'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import {
  formatDate,
  formatRelativeTime,
  getHealthLabel,
  calculateTaskProgress,
  calculateRubricProgress,
  isOverdue,
} from '@/lib/utils';
import {
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import type { TeamMember, Task, Rubric, ProjectHealth } from '@/lib/types';

type TeamDisplay = {
  id: string;
  name: string;
  projectTitle: string;
  health: ProjectHealth;
  members: TeamMember[];
  tasks: Task[];
  rubric: Rubric | null;
  lastActivity: string;
  projectId: string;
};

function getRubricLevel(percentage: number): string {
  if (percentage >= 85) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 50) return 'Developing';
  if (percentage > 0) return 'Needs Work';
  return 'Not Started';
}

function getRubricVariant(level: string): 'success' | 'info' | 'warning' | 'danger' | 'default' {
  if (level === 'Excellent') return 'success';
  if (level === 'Good') return 'info';
  if (level === 'Developing') return 'warning';
  if (level === 'Needs Work') return 'danger';
  return 'default';
}

function healthBadgeVariant(health: ProjectHealth): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (health === 'on_track') return 'success';
  if (health === 'needs_attention') return 'warning';
  if (health === 'at_risk') return 'danger';
  return 'default';
}

export default function MentorPage() {
  const { team, members, project, tasks, feedback, rubric, logbook, currentUser, toggleFeedbackResolved } =
    useAppStore();
  const { t } = useTranslations();

  const isMentor = useMemo(() => {
    if (!currentUser || !members || members.length === 0) return false;
    const me = members.find((m) => m.userId === currentUser.id);
    return me?.role === 'team_leader' || me?.role === 'advisor';
  }, [members, currentUser]);

  const teamsData: TeamDisplay[] = useMemo(() => {
    if (team && members && members.length > 0) {
      const lastActivity =
        logbook.length > 0
          ? logbook[logbook.length - 1].date
          : project?.updatedAt || project?.createdAt || new Date().toISOString();
      return [
        {
          id: team.id,
          name: team.name,
          projectTitle: project?.title || 'Untitled Project',
          health: (project?.health as ProjectHealth) || 'on_track',
          members,
          tasks,
          rubric,
          lastActivity,
          projectId: team.projectId || team.id,
        },
      ];
    }

    // No demo teams here: showing fake students would mislead mentors.
    // When the mentor has no team yet, the page renders an honest empty state.
    return [];
  }, [team, members, project, tasks, rubric, logbook]);

  const pendingFeedbackList = feedback.filter((f) => !f.resolved);
  const pendingFeedbackCount = pendingFeedbackList.length;

  const allTasks = teamsData.flatMap((td) => td.tasks);
  const overdueTasks = allTasks.filter((t) => {
    const d = t.teamDeadline || t.officialDeadline;
    return d && isOverdue(d) && t.status !== 'completed' && t.status !== 'submitted';
  });

  const totalTeams = teamsData.length;
  const totalStudents = teamsData.reduce((acc, td) => acc + td.members.length, 0);

  const getMemberName = (userId: string, teamMembers: TeamMember[]) => {
    return teamMembers.find((m) => m.userId === userId)?.user.name || 'Unknown';
  };

  // For global overdue list we need to map tasks to their team for member lookup
  const overdueWithTeam = overdueTasks.map((task) => {
    const ownerTeam = teamsData.find((td) => td.tasks.some((t) => t.id === task.id)) || teamsData[0];
    return { task, ownerTeam };
  });

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-teal-700 rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('mentorDashboard')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('mentorDesc')}</p>
          </div>
        </div>
      </div>

      {!isMentor && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Mentor view is for advisors</p>
            <p className="text-xs text-amber-700 mt-1">
              You are viewing as a student. Only your own team&apos;s real data appears here.
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card padding={true} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('totalTeams')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{totalTeams}</p>
            </div>
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
              <Users size={18} className="text-teal-600" />
            </div>
          </div>
        </Card>
        <Card padding={true} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('totalStudents')}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">{totalStudents}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <GraduationCap size={18} className="text-blue-600" />
            </div>
          </div>
        </Card>
        <Card padding={true} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('pendingFeedback')}</p>
              <p className="text-2xl font-semibold text-amber-600 mt-1">{pendingFeedbackCount}</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <MessageSquare size={18} className="text-amber-600" />
            </div>
          </div>
        </Card>
        <Card padding={true} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t('overdueTasks')}</p>
              <p className="text-2xl font-semibold text-red-600 mt-1">{overdueTasks.length}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Teams List */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Users size={16} className="text-gray-500" /> {t('teamsOverview')}
        </h2>
        {teamsData.length === 0 && (
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No teams to review yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Mentor insights appear here once your team workspace has members, tasks, and rubric data. Nothing is fabricated in the meantime.
            </p>
          </Card>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {teamsData.map((td) => {
            const progress = calculateTaskProgress(td.tasks);
            const completed = td.tasks.filter((t) => t.status === 'completed').length;
            return (
              <Card key={td.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{td.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{td.projectTitle}</p>
                  </div>
                  <Badge variant={healthBadgeVariant(td.health)}>{getHealthLabel(td.health)}</Badge>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {completed}/{td.tasks.length} • {progress}%
                    </span>
                  </div>
                  <ProgressBar value={progress} size="sm" color="teal" />
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users size={12} /> {td.members.length} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> Last: {formatRelativeTime(td.lastActivity)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {td.members.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 flex items-center justify-center text-[10px] font-semibold"
                      title={m.user.name}
                    >
                      {m.user.name.charAt(0)}
                    </div>
                  ))}
                  {td.members.length > 4 && (
                    <span className="text-xs text-gray-400">+{td.members.length - 4}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pending Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={16} className="text-amber-500" /> {t('pendingFeedback')}{' '}
            <span className="text-xs font-normal text-gray-400">({pendingFeedbackCount})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingFeedbackList.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <p className="text-sm text-gray-500">No pending feedback</p>
              <p className="text-xs text-gray-400 mt-1">All advisor feedback has been resolved</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingFeedbackList.map((fb) => {
                // find which team project this feedback belongs to
                const fbTeam = teamsData.find((td) => td.projectId === fb.projectId) || teamsData[0];
                return (
                  <div
                    key={fb.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-amber-50/40 dark:bg-amber-900/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {fbTeam?.projectTitle || fb.projectId}
                          </span>
                          {fb.section && (
                            <Badge variant="info" size="sm">
                              {fb.section}
                            </Badge>
                          )}
                          <span className="text-[11px] text-gray-400">{formatDate(fb.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{fb.content}</p>
                        <p className="text-xs text-gray-400 mt-1">by {fb.authorName} • {fb.authorRole}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleFeedbackResolved(fb.id)}
                        className="shrink-0 gap-1"
                      >
                        <CheckCircle size={14} /> Resolve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rubric Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList size={16} className="text-teal-600" /> {t('rubricOverview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamsData.map((td) => {
              const percentage = td.rubric ? calculateRubricProgress(td.rubric.criteria) : 0;
              const level = getRubricLevel(percentage);
              const variant = getRubricVariant(level);
              const total = td.rubric?.criteria.length || 0;
              const complete = td.rubric?.criteria.filter((c) => c.status === 'complete').length || 0;
              return (
                <div
                  key={td.id}
                  className="flex items-center gap-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{td.name}</p>
                      <Badge variant={variant} size="sm">
                        {level}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{td.projectTitle}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">
                          {complete}/{total} criteria
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{percentage}%</span>
                      </div>
                      <ProgressBar value={percentage} size="sm" color="teal" />
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{percentage}%</div>
                    <div className="text-xs text-gray-400">{level}</div>
                  </div>
                </div>
              );
            })}
            {teamsData.every((td) => !td.rubric || td.rubric.criteria.length === 0) && (
              <p className="text-xs text-gray-400 text-center">No rubric data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Overdue Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" /> {t('overdueTasks')}{' '}
            <span className="text-xs font-normal text-gray-400">({overdueTasks.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueWithTeam.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <p className="text-sm text-gray-500">No overdue tasks</p>
              <p className="text-xs text-gray-400 mt-1">All teams are on track</p>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueWithTeam.map(({ task, ownerTeam }) => {
                const deadline = task.teamDeadline || task.officialDeadline || '';
                const assigneeName =
                  task.assignedTo.length > 0
                    ? task.assignedTo.map((id) => getMemberName(id, ownerTeam.members)).join(', ')
                    : 'Unassigned';
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 border border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-900/10 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users size={12} /> {assigneeName}
                        </span>
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <Clock size={12} /> {deadline ? formatDate(deadline) : 'No due date'}
                        </span>
                        <span className="text-xs text-gray-400 hidden sm:inline">{ownerTeam.name}</span>
                      </div>
                    </div>
                    <Badge variant="danger" size="sm">
                      Overdue
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
