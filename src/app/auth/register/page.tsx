'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/supabase/queries';
import { useTranslations } from '@/lib/useTranslations';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      router.push('/onboarding');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-teal-700 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">S</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">{t('createAccount')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('getStarted')}</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
          )}
          <Input label={t('fullName')} placeholder="Ahmed Hassan" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input label={t('email')} type="email" placeholder="you@stem.edu.eg" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label={t('password')} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('loading') : t('createAccount')}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/auth/login" className="text-teal-700 hover:underline font-medium">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
}
