'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { useTranslations } from '@/lib/useTranslations';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAppStore();
  const { t } = useTranslations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError('Enter email and password'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      await login('demo@stem.edu.eg', 'demo123');
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-teal-700 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">STEM Capstone Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('signInToWorkspace')}</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4 shadow-sm">
          {error && <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-700 dark:text-red-300">{error}</div>}
          <Input label={t('email')} type="email" placeholder="you@stem.edu.eg" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          <div className="space-y-1">
            <Input label={t('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 mt-1">{showPw ? 'Hide' : 'Show'} password</button>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? t('loading') : t('signIn')}</Button>
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
            <div className="relative flex justify-center"><span className="bg-white dark:bg-gray-900 px-2 text-xs text-gray-500">or</span></div>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleDemo} disabled={loading}>Continue as Demo</Button>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">Demo uses offline mode — no account needed</p>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          {t('dontHaveAccount')} <Link href="/auth/register" className="text-teal-700 dark:text-teal-400 hover:underline font-medium">{t('signUp')}</Link>
        </p>
      </div>
    </div>
  );
}
