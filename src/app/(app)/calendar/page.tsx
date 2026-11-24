'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn, formatDate, formatShortDate } from '@/lib/utils';
import { generateICS, getGoogleCalendarUrl, getOutlookCalendarUrl } from '@/lib/calendarSync';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Clock, Flag, Users, FileText, ExternalLink, Download
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday
} from 'date-fns';

type ViewMode = 'month' | 'week' | 'agenda';

export default function CalendarPage() {
  const { calendarEvents, tasks, milestones, meetings } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (date: Date) => {
    return calendarEvents.filter(event => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return calendarEvents
      .filter(e => parseISO(e.date) >= now)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
      .slice(0, 10);
  }, [calendarEvents]);

  const typeIcons: Record<string, React.ReactNode> = {
    milestone: <Flag size={12} />,
    task: <FileText size={12} />,
    meeting: <Users size={12} />,
    deadline: <Clock size={12} />,
  };

  const typeColors: Record<string, string> = {
    milestone: 'bg-purple-50 text-purple-700',
    task: 'bg-blue-50 text-blue-700',
    meeting: 'bg-gray-100 text-gray-700',
    deadline: 'bg-red-50 text-red-700',
  };

  const handleExportAll = () => {
    const icsContent = generateICS(tasks || [], milestones || [], meetings || []);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'stem-capstone-calendar.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-5 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track milestones, deadlines, and meetings</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExportAll} className="gap-1.5 w-full sm:w-auto justify-center">
            <Download size={14} />
            Export All to ICS
          </Button>
          <div className="flex gap-1 bg-gray-100 rounded-md p-0.5 w-full sm:w-auto">
            {(['month', 'week', 'agenda'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex-1 sm:flex-none px-3 py-2 sm:py-1.5 text-xs font-medium rounded transition-colors capitalize min-h-[44px] sm:min-h-0',
                  viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 overflow-hidden" padding={false}>
          {/* Month Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 rounded hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronLeft size={18} className="text-gray-600" />
            </button>
            <h2 className="text-sm font-semibold text-gray-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 rounded hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronRight size={18} className="text-gray-600" />
            </button>
          </div>

          {viewMode === 'month' && (
            <div className="p-2 sm:p-4 overflow-x-auto">
              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1 sm:mb-2 min-w-[320px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>
              {/* Days Grid */}
              <div className="grid grid-cols-7 min-w-[320px]">
                {days.map((day, i) => {
                  const dayEvents = getEventsForDay(day);
                  const inMonth = isSameMonth(day, currentDate);
                  const today = isToday(day);
                  const selected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        'min-h-[60px] sm:min-h-[80px] p-1 sm:p-1.5 border border-gray-100 rounded cursor-pointer transition-colors',
                        !inMonth && 'bg-gray-50 text-gray-400',
                        inMonth && 'hover:bg-gray-50',
                        today && 'bg-teal-50/50 border-teal-200',
                        selected && 'ring-2 ring-teal-500'
                      )}
                    >
                      <div className={cn(
                        'text-xs font-medium mb-1',
                        today ? 'text-teal-700 font-bold' : inMonth ? 'text-gray-700' : 'text-gray-400'
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5 hidden sm:block">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={cn(
                              'text-[10px] px-1 py-0.5 rounded truncate',
                              typeColors[event.type] || 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-[10px] text-gray-500 px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                      <div className="sm:hidden">
                        {dayEvents.length > 0 && (
                          <div className="flex gap-0.5 flex-wrap">
                            {dayEvents.slice(0, 3).map(event => (
                              <div key={event.id} className={cn('w-1.5 h-1.5 rounded-full', typeColors[event.type]?.includes('purple') ? 'bg-purple-500' : typeColors[event.type]?.includes('blue') ? 'bg-blue-500' : typeColors[event.type]?.includes('red') ? 'bg-red-500' : 'bg-gray-400')} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'agenda' && (
            <div className="divide-y divide-gray-100">
              {upcomingEvents.map(event => (
                <div key={event.id} className="px-5 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-1.5 rounded', typeColors[event.type])}>
                      {typeIcons[event.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                        <span className="flex items-center gap-1">
                          <a
                            href={getGoogleCalendarUrl(event.title, '', event.date, event.endDate)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-gray-100"
                            title="Add to Google Calendar"
                          >
                            <CalendarIcon size={12} className="text-gray-500" />
                          </a>
                          <a
                            href={getOutlookCalendarUrl(event.title, '', event.date)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-gray-100"
                            title="Add to Outlook"
                          >
                            <ExternalLink size={12} className="text-gray-500" />
                          </a>
                        </span>
                      </div>
                    </div>
                    <Badge variant="default" size="sm">{event.type}</Badge>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-gray-500">No upcoming events</div>
              )}
            </div>
          )}
        </Card>

        {/* Upcoming Events Sidebar */}
        <Card className="h-fit">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Events</h3>
          <div className="space-y-3">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className={cn('p-1.5 rounded shrink-0', typeColors[event.type])}>
                  {typeIcons[event.type]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{event.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500">{formatDate(event.date)}</p>
                    <span className="flex items-center gap-1">
                      <a
                        href={getGoogleCalendarUrl(event.title, '', event.date, event.endDate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-gray-100"
                        title="Add to Google Calendar"
                      >
                        <CalendarIcon size={12} className="text-gray-500" />
                      </a>
                      <a
                        href={getOutlookCalendarUrl(event.title, '', event.date)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-gray-100"
                        title="Add to Outlook"
                      >
                        <ExternalLink size={12} className="text-gray-500" />
                      </a>
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-gray-500">No upcoming events</p>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Legend</h4>
            <div className="space-y-1.5">
              {Object.entries(typeColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={cn('w-3 h-3 rounded', color)} />
                  <span className="text-xs text-gray-600 capitalize">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
