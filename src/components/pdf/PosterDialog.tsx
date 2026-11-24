'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useAppStore } from '@/lib/store';
import { POSTER_BLOCKS, buildPosterData, type PosterBlockId } from '@/lib/poster';
import { CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';

interface PosterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (blocks: PosterBlockId[], acknowledgements: string) => void;
}

function ackKey(projectId: string) {
  return `sch_poster_ack_${projectId}`;
}

export default function PosterDialog({ isOpen, onClose, onGenerate }: PosterDialogProps) {
  const { project, team, members, budgetItems, experiments, sources, issues } = useAppStore();
  const [selected, setSelected] = useState<PosterBlockId[]>(POSTER_BLOCKS.map((b) => b.id));
  const [ack, setAck] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen || !project || typeof window === 'undefined') return;
    try {
      setAck(localStorage.getItem(ackKey(project.id)) || '');
    } catch {
      setAck('');
    }
    const data = buildPosterData({ project, team, members, budgetItems, experiments, sources, issues });
    setSelected(data.blocks.filter((b) => b.hasContent).map((b) => b.id));
  }, [isOpen, project, team, members, budgetItems, experiments, sources, issues]);

  if (!project) return null;

  const data = buildPosterData({ project, team, members, budgetItems, experiments, sources, issues });
  const contentCount = data.blocks.filter((b) => b.hasContent).length;

  const toggle = (id: PosterBlockId) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleGenerate = async () => {
    if (selected.length === 0) return;
    setGenerating(true);
    try {
      if (typeof window !== 'undefined') {
        try { localStorage.setItem(ackKey(project.id), ack); } catch {}
      }
      await new Promise((r) => setTimeout(r, 300));
      onGenerate(selected, ack);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Poster" size="lg">
      <p className="text-sm text-gray-500 mb-3">
        Builds a one-page academic poster from your workspace data — same section structure as your
        reference posters. Only blocks with content are pre-selected ({contentCount}/{POSTER_BLOCKS.length} ready).
      </p>

      <div className="space-y-2 mb-4">
        {data.blocks.map((b) => (
          <label
            key={b.id}
            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(b.id)}
                onChange={() => toggle(b.id)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              {POSTER_BLOCKS.find((m) => m.id === b.id)?.label}
            </span>
            {b.hasContent ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 size={12} /> Has content
              </span>
            ) : (
              <span className="text-xs text-gray-400">Empty</span>
            )}
          </label>
        ))}
      </div>

      <Textarea
        label="Acknowledgements (optional, saved for next time)"
        value={ack}
        onChange={(e) => setAck(e.target.value)}
        placeholder="e.g., We thank our teachers and the fab lab engineer..."
        rows={3}
      />

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleGenerate} disabled={selected.length === 0 || generating} className="gap-1.5">
          {generating ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
          {generating ? 'Generating...' : 'Generate poster'}
        </Button>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Tip: in the print dialog choose landscape orientation and &quot;Save as PDF&quot;.
      </p>
    </Modal>
  );
}
