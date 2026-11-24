'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Bug, Lightbulb, Star } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

type Category = 'Bug' | 'Feature' | 'Improvement';

const CATEGORIES: { value: Category; label: string; icon: typeof Bug }[] = [
  { value: 'Bug', label: 'Bug', icon: Bug },
  { value: 'Feature', label: 'Feature', icon: Lightbulb },
  { value: 'Improvement', label: 'Improvement', icon: Star },
];

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<Category>('Bug');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Load persisted dismissed state
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem('sch_feedback_widget_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const persistDismissed = (dismissed: boolean) => {
    try {
      localStorage.setItem('sch_feedback_widget_dismissed', String(dismissed));
    } catch {
      // ignore
    }
    setIsDismissed(dismissed);
  };

  const handleOpen = () => {
    setIsOpen(true);
    persistDismissed(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    persistDismissed(true);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);

    const feedbackEntry = {
      id: Date.now().toString(),
      message: message.trim(),
      category,
      email: email.trim() || null,
      url: typeof window !== 'undefined' ? window.location.href : '',
      createdAt: new Date().toISOString(),
    };

    // Persist to localStorage
    try {
      const raw = localStorage.getItem('sch_feedback_widget');
      const existing = raw ? JSON.parse(raw) : [];
      const next = Array.isArray(existing) ? [...existing, feedbackEntry] : [feedbackEntry];
      localStorage.setItem('sch_feedback_widget', JSON.stringify(next));
    } catch {
      // ignore localStorage errors
    }

    // Try to send to Supabase table 'feedback'
    try {
      const supabase = createClient();
      await supabase.from('feedback').insert([
        {
          message: feedbackEntry.message,
          category: feedbackEntry.category,
          email: feedbackEntry.email,
          url: feedbackEntry.url,
          created_at: feedbackEntry.createdAt,
        },
      ]);
    } catch {
      // ignore supabase errors - still show thank you
    }

    setSubmitting(false);
    setMessage('');
    setEmail('');
    setIsOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // If dismissed, still show floating button to allow reopen - but respect spec "Persists dismissed state"
  // We keep button visible but panel closed. To fully hide after dismissed, uncomment below:
  // if (isDismissed && !isOpen) { ... }
  // For now, we keep widget visible even when dismissed, but panel stays closed.

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 flex flex-col items-end gap-3">
        {isOpen && (
          <Card className="w-[320px] sm:w-[360px] shadow-xl border border-gray-200 dark:border-gray-800 p-0 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-teal-700 dark:text-teal-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Send feedback</span>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close feedback panel"
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Category select */}
              <div>
                <label htmlFor="feedback-category" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category
                </label>
                <div className="relative">
                  <select
                    id="feedback-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-2.5 pointer-events-none flex gap-1 text-gray-400">
                    {category === 'Bug' && <Bug size={16} />}
                    {category === 'Feature' && <Lightbulb size={16} />}
                    {category === 'Improvement' && <Star size={16} />}
                  </div>
                </div>
                {/* Category icons row for visual */}
                <div className="flex gap-2 mt-2">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border text-xs font-medium transition-colors ${
                          active
                            ? 'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-300'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400'
                        }`}
                      >
                        <Icon size={14} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message textarea */}
              <div>
                <label htmlFor="feedback-message" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Feedback
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you think..."
                  rows={4}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                />
              </div>

              {/* Email optional */}
              <div>
                <label htmlFor="feedback-email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!message.trim() || submitting}
                className="w-full flex items-center justify-center gap-2"
                variant="primary"
              >
                {submitting ? (
                  'Sending...'
                ) : (
                  <>
                    <Send size={16} />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Toggle button - hidden when panel open on mobile to avoid duplicate? Keep visible but change icon */}
        {!isOpen ? (
          <button
            onClick={handleOpen}
            aria-label="Open feedback widget"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-lg hover:shadow-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          >
            <MessageCircle size={22} />
          </button>
        ) : (
          <button
            onClick={handleClose}
            aria-label="Close feedback widget"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 hover:bg-black text-white shadow-lg transition-all lg:hidden"
          >
            <X size={22} />
          </button>
        )}
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-4 lg:bottom-4 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-2">
          <span>Thank you for your feedback!</span>
          <button onClick={() => setShowToast(false)} className="ml-2 text-gray-300 hover:text-white" aria-label="Dismiss toast">
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
