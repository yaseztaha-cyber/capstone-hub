import type { Task, Milestone, Meeting } from '@/lib/types';

/**
 * Format a date string or Date into ICS UTC format: YYYYMMDDTHHMMSSZ
 */
function toICSDate(dateStr: string | Date): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function escapeICSText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\n');
}

function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}@stemcapstonehub.com`;
}

function foldLine(line: string): string[] {
  // RFC5545 recommends folding at 75 octets. Simple implementation: 75 chars
  if (line.length <= 75) return [line];
  const result: string[] = [];
  let pos = 0;
  while (pos < line.length) {
    const chunk = line.substring(pos, pos + 75);
    result.push(pos === 0 ? chunk : ' ' + chunk);
    pos += 75;
  }
  return result;
}

function buildVEvent(uid: string, dtStamp: string, dtStart: string, dtEnd: string, summary: string, description: string): string[] {
  const lines: string[] = [];
  lines.push('BEGIN:VEVENT');
  lines.push(`UID:${uid}`);
  lines.push(`DTSTAMP:${dtStamp}`);
  lines.push(`DTSTART:${dtStart}`);
  lines.push(`DTEND:${dtEnd}`);
  lines.push(...foldLine(`SUMMARY:${escapeICSText(summary)}`));
  if (description) {
    lines.push(...foldLine(`DESCRIPTION:${escapeICSText(description)}`));
  }
  lines.push('STATUS:CONFIRMED');
  lines.push('END:VEVENT');
  return lines;
}

export function generateICS(
  tasks: Task[] | any[] = [],
  milestones: Milestone[] | any[] = [],
  meetings: Meeting[] | any[] = []
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//STEM Capstone Hub//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const now = new Date().toISOString();
  const dtStamp = toICSDate(now);

  // Tasks
  for (const task of tasks || []) {
    const t: any = task;
    const rawStart = t.teamDeadline || t.officialDeadline || t.date || t.deadline || t.startDate;
    if (!rawStart) continue;
    const dtStart = toICSDate(rawStart);
    if (!dtStart) continue;

    let dtEnd = '';
    if (t.endDate) {
      dtEnd = toICSDate(t.endDate);
    }
    if (!dtEnd) {
      const startDate = new Date(rawStart);
      dtEnd = toICSDate(addHours(startDate, 1).toISOString());
    }

    const title = t.title || t.name || 'Task';
    const desc = t.description || t.details || '';
    const uid = t.id ? `${t.id}@stemcapstonehub.com` : generateUID();

    lines.push(...buildVEvent(uid, dtStamp, dtStart, dtEnd, title, desc));
  }

  // Milestones
  for (const ms of milestones || []) {
    const m: any = ms;
    const rawStart = m.teamDeadline || m.officialDeadline || m.date || m.deadline;
    if (!rawStart) continue;
    const dtStart = toICSDate(rawStart);
    if (!dtStart) continue;

    let dtEnd = '';
    if (m.endDate) {
      dtEnd = toICSDate(m.endDate);
    }
    if (!dtEnd) {
      const startDate = new Date(rawStart);
      dtEnd = toICSDate(addHours(startDate, 1).toISOString());
    }

    const title = m.name || m.title || 'Milestone';
    const desc = m.description || '';
    const uid = m.id ? `${m.id}@stemcapstonehub.com` : generateUID();

    lines.push(...buildVEvent(uid, dtStamp, dtStart, dtEnd, title, desc));
  }

  // Meetings
  for (const meeting of meetings || []) {
    const mt: any = meeting;
    const rawStart = mt.date || mt.startDate || mt.teamDeadline || mt.officialDeadline;
    if (!rawStart) continue;
    const dtStart = toICSDate(rawStart);
    if (!dtStart) continue;

    let dtEnd = '';
    if (mt.endDate) {
      dtEnd = toICSDate(mt.endDate);
    } else if (mt.duration) {
      const startDate = new Date(rawStart);
      const dur = typeof mt.duration === 'number' ? mt.duration : parseInt(mt.duration, 10) || 60;
      dtEnd = toICSDate(addMinutes(startDate, dur).toISOString());
    } else {
      const startDate = new Date(rawStart);
      dtEnd = toICSDate(addHours(startDate, 1).toISOString());
    }

    const title = mt.title || mt.name || 'Meeting';
    const desc = mt.agenda || mt.description || mt.notes || '';
    const uid = mt.id ? `${mt.id}@stemcapstonehub.com` : generateUID();

    lines.push(...buildVEvent(uid, dtStamp, dtStart, dtEnd, title, desc));
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function getGoogleCalendarUrl(title: string, description: string, startDate: string, endDate?: string): string {
  const start = toICSDate(startDate);
  const end = endDate ? toICSDate(endDate) : toICSDate(addHours(new Date(startDate), 1).toISOString());
  const base = 'https://calendar.google.com/calendar/render';
  // Ensure action param comes first and text param follows to match spec prefix
  return `${base}?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(description)}&dates=${start}/${end}`;
}

export function getOutlookCalendarUrl(title: string, description: string, startDate: string): string {
  const start = new Date(startDate).toISOString();
  const end = addHours(new Date(startDate), 1).toISOString();
  const base = 'https://outlook.live.com/calendar/0/deeplink/compose';
  return `${base}?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description)}&startdt=${encodeURIComponent(start)}&enddt=${encodeURIComponent(end)}`;
}
