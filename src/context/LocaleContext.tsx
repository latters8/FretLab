import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ru, type LocaleDict } from '../locales/ru';
import { en } from '../locales/en';

export type Locale = 'ru' | 'en';

const DICTS: Record<Locale, LocaleDict> = { ru, en };

interface LocaleContextValue {
  locale: Locale;
  t: LocaleDict;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = 'fretlab_locale';

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ru' || stored === 'en') return stored;
  } catch {}
  return 'ru';
}

// Accesses a nested path like "soloGenerator.play", returns value or English fallback
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? path;
}

function buildT(dict: LocaleDict, enDict: LocaleDict): LocaleDict {
  // Return a proxy that falls back to English for missing keys
  return new Proxy(dict, {
    get(target, ns: string) {
      if (ns in target) return target[ns as keyof LocaleDict];
      if (ns in enDict) return enDict[ns as keyof LocaleDict];
      return undefined;
    },
  });
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ru' ? 'en' : 'ru');
  }, [locale, setLocale]);

  const t = buildT(DICTS[locale], DICTS.en);

  return (
    <LocaleContext.Provider value={{ locale, t, setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useTranslation(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useTranslation must be used within LocaleProvider');
  return ctx;
}
