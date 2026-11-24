'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import ScoreCard from '@/components/rubric/ScoreCard';
import { cn, getRubricStatusColor, getRubricStatusIcon, formatDate } from '@/lib/utils';
import { useTranslations } from '@/lib/useTranslations';
import type { RubricCriterion, RubricStatus } from '@/lib/types';
import {
  ClipboardList, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronRight, FileText, BookOpen, Target, TrendingUp,
  Award, CheckCircle, AlertCircle
} from 'lucide-react';

export default function RubricPage() {
  const { rubric, tasks, logbook, files, qualityScore } = useAppStore();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCriterion, setSelectedCriterion] = useState<RubricCriterion | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [recalcKey, setRecalcKey] = useState(0);

  const handleRecalculate = () => {
    setRecalcKey((k) => k + 1);
  };

  const getCriterionScore = (status: RubricStatus): number => {
    switch (status) {
      case 'complete': return 4;
      case 'partial': return 2;
      case 'missing':
      default: return 0;
    }
  };

  if (!rubric) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{t('rubric')}</h1>
            <p className="text-sm text-gray-500 mt-0.5">No rubric loaded</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRecalculate}>
            <TrendingUp size={14} className="mr-1.5" />
            Recalculate
          </Button>
        </div>
        <ScoreCard key={recalcKey} rubric={null} />
      </div>
    );
  }

  const criteria = rubric.criteria;
  const complete = criteria.filter(c => c.status === 'complete').length;
  const partial = criteria.filter(c => c.status === 'partial').length;
  const missing = criteria.filter(c => c.status === 'missing').length;
  const total = criteria.length;

  const filteredCriteria = criteria.filter(c => {
    if (filterStatus === 'all') return true;
    return c.status === filterStatus;
  });

  // Group by section
  const sections = Array.from(new Set(criteria.map(c => c.section)));

  const getStatusIcon = (status: RubricStatus) => {
    switch (status) {
      case 'complete': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'partial': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'missing': return <XCircle size={16} className="text-red-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'gaps', label: 'Gap Analysis', count: missing + partial },
    { id: 'quality', label: 'Quality Score' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('rubric')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rubric.name}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRecalculate}>
          <TrendingUp size={14} className="mr-1.5" />
          Recalculate
        </Button>
      </div>

      {/* Auto-scoring ScoreCard at top */}
      <ScoreCard key={recalcKey} rubric={rubric} />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">Total Criteria</div>
            </div>
            <div className="bg-white border border-emerald-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-emerald-600">{complete}</div>
              <div className="text-xs text-gray-500">Complete</div>
            </div>
            <div className="bg-white border border-amber-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-amber-600">{partial}</div>
              <div className="text-xs text-gray-500">Partial</div>
            </div>
            <div className="bg-white border border-red-200 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold text-red-600">{missing}</div>
              <div className="text-xs text-gray-500">Missing</div>
            </div>
          </div>

          {/* Progress */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Overall Rubric Coverage</h3>
              <span className="text-sm font-medium text-gray-700">{qualityScore?.rubricCoverage || 0}%</span>
            </div>
            <ProgressBar value={qualityScore?.rubricCoverage || 0} size="md" color="teal" />
          </Card>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Filter:</span>
            {['all', 'complete', 'partial', 'missing'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full transition-colors capitalize',
                  filterStatus === status ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {status === 'all' ? 'All' : status} ({status === 'all' ? total : status === 'complete' ? complete : status === 'partial' ? partial : missing})
              </button>
            ))}
          </div>

          {/* Criteria by Section */}
          {sections.map(section => {
            const sectionCriteria = filteredCriteria.filter(c => c.section === section);
            if (sectionCriteria.length === 0) return null;
            return (
              <Card key={section}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{section}</h3>
                <div className="space-y-2">
                  {sectionCriteria.map(criterion => {
                    const score = getCriterionScore(criterion.status);
                    return (
                      <div
                        key={criterion.id}
                        onClick={() => setSelectedCriterion(criterion)}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        {getStatusIcon(criterion.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{criterion.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{criterion.description}</p>
                        </div>
                        <span className={cn(
                          'text-xs font-mono font-semibold px-2 py-1 rounded-md border',
                          score === 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          score === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        )}>
                          {score}/4
                        </span>
                        <Badge
                          variant={criterion.status === 'complete' ? 'success' : criterion.status === 'partial' ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {criterion.status}
                        </Badge>
                        <ChevronRight size={14} className="text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Gap Analysis */}
      {activeTab === 'gaps' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">What are we missing?</h3>
            <p className="text-sm text-gray-500 mb-4">
              {missing} requirement{missing !== 1 ? 's' : ''} completely missing, {partial} partially complete
            </p>

            <div className="space-y-4">
              {criteria.filter(c => c.status !== 'complete').map(criterion => {
                const score = getCriterionScore(criterion.status);
                return (
                  <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(criterion.status)}
                      <h4 className="text-sm font-semibold text-gray-900">{criterion.name}</h4>
                      <Badge variant={criterion.status === 'partial' ? 'warning' : 'danger'} size="sm">
                        {criterion.status}
                      </Badge>
                      <span className={cn(
                        'ml-auto text-xs font-mono font-semibold px-2 py-0.5 rounded border',
                        score === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                      )}>
                        {score}/4
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{criterion.description}</p>
                    {criterion.missingInfo.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-gray-500 uppercase">Missing:</label>
                        <ul className="mt-1 space-y-0.5">
                          {criterion.missingInfo.map((info, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                              <XCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                              {info}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {criterion.relatedTasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-500">Related tasks: {criterion.relatedTasks.length}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Quality Score */}
      {activeTab === 'quality' && qualityScore && (
        <div className="space-y-4">
          <Card className="text-center py-8">
            <div className="text-5xl font-bold text-gray-900 mb-2">{qualityScore.overall}%</div>
            <p className="text-sm text-gray-500 mb-6">Project Readiness</p>
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Rubric Coverage</span>
                  <span className="font-medium">{qualityScore.rubricCoverage}%</span>
                </div>
                <ProgressBar value={qualityScore.rubricCoverage} color="teal" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Task Completion</span>
                  <span className="font-medium">{qualityScore.taskCompletion}%</span>
                </div>
                <ProgressBar value={qualityScore.taskCompletion} color="blue" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Evidence Coverage</span>
                  <span className="font-medium">{qualityScore.evidenceCoverage}%</span>
                </div>
                <ProgressBar value={qualityScore.evidenceCoverage} color="amber" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Documentation</span>
                  <span className="font-medium">{qualityScore.documentation}%</span>
                </div>
                <ProgressBar value={qualityScore.documentation} color="green" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Timeline</span>
                  <span className="font-medium">{qualityScore.timeline}%</span>
                </div>
                <ProgressBar value={qualityScore.timeline} color="green" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Criterion Detail Modal */}
      <Modal isOpen={!!selectedCriterion} onClose={() => setSelectedCriterion(null)} title="Criterion Details" size="lg">
        {selectedCriterion && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(selectedCriterion.status)}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">{selectedCriterion.name}</h3>
                <p className="text-sm text-gray-500">{selectedCriterion.section}</p>
              </div>
              <span className={cn(
                'text-sm font-mono font-semibold px-2.5 py-1 rounded-md border',
                getCriterionScore(selectedCriterion.status) === 4 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                getCriterionScore(selectedCriterion.status) === 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-red-50 text-red-700 border-red-200'
              )}>
                {getCriterionScore(selectedCriterion.status)}/4
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Requirement</label>
              <p className="text-sm text-gray-700 mt-1">{selectedCriterion.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
                <div className="mt-1">
                  <Badge
                    variant={selectedCriterion.status === 'complete' ? 'success' : selectedCriterion.status === 'partial' ? 'warning' : 'danger'}
                    size="md"
                  >
                    {getRubricStatusIcon(selectedCriterion.status)} {selectedCriterion.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Auto Score</label>
                <p className="text-sm text-gray-700 mt-1 font-mono">{getCriterionScore(selectedCriterion.status)}/4 points</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Evidence</label>
                <p className="text-sm text-gray-700 mt-1">{selectedCriterion.evidence.length} file(s) attached</p>
              </div>
            </div>

            {selectedCriterion.missingInfo.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Missing Information</label>
                <ul className="mt-1 space-y-1">
                  {selectedCriterion.missingInfo.map((info, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                      <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                      {info}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedCriterion.relatedTasks.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Related Tasks</label>
                <p className="text-sm text-gray-700 mt-1">{selectedCriterion.relatedTasks.length} task(s) linked</p>
              </div>
            )}

            {selectedCriterion.relatedLogbookEntries.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Related Logbook Entries</label>
                <p className="text-sm text-gray-700 mt-1">{selectedCriterion.relatedLogbookEntries.length} entry/entries linked</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
