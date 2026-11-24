'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { currentUser, onboarded, loading } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.push('/auth/login');
    } else if (onboarded) {
      router.push('/dashboard');
    } else {
      router.push('/onboarding');
    }
  }, [currentUser, onboarded, loading, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 bg-teal-700 rounded-lg flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-lg font-bold">S</span>
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
