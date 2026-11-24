'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import VelocityChart from '@/components/analytics/VelocityChart';
import BurndownChart from '@/components/analytics/BurndownChart';
import StageProgress from '@/components/analytics/StageProgress';
import {
  calculateVelocity,
  calculateBurndown,
  calculateStageProgress,
  calculateTimeVsEstimate,
} from '@/lib/analyticsAdvanced';
import { BarChart3, TrendingUp, Activity, Timer } from 'lucide-react';

type Range = '4w' | '3m' | 'all';

function getCutoff(range: Range): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  if (range === '4w') {
    const d = new Date(now);
    d.setDate(d.getDate() - 28);
    return d;
  }
  if (range === '3m') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return d;
  }
  return null;
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function AnalyticsPage() {
  const { tasks, milestones, logbook } = useAppStore();
  const [range, setRange] = useState<Range>('all');

  const cutoff = useMemo(() => getCutoff(range), [range]);

  const filteredTasks = useMemo(() => {
    if (!cutoff) return tasks;
    return tasks.filter((t) => {
      const candidates: string[] = [];
      if (t.createdDate) candidates.push(t.createdDate);
      if (t.completionDate) candidates.push(t.completionDate);
      if (t.teamDeadline) candidates.push(t.teamDeadline);
      if (t.officialDeadline) candidates.push(t.officialDeadline);
      if (candidates.length === 0) return false;
      return candidates.some((d) => {
        const dt = new Date(d);
        return !isNaN(dt.getTime()) && dt >= cutoff;
      });
    });
  }, [tasks, cutoff]);

  // Also keep logbook in scope per spec (even if not directly visualized)
  const _logbookCount = logbook.length;

  const velocityData = useMemo(() => calculateVelocity(filteredTasks), [filteredTasks]);
  const burndownData = useMemo(() => calculateBurndown(filteredTasks, milestones), [filteredTasks, milestones]);
  const stageData = useMemo(() => calculateStageProgress(filteredTasks), [filteredTasks]);
  const timeData = useMemo(() => calculateTimeVsEstimate(filteredTasks), [filteredTasks]);

  const totalTasks = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === 'completed').length;

  const velocityPerWeek = useMemo(() => {
    if (velocityData.length === 0) return '0';
    const totalCompleted = velocityData.reduce((sum, d) => sum + d.completed, 0);
    const avg = totalCompleted / velocityData.length;
    return avg % 1 === 0 ? String(avg) : avg.toFixed(1);
  }, [velocityData]);

  const avgCompletionTime = useMemo(() => {
    const withTime = timeData.filter((d) => d.actual > 0);
    if (withTime.length === 0) return '—';
    const sum = withTime.reduce((s, d) => s + d.actual, 0);
    const avg = Math.round(sum / withTime.length);
    return formatMinutes(avg);
  }, [timeData]);

  if (tasks.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track velocity, burndown and progress</p>
          </div>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Date range filter"
          >
            <option value="4w">Last 4 weeks</option>
            <option value="3m">Last 3 months</option>
            <option value="all">All time</option>
          </select>
        </div>
        <Card>
          <EmptyState
            icon={<BarChart3 size={40} />}
            title="No analytics data yet"
            description="Create and complete tasks to see velocity, burndown and stage progress. Your analytics will appear here once you have project activity."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 size={20} className="text-teal-600" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track velocity, burndown and progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="info">{_logbookCount} log entries</Badge>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] sm:min-h-0"
            aria-label="Date range filter"
          >
            <option value="4w">Last 4 weeks</option>
            <option value="3m">Last 3 months</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total tasks</span>
            <span className="w-8 h-8 bg-teal-50 dark:bg-teal-950 rounded-md flex items-center justify-center text-teal-600">
              <BarChart3 size={16} />
            </span>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{totalTasks}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">in selected range</div>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completed</span>
            <span className="w-8 h-8 bg-emerald-50 dark:bg-emerald-950 rounded-md flex items-center justify-center text-emerald-600">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{completed}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0}% completion
          </div>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Velocity per week</span>
            <span className="w-8 h-8 bg-blue-50 dark:bg-blue-950 rounded-md flex items-center justify-center text-blue-600">
              <Activity size={16} />
            </span>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{velocityPerWeek}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">avg completed per week</div>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg completion time</span>
            <span className="w-8 h-8 bg-amber-50 dark:bg-amber-950 rounded-md flex items-center justify-center text-amber-600">
              <Timer size={16} />
            </span>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{avgCompletionTime}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">average time spent</div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VelocityChart data={velocityData} />
        <BurndownChart data={burndownData} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <StageProgress data={stageData} />
      </div>

      {/* Optional time vs estimate debug - hidden unless has data but useful for completeness */}
      {timeData.length > 0 && timeData.some((d) => d.estimated !== undefined) && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Time vs Estimate</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 font-medium">Task</th>
                  <th className="text-right py-2 font-medium">Estimated</th>
                  <th className="text-right py-2 font-medium">Actual</th>
                </tr>
              </thead>
              <tbody>
                {timeData.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-2 text-gray-900 dark:text-gray-100 truncate max-w-[200px]">{row.task}</td>
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">{row.estimated !== undefined ? formatMinutes(row.estimated) : '—'}</td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100">{formatMinutes(row.actual)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
