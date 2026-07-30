'use client'

import { useCallback } from 'react'

import locales, { localeNames } from '../../locales'

const DEFAULT_LOCALE = 'en-US'

function detectLocale(): keyof typeof locales {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const lang = navigator.language
  if (lang in locales) return lang as keyof typeof locales
  const short = lang.split('-')[0]
  const match = Object.keys(localeNames).find((l) => l.startsWith(short + '-'))
  return (match as keyof typeof locales) ?? DEFAULT_LOCALE
}

export function useTranslation(scope?: string) {
  return useCallback(
    (key: string) => {
      const locale = detectLocale()
      const table = locales[locale] ?? locales[DEFAULT_LOCALE]
      // @ts-ignore
      return table[scope ? `${scope}.${key}` : key] as string
    },
    [scope],
  )
}
