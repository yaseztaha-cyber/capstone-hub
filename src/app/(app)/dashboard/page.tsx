'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { evaluateReadiness } from '@/lib/readiness';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import { cn, getTaskStatusLabel, getTaskStatusColor, getHealthColor, getHealthLabel, getOverdueTasks, getUpcomingTasks, getTasksNeedingAttention, calculateTaskProgress, formatShortDate, isOverdue, daysUntil, getPriorityColor } from '@/lib/utils';
import { getTimeRemaining, getDeadlineColor } from '@/lib/deadlines';
import {
  AlertTriangle, CheckCircle2, Clock, Zap, ChevronRight, AlertCircle, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/useTranslations';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import Tour from '@/components/onboarding/Tour';

export default function DashboardPage() {
  const { project, tasks, milestones, members, currentUser, logbook, qualityScore, loading, sources, experiments, files, rubric, challengeText, ideas, blueprint } = useAppStore();
  const readiness = useMemo(
    () => evaluateReadiness({ project, tasks, sources, experiments, files, rubric, challengeText, ideas, blueprint }),
    [project, tasks, sources, experiments, files, rubric, challengeText, ideas, blueprint]
  );
  const router = useRouter();
  const { t } = useTranslations();
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem('sch_tour_done');
      if (!done) {
        const timer = setTimeout(() => setTourOpen(true), 1000);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
      </div>
    );
  }

  if (!project || !currentUser) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <Card className="p-6 text-center space-y-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">No workspace yet</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create a team or join with a code to see your dashboard.
          </p>
          <Button onClick={() => router.push('/onboarding')}>Go to onboarding</Button>
        </Card>
      </div>
    );
  }

  const overdueTasks = getOverdueTasks(tasks);
  const upcomingTasks = getUpcomingTasks(tasks, 7);
  const needsAttention = getTasksNeedingAttention(tasks);
  const taskProgress = calculateTaskProgress(tasks);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  const nextAction = [...tasks]
    .filter(t => t.status !== 'completed' && t.status !== 'submitted')
    .sort((a, b) => {
      const p: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
      return (p[a.priority] ?? 2) - (p[b.priority] ?? 2);
    })[0];

  const getMemberName = (userId: string) => members.find(m => m.userId === userId)?.user.name || 'Unknown';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6 overflow-x-hidden">
      <div data-tour="dashboard" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {greeting()}, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{project.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setTourOpen(true)} className="gap-2">
            <HelpCircle size={16} />
            Take Tour
          </Button>
          <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium', getHealthColor(project.health))}>
            {project.health === 'on_track' && <CheckCircle2 size={15} />}
            {project.health === 'needs_attention' && <AlertTriangle size={15} />}
            {project.health === 'at_risk' && <AlertCircle size={15} />}
            {getHealthLabel(project.health)}
          </div>
        </div>
      </div>

      {project.healthReasons && project.healthReasons.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Why:</p>
          <ul className="space-y-1">
            {project.healthReasons.map((reason: string, i: number) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>{reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
              <CheckCircle2 size={14} className="text-teal-600" />
              Project Readiness
            </CardTitle>
            <Badge variant={readiness.overall === 'READY' ? 'success' : readiness.overall === 'NOT READY' ? 'danger' : 'warning'}>
              {readiness.overall} · {readiness.passCount}/{readiness.totalCount}
            </Badge>
          </div>
        </CardHeader>
        <ul className="space-y-2">
          {readiness.checks.map((check) => (
            <li key={check.id} className="flex items-start gap-2 text-sm">
              {check.status === 'pass' ? (
                <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
              ) : check.status === 'fail' ? (
                <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              ) : check.status === 'warn' ? (
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
              ) : (
                <HelpCircle size={15} className="text-gray-400 mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="font-medium text-gray-900">{check.label}</span>
                {check.reasons.map((reason, i) => (
                  <p key={i} className="text-xs text-gray-500 mt-0.5">{reason}</p>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/project"><Button variant="outline" size="sm">Open workspace</Button></Link>
          <Link href="/rubric"><Button variant="outline" size="sm">Review rubric</Button></Link>
        </div>
      </Card>

      {nextAction && (
        <div data-tour="tasks">
          <Card className="border-l-4 border-l-teal-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
                  <Zap size={14} className="text-teal-600" />
                  Recommended {t('next')}
                </CardTitle>
                <Badge variant={nextAction.priority === 'critical' ? 'danger' : nextAction.priority === 'high' ? 'warning' : 'default'}>
                  {nextAction.priority}
                </Badge>
              </div>
            </CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-gray-900">{nextAction.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{nextAction.description}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-3 text-xs text-gray-500">
                  <span className="truncate">Assigned to: {nextAction.assignedTo.map((id: string) => getMemberName(id)).join(', ')}</span>
                  {nextAction.teamDeadline && (
                    <span className={cn('font-medium', isOverdue(nextAction.teamDeadline) ? 'text-red-600' : daysUntil(nextAction.teamDeadline) <= 2 ? 'text-amber-600' : 'text-gray-600')}>
                      Due: {formatShortDate(nextAction.teamDeadline)}
                    </span>
                  )}
                </div>
              </div>
              <Link href="/tasks" className="w-full sm:w-auto"><Button size="sm" className="w-full sm:w-auto justify-center">Open Task <ChevronRight size={14} className="ml-1" /></Button></Link>
            </div>
          </Card>
        </div>
      )}

      <div data-tour="tasks" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Tasks</div>
          <div className="text-2xl font-semibold text-gray-900">{tasks.length}</div>
          <div className="text-xs text-gray-500 mt-1">{completedTasks} {t('completed')}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">In Progress</div>
          <div className="text-2xl font-semibold text-blue-600">{inProgressTasks}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Overdue</div>
          <div className={cn("text-2xl font-semibold", overdueTasks.length > 0 ? "text-red-600" : "text-gray-900")}>{overdueTasks.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Quality Score</div>
          <div className="text-2xl font-semibold text-gray-900">{qualityScore?.overall || 0}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div data-tour="project">
          <Card>
            <CardHeader><CardTitle>Project Progress</CardTitle></CardHeader>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Task Completion</span>
                  <span className="font-medium text-gray-900">{taskProgress}%</span>
                </div>
                <ProgressBar value={taskProgress} color="teal" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Rubric Coverage</span>
                  <span className="font-medium text-gray-900">{qualityScore?.rubricCoverage || 0}%</span>
                </div>
                <ProgressBar value={qualityScore?.rubricCoverage || 0} color="blue" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Evidence Coverage</span>
                  <span className="font-medium text-gray-900">{qualityScore?.evidenceCoverage || 0}%</span>
                </div>
                <ProgressBar value={qualityScore?.evidenceCoverage || 0} color="amber" />
              </div>
            </div>
          </Card>
        </div>

        <div data-tour="calendar">
          <Card>
            <CardHeader><CardTitle>Due This Week</CardTitle></CardHeader>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks due this week</p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', task.status === 'blocked' ? 'bg-red-500' : task.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.assignedTo.map((id: string) => getMemberName(id)).join(', ')}</p>
                    </div>
                    <span className={cn('text-xs font-medium shrink-0', isOverdue(task.teamDeadline || task.officialDeadline || '') ? 'text-red-600' : daysUntil(task.teamDeadline || task.officialDeadline || '') <= 2 ? 'text-amber-600' : 'text-gray-500')}>
                      {formatShortDate(task.teamDeadline || task.officialDeadline || '')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Needs Attention
            </CardTitle>
          </CardHeader>
          {needsAttention.length === 0 ? (
            <p className="text-sm text-gray-500">No items need attention</p>
          ) : (
            <div className="space-y-2">
              {needsAttention.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-start gap-3 py-2">
                  {task.status === 'blocked' ? <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" /> : <Clock size={14} className="text-amber-500 mt-0.5 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.status === 'blocked' ? 'Blocked' : isOverdue(task.teamDeadline || task.officialDeadline || '') ? 'Overdue' : 'Critical priority'}
                      {' · '}{task.assignedTo.map((id: string) => getMemberName(id)).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={16} className="text-orange-500" /> Due Within 48 Hours
            </CardTitle>
          </CardHeader>
          {(() => {
            const deadlines48h = tasks
              .filter(t => {
                if (t.status === 'completed') return false;
                const deadline = t.teamDeadline || t.officialDeadline;
                if (!deadline) return false;
                const deadlineDate = new Date(deadline);
                const hoursUntil = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
                return hoursUntil >= 0 && hoursUntil <= 48;
              })
              .sort((a, b) => {
                const aDeadline = new Date(a.teamDeadline || a.officialDeadline || '');
                const bDeadline = new Date(b.teamDeadline || b.officialDeadline || '');
                return aDeadline.getTime() - bDeadline.getTime();
              });

            const deadlines48hMilestones = milestones
              .filter(ms => {
                if (ms.isCompleted) return false;
                const deadline = ms.teamDeadline || ms.officialDeadline;
                if (!deadline) return false;
                const deadlineDate = new Date(deadline);
                const hoursUntil = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
                return hoursUntil >= 0 && hoursUntil <= 48;
              })
              .sort((a, b) => {
                const aDeadline = new Date(a.teamDeadline || a.officialDeadline);
                const bDeadline = new Date(b.teamDeadline || b.officialDeadline);
                return aDeadline.getTime() - bDeadline.getTime();
              });

            if (deadlines48h.length === 0 && deadlines48hMilestones.length === 0) {
              return <p className="text-sm text-gray-500">No items due within 48 hours</p>;
            }

            return (
              <div className="space-y-2">
                {deadlines48h.slice(0, 3).map(task => {
                  const deadline = task.teamDeadline || task.officialDeadline || '';
                  return (
                    <div key={task.id} className="flex items-start gap-3 py-2">
                      <Clock size={14} className={cn('mt-0.5 shrink-0', getDeadlineColor(deadline, task.status))} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('text-xs font-medium', getDeadlineColor(deadline, task.status))}>
                            {getTimeRemaining(deadline)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {task.assignedTo.map((id: string) => getMemberName(id)).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {deadlines48hMilestones.slice(0, 2).map(ms => {
                  const deadline = ms.teamDeadline || ms.officialDeadline;
                  return (
                    <div key={ms.id} className="flex items-start gap-3 py-2">
                      <AlertCircle size={14} className={cn('mt-0.5 shrink-0', getDeadlineColor(deadline, ms.isCompleted ? 'completed' : 'not_started'))} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{ms.name}</p>
                        <span className={cn('text-xs font-medium', getDeadlineColor(deadline, ms.isCompleted ? 'completed' : 'not_started'))}>
                          {getTimeRemaining(deadline)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>

        <div data-tour="chat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock size={16} className="text-gray-400" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {logbook.length === 0 ? (
                <p className="text-sm text-gray-500">No activity yet</p>
              ) : (
                logbook.slice(-5).reverse().map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 py-1">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{getMemberName(entry.studentId)}</span>
                        {' '}{entry.activity.toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-400">{formatShortDate(entry.date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      <Tour open={tourOpen} onClose={() => setTourOpen(false)} onComplete={() => setTourOpen(false)} />
    </div>
  );
}
