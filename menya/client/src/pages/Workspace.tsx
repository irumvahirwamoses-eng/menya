import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock3,
  FileText,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Play,
  Search,
  Sparkles,
  Target,
  Video,
} from 'lucide-react'
import { AITutorPanel } from '../components/ai/AITutorPanel'
import { AIInsightFeed } from '../components/ai/AIInsight'
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  Tabs,
  type TabItem,
} from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { modules } from '../data/mock'
import { useT } from '../i18n'
import { apiClient } from '../lib/api'
import type { LessonType } from '../types'
import { cn, lessonTypeLabel } from '../lib/utils'

const typeIcon: Record<LessonType, typeof BookOpen> = {
  video: Video,
  reading: BookOpen,
  practice: Target,
  quiz: ClipboardCheck,
}

const flatLessons = modules.flatMap((module, moduleIndex) =>
  module.lessons.map((lesson) => ({
    ...lesson,
    moduleId: module.id,
    moduleTitle: module.title,
    moduleIndex,
  })),
)

const objectives = [
  'State Ohm’s law and identify each quantity and unit.',
  'Calculate current, voltage or resistance from a circuit problem.',
  'Apply the formula to a real installation scenario.',
]

const miniQuestion = {
  prompt: 'A 12 V supply feeds a 3 Ω resistor. What current flows?',
  options: ['0.25 A', '4 A', '36 A', '9 A'],
  answer: 1,
  explanation: 'I = V ÷ R = 12 ÷ 3 = 4 A.',
}

type MobileTab = 'curriculum' | 'lesson' | 'ai'

export default function Workspace() {
  const { completedLessons, toggleLessonComplete, notify } = useApp()
  const t = useT()
  const [activeId, setActiveId] = useState('l6')
  const [expanded, setExpanded] = useState<string[]>(modules.map((module) => module.id))
  const [search, setSearch] = useState('')
  const [mobileTab, setMobileTab] = useState<MobileTab>('lesson')
  const [lessonTab, setLessonTab] = useState('content')
  const [simplify, setSimplify] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [answer, setAnswer] = useState<number | null>(null)

  const active = flatLessons.find((lesson) => lesson.id === activeId) ?? flatLessons[5]
  const activeIndex = flatLessons.findIndex((lesson) => lesson.id === active.id)
  const isComplete = completedLessons.includes(active.id)

  const filteredModules = useMemo(() => {
    if (!search.trim()) return modules
    const term = search.toLowerCase()
    return modules
      .map((module) => ({
        ...module,
        lessons: module.lessons.filter((lesson) => `${lesson.title} ${lesson.description}`.toLowerCase().includes(term)),
      }))
      .filter((module) => module.lessons.length)
  }, [search])

  const completedInModule = (moduleId: string) => {
    const module = modules.find((item) => item.id === moduleId)!
    return module.lessons.filter((lesson) => completedLessons.includes(lesson.id)).length
  }

  const selectLesson = (id: string) => {
    setActiveId(id)
    setAnswer(null)
    setPlaying(false)
    setMobileTab('lesson')
  }

  const markComplete = async () => {
    const nowComplete = !isComplete
    toggleLessonComplete(active.id)
    try {
      await apiClient.patch('/progress/EIL-301', {
        lesson: { lessonId: active.id, completed: nowComplete },
      })
      notify(
        nowComplete ? t('Lesson completed') : t('Lesson marked as incomplete'),
        nowComplete ? t('Progress saved to your MENYA record.') : t('You can revisit it any time.'),
        nowComplete ? 'success' : 'info',
      )
    } catch {
      toggleLessonComplete(active.id)
      notify(t('Could not save progress'), t('Your lesson change was not saved. Please try again.'), 'error')
    }
  }

  const move = (direction: -1 | 1) => {
    const next = flatLessons[activeIndex + direction]
    if (next) selectLesson(next.id)
  }

  const lessonTabs: TabItem<string>[] = [
    { id: 'content', label: t('Lesson'), icon: BookOpen },
    { id: 'notes', label: t('My notes'), icon: NotebookPen },
    { id: 'transcript', label: t('Transcript'), icon: FileText },
  ]

  const mobileTabs: TabItem<MobileTab>[] = [
    { id: 'curriculum', label: t('Curriculum'), icon: ListChecks },
    { id: 'lesson', label: t('Lesson'), icon: BookOpen },
    { id: 'ai', label: t('AI Tutor'), icon: Sparkles },
  ]

  /* ------------------------------ Panels -------------------------------- */
  const curriculumPanel = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="shrink-0 border-b border-line p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="eyebrow">{t('Course')}</p>
            <p className="mt-1 text-[13px] font-bold leading-tight">{t('Electrical Installation')}</p>
            <p className="text-[10px] text-muted">EIL-301 · {t('Level 3')}</p>
          </div>
          <Badge tone="emerald">{Math.round((completedLessons.length / flatLessons.length) * 100)}%</Badge>
        </div>
        <ProgressBar value={(completedLessons.length / flatLessons.length) * 100} />
        <div className="relative mt-3">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Find a lesson…')}
            aria-label={t('Search lessons')}
            className="input py-2 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        {filteredModules.length ? (
          filteredModules.map((module) => {
            const isExpanded = expanded.includes(module.id) || Boolean(search)
            const done = completedInModule(module.id)
            const moduleIndex = modules.findIndex((item) => item.id === module.id)
            return (
              <div key={module.id} className="mb-1.5">
                <button
                  onClick={() => setExpanded((current) => current.includes(module.id) ? current.filter((id) => id !== module.id) : [...current, module.id])}
                  className="flex w-full items-center gap-2 rounded-[9px] px-2.5 py-2 text-left transition-colors hover:bg-surface-alt"
                  aria-expanded={isExpanded}
                >
                  <ChevronDown size={14} className={cn('shrink-0 text-muted transition-transform', !isExpanded && '-rotate-90')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-bold">{moduleIndex + 1}. {module.title}</span>
                    <span className="block text-[10px] text-muted">{t('{done}/{total} lessons', { done, total: module.lessons.length })}</span>
                  </span>
                </button>
                {isExpanded && (
                  <ul className="mt-0.5 space-y-0.5">
                    {module.lessons.map((lesson) => {
                      const Icon = typeIcon[lesson.type]
                      const activeLesson = lesson.id === active.id
                      const complete = completedLessons.includes(lesson.id)
                      return (
                        <li key={lesson.id}>
                          <button
                            onClick={() => selectLesson(lesson.id)}
                            className={cn(
                              'flex w-full items-start gap-2.5 rounded-[9px] px-2.5 py-2 text-left transition-colors',
                              activeLesson ? 'bg-emerald-soft text-emerald-dark dark:text-emerald' : 'hover:bg-surface-alt',
                            )}
                          >
                            <span className={cn('mt-0.5 shrink-0', complete ? 'text-emerald' : activeLesson ? 'text-emerald' : 'text-muted')}>
                              {complete ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn('block text-[11px] font-semibold leading-snug', activeLesson ? '' : 'text-ink')}>{lesson.title}</span>
                              <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted">
                                <Clock3 size={10} aria-hidden /> {t('{duration} min · {type}', { duration: lesson.duration, type: t(lessonTypeLabel[lesson.type]) })}
                              </span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })
        ) : (
          <p className="px-3 py-8 text-center text-xs text-muted">{t('No lessons match “{search}”.', { search })}</p>
        )}
      </div>

      <div className="shrink-0 border-t border-line p-4">
        <div className="flex items-center gap-2 rounded-[10px] bg-surface-alt p-3">
          <Sparkles size={15} className="shrink-0 text-emerald" aria-hidden />
          <p className="text-[10px] leading-snug text-muted">
            {t('Your path adapts as you complete lessons. Next up:')} <span className="font-semibold text-ink">{t('Applied calculations')}</span>.
          </p>
        </div>
      </div>
    </div>
  )

  const lessonPanel = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="scroll-area min-h-0 flex-1 overflow-y-auto">
        {/* Lesson header */}
        <div className="border-b border-line p-5 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
            <span>{active.moduleTitle}</span>
            <ChevronRight size={12} aria-hidden />
            <span>{t('Lesson {number}', { number: activeIndex - modules.slice(0, active.moduleIndex).reduce((sum, m) => sum + m.lessons.length, 0) + 1 })}</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-[20px] font-bold sm:text-[22px]">{active.title}</h1>
              <p className="mt-1.5 text-xs text-muted">{active.description}</p>
            </div>
            {isComplete && <Badge tone="emerald" dot>{t('Completed')}</Badge>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted">
            <span className="chip chip-active"><span className="h-1.5 w-1.5 rounded-full bg-emerald" /> {t(lessonTypeLabel[active.type])}</span>
            <span className="flex items-center gap-1"><Clock3 size={12} /> {t('{duration} min', { duration: active.duration })}</span>
            <span>Eng. Rusanganwa Eric</span>
          </div>
        </div>

        <Tabs items={lessonTabs} active={lessonTab} onChange={setLessonTab} className="mx-5 mt-5 sm:mx-6" />

        {lessonTab === 'content' && (
          <div className="space-y-6 p-5 sm:p-6">
            {/* Media */}
            <button
              onClick={() => {
                setPlaying((value) => !value)
                if (!playing) notify(t('Lesson playback'), t('Video lesson started in preview mode.'), 'info')
              }}
              className="group relative flex h-48 w-full items-center justify-center overflow-hidden rounded-xl bg-hero sm:h-56"
              aria-label={playing ? t('Pause lesson video') : t('Play lesson video')}
            >
              <div className="grid-pattern absolute inset-0 opacity-[0.09]" aria-hidden />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-hero-fg ring-1 ring-white/25 transition-transform group-hover:scale-105">
                {playing ? (
                  <span className="flex gap-1"><span className="h-4 w-1 rounded bg-white" /><span className="h-4 w-1 rounded bg-white" /></span>
                ) : (
                  <Play size={22} className="ml-1" fill="currentColor" />
                )}
              </span>
              <span className="absolute bottom-3 left-4 text-[11px] font-semibold text-hero-muted">
                {playing ? t('Playing · 02:14 / 16:00') : t('Watch: working with circuit calculations')}
              </span>
              <span className="absolute right-4 bottom-3 text-[10px] text-hero-muted">16:00</span>
            </button>

            {/* Objectives */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-[14px] font-bold"><Target size={16} className="text-emerald" /> {t('By the end of this lesson, you can:')}</h2>
              <ul className="space-y-2">
                {objectives.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-xs leading-relaxed text-muted">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald" aria-hidden /> {t(item)}
                  </li>
                ))}
              </ul>
            </div>

            {/* Content */}
            <div className="space-y-4 text-[13px] leading-[1.75] text-muted">
              <p>
                {t('In a real installation, you rarely meet a formula in isolation. You meet a cable, a load and a supply — then you need to decide whether the components are safe. This lesson connects the formula to that decision.')}
              </p>
              <div className="rounded-xl border border-emerald/25 bg-emerald-soft/50 p-4 dark:bg-emerald-soft/25">
                <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-dark dark:text-emerald">
                  <Lightbulb size={14} /> {t('Key formula')}
                </p>
                <p className="mt-2 text-lg font-bold tracking-tight text-ink">I = V ÷ R</p>
                <p className="mt-1 text-xs text-muted">{t('Current (A) = Voltage (V) ÷ Resistance (Ω)')}</p>
              </div>
              <p>
                {t('Worked example: a 12 V supply feeds a resistor of 3 Ω. Substitute the values only after you have identified them:')} <strong className="font-semibold text-ink">I = 12 ÷ 3 = 4 A</strong>.{' '}
                {t('If the cable in that circuit is rated below 4 A, it will overheat — so the calculation directly affects safety, not just a score.')}
              </p>
              {simplify && (
                <div className="animate-fade-up rounded-xl border border-line bg-surface-alt p-4 text-xs leading-relaxed">
                  <p className="mb-1.5 flex items-center gap-1.5 font-bold text-emerald"><Sparkles size={13} /> {t('Simplified explanation')}</p>
                  {t('Voltage pushes electricity, resistance slows it down, and current is how much actually flows. More push means more flow; more resistance means less flow. Divide the push by the resistance to get the flow.')}
                </div>
              )}
              <button
                onClick={() => setSimplify((value) => !value)}
                className="inline-flex items-center gap-2 rounded-[9px] border border-line bg-surface px-3 py-2 text-[11px] font-semibold text-muted hover:border-emerald/40 hover:text-emerald"
              >
                <Sparkles size={13} /> {simplify ? t('Hide simple explanation') : t('Explain in simpler terms')}
              </button>
            </div>

            {/* Check */}
            <Card className="border-amber/30 bg-amber-soft/35 p-5 dark:bg-amber-soft/15">
              <p className="flex items-center gap-2 text-[13px] font-bold"><ListChecks size={16} className="text-amber-dark dark:text-amber" /> {t('Check your understanding')}</p>
              <p className="mt-2 text-xs font-medium">{t(miniQuestion.prompt)}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {miniQuestion.options.map((option, index) => {
                  const chosen = answer === index
                  const correct = answer !== null && index === miniQuestion.answer
                  return (
                    <button
                      key={option}
                      onClick={() => setAnswer(index)}
                      className={cn(
                        'flex items-center gap-2.5 rounded-[10px] border bg-surface px-3 py-2.5 text-left text-xs font-medium transition-colors',
                        chosen && index === miniQuestion.answer ? 'border-emerald text-emerald' :
                        chosen ? 'border-danger text-danger' :
                        correct ? 'border-emerald/50 text-emerald' : 'border-line hover:border-line-strong',
                      )}
                    >
                      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px]', chosen || correct ? 'border-current' : 'border-line-strong')}>
                        {chosen ? (index === miniQuestion.answer ? <Check size={11} /> : '×') : String.fromCharCode(65 + index)}
                      </span>
                      {t(option)}
                    </button>
                  )
                })}
              </div>
              {answer !== null && (
                <p className={cn('mt-3 text-[11px] font-medium', answer === miniQuestion.answer ? 'text-emerald' : 'text-danger')}>
                  {answer === miniQuestion.answer
                    ? t('Correct. {explanation}', { explanation: t(miniQuestion.explanation) })
                    : t('Not quite. {explanation}', { explanation: t(miniQuestion.explanation) })}
                </p>
              )}
            </Card>

            <AIInsightFeed context="workspace" />
          </div>
        )}

        {lessonTab === 'notes' && (
          <div className="p-5 sm:p-6">
            <h2 className="mb-2 text-[14px] font-bold">{t('My notes')}</h2>
            <p className="mb-4 text-xs text-muted">{t('Notes are private to you and sync with your study planner.')}</p>
            <textarea
              className="input min-h-48 resize-y leading-relaxed"
              placeholder={t('Write a note about {title}…', { title: active.title })}
              aria-label={t('Lesson notes')}
            />
            <Button size="sm" className="mt-3" onClick={() => notify(t('Note saved'), t('Your note is available offline.'), 'success')}>{t('Save note')}</Button>
          </div>
        )}

        {lessonTab === 'transcript' && (
          <div className="space-y-4 p-5 sm:p-6 text-xs leading-relaxed text-muted">
            <h2 className="text-[14px] font-bold text-ink">{t('Transcript')}</h2>
            <p><strong className="text-ink">00:00</strong> — {t('Welcome back. In this lesson we connect circuit theory to a real installation task.')}</p>
            <p><strong className="text-ink">01:42</strong> — {t('Start by writing down what you know: supply voltage and resistor value.')}</p>
            <p><strong className="text-ink">04:18</strong> — {t('Choose the formula that links those quantities: current equals voltage divided by resistance.')}</p>
            <p><strong className="text-ink">09:05</strong> — {t('Check the answer against the cable rating. This is where calculation becomes a safety decision.')}</p>
          </div>
        )}
      </div>

      {/* Lesson footer */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-line bg-surface p-4">
        <Button variant="ghost" size="sm" icon={ArrowLeft} disabled={activeIndex === 0} onClick={() => move(-1)}>{t('Previous')}</Button>
        <div className="flex items-center gap-2">
          <Button variant={isComplete ? 'secondary' : 'primary'} size="sm" icon={isComplete ? Circle : Check} onClick={markComplete}>
            {isComplete ? t('Mark incomplete') : t('Mark complete')}
          </Button>
          <Button size="sm" iconRight={ArrowRight} disabled={activeIndex === flatLessons.length - 1} onClick={() => move(1)}>{t('Next lesson')}</Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-up">
      {/* Workspace toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-emerald">{t('Learning workspace')}</p>
          <p className="mt-1 text-[13px] font-semibold">
            {t('{course} · Module {number}', { course: t('Electrical Installation'), number: active.moduleIndex + 1 })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-muted sm:block">{t('{done}/{total} lessons complete', { done: completedLessons.length, total: flatLessons.length })}</span>
          <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => setMobileTab('ai')} className="xl:hidden">{t('Ask AI')}</Button>
          <Button size="sm" icon={Check} onClick={markComplete}>{isComplete ? t('Completed') : t('Mark complete')}</Button>
        </div>
      </div>

      <Tabs items={mobileTabs} active={mobileTab} onChange={setMobileTab} className="mb-4 xl:hidden" />

      <div className="grid gap-4 xl:h-[calc(100dvh-var(--header-h)-10.5rem)] xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <div className={cn('h-[70vh] min-h-[520px] xl:h-full', mobileTab === 'curriculum' ? 'block' : 'hidden xl:block')}>
          {curriculumPanel}
        </div>
        <div className={cn('min-h-[560px] xl:h-full xl:min-h-0', mobileTab === 'lesson' ? 'block' : 'hidden xl:block')}>
          {lessonPanel}
        </div>
        <div className={cn('h-[70vh] min-h-[520px] xl:h-full', mobileTab === 'ai' ? 'block' : 'hidden xl:block')}>
          <AITutorPanel key={active.id} lessonTitle={active.title} />
        </div>
      </div>
    </div>
  )
}
