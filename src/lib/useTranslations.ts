'use client';

import { useAppStore } from '@/lib/store';
import { translations, type TranslationKey } from '@/lib/translations';

export function useTranslations() {
  const locale = useAppStore(s => s.locale);

  const t = (key: TranslationKey): string => {
    return translations[locale][key] || translations.en[key] || key;
  };

  return { t, locale, isRTL: locale === 'ar' };
}
