'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import type { Locale } from '@/lib/types';
import { FileDown, CheckCircle2, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (sections: string[], locale: Locale) => void;
}

const SECTION_OPTIONS = [
  { id: 'overview', key: 'overview' as const },
  { id: 'problem', key: 'problem' as const },
  { id: 'research', key: 'research' as const },
  { id: 'scientific', key: 'scientificPrinciples' as const },
  { id: 'design', key: 'designRequirements' as const },
  { id: 'prototype', key: 'prototype' as const },
  { id: 'testing', key: 'testing' as const },
  { id: 'results', key: 'results' as const },
  { id: 'conclusion', key: 'conclusion' as const },
  { id: 'grandchallenge', key: 'grandChallenge' as const },
];

export default function ExportModal({ isOpen, onClose, onExport }: ExportModalProps) {
  const { project } = useAppStore();
  const { t, locale } = useTranslations();
  const [selectedSections, setSelectedSections] = useState<string[]>(
    SECTION_OPTIONS.map(s => s.id)
  );
  const [exportLocale, setExportLocale] = useState<Locale>(locale);
  const [generating, setGenerating] = useState(false);

  const toggleSection = (id: string) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedSections.length === SECTION_OPTIONS.length) {
      setSelectedSections([]);
    } else {
      setSelectedSections(SECTION_OPTIONS.map(s => s.id));
    }
  };

  const handleExport = async () => {
    if (selectedSections.length === 0) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 300));
    onExport(selectedSections, exportLocale);
    setGenerating(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('exportProject')} size="lg">
      <div className="space-y-5">
        <p className="text-sm text-gray-500">{t('exportProjectDesc')}</p>

        {/* Language Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('language')}</label>
          <div className="flex gap-2">
            <button
              onClick={() => setExportLocale('en')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                exportLocale === 'en'
                  ? 'bg-teal-100 text-teal-700 border border-teal-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setExportLocale('ar')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                exportLocale === 'ar'
                  ? 'bg-teal-100 text-teal-700 border border-teal-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent'
              }`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Section Checkboxes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">{t('selectSections')}</label>
            <button
              onClick={toggleAll}
              className="text-xs text-teal-700 hover:underline"
            >
              {selectedSections.length === SECTION_OPTIONS.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="space-y-1.5">
            {SECTION_OPTIONS.map(section => (
              <label
                key={section.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSections.includes(section.id)}
                  onChange={() => toggleSection(section.id)}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{t(section.key)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CheckCircle2 size={14} className="text-teal-600" />
            <span>
              {selectedSections.length} of {SECTION_OPTIONS.length} sections selected
              {project?.title && <span className="text-gray-400"> — {project.title}</span>}
            </span>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} disabled={generating}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleExport}
            disabled={selectedSections.length === 0 || generating}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                {t('exportGenerating')}
              </>
            ) : (
              <>
                <FileDown size={16} className="mr-2" />
                {t('exportAsPdf')}
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
