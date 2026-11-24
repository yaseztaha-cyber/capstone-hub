'use client';

import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import type { Rubric } from '@/lib/types';
import {
  calculateRubricScore,
  getNextSteps,
  getScoreColor,
  getLevelLabel,
  getLevelBadgeVariant,
} from '@/lib/rubricScoring';
import { Award, TrendingUp, AlertCircle, CheckCircle, Target } from 'lucide-react';

interface ScoreCardProps {
  rubric: Rubric | null;
}

export default function ScoreCard({ rubric }: ScoreCardProps) {
  const score = calculateRubricScore(rubric);
  const nextSteps = getNextSteps(rubric);
  const levelColor = getScoreColor(score.level);
  const levelLabel = getLevelLabel(score.level);
  const badgeVariant = getLevelBadgeVariant(score.level);

  // Handle null/empty rubric gracefully
  if (!rubric || !rubric.criteria || rubric.criteria.length === 0) {
    return (
      <Card className="border-dashed">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Award size={24} className="text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No Rubric Data</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm">
            Rubric criteria have not been set up yet. Create criteria to see auto-calculated scores.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <Target size={14} />
            <span>Add criteria to generate next steps</span>
          </div>
        </div>
      </Card>
    );
  }

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score.percentage / 100) * circumference;

  const levelStrokeColor: Record<string, string> = {
    excellent: '#059669',
    good: '#2563eb',
    developing: '#d97706',
    beginning: '#dc2626',
  };

  const strokeColor = levelStrokeColor[score.level] || '#dc2626';

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: circular progress + total + level */}
        <div className="flex flex-col items-center lg:w-1/3 lg:border-r lg:border-gray-100 lg:pr-6">
          <div className="flex items-center gap-2 mb-3 self-start">
            <Award size={18} className="text-teal-600" />
            <h3 className="text-sm font-semibold text-gray-900">Rubric Score</h3>
          </div>

          {/* Circular progress */}
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke={strokeColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${levelColor}`}>{score.percentage}%</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <TrendingUp size={12} />
                {score.total}/{score.maxTotal} pts
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <Badge variant={badgeVariant} size="md">
              {levelLabel}
            </Badge>
            <p className="text-xs text-gray-500">
              {score.total} points earned &middot; max {score.maxTotal}
            </p>
          </div>

          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 w-full text-center">
            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
              <div className="flex items-center justify-center gap-1 text-emerald-700">
                <CheckCircle size={14} />
                <span className="text-sm font-semibold">
                  {score.criteriaScores.filter((c) => c.status === 'complete').length}
                </span>
              </div>
              <div className="text-xs text-emerald-600">Complete</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
              <div className="flex items-center justify-center gap-1 text-amber-700">
                <AlertCircle size={14} />
                <span className="text-sm font-semibold">
                  {score.criteriaScores.filter((c) => c.status === 'partial').length}
                </span>
              </div>
              <div className="text-xs text-amber-600">Partial</div>
            </div>
            <div className="bg-red-50 rounded-lg p-2 border border-red-100">
              <div className="flex items-center justify-center gap-1 text-red-700">
                <AlertCircle size={14} />
                <span className="text-sm font-semibold">
                  {score.criteriaScores.filter((c) => c.status === 'missing').length}
                </span>
              </div>
              <div className="text-xs text-red-600">Missing</div>
            </div>
          </div>
        </div>

        {/* Right: breakdown + missing + next steps */}
        <div className="flex-1 space-y-5">
          {/* Breakdown per criterion */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Target size={14} className="text-gray-500" />
              Breakdown per Criterion
            </h4>
            <div className="space-y-3">
              {score.criteriaScores.map((c) => {
                const pct = (c.score / c.max) * 100;
                const barColor =
                  c.status === 'complete' ? 'green' : c.status === 'partial' ? 'amber' : 'red';
                const statusIcon =
                  c.status === 'complete' ? (
                    <CheckCircle size={14} className="text-emerald-500" />
                  ) : (
                    <AlertCircle
                      size={14}
                      className={c.status === 'partial' ? 'text-amber-500' : 'text-red-500'}
                    />
                  );
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {statusIcon}
                        <span className="text-sm font-medium text-gray-900 truncate">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            c.status === 'complete'
                              ? 'success'
                              : c.status === 'partial'
                                ? 'warning'
                                : 'danger'
                          }
                          size="sm"
                        >
                          {c.score}/{c.max}
                        </Badge>
                        <span className="text-xs text-gray-500 w-14 text-right">{c.status}</span>
                      </div>
                    </div>
                    <ProgressBar value={pct} size="sm" color={barColor as any} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Missing criteria list */}
          {score.missingCriteria.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle size={14} className="text-red-500" />
                Missing Criteria ({score.missingCriteria.length})
              </h4>
              <ul className="space-y-1.5">
                {score.missingCriteria.map((name, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 border border-red-100 rounded-md px-3 py-2"
                  >
                    <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <span>{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp size={14} className="text-teal-600" />
              Next Steps
            </h4>
            <ol className="space-y-2">
              {nextSteps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
                >
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1">{step}</span>
                  <Target size={14} className="text-gray-400 mt-0.5 shrink-0" />
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Card>
  );
}
