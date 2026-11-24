'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { formatDate, cn } from '@/lib/utils';
import MeetingSummary from '@/components/meetings/MeetingSummary';
import { CalendarClock, Plus, Trash2, Users, Clock, FileText, CheckCircle2 } from 'lucide-react';

export default function MeetingsPage() {
  const { meetings, createMeetingAction, updateMeetingAction, deleteMeetingAction, members, currentUser } = useAppStore();
  const { t } = useTranslations();
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState('60');
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState('');

  const getUserName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.user.name || 'Unknown';
  };

  const handleAdd = () => {
    if (!title.trim() || !date) return;
    createMeetingAction({
      title: title.trim(),
      date,
      duration: parseInt(duration) || 60,
      agenda: agenda.trim(),
      notes: notes.trim(),
      actionItems: actionItems.split('\n').filter(a => a.trim()),
      attendees: members.map(m => m.userId),
    });
    setTitle(''); setDate(''); setDuration('60'); setAgenda(''); setNotes(''); setActionItems('');
    setShowAdd(false);
  };

  const pastMeetings = meetings.filter(m => new Date(m.date) < new Date());
  const upcomingMeetings = meetings.filter(m => new Date(m.date) >= new Date());

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('meetings')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('meetingsDescription')}</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={14} className="mr-1.5" /> {t('newMeeting')}
        </Button>
      </div>

      {upcomingMeetings.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('upcomingLabel')}</h2>
          <div className="space-y-3 mb-6">
            {upcomingMeetings.map(meeting => (
              <Card key={meeting.id}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-900">{meeting.title}</h3>
                      <Badge className="bg-blue-50 text-blue-700" size="sm">{t('upcomingLabel')}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><CalendarClock size={12} /> {formatDate(meeting.date)}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {meeting.duration} min</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {meeting.attendees.length} {t('attendees')}</span>
                    </div>
                    {meeting.agenda && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-medium">{t('agenda')}:</span> {meeting.agenda}
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteMeetingAction(meeting.id)} className="text-gray-400 hover:text-red-500 shrink-0 ml-3">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('pastLabel')}</h2>
      {meetings.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <CalendarClock size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">{t('noMeetings')}</p>
          </div>
        </Card>
      ) : pastMeetings.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500 text-center py-4">{t('noPastMeetings')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {pastMeetings.map(meeting => (
            <Card key={meeting.id}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">{meeting.title}</h3>
                    <Badge className="bg-gray-100 text-gray-600" size="sm">{t('completed')}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><CalendarClock size={12} /> {formatDate(meeting.date)}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {meeting.duration} min</span>
                  </div>
                  {meeting.notes && (
                    <div className="mt-2 bg-gray-50 p-2 rounded text-xs text-gray-700">
                      <FileText size={12} className="inline mr-1" />{meeting.notes}
                    </div>
                  )}
                  {meeting.summary && (() => {
                    try {
                      const s = JSON.parse(meeting.summary);
                      return (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          {s.keyDecisions?.[0] !== 'No key decisions recorded' && (
                            <div><span className="font-medium text-emerald-700">Decisions:</span> {s.keyDecisions?.join('; ')}</div>
                          )}
                          {s.actionItems?.[0] !== 'No action items identified' && (
                            <div><span className="font-medium text-blue-700">Actions:</span> {s.actionItems?.join('; ')}</div>
                          )}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                  {meeting.actionItems.length > 0 && (
                    <div className="mt-2">
                      {meeting.actionItems.filter(a => a.trim()).map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 py-0.5">
                          <CheckCircle2 size={12} className="text-gray-400" /> {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteMeetingAction(meeting.id)} className="text-gray-400 hover:text-red-500 shrink-0 ml-3">
                  <Trash2 size={14} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t('newMeeting')}>
        <div className="space-y-3">
          <Input label={t('meetingTitle')} placeholder="e.g. Weekly Sync" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label={t('date')} type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label={t('duration')} type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('agenda')}</label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="What will be discussed?"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('meetingNotes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes from the meeting (fill after meeting)"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('actionItems')}</label>
            <textarea
              value={actionItems}
              onChange={(e) => setActionItems(e.target.value)}
              placeholder="Research sensor options&#10;Order materials&#10;Update timeline"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          {(notes.trim() || agenda.trim()) && (
            <MeetingSummary
              notes={notes}
              agenda={agenda}
            />
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t('cancel')}</Button>
            <Button onClick={handleAdd} disabled={!title.trim() || !date}>{t('create')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
