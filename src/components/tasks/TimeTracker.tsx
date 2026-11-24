'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Clock, Play, Pause, Plus } from 'lucide-react';

interface TimeTrackerProps {
  taskId: string;
}

function formatMinutes(minutes: number): string {
  if (!minutes || minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDurationMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDateTimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function TimeTracker({ taskId }: TimeTrackerProps) {
  const task = useAppStore((s) => s.tasks.find((t) => t.id === taskId));
  const startTimer = useAppStore((s) => s.startTimer);
  const stopTimer = useAppStore((s) => s.stopTimer);
  const addManualTime = useAppStore((s) => s.addManualTime);
  const getTotalTime = useAppStore((s) => s.getTotalTime);

  const [manualMinutes, setManualMinutes] = useState<string>('');
  const [tick, setTick] = useState<number>(Date.now());

  const entries = task?.timeEntries || [];
  const runningEntry = entries.find((e) => !e.end);
  const isRunning = !!runningEntry;

  // live tick
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  if (!task) return null;

  const totalMinutes = getTotalTime(taskId);
  const liveMs = isRunning && runningEntry ? tick - new Date(runningEntry.start).getTime() : 0;
  const liveMinutes = isRunning ? Math.floor(liveMs / 60000) : 0;
  // total display includes live minutes (ceil to at least show running time)
  const displayTotal = totalMinutes + (isRunning ? Math.max(0, liveMinutes) : 0);
  // For more precise live elapsed display, show seconds as well if running
  const liveDisplay = isRunning ? formatDurationMs(Math.max(0, liveMs)) : null;

  const handleToggle = () => {
    if (isRunning) stopTimer(taskId);
    else startTimer(taskId);
  };

  const handleAddManual = () => {
    const mins = parseInt(manualMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      addManualTime(taskId, mins);
      setManualMinutes('');
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-teal-600" />
          <span className="text-sm font-medium text-gray-900">Time Tracking</span>
          <Badge className="bg-teal-50 text-teal-700 border border-teal-200">{formatMinutes(displayTotal)}</Badge>
        </div>
        <Button
          size="sm"
          variant={isRunning ? 'danger' : 'primary'}
          onClick={handleToggle}
        >
          {isRunning ? (
            <>
              <Pause size={14} className="mr-1" /> Stop
            </>
          ) : (
            <>
              <Play size={14} className="mr-1" /> Start
            </>
          )}
        </Button>
      </div>

      {isRunning && runningEntry && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <Clock size={12} />
          <span>Running: {liveDisplay}</span>
          <span className="text-amber-500">· started {formatDateTimeLocal(runningEntry.start)}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          placeholder="Minutes"
          value={manualMinutes}
          onChange={(e) => setManualMinutes(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
        <Button size="sm" variant="secondary" onClick={handleAddManual} disabled={!manualMinutes || parseInt(manualMinutes, 10) <= 0}>
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>

      {entries.length > 0 ? (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="text-xs font-medium text-gray-500 uppercase">Entries ({entries.length})</div>
          {entries
            .slice()
            .reverse()
            .map((e) => {
              const isActive = !e.end;
              return (
                <div key={e.id} className="flex items-center justify-between text-xs border border-gray-100 rounded-md px-3 py-2 bg-gray-50">
                  <div className="flex flex-col">
                    <span className="text-gray-700">
                      {formatDateTimeLocal(e.start)} {e.end ? `→ ${formatDateTimeLocal(e.end)}` : '→ now'}
                    </span>
                    {isActive && <span className="text-amber-600 font-medium">In progress</span>}
                  </div>
                  <Badge className={isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-700'}>
                    {isActive ? formatDurationMs(Math.max(0, tick - new Date(e.start).getTime())) : formatMinutes(e.duration || 0)}
                  </Badge>
                </div>
              );
            })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">No time entries yet</p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Clock size={12} />
        <span>Total: {formatMinutes(displayTotal)}</span>
        {isRunning && <span className="text-amber-600">· live updating</span>}
      </div>
    </Card>
  );
}
