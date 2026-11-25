import { z } from 'zod'
import type { AILanguage, Role } from '../../types'

const navigateActionSchema = z.object({
  type: z.literal('navigate'),
  to: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(80),
})

const themeActionSchema = z.object({
  type: z.literal('setTheme'),
  theme: z.enum(['light', 'dark']),
  label: z.string().trim().min(1).max(80),
})

const notifyActionSchema = z.object({
  type: z.literal('notify'),
  title: z.string().trim().min(1).max(120),
  message: z.string().trim().max(300).optional(),
  tone: z.enum(['success', 'info', 'error']).optional(),
  label: z.string().trim().min(1).max(80),
})

const actionSchema = z.discriminatedUnion('type', [
  navigateActionSchema,
  themeActionSchema,
  notifyActionSchema,
])

export type AIAction = z.infer<typeof actionSchema>

const roleRoutes: Record<Role, readonly string[]> = {
  student: [
    '/dashboard',
    '/workspace',
    '/curriculum',
    '/resources',
    '/assessments',
    '/analytics',
    '/planner',
    '/ai',
    '/settings',
  ],
  trainer: ['/trainer', '/trainer/cohorts', '/trainer/courses', '/trainer/reviews', '/ai', '/settings'],
  reviewer: ['/reviewer', '/reviewer/queue', '/reviewer/history', '/ai', '/settings'],
  admin: ['/admin', '/admin/users', '/admin/courses', '/admin/settings', '/ai', '/settings'],
}

const intentRoutes: Record<Role, Record<string, string>> = {
  student: {
    tutor: '/workspace',
    assessment: '/assessments',
    evaluation: '/workspace',
    planning: '/planner',
    resource: '/resources',
    analytics: '/analytics',
    dashboard: '/dashboard',
  },
  trainer: {
    tutor: '/trainer',
    assessment: '/trainer/courses',
    evaluation: '/trainer/reviews',
    planning: '/trainer/cohorts',
    resource: '/ai',
    analytics: '/trainer',
    dashboard: '/trainer',
  },
  reviewer: {
    tutor: '/ai',
    assessment: '/reviewer/queue',
    evaluation: '/reviewer/queue',
    planning: '/reviewer',
    resource: '/ai',
    analytics: '/reviewer/history',
    dashboard: '/reviewer',
  },
  admin: {
    tutor: '/ai',
    assessment: '/admin/courses',
    evaluation: '/admin/settings',
    planning: '/admin',
    resource: '/ai',
    analytics: '/admin',
    dashboard: '/admin',
  },
}

const labels: Record<AILanguage, Record<string, string>> = {
  en: {
    tutor: 'Open learning workspace',
    assessment: 'Open assessment centre',
    evaluation: 'Open my work',
    planning: 'Open study planner',
    resource: 'Open resource library',
    analytics: 'Open analytics',
    dashboard: 'Open overview',
  },
  rw: {
    tutor: 'Fungura aho biga',
    assessment: 'Fungura ibizamini',
    evaluation: 'Fungura akazi kanjye',
    planning: 'Fungura gahunda yo kwiga',
    resource: 'Fungura ibikoresho',
    analytics: 'Fungura imibare',
    dashboard: 'Fungura incamake',
  },
}

function normalizeRoute(value: string): string {
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return ''
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '')
  return withoutTrailingSlash || '/'
}

export function allowedRoutesForRole(role: Role): string[] {
  return [...roleRoutes[role]]
}

export function validateAIActions(value: unknown, role: Role): AIAction[] {
  if (!Array.isArray(value)) return []
  const routes = new Set(roleRoutes[role])
  const actions: AIAction[] = []

  for (const candidate of value.slice(0, 4)) {
    const parsed = actionSchema.safeParse(candidate)
    if (!parsed.success) continue
    const action = parsed.data
    if (action.type === 'navigate') {
      const to = normalizeRoute(action.to)
      if (!routes.has(to)) continue
      actions.push({ ...action, to })
      continue
    }
    actions.push(action)
  }

  return actions
}

export function suggestedActions(role: Role, intent: string, language: AILanguage): AIAction[] {
  const key = intent in intentRoutes[role] ? intent : 'dashboard'
  const to = intentRoutes[role][key]
  const label = labels[language][key] ?? labels[language].dashboard
  return validateAIActions([{ type: 'navigate', to, label }], role)
}
