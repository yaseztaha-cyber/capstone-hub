'use client';

import { Calendar, ExternalLink, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { generateICS, getGoogleCalendarUrl, getOutlookCalendarUrl } from '@/lib/calendarSync';

interface CalendarSyncButtonsProps {
  title: string;
  description: string;
  date: string;
  endDate?: string;
}

export function CalendarSyncButtons({ title, description, date, endDate }: CalendarSyncButtonsProps) {
  const googleUrl = getGoogleCalendarUrl(title, description, date, endDate);
  const outlookUrl = getOutlookCalendarUrl(title, description, date);

  const handleDownload = () => {
    // Create a single-event ICS using generateICS with a synthetic task
    const icsContent = generateICS(
      [
        {
          id: `single-${Date.now()}`,
          title,
          description,
          teamDeadline: date,
          officialDeadline: date,
          date,
          endDate,
        } as any,
      ],
      [],
      []
    );
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_') || 'event';
    link.download = `${safeTitle}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400 text-xs px-2.5 py-1.5 gap-1.5"
      >
        <Calendar size={14} />
        Add to Google Calendar
      </a>
      <a
        href={outlookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400 text-xs px-2.5 py-1.5 gap-1.5"
      >
        <ExternalLink size={14} />
        Add to Outlook
      </a>
      <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
        <Download size={14} />
        Download .ics
      </Button>
    </div>
  );
}

export default CalendarSyncButtons;
