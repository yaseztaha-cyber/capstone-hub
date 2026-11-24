'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ForecastCard from '@/components/budget/ForecastCard';
import ForecastChart from '@/components/budget/ForecastChart';
import { calculateForecast } from '@/lib/forecast';
import { formatDate, cn } from '@/lib/utils';
import { DollarSign, Plus, Trash2, ShoppingCart, Receipt, AlertCircle } from 'lucide-react';

const BUDGET_CATEGORIES = [
  { value: 'materials', label: 'Materials', color: 'bg-blue-100 text-blue-700' },
  { value: 'tools', label: 'Tools & Equipment', color: 'bg-purple-100 text-purple-700' },
  { value: 'electronics', label: 'Electronics', color: 'bg-amber-100 text-amber-700' },
  { value: 'software', label: 'Software', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'printing', label: 'Printing & Binding', color: 'bg-pink-100 text-pink-700' },
  { value: 'transport', label: 'Transport', color: 'bg-green-100 text-green-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

export default function BudgetPage() {
  const { budgetItems, createBudgetItemAction, deleteBudgetItemAction } = useAppStore();
  const { t } = useTranslations();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('materials');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');

  const forecast = calculateForecast(
    budgetItems.map(i => ({ amount: i.amount, date: i.date })),
    budgetLimit ? parseFloat(budgetLimit) : undefined
  );

  const totalSpent = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const categoryTotals = BUDGET_CATEGORIES.map(cat => ({
    ...cat,
    total: budgetItems.filter(i => i.category === cat.value).reduce((sum, i) => sum + i.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const handleAdd = () => {
    if (!name.trim() || !amount) return;
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    createBudgetItemAction({ name: name.trim(), category, amount: parseFloat(amount), quantity: qty, notes: notes.trim() });
    setName(''); setCategory('materials'); setAmount(''); setQuantity('1'); setNotes('');
    setShowAdd(false);
  };

  const handleExportCsv = () => {
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = ['Item,Quantity,Line Total (EGP),Category,Notes'];
    for (const item of budgetItems) {
      const qty = item.quantity ?? 1;
      lines.push([item.name, qty, Number(item.amount).toFixed(2), item.category, item.notes || ''].map(esc).join(','));
    }
    lines.push(['TOTAL', '', totalSpent.toFixed(2), '', ''].map(esc).join(','));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bill-of-materials.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto overflow-x-hidden">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-gray-900">{t('budget')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('budgetDescription')}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <label className="text-xs text-gray-500 whitespace-nowrap">Budget Limit</label>
            <input
              type="number"
              value={budgetLimit}
              onChange={(e) => setBudgetLimit(e.target.value)}
              placeholder="e.g. 5000"
              className="flex-1 sm:w-28 border border-gray-300 rounded-lg px-2.5 py-2 sm:py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 min-h-[44px] sm:min-h-0"
            />
          </div>
          <Button variant="outline" onClick={handleExportCsv} disabled={budgetItems.length === 0} className="w-full sm:w-auto justify-center">
            BOM CSV
          </Button>
          <Button onClick={() => setShowAdd(true)} className="w-full sm:w-auto justify-center">
            <Plus size={14} className="mr-1.5" /> {t('addExpense')}
          </Button>
        </div>
      </div>

      {budgetItems.length > 0 && (
        <div className="space-y-4 mb-6 overflow-x-hidden">
          <ForecastCard forecast={forecast} />
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <ForecastChart forecast={forecast} budgetLimit={budgetLimit ? parseFloat(budgetLimit) : undefined} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign size={18} className="text-emerald-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('totalSpent')}</div>
              <div className="text-xl font-bold text-gray-900">{totalSpent.toFixed(2)} EGP</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt size={18} className="text-blue-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('transactions')}</div>
              <div className="text-xl font-bold text-gray-900">{budgetItems.length}</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={18} className="text-purple-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('categoriesUsed')}</div>
              <div className="text-xl font-bold text-gray-900">{categoryTotals.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {categoryTotals.length > 0 && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('category')}</h2>
          <div className="space-y-2">
            {categoryTotals.map(cat => (
              <div key={cat.value} className="flex items-center gap-3">
                <span className={cn('text-xs px-2 py-0.5 rounded font-medium', cat.color)}>{cat.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-teal-600 h-2 rounded-full" style={{ width: `${(cat.total / totalSpent) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-900 w-20 text-right">{cat.total.toFixed(2)} EGP</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('transactions')}</h2>
      {budgetItems.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <DollarSign size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">{t('noExpenses')}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {budgetItems.map(item => {
            const cat = BUDGET_CATEGORIES.find(c => c.value === item.category);
            const qty = item.quantity ?? 1;
            return (
              <Card key={item.id}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      {cat && <span className={cn('text-xs px-1.5 py-0.5 rounded', cat.color)}>{cat.label}</span>}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">× {qty}</span>
                    </div>
                    {item.notes && <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-900">{item.amount.toFixed(2)} EGP</span>
                    <button onClick={() => deleteBudgetItemAction(item.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title={t('addExpense')}>
        <div className="space-y-3">
          <Input label={t('itemName')} placeholder="e.g. Arduino Uno" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {BUDGET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('amount')} type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input label="Quantity" type="number" min={1} step={1} placeholder="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <Input label={t('notes')} placeholder="Where and when purchased" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t('cancel')}</Button>
            <Button onClick={handleAdd} disabled={!name.trim() || !amount}>{t('add')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
