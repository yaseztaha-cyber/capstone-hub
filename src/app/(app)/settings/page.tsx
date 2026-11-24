'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import { useTheme } from '@/lib/theme';
import { formatDate, cn } from '@/lib/utils';
import {
  User, Shield, Bell, Palette, Download, Trash2,
  ChevronRight, LogOut, Moon, Sun, Globe, Monitor,
  Cloud, RefreshCw
} from 'lucide-react';
import BackupSection from '@/components/settings/BackupSection';
import { checkCloudSync, type SyncStatus } from '@/lib/supabase/health';
import { generateICS } from '@/lib/calendarSync';
import { exportBackup } from '@/lib/backup';
import { useState } from 'react';

function downloadFile(content: string | Blob, filename: string, mime: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function SettingsPage() {
  const { currentUser, team, project, logbook, tasks, milestones, meetings, decisions, files, sources, locale, setLocale } = useAppStore();
  const { t } = useTranslations();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [exportMsg, setExportMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [sync, setSync] = useState<SyncStatus | null>(null);
  const [syncChecking, setSyncChecking] = useState(false);

  const handleCheckSync = async () => {
    setSyncChecking(true);
    try {
      setSync(await checkCloudSync());
    } catch {
      setSync(null);
    } finally {
      setSyncChecking(false);
    }
  };

  const slug = (project?.title || 'project').replace(/[^a-z0-9]/gi, '_');

  const handleExportLogbook = () => {
    try {
      const lines = [`# Logbook — ${project?.title || 'Project'}`, `Exported ${new Date().toLocaleDateString()}`, ''];
      if (logbook.length === 0) lines.push('_No logbook entries yet._');
      for (const e of logbook) {
        lines.push(`## ${e.date ? new Date(e.date).toLocaleDateString() : 'Undated'} — ${e.activity}`);
        if (e.stage) lines.push(`Stage: ${e.stage}`);
        if (e.whatWasDone) lines.push(`Did: ${e.whatWasDone}`);
        if (e.whyItWasDone) lines.push(`Why: ${e.whyItWasDone}`);
        if (e.result) lines.push(`Result: ${e.result}`);
        if (e.problemsEncountered) lines.push(`Problems: ${e.problemsEncountered}`);
        if (e.nextStep) lines.push(`Next: ${e.nextStep}`);
        if (e.evidence?.length) lines.push(`Evidence: ${e.evidence.join(', ')}`);
        lines.push('');
      }
      downloadFile(lines.join('\n'), `${slug}-logbook.md`, 'text/markdown;charset=utf-8');
      setExportMsg({ text: `Logbook exported (${logbook.length} entries).`, ok: true });
    } catch {
      setExportMsg({ text: 'Logbook export failed.', ok: false });
    }
  };

  const handleExportTimeline = () => {
    try {
      const ics = generateICS(tasks, milestones, meetings);
      downloadFile(ics, `${slug}-timeline.ics`, 'text/calendar;charset=utf-8');
      setExportMsg({ text: 'Timeline exported as a calendar (.ics) file.', ok: true });
    } catch {
      setExportMsg({ text: 'Timeline export failed.', ok: false });
    }
  };

  const handleExportReferences = () => {
    try {
      const lines = [`References — ${project?.title || 'Project'}`, `Exported ${new Date().toLocaleDateString()}`, ''];
      if (sources.length === 0) lines.push('No research sources added yet.');
      sources.forEach((s, i) => {
        const apa = s.apaCitation?.trim()
          || [s.authors && `${s.authors}`, s.year && `(${s.year})`, s.title && `${s.title}.`, s.url && `Retrieved from ${s.url}`].filter(Boolean).join(' ');
        lines.push(`[${i + 1}] ${apa || s.title || 'Untitled source'}`);
      });
      downloadFile(lines.join('\n'), `${slug}-references.txt`, 'text/plain;charset=utf-8');
      setExportMsg({ text: `References exported (${sources.length} sources).`, ok: true });
    } catch {
      setExportMsg({ text: 'References export failed.', ok: false });
    }
  };

  const handleExportArchive = () => {
    try {
      const json = exportBackup();
      downloadFile(json, `${slug}-archive-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
      setExportMsg({ text: 'Full project archive downloaded (JSON).', ok: true });
    } catch {
      setExportMsg({ text: 'Archive export failed.', ok: false });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{t('settings')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('manageAccount')}</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={16} />
            {t('student')}
          </CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">{currentUser?.name || t('student')}</p>
              <p className="text-xs text-gray-500">{currentUser?.email || ''}</p>
            </div>
            <Badge variant="info">{t('student')}</Badge>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-700">{t('school')}</p>
              <p className="text-xs text-gray-500">{currentUser?.school || 'STEM Gharbiya'}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-700">{t('grade')}</p>
              <p className="text-xs text-gray-500">{currentUser?.grade || '11'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={16} />
            {t('projectInformation')}
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-700">{t('team')}</span>
            <span className="text-sm font-medium text-gray-900">{team?.name} ({team?.code})</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-700">{t('project')}</span>
            <span className="text-sm font-medium text-gray-900">{project?.title}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-700">{t('school')}</span>
            <span className="text-sm font-medium text-gray-900">{project?.school}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-700">{t('semester')}</span>
            <span className="text-sm font-medium text-gray-900">{project?.semester}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-700">{t('createdDate')}</span>
            <span className="text-sm font-medium text-gray-900">{team ? formatDate(team.createdAt) : ''}</span>
          </div>
        </div>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe size={16} />
            {t('language')}
          </CardTitle>
        </CardHeader>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocale('en')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              locale === 'en' ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            🇬🇧 {t('english')}
          </button>
          <button
            onClick={() => setLocale('ar')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              locale === 'ar' ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            🇪🇬 {t('arabic')}
          </button>
        </div>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={16} />
            {t('appearance')}
          </CardTitle>
        </CardHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              theme === 'light'
                ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-300'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            <Sun size={16} />
            {t('light')}
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              theme === 'dark'
                ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-300'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            <Moon size={16} />
            {t('dark')}
          </button>
          <button
            onClick={() => setTheme('system')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
              theme === 'system'
                ? 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950 dark:text-teal-300'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            <Monitor size={16} />
            System
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Active: {resolvedTheme}</span>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={16} />
            {t('notificationsSettings')}
          </CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {[
            t('taskAssigned'),
            t('taskDue'),
            t('taskOverdue'),
            t('fileUpdated'),
            t('commentMention'),
            t('deadlineApproaching'),
          ].map(item => (
            <label key={item} className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-sm text-gray-700">{item}</span>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            </label>
          ))}
        </div>
      </Card>

      {/* Exports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download size={16} />
            {t('exportArchive')}
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          <button onClick={handleExportLogbook} className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-sm text-gray-700">{t('exportLogbook')}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          <button onClick={handleExportTimeline} className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-sm text-gray-700">{t('exportTimeline')}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          <button onClick={handleExportReferences} className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-sm text-gray-700">{t('exportReferences')}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
          <button onClick={handleExportArchive} className="w-full flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-sm text-gray-700">{t('generateArchive')}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
        {exportMsg && (
          <div className={`mt-3 p-2.5 rounded-lg text-xs ${exportMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {exportMsg.text}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Logbook downloads as Markdown · Timeline as a calendar (.ics) file · References as APA text · Archive as complete JSON backup
          </p>
        </div>
      </Card>

      {/* Cloud sync status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud size={16} />
            Cloud sync
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-gray-500 mb-3">
          Your work syncs to Supabase when the database is migrated and you are signed in.
          Otherwise everything stays in this browser only.
        </p>
        <Button variant="outline" size="sm" onClick={handleCheckSync} disabled={syncChecking} className="gap-1.5">
          <RefreshCw size={14} className={syncChecking ? 'animate-spin' : ''} />
          {syncChecking ? 'Checking...' : 'Check connection'}
        </Button>
        {sync && (
          <div className="mt-3 space-y-2">
            <div className={`p-2.5 rounded-lg text-xs border ${sync.allOk ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {sync.allOk
                ? `Connected${sync.email ? ` as ${sync.email}` : ''}. All ${sync.tables.length} tables reachable — cloud sync is on.`
                : `Cloud sync is off. ${sync.signedIn ? `Signed in${sync.email ? ` as ${sync.email}` : ''}, but ` : 'Not signed in, and '}some tables are unreachable. Run supabase/schema.sql then supabase/step3-extended.sql in the Supabase SQL editor.`}
            </div>
            <div className="space-y-1">
              {sync.tables.map((tbl) => (
                <div key={tbl.table} className="flex items-start gap-2 text-xs py-1">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${tbl.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="font-mono text-gray-700 shrink-0">{tbl.table}</span>
                  <span className="text-gray-500">{tbl.ok ? 'OK' : tbl.hint}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <BackupSection />

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Trash2 size={16} />
            {t('dangerZone')}
          </CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <button className="w-full flex items-center justify-between py-3 px-2 hover:bg-red-50 rounded-lg transition-colors">
            <span className="text-sm text-red-600">{t('leaveTeam')}</span>
            <ChevronRight size={16} className="text-red-400" />
          </button>
          <button className="w-full flex items-center justify-between py-3 px-2 hover:bg-red-50 rounded-lg transition-colors">
            <span className="text-sm text-red-600">{t('deleteAllData')}</span>
            <ChevronRight size={16} className="text-red-400" />
          </button>
        </div>
      </Card>
    </div>
  );
}
