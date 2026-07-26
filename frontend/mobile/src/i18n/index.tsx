import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, type Locale, type Translations } from './translations';

export const LOCALE_KEY = 'app_locale';
export const SUPPORTED_LOCALES: Locale[] = ['tr', 'en'];
const DEFAULT_LOCALE: Locale = 'tr';

/** Dot-path into the catalogue, e.g. 'common.save'. */
type Leaves<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<Translations>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: async () => {},
  t: (key) => key,
});

export function useI18n() {
  return useContext(I18nContext);
}

/** Convenience for components that only need the translate function. */
export function useTranslation() {
  return useI18n().t;
}

function resolve(catalogue: Translations, key: string): string | undefined {
  return key.split('.').reduce<unknown>(
    (acc, part) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined),
    catalogue
  ) as string | undefined;
}

function deviceLocale(): Locale {
  try {
    const tag = Localization.getLocales()[0]?.languageCode ?? DEFAULT_LOCALE;
    return (SUPPORTED_LOCALES as string[]).includes(tag) ? (tag as Locale) : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LOCALE_KEY);
        if (saved && (SUPPORTED_LOCALES as string[]).includes(saved)) {
          setLocaleState(saved as Locale);
          return;
        }
      } catch {
        /* fall through to the device language */
      }
      setLocaleState(deviceLocale());
    })();
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    try {
      await AsyncStorage.setItem(LOCALE_KEY, next);
    } catch {
      /* the choice still applies for this session */
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      // Fall back to Turkish, then to the key itself, so a missing string is
      // always visible rather than rendering as blank.
      const value = resolve(translations[locale], key) ?? resolve(translations.tr, key) ?? key;
      if (!vars) return value;
      return Object.entries(vars).reduce(
        (out, [name, replacement]) => out.replace(new RegExp(`\\{${name}\\}`, 'g'), String(replacement)),
        value
      );
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
