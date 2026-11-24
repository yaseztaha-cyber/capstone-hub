'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { cn, getStageLabel, getStageColor, formatDate, getHealthColor, getHealthLabel } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import {
  FileText, HelpCircle, Save, X, Upload, Trash2, Link2,
  FileText as FileIcon, ChevronDown, ChevronRight, CheckCircle2,
  AlertOctagon, BookOpen, Beaker, Wrench, FlaskConical,
  BarChart3, Target, Lightbulb, Palette, Eye, History,
  Table as TableIcon, MessageSquare, FileDown, Printer, Download,
  Flag, Map as MapIcon, Sparkles, Loader2, Plus, Archive, Image as ImageIcon
} from 'lucide-react';
import VersionHistory from '@/components/history/VersionHistory';
import TipTapEditor from '@/components/editor/TipTapEditor';
import Textarea from '@/components/ui/Textarea';
import ExportModal from '@/components/pdf/ExportModal';
import PrintLayout from '@/components/pdf/PrintLayout';
import PosterLayout from '@/components/pdf/PosterLayout';
import PosterDialog from '@/components/pdf/PosterDialog';
import type { Locale } from '@/lib/types';
import type { PosterBlockId } from '@/lib/poster';
import { generateDocx } from '@/lib/exportDocx';
import { generateMarkdown } from '@/lib/exportMarkdown';

interface EditableSectionProps {
  label: string;
  value: string;
  onSave: (val: string) => void;
  onHistory?: () => void;
  placeholder?: string;
  multiline?: boolean;
}

function EditableField({ label, value, onSave, onHistory, placeholder, multiline = true }: EditableSectionProps) {
  const { t } = useTranslations();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    onSave(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-medium text-gray-500">{label}</h3>
        {!editing ? (
          <div className="flex items-center gap-1">
            {onHistory && (
              <button onClick={onHistory} className="text-xs text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100" title="Version History">
                <History size={13} />
              </button>
            )}
            <button onClick={() => { setDraft(value); setEditing(true); }} className="text-xs text-teal-700 hover:underline">{t('editField')}</button>
          </div>
        ) : (
          <div className="flex gap-1">
            <button onClick={handleSave} className="text-xs text-emerald-700 hover:underline flex items-center gap-1"><Save size={12} /> {t('saveField')}</button>
            <button onClick={handleCancel} className="text-xs text-gray-500 hover:underline flex items-center gap-1"><X size={12} /> {t('cancelField')}</button>
          </div>
        )}
      </div>
      {editing ? (
        multiline ? (
          <TipTapEditor
            content={draft}
            onChange={setDraft}
            placeholder={placeholder}
            editable={true}
            className="bg-white border border-gray-300 rounded-lg"
          />
        ) : (
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
          />
        )
      ) : (
        <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg min-h-[40px] prose prose-sm max-w-none">
          {value ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} /> : <span className="text-gray-400 italic">{t('notFilledIn')}</span>}
        </div>
      )}
    </div>
  );
}

interface SectionFileUploadProps {
  sectionId: string;
  files: { id: string; name: string; size: number; uploadDate: string }[];
  onUpload: (file: File) => void;
  onDelete: (fileId: string) => void;
}

function SectionFileUpload({ sectionId, files, onUpload, onDelete }: SectionFileUploadProps) {
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  }, [onUpload]);

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 mb-2">{t('files')}</h3>
      {files.length > 0 && (
        <div className="space-y-1 mb-3">
          {files.map(f => (
            <div key={f.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileIcon size={14} className="text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 truncate">{f.name}</span>
                <span className="text-xs text-gray-400 shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
              </div>
              <button onClick={() => onDelete(f.id)} className="text-gray-400 hover:text-red-500 shrink-0 ml-2">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
          dragOver ? 'border-teal-400 bg-teal-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        <Upload size={18} className="mx-auto text-gray-400 mb-1" />
        <p className="text-xs text-gray-500">{t('dropFileHere')} <span className="text-teal-700 font-medium">{t('browse')}</span></p>
        <p className="text-xs text-gray-400 mt-0.5">PDF, DOC, PNG, JPG, CSV, ZIP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.csv,.xlsx,.zip,.txt,.pptx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function IdeaStatusBadge({ status }: { status: 'draft' | 'under_review' | 'approved' | 'archived' }) {
  const labels = { draft: 'Draft', under_review: 'Under review', approved: 'Approved', archived: 'Archived' } as const;
  const variant = status === 'approved' ? 'success' : status === 'under_review' ? 'warning' : 'default';
  return <Badge variant={variant} size="sm">{labels[status]}</Badge>;
}

function GuidanceTip({ text }: { text: string }) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-800 font-medium">
        <Lightbulb size={13} />
        {t('howToFill')}
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div className="mt-2 bg-teal-50 border border-teal-100 rounded-lg p-3 text-xs text-teal-800 leading-relaxed">
          {text}
        </div>
      )}
    </div>
  );
}

export default function ProjectPage() {
  const { project, files, tasks, decisions, issues, sources, members, milestones, logbook, rubric, updateProjectAction, uploadFileAction, deleteFileAction, saveVersionAction, feedback } = useAppStore();
  const {
    challengeText, challengeSource, challengeAnalysis, ideas, blueprint,
    ideaEngineBusy, ideaEngineError, ideaEngineNotice,
    loadIdeaEngine, setChallenge, analyzeChallenge, generateIdeas, addOwnIdea,
    validateIdea, setIdeaStatus, approveIdea, generateBlueprint, applyBlueprintTasks,
    experiments, loadExperiments, createExperimentAction, updateExperimentAction,
    deleteExperimentAction, addTrialAction, deleteTrialAction,
    buildStages, loadBuildStages, roadmapBusy, roadmapError,
    addBuildStage, updateBuildStage, deleteBuildStage, generateBuildStages,
  } = useAppStore();
  const { t } = useTranslations();
  const [activeSection, setActiveSection] = useState('overview');
  const [historySectionId, setHistorySectionId] = useState<string | null>(null);
  const [ownTitle, setOwnTitle] = useState('');
  const [ownProblem, setOwnProblem] = useState('');
  const [ownSolution, setOwnSolution] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expObjective, setExpObjective] = useState('');
  const [expHypothesis, setExpHypothesis] = useState('');
  const [openExpId, setOpenExpId] = useState<string | null>(null);
  const [trialMeas, setTrialMeas] = useState('');
  const [trialResult, setTrialResult] = useState('');
  const [stageTitle, setStageTitle] = useState('');
  const [stageObjective, setStageObjective] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const projectId = project?.id;
  useEffect(() => {
    if (projectId) { loadIdeaEngine(); loadExperiments(); loadBuildStages(); }
  }, [projectId, loadIdeaEngine, loadExperiments, loadBuildStages]);

  const approvedIdea = ideas.find((i) => i.status === 'approved');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [exportLocale, setExportLocale] = useState<Locale>('en');
  const [showPrintLayout, setShowPrintLayout] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [mdLoading, setMdLoading] = useState(false);
  const [posterDialogOpen, setPosterDialogOpen] = useState(false);
  const [posterBlocks, setPosterBlocks] = useState<PosterBlockId[]>([]);
  const [posterAck, setPosterAck] = useState('');
  const [showPoster, setShowPoster] = useState(false);

  const SECTIONS = [
    { id: 'overview', label: t('overview'), icon: Eye, guidance: 'Review your project at a glance — title, stage, health, and milestones.' },
    { id: 'challenge', label: 'Challenge', icon: Flag, guidance: 'Enter the official capstone challenge, then let AI break it into requirements, constraints, and opportunities.' },
    { id: 'ideas', label: 'Ideas', icon: Lightbulb, guidance: 'Generate AI project ideas or add your own. Validate, compare, and approve one as the baseline.' },
    { id: 'blueprint', label: 'Blueprint', icon: MapIcon, guidance: 'Turn the approved idea into a buildable plan, then apply its tasks to the board.' },
    { id: 'problem', label: t('problem'), icon: AlertOctagon, guidance: 'Define the real-world problem your project solves. Be specific about who is affected and why current solutions are insufficient.' },
    { id: 'research', label: t('research'), icon: BookOpen, guidance: 'Show what you learned from existing research. List sources, cite properly, and identify gaps your project fills.' },
    { id: 'scientific', label: t('scientificPrinciples'), icon: Beaker, guidance: 'Explain the scientific concepts and theories that form the basis of your solution.' },
    { id: 'design', label: t('designRequirements'), icon: Wrench, guidance: 'List constraints, materials, and engineering decisions. Explain why you chose this design over alternatives.' },
    { id: 'prototype', label: t('prototype'), icon: Palette, guidance: 'Describe your prototype or model. Upload photos, CAD files, or schematics.' },
    { id: 'testing', label: t('testing'), icon: FlaskConical, guidance: 'Describe your test plan and record results. What did you measure? How did you validate your solution?' },
    { id: 'results', label: t('results'), icon: BarChart3, guidance: 'Present your data and analysis. Use charts, tables, and statistical analysis where possible.' },
    { id: 'conclusion', label: t('conclusion'), icon: CheckCircle2, guidance: 'Summarize what you achieved, what you learned, and what you would do differently next time.' },
    { id: 'grandchallenge', label: t('grandChallenge'), icon: Target, guidance: 'Connect your project to one of the National Academy of Grand Challenges for Engineering.' },
  ];

  if (!project) return null;

  const getMemberName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.user.name || 'Unknown';
  };

  const completedMilestones = milestones.filter(m => m.isCompleted).length;

  const getSectionFiles = (sectionId: string) => {
    return files.filter(f => f.linkedProjectSection === sectionId);
  };

  const handleFileUpload = (sectionId: string, file: File) => {
    const categoryMap: Record<string, string> = {
      problem: 'research', research: 'references', scientific: 'research',
      design: 'design', prototype: 'design', testing: 'testing',
      results: 'data', conclusion: 'portfolio', grandchallenge: 'research',
    };
    uploadFileAction(file, categoryMap[sectionId] || 'other', undefined, sectionId);
  };

  const handleFileDelete = (_sectionId: string, fileId: string) => {
    deleteFileAction(fileId);
  };

  const handleExport = () => {
    window.print();
  };

  const handleChallengePdf = async (file: File) => {
    if (!project) return;
    setPdfMsg(null);
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext !== 'pdf') {
      setPdfMsg('Please choose a PDF file.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPdfMsg('PDF must be under 15 MB to analyze.');
      return;
    }
    setPdfBusy(true);
    try {
      const row = await uploadFileAction(file, 'references', undefined, 'challenge');
      const storagePath = row?.storage_path;
      if (!storagePath) throw new Error('Upload needs cloud sync — sign in first.');
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, storagePath, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Could not read this PDF.');
      const text = String(data.text || '').slice(0, 6000).trim();
      if (!text) throw new Error('No readable text found in this PDF.');
      setChallenge(text, `PDF: ${file.name}`);
      setPdfMsg(`Imported ${file.name}. Analyzing…`);
      await analyzeChallenge();
      setPdfMsg(`Imported ${file.name} and analyzed.`);
    } catch (err: unknown) {
      setPdfMsg(err instanceof Error ? err.message : 'PDF import failed.');
    } finally {
      setPdfBusy(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handlePdfExport = useCallback((sections: string[], locale: Locale) => {
    setActiveSections(sections);
    setExportLocale(locale);
    setExportModalOpen(false);
    setShowPrintLayout(true);

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => setShowPrintLayout(false), 500);
      }, 200);
    });
  }, []);

  const handlePosterExport = useCallback((blocks: PosterBlockId[], acknowledgements: string) => {
    setPosterBlocks(blocks);
    setPosterAck(acknowledgements);
    setPosterDialogOpen(false);
    setShowPoster(true);

    // Landscape page only for the poster print job
    const style = document.createElement('style');
    style.id = 'poster-print-style';
    style.textContent = '@page { size: A3 landscape; margin: 10mm; }';
    document.head.appendChild(style);

    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          setShowPoster(false);
          document.getElementById('poster-print-style')?.remove();
        }, 500);
      }, 200);
    });
  }, []);

  const handleDocxExport = useCallback(async () => {
    if (!project) return;
    setDocxLoading(true);
    try {
      const blob = await generateDocx(project, tasks, milestones, logbook, decisions, files, rubric, sources);
      downloadBlob(blob, `${(project.title || 'project').replace(/[^a-z0-9]/gi, '_')}.docx`);
    } catch (err) {
      console.error('DOCX export failed', err);
    } finally {
      setDocxLoading(false);
    }
  }, [project, tasks, milestones, logbook, decisions, files, rubric, sources]);

  const handleMarkdownExport = useCallback(() => {
    if (!project) return;
    setMdLoading(true);
    try {
      const md = generateMarkdown(project, tasks, milestones, logbook, decisions, files, rubric, sources);
      downloadBlob(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${(project.title || 'project').replace(/[^a-z0-9]/gi, '_')}.md`);
    } catch (err) {
      console.error('Markdown export failed', err);
    } finally {
      setMdLoading(false);
    }
  }, [project, tasks, milestones, logbook, decisions, files, rubric, sources]);

  const getSectionCompletion = (sectionId: string): boolean => {
    switch (sectionId) {
      case 'overview': return !!project.title;
      case 'challenge': return challengeText.trim().length > 0;
      case 'ideas': return ideas.some((i) => i.status === 'approved');
      case 'blueprint': return blueprint.trim().length > 0;
      case 'problem': return !!project.problemStatement;
      case 'research': return sources.length > 0;
      case 'scientific': return !!project.scientificPrinciples;
      case 'design': return !!project.engineeringObjective;
      case 'prototype': return !!project.expectedSolution || buildStages.length > 0;
      case 'testing': return !!project.testingPlan || experiments.length > 0;
      case 'results': return !!project.resultsAnalysis;
      case 'conclusion': return !!project.conclusion;
      case 'grandchallenge': return !!project.grandChallenge;
      default: return false;
    }
  };

  const completedCount = SECTIONS.filter(s => getSectionCompletion(s.id)).length;

  const renderSection = () => {
    const sectionFiles = getSectionFiles(activeSection);
    const guidance = SECTIONS.find(s => s.id === activeSection)?.guidance || '';

    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('projectTitle')}</h3>
                  <p className="text-base text-gray-900 font-medium">{project.title}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('problemStatement')}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{project.problemStatement || <span className="text-gray-400 italic">{t('notSet')}</span>}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('engineeringObjective')}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{project.engineeringObjective || <span className="text-gray-400 italic">{t('notSet')}</span>}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('expectedSolution')}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{project.expectedSolution || <span className="text-gray-400 italic">{t('notSet')}</span>}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('constraints')}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{project.constraints || <span className="text-gray-400 italic">{t('notSet')}</span>}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{t('importantMaterials')}</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{project.importantMaterials || <span className="text-gray-400 italic">{t('notSet')}</span>}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">{t('currentStage')}</div>
                <Badge className={cn(getStageColor(project.currentStage))}>{getStageLabel(project.currentStage)}</Badge>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">{t('projectHealth')}</div>
                <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', getHealthColor(project.health))}>
                  {getHealthLabel(project.health)}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">{t('milestones')}</div>
                <div className="text-lg font-semibold text-gray-900">{completedMilestones}/{milestones.length}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-500 mb-1">{t('filesCount')}</div>
                <div className="text-lg font-semibold text-gray-900">{files.length}</div>
              </div>
            </div>

            {milestones.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('projectMilestones')}</h3>
                <div className="space-y-2">
                  {milestones.map((ms, i) => (
                    <div key={ms.id} className="flex items-center gap-3 py-2">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                        ms.isCompleted ? 'bg-emerald-100 text-emerald-700' :
                        i === milestones.findIndex(m => !m.isCompleted) ? 'bg-teal-100 text-teal-700 ring-2 ring-teal-300' :
                        'bg-gray-100 text-gray-500'
                      )}>
                        {ms.isCompleted ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', ms.isCompleted ? 'text-gray-500' : 'text-gray-900')}>{ms.name}</p>
                        <p className="text-xs text-gray-500">
                          Official: {formatDate(ms.officialDeadline)}
                          {ms.teamDeadline && ` · Team: ${formatDate(ms.teamDeadline)}`}
                        </p>
                      </div>
                      <Badge className={cn(getStageColor(ms.stage))} size="sm">{getStageLabel(ms.stage)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'problem':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <EditableField
              label={t('problemStatement')}
              value={project.problemStatement}
              onSave={(val) => {
                saveVersionAction('problem', project.problemStatement, 'Updated problem statement');
                updateProjectAction({ problemStatement: val });
              }}
              onHistory={() => setHistorySectionId('problem')}
              placeholder="Describe the specific problem your project addresses..."
            />
            <EditableField
              label={t('constraints')}
              value={project.constraints}
              onSave={(val) => {
                saveVersionAction('problem', project.constraints, 'Updated constraints');
                updateProjectAction({ constraints: val });
              }}
              onHistory={() => setHistorySectionId('problem')}
              placeholder="List budget, time, material, or regulatory constraints..."
            />
            <SectionFileUpload
              sectionId="problem"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('problem', file)}
              onDelete={(fileId) => handleFileDelete('problem', fileId)}
            />
          </div>
        );

      case 'research':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-500">{t('researchSources')} ({sources.length})</h3>
                <span className="text-xs text-gray-400">{t('addSourcesFromResearch')}</span>
              </div>
              {sources.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <BookOpen size={20} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">{t('noResearchSources')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('addSourcesFromResearch')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sources.map(source => (
                    <div key={source.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{source.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{source.authors} ({source.year})</p>
                      {source.apaCitation && (
                        <p className="text-xs text-gray-500 mt-1 italic">{source.apaCitation}</p>
                      )}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {source.tags.map(tag => (
                          <span key={tag} className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 text-gray-600">{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <SectionFileUpload
              sectionId="research"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('research', file)}
              onDelete={(fileId) => handleFileDelete('research', fileId)}
            />
          </div>
        );

      case 'scientific':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <EditableField
              label={t('scientificPrinciplesLabel')}
              value={project.scientificPrinciples}
              onSave={(val) => {
                saveVersionAction('scientific', project.scientificPrinciples, 'Updated scientific principles');
                updateProjectAction({ scientificPrinciples: val });
              }}
              onHistory={() => setHistorySectionId('scientific')}
              placeholder="Explain the scientific theories, laws, or principles that underpin your project..."
            />
            <SectionFileUpload
              sectionId="scientific"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('scientific', file)}
              onDelete={(fileId) => handleFileDelete('scientific', fileId)}
            />
          </div>
        );

      case 'design':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <EditableField
              label={t('engineeringObjective')}
              value={project.engineeringObjective}
              onSave={(val) => {
                saveVersionAction('design', project.engineeringObjective, 'Updated engineering objective');
                updateProjectAction({ engineeringObjective: val });
              }}
              onHistory={() => setHistorySectionId('design')}
              placeholder="What are you building and what criteria must it meet?"
            />
            <EditableField
              label={t('importantMaterials')}
              value={project.importantMaterials}
              onSave={(val) => {
                saveVersionAction('design', project.importantMaterials, 'Updated important materials');
                updateProjectAction({ importantMaterials: val });
              }}
              onHistory={() => setHistorySectionId('design')}
              placeholder="List key materials, components, and tools needed..."
            />
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t('designDecisions')} ({decisions.length})</h3>
              {decisions.length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('noDesignDecisions')}</p>
              ) : (
                <div className="space-y-2">
                  {decisions.map(dec => (
                    <div key={dec.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{dec.decision}</p>
                      <p className="text-xs text-gray-500 mt-0.5">By: {dec.decisionMakers.join(', ') || 'Unknown'}</p>
                      {dec.reason && <p className="text-xs text-gray-600 mt-1">{dec.reason}</p>}
                      {dec.alternativesConsidered.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">Alternatives: {dec.alternativesConsidered.join(', ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <SectionFileUpload
              sectionId="design"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('design', file)}
              onDelete={(fileId) => handleFileDelete('design', fileId)}
            />
          </div>
        );

      case 'prototype':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <EditableField
              label={t('expectedSolution')}
              value={project.expectedSolution}
              onSave={(val) => {
                saveVersionAction('prototype', project.expectedSolution, 'Updated expected solution');
                updateProjectAction({ expectedSolution: val });
              }}
              onHistory={() => setHistorySectionId('prototype')}
              placeholder="Describe your prototype — what it looks like, how it works, key features..."
            />
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  Build roadmap ({buildStages.filter((s) => s.status === 'done').length}/{buildStages.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateBuildStages}
                  disabled={roadmapBusy}
                  className="gap-1.5 h-7 text-xs"
                >
                  {roadmapBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {roadmapBusy ? 'Generating...' : 'AI roadmap'}
                </Button>
              </div>
              {roadmapError && (
                <div className="mb-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{roadmapError}</div>
              )}
              {buildStages.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No build stages yet. Generate a roadmap or add stages manually.</p>
              ) : (
                <div className="space-y-2">
                  {buildStages.map((stage, i) => (
                    <div key={stage.id} className="flex items-start gap-3 py-2">
                      <div className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0',
                        stage.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                        stage.status === 'doing' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' :
                        'bg-gray-100 text-gray-500'
                      )}>
                        {stage.status === 'done' ? '✓' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', stage.status === 'done' ? 'text-gray-500' : 'text-gray-900')}>{stage.title}</p>
                        {stage.objective && <p className="text-xs text-gray-500 mt-0.5">{stage.objective}</p>}
                      </div>
                      <select
                        value={stage.status}
                        onChange={(e) => updateBuildStage(stage.id, { status: e.target.value as 'todo' | 'doing' | 'done' })}
                        className="text-xs border border-gray-300 rounded-md px-1.5 py-1 bg-white shrink-0"
                        aria-label="Stage status"
                      >
                        <option value="todo">To do</option>
                        <option value="doing">Doing</option>
                        <option value="done">Done</option>
                      </select>
                      <button onClick={() => deleteBuildStage(stage.id)} className="text-gray-400 hover:text-red-500 shrink-0" aria-label="Delete stage">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <Input
                  value={stageTitle}
                  onChange={(e) => setStageTitle(e.target.value)}
                  placeholder="New stage, e.g., Sensor validation"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!stageTitle.trim()}
                  onClick={() => {
                    addBuildStage({ title: stageTitle, objective: stageObjective });
                    setStageTitle(''); setStageObjective('');
                  }}
                  className="shrink-0"
                >
                  <Plus size={14} /> Add
                </Button>
              </div>
              <Input
                value={stageObjective}
                onChange={(e) => setStageObjective(e.target.value)}
                placeholder="Stage objective (optional)"
                className="mt-2"
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t('issues')} ({issues.length})</h3>
              {issues.length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('noIssuesReported')}</p>
              ) : (
                <div className="space-y-2">
                  {issues.map(issue => (
                    <div key={issue.id} className="bg-gray-50 p-3 rounded-lg border-l-3"
                      style={{ borderLeftColor: issue.severity === 'high' ? '#ef4444' : issue.severity === 'medium' ? '#f59e0b' : '#6b7280' }}>
                      <p className="text-sm font-medium text-gray-900">{issue.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={issue.status === 'resolved' ? 'success' : issue.status === 'in_progress' ? 'warning' : 'danger'} size="sm">
                          {issue.status}
                        </Badge>
                        <span className="text-xs text-gray-500">{issue.responsiblePerson || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <SectionFileUpload
              sectionId="prototype"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('prototype', file)}
              onDelete={(fileId) => handleFileDelete('prototype', fileId)}
            />
          </div>
        );

      case 'testing':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <EditableField
              label={t('testingPlan')}
              value={project.testingPlan}
              onSave={(val) => {
                saveVersionAction('testing', project.testingPlan, 'Updated testing plan');
                updateProjectAction({ testingPlan: val });
              }}
              onHistory={() => setHistorySectionId('testing')}
              placeholder="How will you test your prototype? What metrics will you measure? What controls will you use?"
            />
            <EditableField
              label={t('testingResults')}
              value={project.testingResults}
              onSave={(val) => {
                saveVersionAction('testing', project.testingResults, 'Updated testing results');
                updateProjectAction({ testingResults: val });
              }}
              onHistory={() => setHistorySectionId('testing')}
              placeholder="Record your test results here — include data, observations, and comparisons to expectations..."
            />
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t('testingTasks')}</h3>
              {tasks.filter(t => t.stage === 'testing').length === 0 ? (
                <p className="text-sm text-gray-400 italic">{t('noTestingTasks')}</p>
              ) : (
                <div className="space-y-2">
                  {tasks.filter(t => t.stage === 'testing').map(task => (
                    <div key={task.id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                      <Badge className={cn(
                        task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        task.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      )} size="sm">{task.status.replace('_', ' ')}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Experiments ({experiments.length})</h3>
              <div className="border border-gray-200 rounded-lg p-3 space-y-3 mb-3">
                <Input label="New experiment title" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} placeholder="e.g., Moisture sensor calibration" />
                <Textarea label="Objective (optional)" value={expObjective} onChange={(e) => setExpObjective(e.target.value)} placeholder="What are you trying to prove?" rows={2} />
                <Textarea label="Hypothesis (optional)" value={expHypothesis} onChange={(e) => setExpHypothesis(e.target.value)} placeholder="What do you expect and why?" rows={2} />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!expTitle.trim()}
                  onClick={() => {
                    createExperimentAction({ title: expTitle, objective: expObjective, hypothesis: expHypothesis });
                    setExpTitle(''); setExpObjective(''); setExpHypothesis('');
                  }}
                >
                  <Plus size={14} /> Add experiment
                </Button>
                <p className="text-[11px] text-gray-400">Stored in this browser until cloud sync is configured.</p>
              </div>
              {experiments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No experiments yet. Record each test with its trials and measurements — never invent results.</p>
              ) : (
                <div className="space-y-2">
                  {experiments.map((exp) => {
                    const open = openExpId === exp.id;
                    return (
                      <div key={exp.id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => { setOpenExpId(open ? null : exp.id); setTrialMeas(''); setTrialResult(''); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                        >
                          {open ? <ChevronDown size={14} className="shrink-0 text-gray-400" /> : <ChevronRight size={14} className="shrink-0 text-gray-400" />}
                          <span className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 block truncate">{exp.title}</span>
                            <span className="text-xs text-gray-500">{exp.trials.length} trial{exp.trials.length === 1 ? '' : 's'} · {exp.status}</span>
                          </span>
                          <Badge
                            variant={exp.status === 'completed' ? 'success' : exp.status === 'running' ? 'info' : 'default'}
                            size="sm"
                          >
                            {exp.status}
                          </Badge>
                        </button>
                        {open && (
                          <div className="px-3 pb-3 pt-1 space-y-3 border-t border-gray-100">
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                              <label className="text-xs text-gray-500" htmlFor={`exp-status-${exp.id}`}>Status</label>
                              <select
                                id={`exp-status-${exp.id}`}
                                value={exp.status}
                                onChange={(e) => updateExperimentAction(exp.id, { status: e.target.value as 'planned' | 'running' | 'completed' })}
                                className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
                              >
                                <option value="planned">Planned</option>
                                <option value="running">Running</option>
                                <option value="completed">Completed</option>
                              </select>
                              <button
                                onClick={() => { deleteExperimentAction(exp.id); setOpenExpId(null); }}
                                className="ml-auto text-xs text-red-600 hover:underline flex items-center gap-1"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                            <EditableField label="Objective" value={exp.objective} onSave={(val) => updateExperimentAction(exp.id, { objective: val })} placeholder="What are you trying to prove?" />
                            <EditableField label="Hypothesis" value={exp.hypothesis} onSave={(val) => updateExperimentAction(exp.id, { hypothesis: val })} placeholder="What do you expect and why?" />
                            <EditableField label="Variables" value={exp.variables} onSave={(val) => updateExperimentAction(exp.id, { variables: val })} placeholder="Independent / dependent / controlled variables..." />
                            <EditableField label="Procedure" value={exp.procedure} onSave={(val) => updateExperimentAction(exp.id, { procedure: val })} placeholder="Step-by-step procedure..." />
                            <EditableField label="Conditions" value={exp.conditions} onSave={(val) => updateExperimentAction(exp.id, { conditions: val })} placeholder="Test conditions, controls..." />
                            <EditableField label="Expected result" value={exp.expectedResult} onSave={(val) => updateExperimentAction(exp.id, { expectedResult: val })} placeholder="What would confirm the hypothesis?" />
                            <EditableField label="Actual result" value={exp.actualResult} onSave={(val) => updateExperimentAction(exp.id, { actualResult: val })} placeholder="Record only measured outcomes..." />
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Trials</h4>
                              {exp.trials.length === 0 ? (
                                <p className="text-xs text-gray-400 italic mb-2">No trials recorded yet.</p>
                              ) : (
                                <div className="space-y-2 mb-2">
                                  {exp.trials.map((tr) => (
                                    <div key={tr.id} className="bg-gray-50 p-2.5 rounded-lg">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium text-gray-900">{tr.label}</p>
                                        <button onClick={() => deleteTrialAction(exp.id, tr.id)} className="text-gray-400 hover:text-red-500 shrink-0" aria-label="Delete trial">
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{tr.measurements}</p>
                                      {tr.result && <p className="text-xs text-gray-500 mt-1">Result: {tr.result}</p>}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="space-y-2 border border-dashed border-gray-200 rounded-lg p-2.5">
                                <Textarea label="Measurements" value={trialMeas} onChange={(e) => setTrialMeas(e.target.value)} placeholder="Record actual measured values..." rows={2} />
                                <Input label="Trial result (optional)" value={trialResult} onChange={(e) => setTrialResult(e.target.value)} placeholder="e.g., Within expected range" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!trialMeas.trim()}
                                  onClick={() => {
                                    addTrialAction(exp.id, { measurements: trialMeas, result: trialResult });
                                    setTrialMeas(''); setTrialResult('');
                                  }}
                                >
                                  <Plus size={13} /> Record trial
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <SectionFileUpload
              sectionId="testing"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('testing', file)}
              onDelete={(fileId) => handleFileDelete('testing', fileId)}
            />
          </div>
        );

      case 'results':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <EditableField
              label={t('resultsAnalysis')}
              value={project.resultsAnalysis}
              onSave={(val) => {
                saveVersionAction('results', project.resultsAnalysis, 'Updated results analysis');
                updateProjectAction({ resultsAnalysis: val });
              }}
              onHistory={() => setHistorySectionId('results')}
              placeholder="Present your findings. What did the data show? Did your prototype meet the design criteria?"
            />
            <SectionFileUpload
              sectionId="results"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('results', file)}
              onDelete={(fileId) => handleFileDelete('results', fileId)}
            />
          </div>
        );

      case 'conclusion':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <EditableField
              label={t('conclusion')}
              value={project.conclusion}
              onSave={(val) => {
                saveVersionAction('conclusion', project.conclusion, 'Updated conclusion');
                updateProjectAction({ conclusion: val });
              }}
              onHistory={() => setHistorySectionId('conclusion')}
              placeholder="Summarize your project outcomes. What did you achieve? What would you improve? What are the next steps?"
            />
            <SectionFileUpload
              sectionId="conclusion"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('conclusion', file)}
              onDelete={(fileId) => handleFileDelete('conclusion', fileId)}
            />
          </div>
        );

      case 'grandchallenge':
        return (
          <div className="space-y-4">
            <GuidanceTip text={guidance} />
            <EditableField
              label={t('selectedGrandChallenge')}
              value={project.grandChallenge}
              onSave={(val) => {
                saveVersionAction('grandchallenge', project.grandChallenge, 'Updated grand challenge');
                updateProjectAction({ grandChallenge: val });
              }}
              onHistory={() => setHistorySectionId('grandchallenge')}
              placeholder="Which Grand Challenge for Engineering does your project address?"
              multiline={false}
            />
            <EditableField
              label={t('connectionToProject')}
              value={project.grandChallengeConnection}
              onSave={(val) => {
                saveVersionAction('grandchallenge', project.grandChallengeConnection, 'Updated grand challenge connection');
                updateProjectAction({ grandChallengeConnection: val });
              }}
              onHistory={() => setHistorySectionId('grandchallenge')}
              placeholder="How does your project specifically contribute to solving this grand challenge?"
            />
            <SectionFileUpload
              sectionId="grandchallenge"
              files={sectionFiles}
              onUpload={(file) => handleFileUpload('grandchallenge', file)}
              onDelete={(fileId) => handleFileDelete('grandchallenge', fileId)}
            />
          </div>
        );

      case 'challenge':
        return (
          <div className="space-y-4">
            <GuidanceTip text={SECTIONS.find(s => s.id === 'challenge')?.guidance || ''} />
            {ideaEngineError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{ideaEngineError}</div>
            )}
            {ideaEngineNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{ideaEngineNotice}</div>
            )}
            <Textarea
              label="Challenge statement"
              value={challengeText}
              onChange={(e) => setChallenge(e.target.value, challengeSource)}
              placeholder="e.g., Design a system that reduces water waste in agricultural irrigation."
              rows={3}
            />
            <Input
              label="Challenge source (optional)"
              value={challengeSource}
              onChange={(e) => setChallenge(challengeText, e.target.value)}
              placeholder="e.g., School brief, teacher, PDF document"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={analyzeChallenge}
                disabled={!challengeText.trim() || ideaEngineBusy === 'analyze' || pdfBusy}
                className="gap-1.5"
              >
                {ideaEngineBusy === 'analyze' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {ideaEngineBusy === 'analyze' ? 'Analyzing...' : 'Analyze challenge'}
              </Button>
              <Button
                variant="outline"
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfBusy || ideaEngineBusy === 'analyze'}
                className="gap-1.5"
              >
                {pdfBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {pdfBusy ? 'Reading PDF...' : 'Upload challenge PDF'}
              </Button>
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                aria-label="Upload challenge PDF"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleChallengePdf(file);
                }}
              />
            </div>
            {pdfMsg && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{pdfMsg}</p>
            )}
            {challengeAnalysis && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">AI analysis</h3>
                <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {challengeAnalysis}
                </div>
              </div>
            )}
          </div>
        );

      case 'ideas':
        return (
          <div className="space-y-5">
            <GuidanceTip text={SECTIONS.find(s => s.id === 'ideas')?.guidance || ''} />
            {ideaEngineError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{ideaEngineError}</div>
            )}
            {ideaEngineNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{ideaEngineNotice}</div>
            )}
            {!challengeText.trim() && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                Add your challenge first — ideas are generated from it.
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={generateIdeas}
                disabled={!challengeText.trim() || ideaEngineBusy === 'ideas'}
                className="gap-1.5"
              >
                {ideaEngineBusy === 'ideas' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {ideaEngineBusy === 'ideas' ? 'Generating...' : 'Generate 3 ideas'}
              </Button>
            </div>

            <div className="border border-gray-200 rounded-lg p-3 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <Plus size={14} /> Use our own idea
              </h3>
              <Input label="Project title" value={ownTitle} onChange={(e) => setOwnTitle(e.target.value)} placeholder="e.g., Low-Cost Smart Irrigation Controller" />
              <Textarea label="Problem" value={ownProblem} onChange={(e) => setOwnProblem(e.target.value)} placeholder="What problem does it solve, for whom?" rows={2} />
              <Textarea label="Proposed solution" value={ownSolution} onChange={(e) => setOwnSolution(e.target.value)} placeholder="How does it work?" rows={2} />
              <Button
                variant="outline"
                size="sm"
                disabled={!ownTitle.trim()}
                onClick={() => {
                  addOwnIdea({ title: ownTitle, problem: ownProblem, solution: ownSolution });
                  setOwnTitle(''); setOwnProblem(''); setOwnSolution('');
                }}
              >
                Add idea
              </Button>
            </div>

            {ideas.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Compare ideas</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500">
                        <th className="px-3 py-2 font-medium">Idea</th>
                        <th className="px-3 py-2 font-medium">Source</th>
                        <th className="px-3 py-2 font-medium">Difficulty</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ideas.map((idea) => (
                        <tr key={idea.id} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-medium text-gray-900">{idea.title}</td>
                          <td className="px-3 py-2 text-gray-500">{idea.source === 'ai' ? 'AI' : 'Ours'}</td>
                          <td className="px-3 py-2 text-gray-500">{idea.difficulty || '—'}</td>
                          <td className="px-3 py-2">
                            <IdeaStatusBadge status={idea.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {ideas.length === 0 && (
                <p className="text-sm text-gray-400 italic">No ideas yet. Generate some or add your own.</p>
              )}
              {ideas.map((idea) => (
                <div key={idea.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-gray-900">{idea.title}</h4>
                    <IdeaStatusBadge status={idea.status} />
                  </div>
                  {idea.problem && <p className="text-sm text-gray-600"><span className="font-medium">Problem:</span> {idea.problem}</p>}
                  {idea.solution && <p className="text-sm text-gray-600"><span className="font-medium">Solution:</span> {idea.solution}</p>}
                  {(idea.science || idea.risks) && (
                    <p className="text-xs text-gray-500">
                      {[idea.science && `Science: ${idea.science}`, idea.risks && `Risks: ${idea.risks}`].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {idea.validation && (
                    <div className="text-sm text-gray-700 bg-teal-50 border border-teal-100 rounded-lg p-3 whitespace-pre-wrap">
                      {idea.validation}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ideaEngineBusy === idea.id}
                      onClick={() => validateIdea(idea.id)}
                    >
                      {ideaEngineBusy === idea.id ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      Validate
                    </Button>
                    {idea.status !== 'approved' && (
                      <Button size="sm" disabled={ideaEngineBusy !== null} onClick={() => approveIdea(idea.id)}>
                        <CheckCircle2 size={13} /> Approve
                      </Button>
                    )}
                    {idea.status !== 'archived' && idea.status !== 'approved' && (
                      <Button variant="ghost" size="sm" onClick={() => setIdeaStatus(idea.id, 'archived')}>
                        <Archive size={13} /> Archive
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'blueprint':
        return (
          <div className="space-y-4">
            <GuidanceTip text={SECTIONS.find(s => s.id === 'blueprint')?.guidance || ''} />
            {ideaEngineError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{ideaEngineError}</div>
            )}
            {ideaEngineNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">{ideaEngineNotice}</div>
            )}
            {!approvedIdea && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                Approve an idea first — the blueprint is built from it.
                {ideas.length > 0 && ' Pick one in the Ideas section.'}
              </div>
            )}
            {approvedIdea && (
              <p className="text-sm text-gray-600">
                Baseline: <span className="font-medium text-gray-900">{approvedIdea.title}</span>
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={generateBlueprint}
                disabled={!approvedIdea && ideas.length === 0 || ideaEngineBusy === 'blueprint'}
                className="gap-1.5"
              >
                {ideaEngineBusy === 'blueprint' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {ideaEngineBusy === 'blueprint' ? 'Generating...' : 'Generate blueprint'}
              </Button>
              {blueprint && (
                <Button
                  variant="outline"
                  onClick={applyBlueprintTasks}
                  disabled={ideaEngineBusy === 'apply'}
                  className="gap-1.5"
                >
                  {ideaEngineBusy === 'apply' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {ideaEngineBusy === 'apply' ? 'Applying...' : 'Apply tasks to board'}
                </Button>
              )}
            </div>
            {blueprint ? (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Blueprint</h3>
                <div className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {blueprint}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No blueprint yet.</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto overflow-x-hidden">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">{t('projectWorkspace')}</h1>
          <p className="text-sm text-gray-500 mt-0.5 truncate">{project.title} — {completedCount}/{SECTIONS.length} {t('sectionsCompleted')}</p>
        </div>
        <div className="relative shrink-0 print:hidden">
          <Button variant="outline" size="sm" onClick={() => setExportMenuOpen((v) => !v)} className="gap-1.5">
            <FileDown size={14} /> {t('exportPdf')}
          </Button>
          {exportMenuOpen && (
            <>
              <button aria-label="Close export menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setExportMenuOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <button
                  onClick={() => { setExportMenuOpen(false); setExportModalOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FileDown size={14} className="text-gray-400" /> {t('exportAsPdf')}
                </button>
                <button
                  onClick={() => { setExportMenuOpen(false); handleExport(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Printer size={14} className="text-gray-400" /> {t('printExport')}
                </button>
                <button
                  onClick={() => { setExportMenuOpen(false); setPosterDialogOpen(true); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <ImageIcon size={14} className="text-gray-400" /> Poster
                </button>
                <button
                  onClick={() => { setExportMenuOpen(false); handleDocxExport(); }}
                  disabled={docxLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <FileText size={14} className="text-gray-400" /> {docxLoading ? 'Generating...' : 'DOCX'}
                </button>
                <button
                  onClick={() => { setExportMenuOpen(false); handleMarkdownExport(); }}
                  disabled={mdLoading}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Download size={14} className="text-gray-400" /> {mdLoading ? 'Generating...' : 'Markdown'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Section Navigation */}
        <div className="lg:col-span-1 order-1">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-thin snap-x">
            {SECTIONS.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const completed = getSectionCompletion(section.id);
              const unresolved = feedback.filter(f => f.projectId === project.id && f.section === section.id && !f.resolved).length;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left shrink-0 snap-start min-h-[44px]',
                    'lg:w-full whitespace-nowrap lg:whitespace-normal',
                    isActive ? 'bg-teal-50 text-teal-700 border border-teal-200 lg:border-transparent' : 'bg-white border border-gray-200 lg:border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 lg:bg-transparent'
                  )}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="flex-1">{section.label}</span>
                  {unresolved > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">
                      <MessageSquare size={10} /> {unresolved}
                    </span>
                  )}
                  {completed && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </nav>
          <div className="mt-3 lg:mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs font-medium text-gray-500 mb-1">Completion</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all"
                  style={{ width: `${(completedCount / SECTIONS.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-700">{completedCount}/{SECTIONS.length}</span>
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div className="lg:col-span-3 order-2 min-w-0">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {(() => {
                const section = SECTIONS.find(s => s.id === activeSection);
                const Icon = section?.icon;
                return Icon ? <Icon size={18} className="text-teal-700" /> : null;
              })()}
              <h2 className="text-lg font-semibold text-gray-900">
                {SECTIONS.find(s => s.id === activeSection)?.label}
              </h2>
              {(() => {
                const unresolved = feedback.filter(f => f.projectId === project.id && f.section === activeSection && !f.resolved).length;
                return unresolved > 0 ? (
                  <Badge variant="warning" size="sm" className="ml-1">
                    <MessageSquare size={11} className="mr-1" />
                    Advisor Feedback {unresolved}
                  </Badge>
                ) : null;
              })()}
            </div>
            {renderSection()}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={historySectionId !== null}
        onClose={() => setHistorySectionId(null)}
        title="Version History"
        size="lg"
      >
        {historySectionId && <VersionHistory sectionId={historySectionId} />}
      </Modal>

      {showPrintLayout && (
        <PrintLayout sections={activeSections} locale={exportLocale} />
      )}

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handlePdfExport}
      />

      {showPoster && (
        <PosterLayout blocks={posterBlocks} acknowledgements={posterAck} />
      )}

      <PosterDialog
        isOpen={posterDialogOpen}
        onClose={() => setPosterDialogOpen(false)}
        onGenerate={handlePosterExport}
      />
    </div>
  );
}
