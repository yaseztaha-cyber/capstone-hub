'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { MessageSquare, CheckCircle, Trash2, Send } from 'lucide-react';

interface FeedbackThreadProps {
  shareLinkId: string;
  projectId: string;
}

const SECTION_OPTIONS = [
  { value: '', label: 'General / No section' },
  { value: 'overview', label: 'Overview' },
  { value: 'problem', label: 'Problem' },
  { value: 'research', label: 'Research' },
  { value: 'scientific', label: 'Scientific Principles' },
  { value: 'design', label: 'Design Requirements' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'testing', label: 'Testing' },
  { value: 'results', label: 'Results' },
  { value: 'conclusion', label: 'Conclusion' },
  { value: 'grandchallenge', label: 'Grand Challenge' },
];

export default function FeedbackThread({ shareLinkId, projectId }: FeedbackThreadProps) {
  const { feedback, addFeedback, toggleFeedbackResolved, deleteFeedback } = useAppStore();
  const [content, setContent] = useState('');
  const [section, setSection] = useState('');

  const thread = feedback
    .filter(f => f.shareLinkId === shareLinkId && f.projectId === projectId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handlePost = () => {
    if (!content.trim()) return;
    addFeedback(shareLinkId, content, section || undefined);
    setContent('');
    setSection('');
  };

  return (
    <Card className="mt-3">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={16} className="text-teal-700" />
        <h4 className="text-sm font-semibold text-gray-900">Feedback</h4>
        <Badge variant="default" size="sm">{thread.length}</Badge>
        {thread.filter(f => !f.resolved).length > 0 && (
          <Badge variant="warning" size="sm">{thread.filter(f => !f.resolved).length} unresolved</Badge>
        )}
      </div>

      {thread.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg bg-gray-50">
          <MessageSquare size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No feedback yet</p>
          <p className="text-xs text-gray-400 mt-0.5">Be the first to leave a comment for this thread</p>
        </div>
      ) : (
        <div className="space-y-3 mb-4 max-h-[320px] overflow-y-auto pr-1">
          {thread.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-lg border ${item.resolved ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={item.authorRole === 'advisor' ? 'info' : 'success'}
                    size="sm"
                  >
                    {item.authorRole === 'advisor' ? 'Advisor' : 'Student'}
                  </Badge>
                  <span className="text-xs font-medium text-gray-700">{item.authorName}</span>
                  {item.section && (
                    <Badge variant="default" size="sm" className="capitalize">
                      {item.section}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(item.createdAt)}</span>
              </div>
              <p className={`text-sm mt-2 leading-relaxed ${item.resolved ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                {item.content}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  onClick={() => toggleFeedbackResolved(item.id)}
                  className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
                    item.resolved
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle size={12} />
                  {item.resolved ? 'Unresolve' : 'Resolve'}
                </button>
                <button
                  onClick={() => deleteFeedback(item.id)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Leave feedback..."
          rows={3}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
        />
        <div className="flex items-center gap-2">
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 flex-1"
          >
            {SECTION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Button size="sm" onClick={handlePost} disabled={!content.trim()}>
            <Send size={14} className="mr-1.5" />
            Post
          </Button>
        </div>
      </div>
    </Card>
  );
}
