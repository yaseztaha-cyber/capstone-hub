'use client';

import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import type { BudgetForecast } from '@/lib/forecast';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ForecastCardProps {
  forecast: BudgetForecast;
}

export default function ForecastCard({ forecast }: ForecastCardProps) {
  const { weeklyAverage, projectedTotal, weeksRemaining, status, spendingByWeek } = forecast;

  const statusConfig = {
    on_track: { label: 'On Track', variant: 'success' as const, icon: CheckCircle },
    warning: { label: 'Warning', variant: 'warning' as const, icon: AlertTriangle },
    over_budget: { label: 'Over Budget', variant: 'danger' as const, icon: AlertTriangle },
  };

  const cfg = statusConfig[status];

  const sparkMax = spendingByWeek.length > 0 ? Math.max(...spendingByWeek.map(w => w.amount)) : 1;
  const sparkW = 80;
  const sparkH = 24;
  const sparkPoints = spendingByWeek
    .map((w, i) => {
      const x = (i / Math.max(1, spendingByWeek.length - 1)) * sparkW;
      const y = sparkH - (w.amount / (sparkMax || 1)) * sparkH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Budget Forecast</h3>
        <Badge variant={cfg.variant} size="sm">
          <cfg.icon size={10} className="mr-1" />
          {cfg.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="flex sm:block justify-between items-center sm:items-start">
          <div className="text-xs text-gray-500">Weekly Avg</div>
          <div className="text-lg font-bold text-gray-900">{weeklyAverage.toFixed(0)} EGP</div>
        </div>
        <div className="flex sm:block justify-between items-center sm:items-start">
          <div className="text-xs text-gray-500">Projected Total</div>
          <div className="text-lg font-bold text-gray-900">{projectedTotal.toFixed(0)} EGP</div>
        </div>
        <div className="flex items-center justify-between sm:items-start">
          <div>
            <div className="text-xs text-gray-500">Weeks Left</div>
            <div className="text-lg font-bold text-gray-900">{weeksRemaining}</div>
          </div>
          {spendingByWeek.length > 1 && (
            <svg width={sparkW} height={sparkH} className="mt-1 hidden sm:block">
              <polyline points={sparkPoints} fill="none" stroke="#0d9488" strokeWidth={1.5} />
            </svg>
          )}
        </div>
      </div>
    </Card>
  );
}
