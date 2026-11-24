'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime } from '@/lib/utils';
import Button from '@/components/ui/Button';
import DiffView from '@/components/history/DiffView';
import { History, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';

interface VersionHistoryProps {
  sectionId: string;
}

export default function VersionHistory({ sectionId }: VersionHistoryProps) {
  const { getSectionVersionsAction, revertToVersionAction, project } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const versions = getSectionVersionsAction(sectionId);

  const sectionFieldMap: Record<string, string> = {
    overview: 'title',
    problem: 'problemStatement',
    scientific: 'scientificPrinciples',
    design: 'engineeringObjective',
    prototype: 'expectedSolution',
    testing: 'testingPlan',
    results: 'resultsAnalysis',
    conclusion: 'conclusion',
    grandchallenge: 'grandChallenge',
  };

  const currentContent = project ? String((project as unknown as Record<string, unknown>)[sectionFieldMap[sectionId]] || '') : '';

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <History size={24} className="text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No changes recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 max-h-[60vh] overflow-y-auto">
      {versions.map((version, index) => {
        const isExpanded = expandedId === version.id;
        const prevContent = index < versions.length - 1 ? versions[index + 1].content : '';

        return (
          <div key={version.id} className="border-b border-gray-100 last:border-b-0">
            <button
              onClick={() => setExpandedId(isExpanded ? null : version.id)}
              className="w-full flex items-start gap-3 py-3 px-2 hover:bg-gray-50 text-left transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                {isExpanded ? (
                  <ChevronDown size={14} className="text-gray-400" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">{version.changedBy}</span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(version.changedAt)}</span>
                </div>
                {version.changeDescription && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{version.changeDescription}</p>
                )}
                {!version.changeDescription && (
                  <p className="text-xs text-gray-400 mt-0.5">Updated section content</p>
                )}
              </div>
              {index === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    revertToVersionAction(version.id);
                  }}
                  className="shrink-0 text-xs"
                >
                  <RotateCcw size={12} className="mr-1" />
                  Revert
                </Button>
              )}
            </button>
            {isExpanded && (
              <div className="px-5 pb-3 space-y-2">
                {prevContent !== version.content && (
                  <DiffView oldText={prevContent} newText={version.content} />
                )}
                {prevContent === version.content && (
                  <div className="text-xs text-gray-400 italic px-3">No text changes detected</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
