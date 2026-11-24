'use client';

import { useEffect, useState } from 'react';
import { callAI, askDocs } from '@/lib/ai';
import { useAppStore } from '@/lib/store';
import { chunkText, buildRagIndex, retrieve, loadRagChunks, saveRagChunks, type RagChunk } from '@/lib/rag';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import Badge from '@/components/ui/Badge';
import Textarea from '@/components/ui/Textarea';
import { Sparkles, Wand2, Copy, Check, Loader2, AlertCircle } from 'lucide-react';

type TaskType = 'improve' | 'generate' | 'summarize' | 'expand' | 'ask';

interface AIAssistantProps {
  initialText?: string;
  onInsert?: (text: string) => void;
}

const SECTION_OPTIONS = [
  { value: 'Problem', label: 'Problem' },
  { value: 'Research', label: 'Research' },
  { value: 'Conclusion', label: 'Conclusion' },
  { value: 'Design', label: 'Design' },
  { value: 'Prototype', label: 'Prototype' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Results', label: 'Results' },
  { value: 'Scientific Principles', label: 'Scientific Principles' },
  { value: 'Grand Challenge', label: 'Grand Challenge' },
];

export default function AIAssistant({ initialText = '', onInsert }: AIAssistantProps) {
  const { project, files } = useAppStore();
  const [activeTab, setActiveTab] = useState<TaskType>('improve');
  const [input, setInput] = useState(initialText);
  const [sectionType, setSectionType] = useState('Problem');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cited, setCited] = useState<string[]>([]);
  const [indexing, setIndexing] = useState(false);
  const [indexedCount, setIndexedCount] = useState<number | null>(null);
  const [indexNotice, setIndexNotice] = useState<string | null>(null);

  const tabs = [
    { id: 'improve', label: 'Improve' },
    { id: 'generate', label: 'Generate' },
    { id: 'summarize', label: 'Summarize' },
    { id: 'expand', label: 'Expand' },
    { id: 'ask', label: 'Ask docs' },
  ];

  // Refresh the local knowledge-index count whenever the tab/project changes
  useEffect(() => {
    if (activeTab === 'ask' && project) {
      try {
        const chunks = loadRagChunks(project.id);
        setIndexedCount(chunks.length);
      } catch {
        setIndexedCount(0);
      }
    }
  }, [activeTab, project]);

  const handleIndexFiles = async () => {
    if (!project) {
      setError('No project workspace yet.');
      return;
    }
    const parseable = files.filter((f) => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return f.storagePath && ['txt', 'md', 'markdown', 'pdf'].includes(ext);
    });
    if (parseable.length === 0) {
      setIndexNotice('No indexable files yet — upload .txt, .md, or .pdf files first.');
      return;
    }
    setIndexing(true);
    setIndexNotice(null);
    setError(null);
    try {
      const fresh: RagChunk[] = [];
      let failed = 0;
      for (const f of parseable) {
        try {
          const res = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId: project.id, storagePath: f.storagePath, fileName: f.name }),
          });
          const data = await res.json();
          if (!res.ok) {
            failed++;
            continue;
          }
          fresh.push(...chunkText(f.id, f.name, String(data.text || '')));
        } catch {
          failed++;
        }
      }
      // Replace chunks for re-indexed files, keep the rest
      const ids = new Set(parseable.map((f) => f.id));
      const kept = loadRagChunks(project.id).filter((c) => !ids.has(c.fileId));
      const merged = [...kept, ...fresh];
      saveRagChunks(project.id, merged);
      setIndexedCount(merged.length);
      setIndexNotice(
        failed === 0
          ? `Indexed ${parseable.length} file(s), ${fresh.length} passages.`
          : `Indexed with ${failed} file(s) skipped (unsupported or unreadable).`
      );
    } finally {
      setIndexing(false);
    }
  };

  const handleAsk = async (question: string) => {
    if (!project) {
      setError('No project workspace yet.');
      return;
    }
    const chunks = loadRagChunks(project.id);
    if (chunks.length === 0) {
      setError('Knowledge index is empty. Index your project files first.');
      return;
    }
    const hits = retrieve(buildRagIndex(chunks), question, 3);
    if (hits.length === 0) {
      setCited([]);
      setResult("I couldn't find that in your project files. Try different keywords or index more files.");
      return;
    }
    const context = hits.map((h) => `[${h.fileName}]\n${h.text}`).join('\n\n');
    const res = await askDocs(question, context);
    setCited(Array.from(new Set(hits.map((h) => h.fileName))));
    setResult(res);
  };

  const handleGenerate = async () => {
    if (!input.trim()) {
      setError(activeTab === 'ask' ? 'Please enter a question' : 'Please enter some text');
      return;
    }
    setLoading(true);
    setError(null);
    setResult('');
    setCited([]);
    if (activeTab === 'ask') {
      try {
        await handleAsk(input.trim());
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to answer. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
    try {
      // Use project title as additional context if available
      const context = activeTab === 'generate' ? sectionType : undefined;
      // Optionally enrich prompt with project context
      let prompt = input;
      if (project?.title && activeTab === 'generate') {
        // Keep original prompt but context already passed; optionally append project title hint
        // We do not mutate prompt heavily to respect spec
      }
      const res = await callAI(prompt, activeTab, context);
      setResult(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate. Please try again.';
      // Show clear message for image-unsupported models
      if (message.toLowerCase().includes('cannot read') && message.toLowerCase().includes('.png')) {
        setError('This AI model does not support images. Please provide text only.');
      } else if (message.toLowerCase().includes('does not support image')) {
        setError('This AI model does not support images. Please provide text only.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleInsert = () => {
    if (onInsert && result) {
      onInsert(result);
    }
  };

  const getButtonLabel = () => {
    if (loading) return 'Generating...';
    switch (activeTab) {
      case 'improve':
        return 'Improve with AI';
      case 'generate':
        return 'Generate with AI';
      case 'summarize':
        return 'Summarize with AI';
      case 'expand':
        return 'Expand with AI';
      case 'ask':
        return 'Ask project docs';
      default:
        return 'Generate with AI';
    }
  };

  const getPlaceholder = () => {
    switch (activeTab) {
      case 'improve':
        return 'Paste text to improve for clarity, academic tone, and grammar...';
      case 'generate':
        return 'Describe what you want to generate (e.g., "A problem statement about water filtration for rural communities")...';
      case 'summarize':
        return 'Paste research or content to summarize concisely...';
      case 'expand':
        return 'Paste text to expand with more detail and examples...';
      case 'ask':
        return 'Ask about your indexed project files (e.g., "What was our calibration offset?")...';
      default:
        return 'Enter your text...';
    }
  };

  return (
    <Card className="w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-teal-700 rounded-lg flex items-center justify-center">
          <Sparkles size={16} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            AI Writing Assistant
            <Badge variant="info" size="sm">Free</Badge>
          </h3>
          <p className="text-xs text-gray-500">Powered by OpenRouter free models</p>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as TaskType)} className="mb-4" />

      <div className="space-y-4">
        {activeTab === 'generate' && (
          <div>
            <label htmlFor="ai-section-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Section Type
            </label>
            <select
              id="ai-section-type"
              value={sectionType}
              onChange={(e) => setSectionType(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {SECTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'ask' && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Knowledge index: {indexedCount === null ? '—' : `${indexedCount} passage(s)`} · answers cite your files only
              </p>
              <Button variant="outline" size="sm" onClick={handleIndexFiles} disabled={indexing || loading} className="gap-1.5 h-7 text-xs">
                {indexing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                {indexing ? 'Indexing...' : 'Index project files'}
              </Button>
            </div>
            {indexNotice && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{indexNotice}</p>}
          </div>
        )}

        <div>
          <Textarea
            id="ai-input"
            label={activeTab === 'generate' ? 'Prompt' : activeTab === 'ask' ? 'Question' : 'Input Text'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            rows={5}
            className="min-h-[120px] bg-white dark:bg-gray-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleGenerate} disabled={loading || !input.trim()} className="gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            {getButtonLabel()}
          </Button>
          {project?.title && (
            <span className="text-xs text-gray-500 truncate hidden sm:inline">
              Context: {project.title}
            </span>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {(result || loading) && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Result</label>
              {result && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 h-7 text-xs">
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  {onInsert && (
                    <Button variant="primary" size="sm" onClick={handleInsert} className="gap-1.5 h-7 text-xs">
                      <Wand2 size={14} />
                      Insert
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              {loading ? (
                <div className="w-full min-h-[120px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Loader2 size={20} className="animate-spin text-teal-600" />
                    <span className="text-sm">Generating with AI...</span>
                  </div>
                </div>
              ) : (
                <>
                  <Textarea
                    readOnly
                    value={result}
                    placeholder="AI result will appear here..."
                    rows={6}
                    className="min-h-[120px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                  {cited.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                      Sources: {cited.join(', ')}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
