'use client';

import { useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Tabs from '@/components/ui/Tabs';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';
import { useTranslations } from '@/lib/useTranslations';
import { Folder, FileText, Upload, Search, History } from 'lucide-react';

export default function FilesPage() {
  const { files, members, tasks, uploadFileAction } = useAppStore();
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('other');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const getMemberName = (userId: string) => members.find(m => m.userId === userId)?.user.name || 'Unknown';
  const getTaskName = (taskId: string) => tasks.find(t => t.id === taskId)?.title || '';

  const filtered = files.filter(f => {
    if (activeTab !== 'all' && f.category !== activeTab) return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      await uploadFileAction(pendingFile, category);
      setShowUpload(false);
      setPendingFile(null);
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Files', count: files.length },
    { id: 'research', label: 'Research', count: files.filter(f => f.category === 'research').length },
    { id: 'design', label: 'Design', count: files.filter(f => f.category === 'design').length },
    { id: 'portfolio', label: 'Portfolio', count: files.filter(f => f.category === 'portfolio').length },
    { id: 'testing', label: 'Testing', count: files.filter(f => f.category === 'testing').length },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('files')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{files.length} files uploaded</p>
        </div>
        <Button onClick={() => setShowUpload(true)}><Upload size={16} className="mr-1" /> {t('add')}</Button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder={t('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Folder size={40} />} title="No files found" description="Upload your first file." action={<Button onClick={() => setShowUpload(true)}><Upload size={16} className="mr-1" /> Upload</Button>} />
      ) : (
        <Card padding={false}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Uploaded by</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3 hidden lg:table-cell">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(file => (
                <tr key={file.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedFile(file.id)}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell"><Badge size="sm" className="capitalize">{file.category}</Badge></td>
                  <td className="px-5 py-3 hidden md:table-cell"><span className="text-sm text-gray-600">{getMemberName(file.uploaderId)}</span></td>
                  <td className="px-5 py-3 hidden lg:table-cell"><span className="text-sm text-gray-500">{formatRelativeTime(file.uploadDate)}</span></td>
                  <td className="px-5 py-3 hidden lg:table-cell"><span className="text-sm text-gray-500">{formatSize(file.size)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setPendingFile(null); }} title={t('add')}>
        <div className="space-y-4">
          <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} options={[{ value: 'research', label: 'Research' }, { value: 'design', label: 'Design' }, { value: 'prototype', label: 'Prototype' }, { value: 'testing', label: 'Testing' }, { value: 'data', label: 'Data' }, { value: 'portfolio', label: 'Portfolio' }, { value: 'poster', label: 'Poster' }, { value: 'logbook', label: 'Logbook' }, { value: 'references', label: 'References' }, { value: 'other', label: 'Other' }]} />
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer">
            {pendingFile ? (
              <div>
                <FileText size={24} className="text-teal-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">{pendingFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">{formatSize(pendingFile.size)}</p>
              </div>
            ) : (
              <>
                <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to browse</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, images up to 50MB</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => setPendingFile(e.target.files?.[0] || null)} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowUpload(false); setPendingFile(null); }}>{t('cancel')}</Button>
            <Button onClick={handleUpload} disabled={!pendingFile || uploading}>{uploading ? t('loading') : t('add')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
