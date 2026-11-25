import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Download,
  FileCheck2,
  LibraryBig,
  LogOut,
  Menu,
  MessageCircleQuestion,
  Moon,
  Search,
  Settings2,
  Sparkles,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from '../ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import {
  localizedNavGroups,
  localizedPageTitle,
  localizedRoleLabel,
  roleIcons,
} from '../../data/navigation'
import { resources } from '../../data/mock'
import { useT } from '../../i18n'
import { quickHelpActions, starterPromptsForRole, type QuickHelpId } from '../../lib/ai'
import { cn } from '../../lib/utils'

interface InstallEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const quickHelpIcons: Record<QuickHelpId, LucideIcon> = {
  explain: MessageCircleQuestion,
  quiz: ClipboardCheck,
  plan: CalendarDays,
  check: FileCheck2,
  resources: LibraryBig,
}

const notificationsByRole = {
  student: [
    { id: 1, title: 'Circuit Fundamentals quiz is ready', detail: 'Due today at 5:00 PM', tone: 'amber' as const },
    { id: 2, title: 'MENYA AI found a learning gap', detail: 'Applied calculations · 8-min practice', tone: 'emerald' as const },
    { id: 3, title: 'Trainer feedback received', detail: 'Workshop safety check · 92%', tone: 'info' as const },
  ],
  trainer: [
    { id: 1, title: 'New submissions in your cohort', detail: 'Review queue · 4 waiting', tone: 'amber' as const },
    { id: 2, title: 'AI flagged a mastery gap', detail: 'Applied calculations · targeted practice ready', tone: 'emerald' as const },
    { id: 3, title: 'Cohort check-in suggested', detail: 'Three learners have gone quiet', tone: 'info' as const },
  ],
  reviewer: [
    { id: 1, title: 'Four artifacts await a decision', detail: 'Prioritise safety evidence first', tone: 'amber' as const },
    { id: 2, title: 'Rubric consistency check ready', detail: 'Two decisions need a second look', tone: 'emerald' as const },
    { id: 3, title: 'Median turnaround improved', detail: '18 minutes this week', tone: 'info' as const },
  ],
  admin: [
    { id: 1, title: 'New accounts provisioned', detail: 'Review roles before the next intake', tone: 'amber' as const },
    { id: 2, title: 'AI service healthy', detail: 'Insights and tutoring responding normally', tone: 'emerald' as const },
    { id: 3, title: 'Regional usage report ready', detail: 'Provincial activity is growing', tone: 'info' as const },
  ],
}

export function Topbar() {
  const { theme, toggleTheme, language, setLanguage, setMobileNavOpen, notify, toggleAIDrawer, openAIDrawer, aiDrawerOpen } = useApp()
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const t = useT()
  const searchRef = useRef<HTMLDivElement>(null)
  const aiHelpRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearch, setMobileSearch] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [aiHelpOpen, setAiHelpOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null)

  const page = localizedPageTitle(location.pathname, t)

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchOpen(false)
      if (aiHelpRef.current && !aiHelpRef.current.contains(event.target as Node)) setAiHelpOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  const role = user?.role ?? 'student'
  const notifications = notificationsByRole[role]

  const runQuickHelp = (id: QuickHelpId) => {
    const action = quickHelpActions.find((item) => item.id === id)
    if (!action) return
    setAiHelpOpen(false)
    if (action.tab) {
      navigate(`/ai?tab=${action.tab}&language=${language}&prompt=${encodeURIComponent(t(action.prompt))}`)
      return
    }
    const prompt = action.id === 'explain' ? starterPromptsForRole(role, language)[0] : t(action.prompt)
    openAIDrawer(prompt)
  }

  const suggestions = useMemo(() => {
    const pages = localizedNavGroups(role, t).flatMap((group) => group.items).map((item) => ({
      id: item.to,
      label: item.label,
      detail: role === 'student' ? t('Learning page') : t('{role} workspace', { role: localizedRoleLabel(role, t) }),
      to: item.to,
    }))
    const materials = role === 'student'
      ? resources.map((resource) => ({
          id: resource.id,
          label: resource.title,
          detail: `${resource.type} · ${resource.category}`,
          to: '/resources',
        }))
      : []
    const all = [...pages, ...materials]
    if (!query.trim()) return all.slice(0, 5)
    const term = query.toLowerCase()
    return all.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(term)).slice(0, 6)
  }, [query, role, t])

  const go = (to: string) => {
    navigate(to)
    setQuery('')
    setSearchOpen(false)
    setMobileSearch(false)
  }

  const install = async () => {
    if (!installEvent) {
      notify(t('Install MENYA'), t('Use your browser menu → “Install app” to add MENYA to your device.'), 'info')
      return
    }
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') notify(t('MENYA installed'), t('You can now learn offline from your home screen.'))
    setInstallEvent(null)
  }

  const signOut = async () => {
    await logout()
    setAccountOpen(false)
    navigate('/login', { replace: true })
    notify(t('Signed out'), t('Your learning progress is saved.'), 'info')
  }

  const RoleIcon = roleIcons[user?.role ?? 'student']
  const displayName = user?.name ?? t('MENYA learner')

  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] border-b border-line bg-surface/92 backdrop-blur-xl">
      <div className="flex h-full items-center gap-3 px-4 sm:px-6">
        <button
          className="icon-btn lg:hidden"
          onClick={() => setMobileNavOpen(true)}
          aria-label={t('Open navigation menu')}
        >
          <Menu size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold leading-tight tracking-[-0.01em] sm:text-base">{page.title}</p>
          <p className="hidden truncate text-[11px] text-muted sm:block">{page.description}</p>
        </div>

        {/* Search */}
        <div ref={searchRef} className="relative hidden md:block">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && suggestions[0]) go(suggestions[0].to)
              if (event.key === 'Escape') setSearchOpen(false)
            }}
            placeholder={t('Search your workspace…')}
            aria-label={t('Search MENYA')}
            className="input w-56 py-2 pl-9 lg:w-72"
          />
          {searchOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 z-50 w-[340px] overflow-hidden rounded-card border border-line bg-surface-raised shadow-pop">
              <div className="border-b border-line px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                {query ? t('Search results') : t('Quick access')}
              </div>
              {suggestions.length ? (
                <ul className="max-h-80 overflow-y-auto py-1.5">
                  {suggestions.map((item) => (
                    <li key={item.id}>
                      <button
                        onClick={() => go(item.to)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-alt"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-soft text-emerald">
                          <Search size={14} aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{item.label}</span>
                          <span className="block truncate text-[11px] text-muted">{item.detail}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center text-xs text-muted">{t('No matches. Try a course or skill name.')}</div>
              )}
              <div className="flex items-center gap-1.5 border-t border-line bg-surface-alt px-4 py-2 text-[10px] text-muted">
                <Sparkles size={12} className="text-emerald" aria-hidden /> {t('AI-assisted search across your learning')}
              </div>
            </div>
          )}
        </div>

        <button className="icon-btn md:hidden" onClick={() => setMobileSearch((value) => !value)} aria-label={t('Search')}>
          <Search size={18} />
        </button>

        {/* AI help */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleAIDrawer}
            aria-label={t('Open MENYA AI help')}
            aria-expanded={aiDrawerOpen}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-emerald-solid px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-emerald-solid-hover sm:px-3"
          >
            <Sparkles size={16} aria-hidden />
            <span className="hidden lg:inline">{t('MENYA AI')}</span>
          </button>

          <div ref={aiHelpRef} className="relative">
            <button
              type="button"
              className="icon-btn"
              onClick={() => setAiHelpOpen((value) => !value)}
              aria-label={t('Quick AI help')}
              aria-expanded={aiHelpOpen}
              title={t('Quick AI help')}
            >
              <MessageCircleQuestion size={17} aria-hidden />
            </button>
            {aiHelpOpen && (
              <div
                role="menu"
                aria-label={t('Quick AI help actions')}
                className="absolute top-[calc(100%+10px)] right-0 z-50 w-56 overflow-hidden rounded-card border border-line bg-surface-raised p-1.5 shadow-pop"
              >
                <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">{t('Quick help')}</p>
                {quickHelpActions.map((action) => {
                  const Icon = quickHelpIcons[action.id]
                  return (
                    <button
                      key={action.id}
                      type="button"
                      role="menuitem"
                      onClick={() => runQuickHelp(action.id)}
                      title={t(action.label)}
                      className="flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left text-[12px] font-medium text-muted transition-colors hover:bg-surface-alt hover:text-ink"
                    >
                      <Icon size={15} className="shrink-0 text-emerald" aria-hidden />
                      {t(action.label)}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="hidden h-6 w-px bg-line sm:block" />

        <div
          className="hidden items-center rounded-[10px] border border-line bg-surface-alt p-0.5 sm:flex"
          role="group"
          aria-label={t('System language')}
        >
          {(['en', 'rw'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLanguage(option)}
              aria-pressed={language === option}
              title={t(option === 'en' ? 'English' : 'Kinyarwanda')}
              className={cn(
                'rounded-[8px] px-2 py-1 text-[10px] font-bold tracking-wide transition-colors',
                language === option
                  ? 'bg-emerald-solid text-white shadow-sm'
                  : 'text-muted hover:text-ink',
              )}
            >
              {option === 'en' ? 'EN' : 'RW'}
            </button>
          ))}
        </div>

        <button onClick={install} className="icon-btn hidden sm:inline-flex" title={t('Install MENYA')} aria-label={t('Install MENYA app')}>
          <Download size={17} />
        </button>

        <button
          onClick={toggleTheme}
          className="icon-btn"
          title={t(theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme')}
          aria-label={t('Toggle colour theme')}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            className="icon-btn relative"
            onClick={() => {
              setNotificationsOpen((value) => !value)
              setAccountOpen(false)
            }}
            aria-label={t('Notifications, {count} unread', { count: notifications.length })}
            aria-expanded={notificationsOpen}
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber ring-2 ring-surface" />
          </button>
          {notificationsOpen && (
            <div className="absolute top-[calc(100%+10px)] right-0 z-50 w-[330px] overflow-hidden rounded-card border border-line bg-surface-raised shadow-pop">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-sm font-bold">{t('Notifications')}</span>
                <button
                  className="text-[11px] font-semibold text-emerald"
                  onClick={() => {
                    setNotificationsOpen(false)
                    notify(t('All caught up'), t('Notifications marked as read.'), 'info')
                  }}
                >
                  {t('Mark all read')}
                </button>
              </div>
              <ul className="divide-y divide-line/70">
                {notifications.map((item) => (
                  <li key={item.id} className="flex gap-3 px-4 py-3 hover:bg-surface-alt/60">
                    <span
                      className={cn(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        item.tone === 'amber' ? 'bg-amber' : item.tone === 'emerald' ? 'bg-emerald' : 'bg-info',
                      )}
                    />
                    <div>
                      <p className="text-[13px] font-semibold leading-snug">{t(item.title)}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{t(item.detail)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="relative">
          <button
            onClick={() => {
              setAccountOpen((value) => !value)
              setNotificationsOpen(false)
            }}
            className="flex items-center gap-2 rounded-[11px] border border-line bg-surface py-1 pr-2 pl-1 transition-colors hover:border-line-strong"
            aria-label={t('Account menu')}
            aria-expanded={accountOpen}
          >
            <Avatar name={displayName} size="sm" />
            <span className="hidden text-left lg:block">
              <span className="block text-[11px] font-bold leading-tight">{displayName.split(' ')[0]}</span>
              <span className="block text-[10px] leading-tight text-muted">
                {user ? localizedRoleLabel(user.role, t) : t('Signed out')}
              </span>
            </span>
            <ChevronDown size={14} className="text-muted" />
          </button>
          {accountOpen && user && (
            <div className="absolute top-[calc(100%+10px)] right-0 z-50 w-64 overflow-hidden rounded-card border border-line bg-surface-raised p-1.5 shadow-pop">
              <div className="px-3 py-2.5">
                <p className="truncate text-[13px] font-bold">{user.name}</p>
                <p className="truncate text-[11px] text-muted">{user.email}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2 py-1 text-[10px] font-bold text-emerald-dark dark:text-emerald">
                  <RoleIcon size={12} aria-hidden /> {localizedRoleLabel(user.role, t)}
                </span>
              </div>
              <div className="border-t border-line px-3 py-2.5">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted">{t('System language')}</p>
                <div className="flex gap-1.5" role="group" aria-label={t('System language')}>
                  {(['en', 'rw'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLanguage(option)}
                      aria-pressed={language === option}
                      className={cn(
                        'flex-1 rounded-[8px] border px-2 py-1.5 text-[11px] font-bold transition-colors',
                        language === option
                          ? 'border-emerald bg-emerald-soft text-emerald-dark dark:text-emerald'
                          : 'border-line text-muted hover:text-ink',
                      )}
                    >
                      {t(option === 'en' ? 'English' : 'Kinyarwanda')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-line pt-1">
                <button
                  onClick={() => {
                    setAccountOpen(false)
                    navigate('/settings')
                  }}
                  className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-surface-alt"
                >
                  <Settings2 size={15} className="text-muted" aria-hidden /> {t('Preferences')}
                </button>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-[9px] px-3 py-2.5 text-left text-[13px] font-medium text-danger transition-colors hover:bg-danger-soft"
                >
                  <LogOut size={15} aria-hidden /> {t('Sign out')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {mobileSearch && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-surface p-3 shadow-card md:hidden">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && suggestions[0]) go(suggestions[0].to)
                if (event.key === 'Escape') setMobileSearch(false)
              }}
              placeholder={t('Search your workspace…')}
              className="input pl-9"
            />
            <button className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-muted" onClick={() => setMobileSearch(false)} aria-label={t('Close search')}>
              <X size={16} />
            </button>
          </div>
          {query && (
            <ul className="mt-2 space-y-1">
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button onClick={() => go(item.to)} className="w-full rounded-lg px-3 py-2 text-left text-[13px] hover:bg-surface-alt">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </header>
  )
}
