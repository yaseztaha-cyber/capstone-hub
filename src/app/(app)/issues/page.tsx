'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Tabs from '@/components/ui/Tabs';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { useTranslations } from '@/lib/useTranslations';
import type { IssueCategory, IssueSeverity } from '@/lib/types';
import { AlertTriangle, AlertCircle, Plus, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';

const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  high: 'bg-orange-50 text-orange-700 border border-orange-200',
  critical: 'bg-red-50 text-red-700 border border-red-200',
};

export default function IssuesPage() {
  const { issues, members, currentUser, project, createIssueAction } = useAppStore();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', desc: '', category: 'technical', severity: 'medium', assignee: '' });
  const [saving, setSaving] = useState(false);

  const getMemberName = (userId: string) => members.find(m => m.userId === userId)?.user.name || 'Unknown';

  const filtered = issues.filter(i => {
    if (activeTab === 'open') return i.status === 'open';
    if (activeTab === 'in_progress') return i.status === 'in_progress';
    if (activeTab === 'resolved') return i.status === 'resolved';
    return true;
  });

  const handleCreate = async () => {
    if (!form.title.trim() || !currentUser) return;
    setSaving(true);
    try {
      await createIssueAction({
        title: form.title,
        description: form.desc,
        category: form.category as IssueCategory,
        severity: form.severity as IssueSeverity,
        responsiblePerson: form.assignee ? getMemberName(form.assignee) : undefined,
      });
      setShowNew(false);
      setForm({ title: '', desc: '', category: 'technical', severity: 'medium', assignee: '' });
    } finally {
      setSaving(false);
    }
  };

  const statusIcons: Record<string, React.ReactNode> = {
    open: <AlertCircle size={14} className="text-red-500" />,
    in_progress: <Clock size={14} className="text-amber-500" />,
    resolved: <CheckCircle size={14} className="text-emerald-500" />,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('issues')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and resolve project problems</p>
        </div>
        <Button onClick={() => setShowNew(true)}><Plus size={16} className="mr-1" /> {t('add')}</Button>
      </div>

      <Tabs tabs={[
        { id: 'all', label: 'All', count: issues.length },
        { id: 'open', label: 'Open', count: issues.filter(i => i.status === 'open').length },
        { id: 'in_progress', label: 'In Progress', count: issues.filter(i => i.status === 'in_progress').length },
        { id: 'resolved', label: 'Resolved', count: issues.filter(i => i.status === 'resolved').length },
      ]} activeTab={activeTab} onChange={setActiveTab} />

      {filtered.length === 0 ? (
        <EmptyState icon={<AlertTriangle size={40} />} title="No issues reported" description="No issues have been reported yet." action={<Button onClick={() => setShowNew(true)}><Plus size={16} className="mr-1" /> Report</Button>} />
      ) : (
        <div className="space-y-2">
          {filtered.map(issue => (
            <div key={issue.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div onClick={() => setExpanded(expanded === issue.id ? null : issue.id)} className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  {statusIcons[issue.status]}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-gray-900">{issue.title}</h3>
                      <Badge className={cn(SEVERITY_COLORS[issue.severity])} size="sm">{issue.severity}</Badge>
                      <Badge size="sm" className="capitalize">{issue.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{issue.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span>{formatRelativeTime(issue.date)}</span>
                      {issue.responsiblePerson && <span>Assigned: {issue.responsiblePerson}</span>}
                    </div>
                  </div>
                  {expanded === issue.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>
              {expanded === issue.id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                  <div><label className="text-xs font-medium text-gray-500 uppercase">Description</label><p className="text-sm text-gray-700 mt-1">{issue.description}</p></div>
                  {issue.resolution && <div><label className="text-xs font-medium text-gray-500 uppercase">Resolution</label><p className="text-sm text-gray-700 mt-1">{issue.resolution}</p></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title={t('add')}>
        <div className="space-y-4">
          <Input label="Title" placeholder="Brief description" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" rows={3} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={[{ value: 'technical', label: 'Technical' }, { value: 'materials', label: 'Materials' }, { value: 'team', label: 'Team' }, { value: 'deadline', label: 'Deadline' }, { value: 'mentor', label: 'Mentor' }, { value: 'documentation', label: 'Documentation' }, { value: 'prototype', label: 'Prototype' }, { value: 'research', label: 'Research' }, { value: 'other', label: 'Other' }]} />
            <Select label="Severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
          </div>
          <Select label="Responsible Person" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} options={[{ value: '', label: 'Unassigned' }, ...members.map(m => ({ value: m.userId, label: m.user.name }))]} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowNew(false)}>{t('cancel')}</Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || saving}>{saving ? t('loading') : t('add')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
