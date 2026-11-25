export const ROLES = ['student', 'trainer', 'reviewer', 'admin'] as const
export type Role = (typeof ROLES)[number]
export type AILanguage = 'en' | 'rw'
export type AITask = 'general' | 'tutor' | 'assessment' | 'evaluation' | 'planning' | 'resource'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
}

export const ACCESS_TOKEN_TTL = '15m'
export const REFRESH_TOKEN_TTL = '7d'
export const REFRESH_COOKIE = 'menya_refresh'
