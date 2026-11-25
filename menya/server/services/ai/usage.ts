import { createHash } from 'node:crypto'
import { config } from '../../config'
import type { AIEngine, AIUsage } from './provider'

interface CacheEntry {
  value: unknown
  engine: AIEngine
  usage: AIUsage
  expiresAt: number
}

interface QuotaEntry {
  date: string
  used: number
  resetAt: string
}

interface UsageCounters {
  date: string
  requests: number
  tokens: number
  errors: number
  fallbacks: number
}

export interface QuotaSnapshot {
  limit: number
  used: number
  resetAt: string
}

export interface UsageSnapshot {
  requests: number
  tokens: number
  errors: number
  fallbacks: number
}

export interface CachedAIResult<T> {
  value: T
  engine: AIEngine
  usage: AIUsage
}

export interface RecordAIRequestInput {
  engine: AIEngine
  tokens: number
  error?: boolean
  fallback?: boolean
  errorMessage?: string
}

const responseCache = new Map<string, CacheEntry>()
const quotas = new Map<string, QuotaEntry>()
let lastError: string | null = null
let counters: UsageCounters = {
  date: utcDate(),
  requests: 0,
  tokens: 0,
  errors: 0,
  fallbacks: 0,
}

function utcDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function nextResetAt(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString()
}

function ensureCurrentDay(): void {
  const today = utcDate()
  if (counters.date === today) return
  counters = { date: today, requests: 0, tokens: 0, errors: 0, fallbacks: 0 }
  lastError = null
}

function pruneCache(): void {
  const now = Date.now()
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) responseCache.delete(key)
  }
}

export function makeCacheKey(...parts: unknown[]): string {
  const serialized = JSON.stringify(parts, (_key, value) => (value === undefined ? '__undefined__' : value))
  return createHash('sha256').update(serialized ?? 'null').digest('hex')
}

export function readCached<T>(key: string): CachedAIResult<T> | null {
  pruneCache()
  const entry = responseCache.get(key)
  if (!entry) return null
  return { value: entry.value as T, engine: entry.engine, usage: entry.usage }
}

export function writeCached<T>(key: string, value: T, engine: AIEngine, usage: AIUsage): void {
  const ttl = Number.isFinite(config.ai.cacheTtlMs) ? config.ai.cacheTtlMs : 0
  if (ttl <= 0) return
  responseCache.set(key, {
    value,
    engine,
    usage,
    expiresAt: Date.now() + ttl,
  })
  pruneCache()
}

export function getQuota(userId: string): QuotaSnapshot {
  const limit = Number.isFinite(config.ai.dailyQuota) ? Math.max(0, Math.floor(config.ai.dailyQuota)) : 120
  const entry = quotas.get(userId)
  if (!entry || entry.date !== utcDate()) {
    return { limit, used: 0, resetAt: nextResetAt() }
  }
  return { limit, used: entry.used, resetAt: entry.resetAt }
}

export function reserveQuota(userId: string): boolean {
  const quota = getQuota(userId)
  if (quota.limit > 0 && quota.used >= quota.limit) return false
  quotas.set(userId, {
    date: utcDate(),
    used: quota.used + 1,
    resetAt: quota.resetAt,
  })
  return true
}

export function recordAIRequest(input: RecordAIRequestInput): void {
  ensureCurrentDay()
  counters.requests += 1
  counters.tokens += Number.isFinite(input.tokens) ? Math.max(0, Math.round(input.tokens)) : 0
  if (input.error) counters.errors += 1
  if (input.fallback) counters.fallbacks += 1
  if (input.error && input.errorMessage) {
    lastError = input.errorMessage.replace(/\s+/g, ' ').trim().slice(0, 240)
  }
}

export function getUsageSnapshot(userId: string): {
  cacheEntries: number
  quota: QuotaSnapshot
  usage: UsageSnapshot
  lastError: string | null
} {
  ensureCurrentDay()
  pruneCache()
  return {
    cacheEntries: responseCache.size,
    quota: getQuota(userId),
    usage: {
      requests: counters.requests,
      tokens: counters.tokens,
      errors: counters.errors,
      fallbacks: counters.fallbacks,
    },
    lastError,
  }
}
