'use client';

import { Card } from '@/components/ui/Card';

interface VelocityChartProps {
  data: { week: string; completed: number }[];
}

export default function VelocityChart({ data }: VelocityChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Velocity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No velocity data yet</p>
      </Card>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.completed), 1);
  const chartW = 560;
  const chartH = 240;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const barGap = 8;
  const barWidth = Math.max(12, innerW / data.length - barGap);
  const stepX = innerW / data.length;

  const scaleY = (val: number) => padT + innerH - (val / (maxVal || 1)) * innerH;

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  const formatWeek = (week: string) => {
    try {
      const d = new Date(week);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {}
    return week.length > 10 ? week.slice(5) : week;
  };

  return (
    <Card>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Velocity</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Completed tasks per week</p>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Velocity chart showing completed tasks per week">
        {/* grid lines */}
        {yTickValues.map((val, i) => (
          <g key={i}>
            <line x1={padL} y1={scaleY(val)} x2={chartW - padR} y2={scaleY(val)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={padL - 8} y={scaleY(val) + 4} textAnchor="end" className="fill-gray-400" fontSize={10}>
              {val}
            </text>
          </g>
        ))}

        {/* bars */}
        {data.map((d, i) => {
          const x = padL + i * stepX + (stepX - barWidth) / 2;
          const y = scaleY(d.completed);
          const h = innerH - (y - padT);
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                fill="#0d9488"
                rx={4}
                ry={4}
              />
              {h > 16 && (
                <text x={x + barWidth / 2} y={y + 14} textAnchor="middle" className="fill-white" fontSize={10} fontWeight={600}>
                  {d.completed}
                </text>
              )}
              {h <= 16 && d.completed > 0 && (
                <text x={x + barWidth / 2} y={y - 4} textAnchor="middle" className="fill-gray-900" fontSize={10} fontWeight={600}>
                  {d.completed}
                </text>
              )}
            </g>
          );
        })}

        {/* x labels */}
        {data.map((d, i) => {
          const x = padL + i * stepX + stepX / 2;
          return (
            <text key={i} x={x} y={chartH - 10} textAnchor="middle" className="fill-gray-500" fontSize={10}>
              {formatWeek(d.week)}
            </text>
          );
        })}
      </svg>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="w-3 h-3 bg-teal-600 rounded-sm inline-block" />
        Completed tasks
      </div>
    </Card>
  );
}
