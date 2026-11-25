import { useCallback } from 'react'
import { useApp } from '../context/AppContext'
import type { AILanguage } from '../types'
import { dictionaries } from './dictionaries'

export type Translate = (key: string, variables?: Record<string, string | number>) => string

export function currentLanguage(): AILanguage {
  try {
    return localStorage.getItem('menya:language') === 'rw' ? 'rw' : 'en'
  } catch {
    return 'en'
  }
}

export function translateCurrent(
  key: string,
  variables?: Record<string, string | number>,
): string {
  return translateText(currentLanguage(), key, variables)
}

export function translateText(
  language: AILanguage,
  key: string,
  variables?: Record<string, string | number>,
): string {
  const template = language === 'rw' ? (dictionaries[key] ?? key) : key
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = variables?.[name]
    return value === undefined ? `{${name}}` : String(value)
  })
}

export function useT(): Translate {
  const { language } = useApp()
  return useCallback(
    (key: string, variables?: Record<string, string | number>) => translateText(language, key, variables),
    [language],
  )
}
