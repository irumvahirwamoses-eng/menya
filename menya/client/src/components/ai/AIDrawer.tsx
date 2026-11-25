import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  LibraryBig,
  MessageCircleQuestion,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AITutorPanel } from './AITutorPanel'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { localizedWorkspace } from '../../data/navigation'
import { useT } from '../../i18n'
import { quickHelpActions, starterPromptsForRole, type QuickHelpId } from '../../lib/ai'
import type { Role } from '../../types'

const quickHelpIcons: Record<QuickHelpId, LucideIcon> = {
  explain: MessageCircleQuestion,
  quiz: ClipboardCheck,
  plan: CalendarDays,
  check: FileCheck2,
  resources: LibraryBig,
}

export function AIDrawer() {
  const { aiDrawerOpen, aiDrawerPrompt, openAIDrawer, closeAIDrawer, language, setLanguage } = useApp()
  const { user } = useAuth()
  const t = useT()
  const navigate = useNavigate()
  const role: Role = user?.role ?? 'student'
  const workspace = localizedWorkspace(role, t)

  useEffect(() => {
    if (!aiDrawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAIDrawer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [aiDrawerOpen, closeAIDrawer])

  if (!aiDrawerOpen) return null

  const runQuickHelp = (id: QuickHelpId) => {
    const action = quickHelpActions.find((item) => item.id === id)
    if (!action) return
    if (action.tab) {
      closeAIDrawer()
      navigate(`/ai?tab=${action.tab}&language=${language}&prompt=${encodeURIComponent(t(action.prompt))}`)
      return
    }
    const prompt = action.id === 'explain' ? starterPromptsForRole(role, language)[0] : t(action.prompt)
    openAIDrawer(prompt)
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[65] bg-[#07111f]/55 backdrop-blur-[2px]"
        aria-label={t('Close MENYA AI help')}
        onClick={closeAIDrawer}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-drawer-title"
        className="animate-fade-up fixed inset-x-0 bottom-0 z-[70] flex h-[86dvh] flex-col overflow-hidden rounded-t-[22px] border border-line bg-surface shadow-pop sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-[min(430px,100vw)] sm:rounded-none sm:rounded-l-[22px]"
      >
        <div className="shrink-0 border-b border-line bg-surface px-4 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow text-emerald">{t('MENYA AI')}</p>
              <h2 id="ai-drawer-title" className="mt-1 truncate text-[15px] font-bold">
                {workspace.label}
              </h2>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">{workspace.description}</p>
            </div>
            <button type="button" className="icon-btn" onClick={closeAIDrawer} aria-label={t('Close AI help drawer')}>
              <X size={17} aria-hidden />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-5 gap-1" aria-label={t('Quick AI help')}>
            {quickHelpActions.map((action) => {
              const Icon = quickHelpIcons[action.id]
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => runQuickHelp(action.id)}
                  title={t(action.label)}
                  aria-label={t('AI quick help: {label}', { label: t(action.label) })}
                  className="flex flex-col items-center gap-1 rounded-[10px] border border-line bg-surface-alt px-1 py-2 text-[9px] font-semibold text-muted transition-colors hover:border-emerald/40 hover:text-emerald"
                >
                  <Icon size={15} aria-hidden />
                  <span className="truncate">{t(action.label)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 p-2.5 sm:p-3">
          <AITutorPanel
            key={`${language}:${aiDrawerPrompt ?? 'ai-drawer-welcome'}`}
            lessonTitle={workspace.label}
            context={workspace.label}
            initialMessage={aiDrawerPrompt ?? undefined}
            initialTask="tutor"
            language={language}
            onLanguageChange={setLanguage}
            role={role}
            compact
          />
        </div>
      </aside>
    </>
  )
}
