import {
  BookOpenCheck,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  Compass,
  GraduationCap,
  History,
  LayoutDashboard,
  LibraryBig,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserCog,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import type { Translate } from '../i18n'
import type { Role } from '../types'


export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const preferences: NavItem = { to: '/settings', label: 'Preferences', icon: Settings2 }
const aiAssistant: NavItem = { to: '/ai', label: 'MENYA AI', icon: Sparkles }
const intelligence: NavGroup = { label: 'Intelligence', items: [aiAssistant] }

const learningNav: NavGroup[] = [
  {
    label: 'Learning',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/workspace', label: 'Learning workspace', icon: BookOpenCheck },
      { to: '/curriculum', label: 'Curriculum explorer', icon: Compass },
      { to: '/resources', label: 'Resource library', icon: LibraryBig },
      { to: '/assessments', label: 'Assessment centre', icon: ClipboardCheck, badge: '1' },
      { to: '/analytics', label: 'Progress & analytics', icon: ChartNoAxesCombined },
      { to: '/planner', label: 'Study planner', icon: CalendarDays },
    ],
  },
  intelligence,
  { label: 'Account', items: [preferences] },
]

const trainerNav: NavGroup[] = [
  {
    label: 'Trainer workspace',
    items: [
      { to: '/trainer', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/trainer/cohorts', label: 'Cohort learners', icon: UsersRound },
      { to: '/trainer/courses', label: 'Course oversight', icon: BookOpenCheck },
      { to: '/trainer/reviews', label: 'Submission oversight', icon: ClipboardCheck, badge: '4' },
    ],
  },
  intelligence,
  { label: 'Account', items: [preferences] },
]

const reviewerNav: NavGroup[] = [
  {
    label: 'Review workspace',
    items: [
      { to: '/reviewer', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/reviewer/queue', label: 'Review queue', icon: ClipboardCheck, badge: '4' },
      { to: '/reviewer/history', label: 'Decision history', icon: History },
    ],
  },
  intelligence,
  { label: 'Account', items: [preferences] },
]

const adminNav: NavGroup[] = [
  {
    label: 'Administration',
    items: [
      { to: '/admin', label: 'Platform overview', icon: LayoutDashboard },
      { to: '/admin/users', label: 'Users & access', icon: UserCog },
      { to: '/admin/courses', label: 'Course catalogue', icon: BookOpenCheck },
      { to: '/admin/settings', label: 'Platform settings', icon: Settings2 },
    ],
  },
  intelligence,
  { label: 'Account', items: [preferences] },
]

export function navGroupsForRole(role: Role): NavGroup[] {
  if (role === 'trainer') return trainerNav
  if (role === 'reviewer') return reviewerNav
  if (role === 'admin') return adminNav
  return learningNav
}

export const roleHome: Record<Role, string> = {
  student: '/dashboard',
  trainer: '/trainer',
  reviewer: '/reviewer',
  admin: '/admin',
}

export const roleWorkspaces: Record<Role, { label: string; description: string }> = {
  student: {
    label: 'Learning workspace',
    description: 'Your MENYA AI tutor follows each lesson and adapts to your answers.',
  },
  trainer: {
    label: 'Trainer workspace',
    description: 'MENYA AI copilots surface cohort gaps, course mastery and submission patterns.',
  },
  reviewer: {
    label: 'Quality workspace',
    description: 'MENYA AI copilots check consistency against the shared assessment rubric.',
  },
  admin: {
    label: 'Operations workspace',
    description: 'MENYA AI copilots summarise platform health, access and course coverage.',
  },
}

export const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Overview', description: 'Your learning at a glance' },
  '/workspace': { title: 'Learning workspace', description: 'Curriculum, lesson and AI tutor in one place' },
  '/curriculum': { title: 'Curriculum explorer', description: 'Find the right path for your goal' },
  '/resources': { title: 'Resource library', description: 'Curated learning materials for your trade' },
  '/assessments': { title: 'Assessment centre', description: 'Demonstrate what you can do' },
  '/analytics': { title: 'Progress & analytics', description: 'Understand how you are growing' },
  '/planner': { title: 'Study planner', description: 'Build a routine that fits your week' },
  '/ai': { title: 'MENYA AI', description: 'Your intelligent assistant for this workspace' },
  '/trainer': { title: 'Trainer dashboard', description: 'Cohort health and teaching priorities' },
  '/trainer/cohorts': { title: 'Cohort learners', description: 'See who needs encouragement and follow-up' },
  '/trainer/courses': { title: 'Course oversight', description: 'Mastery and coverage across your learning paths' },
  '/trainer/reviews': { title: 'Submission oversight', description: 'Track learner evidence waiting for feedback' },
  '/reviewer': { title: 'Reviewer dashboard', description: 'Quality signals and queue priorities' },
  '/reviewer/queue': { title: 'Review queue', description: 'Assess evidence against clear criteria' },
  '/reviewer/history': { title: 'Decision history', description: 'Keep feedback consistent and traceable' },
  '/admin': { title: 'Platform overview', description: 'Platform health, access and regional activity' },
  '/admin/users': { title: 'Users & access', description: 'Manage roles and account status' },
  '/admin/courses': { title: 'Course catalogue', description: 'Oversee learning paths across every trade' },
  '/admin/settings': { title: 'Platform settings', description: 'Service health and AI configuration' },
  '/settings': { title: 'Preferences', description: 'Theme, profile and notification settings' },
}

export const roleLabels: Record<Role, string> = {
  student: 'Student',
  trainer: 'Teacher / trainer',
  reviewer: 'Reviewer',
  admin: 'Administrator',
}

export const roleIcons: Record<Role, LucideIcon> = {
  student: GraduationCap,
  trainer: UsersRound,
  reviewer: ClipboardCheck,
  admin: ShieldCheck,
}

export function localizedNavGroups(role: Role, t: Translate): NavGroup[] {
  return navGroupsForRole(role).map((group) => ({
    ...group,
    label: t(group.label),
    items: group.items.map((item) => ({
      ...item,
      label: t(item.label),
      badge: item.badge && !/^\d+$/.test(item.badge) ? t(item.badge) : item.badge,
    })),
  }))
}

export function localizedRoleLabel(role: Role, t: Translate): string {
  return t(roleLabels[role])
}

export function localizedWorkspace(role: Role, t: Translate): { label: string; description: string } {
  const workspace = roleWorkspaces[role]
  return { label: t(workspace.label), description: t(workspace.description) }
}

export function localizedPageTitle(
  path: string,
  t: Translate,
): { title: string; description: string } {
  const page = pageTitles[path] ?? { title: 'MENYA', description: 'Learn with intelligence' }
  return { title: t(page.title), description: t(page.description) }
}
