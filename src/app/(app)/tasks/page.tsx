'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { cn, getTaskStatusLabel, getTaskStatusColor, getPriorityColor, formatDate, formatShortDate, isOverdue, daysUntil, getStageLabel, getStageColor } from '@/lib/utils';
import type { Task, TaskStatus, TaskPriority, ProjectStage } from '@/lib/types';
import { useTranslations } from '@/lib/useTranslations';
import { CheckSquare, Plus, ChevronRight, Link2, Filter, Clock } from 'lucide-react';
import TimeTracker from '@/components/tasks/TimeTracker';

function formatMinutesShort(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function TasksPage() {
  const { t } = useTranslations();
  const { tasks, members, project, currentUser, createTaskAction, updateTaskStatusAction, getTotalTime } = useAppStore();
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('normal');
  const [newStage, setNewStage] = useState('research');
  const [newAssigned, setNewAssigned] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  const getMemberName = (userId: string) => members.find(m => m.userId === userId)?.user.name || 'Unknown';

  // Keep selectedTask in sync with store updates (e.g., time tracking, status changes)
  useEffect(() => {
    if (selectedTask) {
      const fresh = tasks.find((t) => t.id === selectedTask.id);
      if (fresh && fresh !== selectedTask) {
        // shallow compare significant fields to avoid loop
        if (
          fresh.status !== selectedTask.status ||
          fresh.timeSpent !== selectedTask.timeSpent ||
          (fresh.timeEntries?.length || 0) !== (selectedTask.timeEntries?.length || 0) ||
          JSON.stringify(fresh.timeEntries) !== JSON.stringify(selectedTask.timeEntries)
        ) {
          setSelectedTask(fresh);
        }
      }
    }
  }, [tasks, selectedTask]);

  const filteredTasks = tasks.filter(task => {
    if (activeTab === 'my') return currentUser && task.assignedTo.includes(currentUser.id);
    if (activeTab === 'overdue') return isOverdue(task.teamDeadline || task.officialDeadline || '') && task.status !== 'completed';
    if (activeTab === 'blocked') return task.status === 'blocked';
    if (statusFilter !== 'all') return task.status === statusFilter;
    return true;
  });

  const handleCreate = async () => {
    if (!newTitle.trim() || !project || !currentUser) return;
    setCreating(true);
    try {
      await createTaskAction({
        title: newTitle,
        description: newDesc,
        priority: newPriority as TaskPriority,
        stage: newStage as ProjectStage,
        assignedTo: newAssigned ? [newAssigned] : [],
        teamDeadline: newDeadline || undefined,
        projectId: project.id,
        createdBy: currentUser.id,
      });
      setShowNewTask(false);
      setNewTitle('');
      setNewDesc('');
      setNewDeadline('');
    } finally {
      setCreating(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All', count: tasks.length },
    { id: 'my', label: 'My Tasks', count: tasks.filter(task => currentUser && task.assignedTo.includes(currentUser.id)).length },
    { id: 'overdue', label: 'Overdue', count: tasks.filter(task => isOverdue(task.teamDeadline || task.officialDeadline || '') && task.status !== 'completed').length },
    { id: 'blocked', label: 'Blocked', count: tasks.filter(task => task.status === 'blocked').length },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-5 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">{t('tasks')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.length} {t('tasks')}</p>
        </div>
        <Button onClick={() => setShowNewTask(true)} className="w-full sm:w-auto justify-center"><Plus size={16} className="mr-1" /> {t('add')} {t('tasks')}</Button>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        <Filter size={14} className="text-gray-400 shrink-0" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-md px-2 py-2 sm:py-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 min-h-[44px] sm:min-h-0">
          <option value="all">All {t('tasks')}</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting">Waiting</option>
          <option value="blocked">Blocked</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={40} />}
          title={`No ${t('tasks').toLowerCase()} found`}
          description={`Create your first ${t('tasks').toLowerCase().slice(0, -1)} to start organizing your workflow.`}
          action={<Button onClick={() => setShowNewTask(true)}><Plus size={16} className="mr-1" /> {t('create')} {t('tasks').slice(0, -1)}</Button>}
        />
      ) : (
        <div className="space-y-2">
          {filteredTasks.map(task => {
            const deadline = task.teamDeadline || task.officialDeadline;
            const overdue = deadline ? isOverdue(deadline) && task.status !== 'completed' : false;
            const daysLeft = deadline ? daysUntil(deadline) : null;
            return (
              <div key={task.id} onClick={() => setSelectedTask(task)} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {task.status === 'completed' ? (
                      <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center"><CheckSquare size={12} className="text-emerald-600" /></div>
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={cn('text-sm font-medium', task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900')}>{task.title}</h3>
                      {task.priority !== 'normal' && <span className={cn('text-xs', getPriorityColor(task.priority))}>• {task.priority}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge className={cn(getTaskStatusColor(task.status))}>{getTaskStatusLabel(task.status)}</Badge>
                      <Badge className={cn(getStageColor(task.stage))}>{getStageLabel(task.stage)}</Badge>
                      <span className="text-xs text-gray-400">{task.assignedTo.map((id: string) => getMemberName(id)).join(', ')}</span>
                      {deadline && (
                        <span className={cn('text-xs font-medium', overdue ? 'text-red-600' : daysLeft !== null && daysLeft <= 2 ? 'text-amber-600' : 'text-gray-500')}>
                          {overdue ? 'Overdue' : `${daysLeft}d left`} · {formatShortDate(deadline)}
                        </span>
                      )}
                      {getTotalTime(task.id) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                          <Clock size={12} /> {formatMinutesShort(getTotalTime(task.id))}
                        </span>
                      )}
                    </div>
                    {task.dependencies.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <Link2 size={12} /> {task.dependencies.length} dependenc{task.dependencies.length === 1 ? 'y' : 'ies'}
                      </div>
                    )}
                    {task.timeEntries?.some((e) => !e.end) && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                        <Clock size={12} className="animate-pulse" /> Timer running
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-300 shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)} title={`${t('create')} ${t('tasks').slice(0, -1)}`}>
        <div className="space-y-4">
          <Input label="Title" placeholder="What needs to be done?" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" rows={3} placeholder="Details..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Priority" value={newPriority} onChange={(e) => setNewPriority(e.target.value)} options={[{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
            <Select label="Stage" value={newStage} onChange={(e) => setNewStage(e.target.value)} options={[{ value: 'research', label: 'Research' }, { value: 'design', label: 'Design' }, { value: 'prototype', label: 'Prototype' }, { value: 'testing', label: 'Testing' }, { value: 'analysis', label: 'Analysis' }, { value: 'documentation', label: 'Documentation' }, { value: 'presentation', label: 'Presentation' }]} />
          </div>
          <Select label="Assign To" value={newAssigned} onChange={(e) => setNewAssigned(e.target.value)} options={[{ value: '', label: 'Unassigned' }, ...members.map(m => ({ value: m.userId, label: m.user.name }))]} />
          <Input label="Team Deadline" type="date" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowNewTask(false)} className="w-full sm:w-auto">{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim() || creating} className="w-full sm:w-auto">{creating ? 'Creating...' : t('create') + ' ' + t('tasks')}</Button>
          </div>
        </div>
      </Modal>

      {/* Task Detail Modal */}
      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Task Details" size="lg">
        {selectedTask && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">{selectedTask.title}</h3>
            {selectedTask.description && <p className="text-sm text-gray-500">{selectedTask.description}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                <div className="mt-1"><Badge className={cn(getTaskStatusColor(selectedTask.status))}>{getTaskStatusLabel(selectedTask.status)}</Badge></div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Priority</label>
                <p className={cn('text-sm font-medium capitalize mt-1', getPriorityColor(selectedTask.priority))}>{selectedTask.priority}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Stage</label>
                <div className="mt-1"><Badge className={cn(getStageColor(selectedTask.stage))}>{getStageLabel(selectedTask.stage)}</Badge></div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Assigned To</label>
                <p className="text-sm text-gray-700 mt-1">{selectedTask.assignedTo.map((id: string) => getMemberName(id)).join(', ') || 'Unassigned'}</p>
              </div>
              {selectedTask.teamDeadline && <div><label className="text-xs font-medium text-gray-500 uppercase">Team Deadline</label><p className="text-sm text-gray-700 mt-1">{formatDate(selectedTask.teamDeadline)}</p></div>}
              {selectedTask.officialDeadline && <div><label className="text-xs font-medium text-gray-500 uppercase">Official Deadline</label><p className="text-sm text-gray-700 mt-1">{formatDate(selectedTask.officialDeadline)}</p></div>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Update Status</label>
              <div className="flex gap-2 flex-wrap">
                {(['not_started', 'in_progress', 'waiting', 'blocked', 'submitted', 'completed'] as TaskStatus[]).map(status => (
                  <button key={status} onClick={() => updateTaskStatusAction(selectedTask.id, status)} className={cn('px-3 py-1.5 text-xs font-medium rounded-md border transition-colors', selectedTask.status === status ? 'bg-teal-50 border-teal-300 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50')}>
                    {getTaskStatusLabel(status)}
                  </button>
                ))}
              </div>
            </div>
            <TimeTracker taskId={selectedTask.id} />
          </div>
        )}
      </Modal>
    </div>
  );
}
