'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, useState } from 'react';
import { Download, Upload, Copy, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toast from '@/components/ui/Toast';
import { exportBackup, importBackup, cloneProject } from '@/lib/backup';

export default function BackupSection() {
  const [cloneName, setCloneName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleExport = () => {
    try {
      const json = exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `stem-capstone-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Backup exported successfully', 'success');
    } catch {
      showToast('Failed to export backup', 'error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const ok = importBackup(text);
        if (ok) {
          showToast('Backup imported successfully', 'success');
          // small delay then reload to reflect restored state
          setTimeout(() => {
            try {
              window.location.reload();
            } catch {}
          }, 800);
        } else {
          showToast('Invalid backup file', 'error');
        }
      } catch {
        showToast('Failed to import backup', 'error');
      }
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      showToast('Failed to read file', 'error');
    };
    reader.readAsText(file);
  };

  const handleClone = () => {
    const trimmed = cloneName.trim();
    if (!trimmed) {
      showToast('Please enter a new project name', 'error');
      return;
    }
    try {
      cloneProject(trimmed);
      showToast(`Project cloned as "${trimmed}"`, 'success');
      setCloneName('');
    } catch {
      showToast('Failed to clone project', 'error');
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download size={16} />
            Backup &amp; Restore
          </CardTitle>
        </CardHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Export your data as JSON for safekeeping, restore from a backup file, or duplicate your current project.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download size={16} />
              Export Backup
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="gap-2">
              <Upload size={16} />
              Import Backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Import backup file"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Copy size={14} />
              Clone Project
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Duplicate the current project with a new name. Tasks will be copied with new IDs.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="New project name"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleClone();
                }}
                aria-label="New project name"
              />
              <Button onClick={handleClone} className="gap-2 shrink-0" disabled={!cloneName.trim()}>
                <Copy size={16} />
                Clone
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
