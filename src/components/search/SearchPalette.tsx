'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import MiniSearch from 'minisearch';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import {
  CheckSquare, FileText, BookOpen, AlertTriangle, CalendarClock,
  Flag, Users, Search as SearchIcon, CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaletteDoc {
  id: string;
  title: string;
  text: string;
  type: string;
  route: string;
}

const TYPE_META: Record<string, { icon: typeof CheckSquare; label: string }> = {
  task: { icon: CheckSquare, label: 'Task' },
  file: { icon: FileText, label: 'File' },
  logbook: { icon: BookOpen, label: 'Logbook' },
  decision: { icon: Users, label: 'Decision' },
  issue: { icon: AlertTriangle, label: 'Issue' },
  source: { icon: FileText, label: 'Source' },
  meeting: { icon: CalendarClock, label: 'Meeting' },
  milestone: { icon: Flag, label: 'Milestone' },
};

// Arabic-tolerant term processing: normalize alef/hamza, ta-marbuta,
// alef-maqsura, strip diacritics + tatweel so مخزون matches مخزون.
function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u0652\u0640]/g, '');
}

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const router = useRouter();
  const { tasks, files, logbook, decisions, issues, sources, meetings, milestones } = useAppStore();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const docs = useMemo<PaletteDoc[]>(() => {
    const out: PaletteDoc[] = [];
    for (const t of tasks) out.push({ id: `task-${t.id}`, title: t.title, text: t.description || '', type: 'task', route: '/tasks' });
    for (const f of files) out.push({ id: `file-${f.id}`, title: f.name, text: `${f.category}`, type: 'file', route: '/files' });
    for (const l of logbook) out.push({ id: `log-${l.id}`, title: l.activity, text: `${l.whatWasDone} ${l.result}`.trim(), type: 'logbook', route: '/logbook' });
    for (const d of decisions) out.push({ id: `dec-${d.id}`, title: d.decision, text: d.reason || '', type: 'decision', route: '/project' });
    for (const i of issues) out.push({ id: `iss-${i.id}`, title: i.title, text: i.description || '', type: 'issue', route: '/issues' });
    for (const s of sources) out.push({ id: `src-${s.id}`, title: s.title, text: `${s.authors} ${s.notes}`.trim(), type: 'source', route: '/project' });
    for (const m of meetings) out.push({ id: `meet-${m.id}`, title: m.title, text: m.agenda || '', type: 'meeting', route: '/meetings' });
    for (const ms of milestones) out.push({ id: `ms-${ms.id}`, title: ms.name, text: '', type: 'milestone', route: '/calendar' });
    return out;
  }, [tasks, files, logbook, decisions, issues, sources, meetings, milestones]);

  const index = useMemo(() => {
    const ms = new MiniSearch<PaletteDoc>({
      fields: ['title', 'text'],
      storeFields: ['title', 'text', 'type', 'route'],
      processTerm: (term) => {
        const n = normalizeTerm(term);
        return n.length > 1 ? n : null;
      },
      searchOptions: { prefix: true, fuzzy: 0.2 },
    });
    ms.addAll(docs);
    return ms;
  }, [docs]);

  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 2) return [];
    try {
      return index.search(q).slice(0, 12);
    } catch {
      return [];
    }
  }, [index, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open ]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = (route: string) => {
    onClose();
    router.push(route);
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Search project" size="lg">
      <div className="relative">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && results[active]) {
              go(results[active].route);
            }
          }}
          placeholder="Search tasks, files, logbook, decisions, issues..."
          autoFocus
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Search project content"
        />
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto">
        {query.trim().length < 2 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 py-4 text-center">
            Type at least 2 characters. Searches across your current project only — Arabic and English.
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No matches in this project.</p>
        ) : (
          <ul className="space-y-1">
            {results.map((r, i) => {
              const meta = TYPE_META[r.type] || TYPE_META.task;
              const Icon = meta.icon;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => go(r.route)}
                    onMouseEnter={() => setActive(i)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                      i === active ? 'bg-teal-50 dark:bg-teal-950/40' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    <Icon size={16} className="text-gray-400 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.title}</span>
                      {r.text && <span className="block text-xs text-gray-500 truncate">{r.text.slice(0, 100)}</span>}
                    </span>
                    <span className="text-[11px] text-gray-400 shrink-0">{meta.label}</span>
                    {i === active && <CornerDownLeft size={14} className="text-teal-600 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
