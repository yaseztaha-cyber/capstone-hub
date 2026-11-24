'use client';

import { Card } from '@/components/ui/Card';
import { format, parseISO } from 'date-fns';

interface BurndownChartProps {
  data: { date: string; remaining: number; ideal: number }[];
}

export default function BurndownChart({ data }: BurndownChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Burndown</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No burndown data yet</p>
      </Card>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.remaining, d.ideal)), 1);
  const chartW = 560;
  const chartH = 240;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const scaleX = (i: number) => padL + (i / Math.max(1, data.length - 1)) * innerW;
  const scaleY = (val: number) => padT + innerH - (val / (maxVal || 1)) * innerH;

  const remainingPoints = data.map((d, i) => `${scaleX(i)},${scaleY(d.remaining)}`).join(' ');
  const idealPoints = data.map((d, i) => `${scaleX(i)},${scaleY(d.ideal)}`).join(' ');

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  const formatDateLabel = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (!isNaN(d.getTime())) return format(d, 'MMM d');
    } catch {}
    try {
      const d2 = new Date(dateStr);
      if (!isNaN(d2.getTime())) return format(d2, 'MMM d');
    } catch {}
    return dateStr.slice(5);
  };

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Burndown</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Remaining tasks vs ideal</p>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Burndown chart showing remaining tasks vs ideal">
        {/* grid */}
        {yTickValues.map((val, i) => (
          <g key={i}>
            <line x1={padL} y1={scaleY(val)} x2={chartW - padR} y2={scaleY(val)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={padL - 8} y={scaleY(val) + 4} textAnchor="end" className="fill-gray-400" fontSize={10}>
              {val}
            </text>
          </g>
        ))}

        {/* ideal line */}
        <polyline points={idealPoints} fill="none" stroke="#9ca3af" strokeWidth={2} strokeDasharray="6,4" strokeLinejoin="round" strokeLinecap="round" />

        {/* remaining line */}
        <polyline points={remainingPoints} fill="none" stroke="#0d9488" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

        {/* dots for remaining */}
        {data.map((d, i) => (
          <circle key={i} cx={scaleX(i)} cy={scaleY(d.remaining)} r={3.5} fill="#0d9488" stroke="white" strokeWidth={1.5} />
        ))}

        {/* dots for ideal - smaller */}
        {data.map((d, i) => (
          <circle key={`ideal-${i}`} cx={scaleX(i)} cy={scaleY(d.ideal)} r={2.5} fill="white" stroke="#9ca3af" strokeWidth={1.5} />
        ))}

        {/* x labels: show max 6 labels to avoid crowding */}
        {data.map((d, i) => {
          if (data.length > 6) {
            const step = Math.ceil(data.length / 6);
            if (i % step !== 0 && i !== data.length - 1) return null;
          }
          return (
            <text key={i} x={scaleX(i)} y={chartH - 10} textAnchor="middle" className="fill-gray-500" fontSize={10}>
              {formatDateLabel(d.date)}
            </text>
          );
        })}
      </svg>

      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-teal-600 inline-block rounded" /> Remaining
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-gray-400 inline-block rounded" style={{ borderTop: '2px dashed #9ca3af', height: 0 }} /> Ideal
        </span>
      </div>
    </Card>
  );
}
