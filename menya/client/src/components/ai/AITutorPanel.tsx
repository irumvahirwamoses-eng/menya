import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUp,
  BookOpen,
  Lightbulb,
  ListChecks,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { Badge, Toggle } from '../ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { translateText, useT } from '../../i18n'
import { apiClient } from '../../lib/api'
import {
  exercisesForRole,
  runAIAction,
  starterPromptsForRole,
  type AIActionContext,
} from '../../lib/ai'
import { cn } from '../../lib/utils'
import type {
  AIAction,
  AILanguage,
  AIHistoryMessage,
  AISource,
  AITutorResponse,
  AITutorTask,
  Role,
} from '../../types'

interface Message {
  id: number
  role: 'ai' | 'user'
  text: string
  sources?: AISource[]
  actions?: AIAction[]
  notice?: string
}

export interface AITutorPanelProps {
  lessonTitle: string
  context?: string
  title?: string
  prompts?: string[]
  exercises?: string[]
  role?: Role
  initialMessage?: string
  initialTask?: AITutorTask
  language?: AILanguage
  /** Lets the host page mirror a language switch in its URL. */
  onLanguageChange?: (language: AILanguage) => void
  simpleMode?: boolean
  compact?: boolean
}

const roleTitles: Record<Role, string> = {
  student: 'MENYA AI Tutor',
  trainer: 'MENYA AI Trainer Copilot',
  reviewer: 'MENYA AI Review Copilot',
  admin: 'MENYA AI Operations Copilot',
}

/** Renders approved source references exactly as `[S1] Title`. */
export function AISourceChips({ sources }: { sources: AISource[] }) {
  if (!sources.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {sources.map((source) => (
        <span
          key={source.id}
          className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-medium text-muted"
        >
          [{source.id}] {source.title}
        </span>
      ))}
    </div>
  )
}

/** Renders only server-validated actions using the shared safe runner. */
export function AIActionButtons({
  actions,
  context,
}: {
  actions: AIAction[]
  context: AIActionContext
}) {
  if (!actions.length) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {actions.map((action, index) => (
        <button
          key={`${action.type}-${index}`}
          type="button"
          onClick={() => runAIAction(action, context)}
          className="rounded-lg border border-emerald/35 bg-emerald-soft px-2.5 py-1 text-[10px] font-semibold text-emerald-dark transition-colors hover:border-emerald/70 dark:text-emerald"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}

function greeting(role: Role, lessonTitle: string, language: AILanguage): string {
  const key = role === 'student'
    ? 'I am following your lesson on “{lessonTitle}”. Ask me anything, or use a prompt below. I can simplify a concept, give a hint, or create practice questions.'
    : 'I am reading your {lessonTitle} workspace. Ask me about patterns, priorities or next steps and I will answer from your {role} view.'
  return translateText(language, key, { lessonTitle, role })
}

export function AITutorPanel({
  lessonTitle,
  context,
  title,
  prompts,
  exercises,
  role: roleOverride,
  initialMessage,
  initialTask = 'tutor',
  language,
  onLanguageChange,
  simpleMode: initialSimpleMode,
  compact = false,
}: AITutorPanelProps) {
  const t = useT()
  const { user } = useAuth()
  const { setTheme, notify, language: appLanguage, setLanguage } = useApp()
  const navigate = useNavigate()
  const role = roleOverride ?? user?.role ?? 'student'
  const contextLabel = context ?? lessonTitle
  const activeLanguage = language ?? appLanguage
  const changeLanguage = (next: AILanguage) => {
    if (onLanguageChange) onLanguageChange(next)
    else setLanguage(next)
  }
  const defaultPrompts = prompts ?? starterPromptsForRole(role, activeLanguage)
  const defaultExercises = exercises ?? exercisesForRole(role, activeLanguage)
  const promptsKey = `${defaultPrompts.join('|')}::${activeLanguage}`
  const [promptState, setPromptState] = useState({ key: promptsKey, prompts: defaultPrompts })
  const activePrompts = promptState.key === promptsKey ? promptState.prompts : defaultPrompts
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'ai', text: greeting(role, contextLabel, activeLanguage) },
  ])
  const [input, setInput] = useState(initialMessage ?? '')
  const [thinking, setThinking] = useState(false)
  const [simpleMode, setSimpleMode] = useState(initialSimpleMode ?? false)
  const endRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(2)
  const actionContext: AIActionContext = { navigate, setTheme, notify }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, thinking])

  const send = async (text: string) => {
    const value = text.trim()
    if (!value || thinking) return

    const userId = nextId.current++
    const history: AIHistoryMessage[] = messages.slice(-8).map((message) => ({
      role: message.role,
      text: message.text,
    }))

    setInput('')
    setMessages((current) => [...current, { id: userId, role: 'user', text: value }])
    setThinking(true)

    try {
      const response = await apiClient.post<AITutorResponse>('/ai/tutor', {
        message: value,
        context: contextLabel,
        simpleMode,
        language: activeLanguage,
        task: initialTask,
        history,
      })
      if (response.prompts?.length) setPromptState({ key: promptsKey, prompts: response.prompts })
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'ai',
          text: response.reply,
          sources: response.sources ?? [],
          actions: response.actions ?? [],
          notice: response.notice,
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'ai',
          text: translateText(
            activeLanguage,
            'I could not reach the MENYA AI service just now. Please try again in a moment.',
          ),
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }

  const visiblePrompts = compact ? activePrompts.slice(0, 3) : activePrompts

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className={cn('shrink-0 border-b border-line', compact ? 'px-3 py-2.5' : 'px-4 py-3.5')}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className={cn('flex items-center justify-center rounded-xl bg-emerald-soft text-emerald', compact ? 'h-8 w-8' : 'h-9 w-9')}>
              <Sparkles size={compact ? 15 : 17} aria-hidden />
            </span>
            <div>
              <p className="text-[13px] font-bold leading-tight">{t(title ?? roleTitles[role])}</p>
              <p className="flex items-center gap-1.5 text-[10px] text-muted">
                <span className="soft-pulse h-1.5 w-1.5 rounded-full bg-emerald" /> {t('Context aware · server backed')}
              </p>
            </div>
          </div>
          <Badge tone="emerald" dot>{t('Live')}</Badge>
        </div>
        <div className={cn('mt-3 flex items-center justify-between gap-2 rounded-[10px] bg-surface-alt', compact ? 'px-2.5 py-1.5' : 'px-3 py-2')}>
          <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
            <BookOpen size={12} className="shrink-0" aria-hidden />
            <span className="truncate">{t(contextLabel)}</span>
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 rounded-[10px] bg-surface-alt px-2.5 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('Language')}</span>
          <div className="inline-flex rounded-lg border border-line bg-surface p-0.5" role="group" aria-label={t('AI response language')}>
            {(['en', 'rw'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changeLanguage(option)}
                aria-pressed={activeLanguage === option}
                className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors',
                  activeLanguage === option
                    ? 'bg-emerald-soft text-emerald-dark dark:text-emerald'
                    : 'text-muted hover:text-ink',
                )}
              >
                {t(option === 'en' ? 'English' : 'Kinyarwanda')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn('scroll-area min-h-0 flex-1 space-y-4 overflow-y-auto', compact ? 'px-3 py-3' : 'px-4 py-4')}>
        {messages.map((message, index) => {
          const text = index === 0 && message.role === 'ai' && message.id === 1
            ? greeting(role, contextLabel, activeLanguage)
            : message.text
          return (
            <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  message.role === 'user'
                    ? 'max-w-[88%] rounded-[14px] rounded-br-[4px] bg-emerald-solid px-3.5 py-2.5 text-[12px] leading-relaxed text-white'
                    : 'max-w-[92%] rounded-[14px] rounded-bl-[4px] border border-line bg-surface-alt px-3.5 py-2.5 text-[12px] leading-relaxed'
                }
              >
                {message.role === 'ai' && (
                  <span className="mb-1.5 flex items-center gap-1 text-[10px] font-bold tracking-wide text-emerald">
                    <Sparkles size={11} aria-hidden /> {t('MENYA AI')}
                  </span>
                )}
                {text}
                {message.role === 'ai' && (
                  <>
                    <AISourceChips sources={message.sources ?? []} />
                    <AIActionButtons actions={message.actions ?? []} context={actionContext} />
                    {message.notice && (
                      <p className="mt-2 border-t border-line pt-1.5 text-[10px] leading-snug text-muted">{message.notice}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}

        {thinking && (
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span className="flex gap-1">
              <span className="soft-pulse h-1.5 w-1.5 rounded-full bg-emerald" />
              <span className="soft-pulse h-1.5 w-1.5 rounded-full bg-emerald [animation-delay:200ms]" />
              <span className="soft-pulse h-1.5 w-1.5 rounded-full bg-emerald [animation-delay:400ms]" />
            </span>
            {translateText(activeLanguage, 'Reading your workspace context…')}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={cn('shrink-0 border-t border-line', compact ? 'px-3 py-2.5' : 'px-4 py-3')}>
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          <WandSparkles size={12} className="text-emerald" aria-hidden /> {t('Try asking')}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {visiblePrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => void send(t(prompt))}
              className="rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-muted transition-colors hover:border-emerald/40 hover:text-emerald"
            >
              {t(prompt)}
            </button>
          ))}
        </div>

        {!compact && (
          <div className="mt-3 rounded-[11px] border border-amber/30 bg-amber-soft p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-amber-dark dark:text-amber">
              <ListChecks size={13} aria-hidden /> {t('Suggested next moves')}
            </p>
            <ul className="mt-2 space-y-1.5">
              {defaultExercises.map((exercise) => (
                <li key={exercise}>
                  <button
                    onClick={() => void send(t(exercise))}
                    className="flex w-full items-start gap-1.5 text-left text-[11px] leading-snug text-muted transition-colors hover:text-ink"
                  >
                    <Lightbulb size={12} className="mt-0.5 shrink-0 text-amber-dark dark:text-amber" aria-hidden />
                    {t(exercise)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium text-muted">{t('Use simple language')}</span>
          <Toggle checked={simpleMode} onChange={setSimpleMode} label={t('Use simple language in AI answers')} />
        </div>

        <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={translateText(activeLanguage, 'Ask MENYA AI…')}
            aria-label={t('Message MENYA AI')}
            className="input py-2"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-emerald-solid text-white transition-colors hover:bg-emerald-solid-hover disabled:opacity-40"
            aria-label={t('Send message')}
          >
            <ArrowUp size={17} aria-hidden />
          </button>
        </form>
        <p className="mt-2 text-center text-[9px] text-muted">
          {t('AI supports your work. Verify safety information and formal decisions with your trainer or institution policy.')}
        </p>
      </div>
    </div>
  )
}
