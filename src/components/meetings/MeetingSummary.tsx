'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { autoSummarize, type MeetingSummary as MeetingSummaryType } from '@/lib/summarize';
import { CheckCircle2, Target, MessageSquare, ArrowRight, RefreshCw } from 'lucide-react';

interface MeetingSummaryProps {
  notes: string;
  agenda: string;
  summary?: string;
  onSummaryChange?: (summary: string) => void;
}

export default function MeetingSummary({ notes, agenda, summary, onSummaryChange }: MeetingSummaryProps) {
  const [data, setData] = useState<MeetingSummaryType | null>(() => {
    if (summary) {
      try { return JSON.parse(summary); } catch { return null; }
    }
    return null;
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const generate = () => {
    const result = autoSummarize(notes, agenda);
    setData(result);
    setEditing(false);
    onSummaryChange?.(JSON.stringify(result));
  };

  const sections = data ? [
    { title: 'Key Decisions', items: data.keyDecisions, icon: CheckCircle2, color: 'text-emerald-600' },
    { title: 'Action Items', items: data.actionItems, icon: Target, color: 'text-blue-600' },
    { title: 'Topics Discussed', items: data.topicsDiscussed, icon: MessageSquare, color: 'text-purple-600' },
    { title: 'Follow-up Items', items: data.followUpItems, icon: ArrowRight, color: 'text-amber-600' },
  ] : [];

  return (
    <Card className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Meeting Summary</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={generate}>
            <RefreshCw size={12} className="mr-1" /> {data ? 'Regenerate' : 'Auto-Summarize'}
          </Button>
          {data && (
            <Button size="sm" variant="ghost" onClick={() => {
              if (editing) {
                onSummaryChange?.(JSON.stringify(data));
                setEditing(false);
              } else {
                setDraft(JSON.stringify(data, null, 2));
                setEditing(true);
              }
            }}>
              {editing ? 'Save' : 'Edit'}
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            try {
              const parsed = JSON.parse(e.target.value);
              setData(parsed);
            } catch {}
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          rows={10}
        />
      ) : data ? (
        <div className="grid grid-cols-2 gap-4">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center gap-1.5 mb-2">
                <section.icon size={14} className={section.color} />
                <h4 className="text-xs font-semibold text-gray-700">{section.title}</h4>
              </div>
              <ul className="space-y-1">
                {section.items.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-400 mt-0.5">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-4">
          Click &quot;Auto-Summarize&quot; to generate a summary from meeting notes and agenda.
        </p>
      )}
    </Card>
  );
}
