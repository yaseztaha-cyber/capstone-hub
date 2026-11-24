'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { Share2, Copy, Trash2, CheckCircle2, ExternalLink, Mail, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import FeedbackThread from '@/components/share/FeedbackThread';

export default function SharePage() {
  const { project, shareLinks, createShareLinkAction, deleteShareLinkAction, feedback } = useAppStore();
  const { t } = useTranslations();
  const [advisorName, setAdvisorName] = useState('');
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!project) return null;

  const handleCreate = () => {
    if (!advisorName.trim() || !advisorEmail.trim()) return;
    createShareLinkAction(advisorName.trim(), advisorEmail.trim());
    setAdvisorName('');
    setAdvisorEmail('');
  };

  const handleCopy = (token: string, id: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getFeedbackCountForLink = (linkId: string) => {
    return feedback.filter(f => f.shareLinkId === linkId && f.projectId === project.id).length;
  };

  const getUnresolvedCountForLink = (linkId: string) => {
    return feedback.filter(f => f.shareLinkId === linkId && f.projectId === project.id && !f.resolved).length;
  };

  const globalShareLinkId = 'global';
  const globalFeedbackCount = feedback.filter(f => f.shareLinkId === globalShareLinkId && f.projectId === project.id).length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{t('shareWithAdvisor')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('shareDescription')}</p>
      </div>

      {/* Global project feedback thread at top */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare size={16} className="text-teal-700" />
          <h2 className="text-sm font-semibold text-gray-900">Project Feedback</h2>
          <Badge variant="default" size="sm">{globalFeedbackCount} comments</Badge>
        </div>
        <FeedbackThread shareLinkId={globalShareLinkId} projectId={project.id} />
      </div>

      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('createShareLink')}</h2>
        <div className="space-y-3">
          <Input
            label={t('advisorName')}
            placeholder="e.g. Dr. Ahmed"
            value={advisorName}
            onChange={(e) => setAdvisorName(e.target.value)}
          />
          <Input
            label={t('advisorEmail')}
            type="email"
            placeholder="advisor@school.edu.eg"
            value={advisorEmail}
            onChange={(e) => setAdvisorEmail(e.target.value)}
          />
          <Button onClick={handleCreate} disabled={!advisorName.trim() || !advisorEmail.trim()}>
            <Share2 size={14} className="mr-1.5" /> {t('generateLink')}
          </Button>
        </div>
      </Card>

      <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('activeShareLinks')}</h2>
      {shareLinks.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500 text-center py-4">{t('noShareLinks')}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shareLinks.map(link => {
            const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${link.token}`;
            const isExpanded = expandedIds.has(link.id);
            const count = getFeedbackCountForLink(link.id);
            const unresolved = getUnresolvedCountForLink(link.id);
            return (
              <Card key={link.id}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{link.advisorName}</p>
                      <Badge variant="success" size="sm">{t('activeShare')}</Badge>
                      {count > 0 && (
                        <Badge variant={unresolved > 0 ? 'warning' : 'default'} size="sm">
                          <MessageSquare size={10} className="mr-1" /> {count} {unresolved > 0 ? `(${unresolved} unresolved)` : ''}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <Mail size={11} /> {link.advisorEmail}
                    </p>
                    <div className="mt-2 flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
                      <code className="text-xs text-gray-600 truncate flex-1">{url}</code>
                      <button
                        onClick={() => handleCopy(link.token, link.id)}
                        className="text-gray-400 hover:text-teal-700 shrink-0"
                      >
                        {copiedId === link.id ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t('created')} {formatDate(link.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => deleteShareLinkAction(link.id)}
                    className="text-gray-400 hover:text-red-500 shrink-0 ml-3"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Collapsible FeedbackThread */}
                <div className="mt-3">
                  <button
                    onClick={() => toggleExpanded(link.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800"
                  >
                    <MessageSquare size={13} />
                    Feedback {count > 0 ? `(${count})` : ''}
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  {isExpanded && (
                    <FeedbackThread shareLinkId={link.id} projectId={project.id} />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
