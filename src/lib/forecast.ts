export interface BudgetForecast {
  weeklyAverage: number;
  projectedTotal: number;
  weeksRemaining: number;
  status: 'on_track' | 'warning' | 'over_budget';
  spendingByWeek: { week: string; amount: number }[];
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `W${weekNum}`;
}

export function calculateForecast(
  budgetItems: { amount: number; date: string }[],
  budgetLimit?: number
): BudgetForecast {
  if (budgetItems.length === 0) {
    return {
      weeklyAverage: 0,
      projectedTotal: 0,
      weeksRemaining: 0,
      status: 'on_track',
      spendingByWeek: [],
    };
  }

  const sorted = [...budgetItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const totalDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / 86400000);
  const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));

  const weekMap = new Map<string, number>();
  for (const item of budgetItems) {
    const key = getWeekKey(item.date);
    weekMap.set(key, (weekMap.get(key) || 0) + item.amount);
  }

  const spendingByWeek = [...weekMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, amount]) => ({ week, amount: Math.round(amount * 100) / 100 }));

  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const weeklyAverage = Math.round((totalSpent / totalWeeks) * 100) / 100;

  const PROJECT_WEEKS = 16;
  const weeksRemaining = Math.max(0, PROJECT_WEEKS - totalWeeks);
  const projectedTotal = Math.round((totalSpent + weeklyAverage * weeksRemaining) * 100) / 100;

  let status: BudgetForecast['status'] = 'on_track';
  if (budgetLimit) {
    if (projectedTotal > budgetLimit) {
      status = 'over_budget';
    } else if (projectedTotal > budgetLimit * 0.85) {
      status = 'warning';
    }
  }

  return {
    weeklyAverage,
    projectedTotal,
    weeksRemaining,
    status,
    spendingByWeek,
  };
}
