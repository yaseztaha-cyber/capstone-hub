'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Users, Plus, ArrowRight, ArrowLeft, Check } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { createTeamAction, joinTeamAction, logout } = useAppStore();
  const { t } = useTranslations();
  const [step, setStep] = useState(0);
  const [action, setAction] = useState<'choose' | 'create' | 'join'>('choose');
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [semester, setSemester] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const friendlyError = (m: string) =>
    /row-level security|violates row-level|RLS/i.test(m)
      ? 'Database blocked team creation (missing RLS policy on "teams"). Try again — an offline workspace will be created so you can continue.'
      : m;

  const handleCreateTeam = async () => {
    if (!teamName.trim() || !projectName.trim()) return;
    setError('');
    setLoading(true);
    try {
      await createTeamAction(teamName, projectName, { school, semester, grade });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(friendlyError(err instanceof Error ? err.message : 'Failed to create team'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try { await logout(); } catch {}
    router.push('/auth/login');
  };

  const handleJoinTeam = async () => {
    if (joinCode.length < 4) return;
    setError('');
    setLoading(true);
    try {
      await joinTeamAction(joinCode);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Team not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-white text-lg font-bold">S</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('welcomeToSTEM')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('getStarted')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </div>
        )}

        {step === 0 && action === 'choose' && (
          <div className="space-y-3">
            <button
              onClick={() => setAction('create')}
              className="w-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-lg flex items-center justify-center group-hover:bg-teal-200 dark:group-hover:bg-teal-900/50 transition-colors">
                  <Plus size={18} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('createTeam')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('getStarted')}</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setAction('join')}
              className="w-full p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Users size={18} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('joinTeam')}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('orJoinTeam')}</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {step === 0 && action === 'create' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('createTeam')}</h2>
            <div className="space-y-3">
              <Input label={t('teamName')} placeholder="e.g., Team 7" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
              <Input label={t('projectName')} placeholder="e.g., Low-Cost Water Quality Monitor" value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
              <Input label="School (optional)" placeholder="e.g., STEM Gharbiya" value={school} onChange={(e) => setSchool(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Grade (optional)" placeholder="e.g., 11" value={grade} onChange={(e) => setGrade(e.target.value)} />
                <Input label="Semester (optional)" placeholder="e.g., Fall 2025" value={semester} onChange={(e) => setSemester(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setAction('choose')} className="flex-1 gap-1.5">
                  <ArrowLeft size={14} /> {t('back')}
                </Button>
                <Button onClick={handleCreateTeam} disabled={!teamName.trim() || !projectName.trim() || loading} className="flex-1 gap-1.5">
                  {loading ? t('loading') : <><Check size={14} /> {t('createTeamBtn')}</>}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 0 && action === 'join' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('joinTeam')}</h2>
            <div className="space-y-3">
              <Input label={t('teamCode')} placeholder="XXXXXX" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} required />
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setAction('choose')} className="flex-1 gap-1.5">
                  <ArrowLeft size={14} /> {t('back')}
                </Button>
                <Button onClick={handleJoinTeam} disabled={joinCode.length < 4 || loading} className="flex-1 gap-1.5">
                  {loading ? t('loading') : <>{t('joinTeamBtn')} <ArrowRight size={14} /></>}
                </Button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          <button type="button" onClick={handleSignOut} className="text-teal-700 dark:text-teal-400 hover:underline font-medium">
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
}