'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Tabs from '@/components/ui/Tabs';
import { cn, formatDate, getStageLabel, getStageColor, formatRelativeTime } from '@/lib/utils';
import { useTranslations } from '@/lib/useTranslations';
import type { ProjectStage } from '@/lib/types';
import { BookOpen, Plus, ChevronDown, ChevronUp, Filter } from 'lucide-react';

export default function LogbookPage() {
  const { logbook, members, currentUser, createLogbookEntryAction } = useAppStore();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('timeline');
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterMember, setFilterMember] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [form, setForm] = useState({ activity: '', stage: 'research', what: '', why: '', result: '', problems: '', nextStep: '' });
  const [saving, setSaving] = useState(false);

  const getMemberName = (userId: string) => members.find(m => m.userId === userId)?.user.name || 'Unknown';

  const filtered = logbook
    .filter(e => (filterMember === 'all' || e.studentId === filterMember) && (filterStage === 'all' || e.stage === filterStage))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCreate = async () => {
    if (!form.activity.trim() || !currentUser) return;
    setSaving(true);
    try {
      await createLogbookEntryAction({
        activity: form.activity,
        stage: form.stage as ProjectStage,
        whatWasDone: form.what,
        whyItWasDone: form.why,
        result: form.result,
        problemsEncountered: form.problems,
        nextStep: form.nextStep,
        studentId: currentUser.id,
      });
      setShowNew(false);
      setForm({ activity: '', stage: 'research', what: '', why: '', result: '', problems: '', nextStep: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('logbook')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Project activity history</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus size={16} className="mr-1" /> Add Entry</Button>
      </div>

      <Tabs tabs={[{ id: 'timeline', label: 'Timeline', count: filtered.length }, { id: 'contributions', label: 'Contributions' }]} activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex items-center gap-3">
        <Filter size={14} className="text-gray-400" />
        <select value={filterMember} onChange={(e) => setFilterMember(e.target.value)} className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-600">
          <option value="all">All Members</option>
          {members.map(m => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
        </select>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="text-sm border border-gray-200 rounded-md px-2 py-1 text-gray-600">
          <option value="all">All Stages</option>
          <option value="research">Research</option><option value="design">Design</option><option value="prototype">Prototype</option>
          <option value="testing">Testing</option><option value="analysis">Analysis</option><option value="documentation">Documentation</option>
        </select>
      </div>

      {activeTab === 'timeline' && (
        filtered.length === 0 ? (
          <EmptyState icon={<BookOpen size={40} />} title="No logbook entries" description="Start recording project activity." action={<Button onClick={() => setShowNew(true)}><Plus size={16} className="mr-1" /> Add Entry</Button>} />
        ) : (
          <div className="relative pl-10">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
            {filtered.map(entry => (
              <div key={entry.id} className="relative pl-10 py-3">
                <div className={cn('absolute left-2.5 top-5 w-3 h-3 rounded-full border-2 border-white', entry.isAutomatic ? 'bg-blue-400' : 'bg-teal-500')} />
                <div onClick={() => setExpanded(expanded === entry.id ? null : entry.id)} className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{getMemberName(entry.studentId)}</span>
                        <Badge className={cn(getStageColor(entry.stage))} size="sm">{getStageLabel(entry.stage)}</Badge>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-1">{entry.activity}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(entry.date)}</p>
                    </div>
                    {expanded === entry.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                  {expanded === entry.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                      {entry.whatWasDone && <div><label className="text-xs font-medium text-gray-500 uppercase">{t('whatWasDone')}</label><p className="text-sm text-gray-700 mt-0.5">{entry.whatWasDone}</p></div>}
                      {entry.whyItWasDone && <div><label className="text-xs font-medium text-gray-500 uppercase">{t('whyItWasDone')}</label><p className="text-sm text-gray-700 mt-0.5">{entry.whyItWasDone}</p></div>}
                      {entry.result && <div><label className="text-xs font-medium text-gray-500 uppercase">{t('result')}</label><p className="text-sm text-gray-700 mt-0.5">{entry.result}</p></div>}
                      {entry.problemsEncountered && <div><label className="text-xs font-medium text-gray-500 uppercase">{t('problemsEncountered')}</label><p className="text-sm text-gray-700 mt-0.5">{entry.problemsEncountered}</p></div>}
                      {entry.nextStep && <div><label className="text-xs font-medium text-gray-500 uppercase">{t('nextStep')}</label><p className="text-sm text-gray-700 mt-0.5">{entry.nextStep}</p></div>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'contributions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map(member => {
            const entries = logbook.filter(e => e.studentId === member.userId);
            const completedTasks = useAppStore.getState().tasks.filter(t => t.assignedTo.includes(member.userId) && t.status === 'completed').length;
            return (
              <Card key={member.userId}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center font-semibold text-sm">{member.user.name.charAt(0)}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{member.user.name}</h3>
                    <p className="text-xs text-gray-500">{member.customRole}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded-lg"><div className="text-lg font-semibold text-gray-900">{entries.length}</div><div className="text-xs text-gray-500">Logbook Entries</div></div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg"><div className="text-lg font-semibold text-gray-900">{completedTasks}</div><div className="text-xs text-gray-500">Tasks Done</div></div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Add Logbook Entry" size="lg">
        <div className="space-y-4">
          <Input label="Activity" placeholder="e.g., Prototype testing" value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })} />
          <Select label="Stage" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} options={[{ value: 'research', label: 'Research' }, { value: 'design', label: 'Design' }, { value: 'prototype', label: 'Prototype' }, { value: 'testing', label: 'Testing' }, { value: 'analysis', label: 'Analysis' }, { value: 'documentation', label: 'Documentation' }]} />
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('whatWasDone')}</label><textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" rows={2} value={form.what} onChange={(e) => setForm({ ...form, what: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('whyItWasDone')}</label><textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" rows={2} value={form.why} onChange={(e) => setForm({ ...form, why: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('result')}</label><textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" rows={2} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('problemsEncountered')}</label><textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" rows={2} value={form.problems} onChange={(e) => setForm({ ...form, problems: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('nextStep')}</label><textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" rows={2} value={form.nextStep} onChange={(e) => setForm({ ...form, nextStep: e.target.value })} /></div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={!form.activity.trim() || saving}>{saving ? t('loading') : t('save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
