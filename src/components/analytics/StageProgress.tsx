'use client';

import { Card } from '@/components/ui/Card';
import { getStageLabel } from '@/lib/utils';

interface StageProgressProps {
  data: { stage: string; total: number; completed: number; percentage: number }[];
}

const STAGE_COLORS: Record<string, string> = {
  research: '#2563eb',
  design: '#7c3aed',
  prototype: '#d97706',
  testing: '#ea580c',
  analysis: '#0891b2',
  documentation: '#059669',
  presentation: '#db2777',
};

const STAGE_BG: Record<string, string> = {
  research: 'bg-blue-50',
  design: 'bg-violet-50',
  prototype: 'bg-amber-50',
  testing: 'bg-orange-50',
  analysis: 'bg-cyan-50',
  documentation: 'bg-emerald-50',
  presentation: 'bg-pink-50',
};

export default function StageProgress({ data }: StageProgressProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Stage Progress</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No stage data yet</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Stage Progress</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Progress by project stage</p>
      <div className="space-y-4">
        {data.map((item) => {
          const color = STAGE_COLORS[item.stage] || '#0d9488';
          const bg = STAGE_BG[item.stage] || 'bg-gray-50';
          let label: string;
          try {
            label = getStageLabel(item.stage as unknown as Parameters<typeof getStageLabel>[0]);
          } catch {
            label = item.stage.charAt(0).toUpperCase() + item.stage.slice(1);
          }
          return (
            <div key={item.stage} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{label}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.completed}/{item.total}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.percentage}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
