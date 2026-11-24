'use client';

import { Card } from '@/components/ui/Card';
import type { BudgetForecast } from '@/lib/forecast';

interface ForecastChartProps {
  forecast: BudgetForecast;
  budgetLimit?: number;
}

export default function ForecastChart({ forecast, budgetLimit }: ForecastChartProps) {
  const { spendingByWeek } = forecast;
  if (spendingByWeek.length === 0) return null;

  const maxVal = Math.max(
    ...spendingByWeek.map(w => w.amount),
    budgetLimit || 0,
    forecast.projectedTotal / Math.max(1, forecast.spendingByWeek.length)
  );

  const chartW = 560;
  const chartH = 200;
  const padL = 50;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const scaleY = (val: number) => padT + innerH - (val / (maxVal || 1)) * innerH;
  const scaleX = (i: number) => padL + (i / Math.max(1, spendingByWeek.length - 1)) * innerW;

  const actualPoints = spendingByWeek
    .map((w, i) => `${scaleX(i)},${scaleY(w.amount)}`)
    .join(' ');

  const avgPoints = forecast.weeklyAverage > 0
    ? spendingByWeek.map((_, i) => `${scaleX(i)},${scaleY(forecast.weeklyAverage)}`).join(' ')
    : '';

  const projectedStart = spendingByWeek.length > 0 ? spendingByWeek[spendingByWeek.length - 1].amount : 0;
  const projectedPoints = forecast.weeksRemaining > 0
    ? `${scaleX(spendingByWeek.length - 1)},${scaleY(projectedStart)} ${scaleX(spendingByWeek.length - 1 + forecast.weeksRemaining)},${scaleY(forecast.projectedTotal)}`
    : '';

  const budgetLineY = budgetLimit ? scaleY(budgetLimit) : null;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxVal / yTicks) * i));

  return (
    <Card className="mt-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Spending Forecast</h3>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {yTickValues.map((val, i) => (
          <g key={i}>
            <line x1={padL} y1={scaleY(val)} x2={chartW - padR} y2={scaleY(val)} stroke="#f3f4f6" strokeWidth={1} />
            <text x={padL - 8} y={scaleY(val) + 4} textAnchor="end" className="fill-gray-400" fontSize={10}>
              {val}
            </text>
          </g>
        ))}

        {spendingByWeek.map((w, i) => (
          <text key={i} x={scaleX(i)} y={chartH - 8} textAnchor="middle" className="fill-gray-400" fontSize={10}>
            {w.week}
          </text>
        ))}

        {budgetLineY !== null && (
          <>
            <line x1={padL} y1={budgetLineY} x2={chartW - padR} y2={budgetLineY} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,3" />
            <text x={chartW - padR} y={budgetLineY - 5} textAnchor="end" className="fill-red-500" fontSize={9}>
              Budget: {budgetLimit}
            </text>
          </>
        )}

        {avgPoints && (
          <polyline points={avgPoints} fill="none" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3,3" />
        )}

        {projectedPoints && (
          <polyline points={projectedPoints} fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5,4" />
        )}

        {actualPoints && (
          <polyline points={actualPoints} fill="none" stroke="#0d9488" strokeWidth={2} strokeLinejoin="round" />
        )}

        {spendingByWeek.map((w, i) => (
          <circle key={i} cx={scaleX(i)} cy={scaleY(w.amount)} r={3} fill="#0d9488" />
        ))}
      </svg>

      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-teal-600 inline-block rounded" /> Actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-gray-400 inline-block rounded border-dashed" style={{ borderTop: '1px dashed #94a3b8', height: 0 }} /> Projected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-0.5 bg-gray-300 inline-block rounded" /> Avg
        </span>
        {budgetLimit && (
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-red-500 inline-block rounded" /> Budget
          </span>
        )}
      </div>
    </Card>
  );
}
