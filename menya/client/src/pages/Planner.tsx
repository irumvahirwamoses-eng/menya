import { useEffect, useState, type FormEvent } from 'react'
import { Check, ChevronDown, CircleCheck, Clock3, Flame, Plus } from 'lucide-react'
import { AIInsightFeed } from '../components/ai/AIInsight'
import { PageHeader } from '../components/layout/PageHeader'
import { Badge, Button, Card, StatCard } from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { courses, plannerTasks, student } from '../data/mock'
import { useT, type Translate } from '../i18n'
import { apiClient } from '../lib/api'
import { cn } from '../lib/utils'
import type { Course, PlannerTask } from '../types'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const TASK_TYPES: PlannerTask['type'][] = ['Learn', 'Practice', 'Assessment', 'Review']

const typeTone: Record<PlannerTask['type'], 'emerald' | 'amber' | 'info' | 'neutral'> = {
  Learn: 'info',
  Practice: 'emerald',
  Assessment: 'amber',
  Review: 'neutral',
}

interface TaskDraft {
  title: string
  course: string
  day: string
  start: string
  duration: string
  type: PlannerTask['type']
}

const emptyDraft: TaskDraft = {
  title: '',
  course: courses[0].title,
  day: '0',
  start: '09:00',
  duration: '20',
  type: 'Learn',
}

function formatDuration(minutes: number, translate: Translate) {
  if (minutes < 60) return translate('{minutes} min', { minutes })
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? translate('{hours}h {rest}m', { hours, rest }) : translate('{hours}h', { hours })
}

function TaskCard({ task, onToggle }: { task: PlannerTask; onToggle: (task: PlannerTask) => void }) {
  const t = useT()
  const checkboxId = `planner-task-${task.id}`
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface-alt/70 p-3 transition-opacity',
        task.done && 'opacity-65',
      )}
    >
      <div className="flex items-start gap-2.5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={task.done}
          onChange={() => onToggle(task)}
          aria-label={
            task.done
              ? t('Mark {title} as not done', { title: task.title })
              : t('Mark {title} as done', { title: task.title })
          }
          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="flex items-center gap-1 text-[11px] font-semibold tabular-nums text-muted">
              <Clock3 size={12} aria-hidden />
              {t('{start} · {duration} min', { start: task.start, duration: task.duration })}
            </span>
            <Badge tone={typeTone[task.type]}>{t(task.type)}</Badge>
          </div>
          <label
            htmlFor={checkboxId}
            className={cn(
              'mt-1.5 block cursor-pointer text-[13px] font-semibold leading-snug',
              task.done && 'text-muted line-through',
            )}
          >
            {task.title}
          </label>
          <p className="mt-1 truncate text-[11px] text-muted">{task.course}</p>
        </div>
      </div>
    </div>
  )
}

export default function Planner() {
  const { notify } = useApp()
  const t = useT()
  const [tasks, setTasks] = useState<PlannerTask[]>(() => plannerTasks.map((task) => ({ ...task })))
  const [courseOptions, setCourseOptions] = useState<Course[]>(courses)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [draft, setDraft] = useState<TaskDraft>({ ...emptyDraft })

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<{ tasks: PlannerTask[] }>('/planner'),
      apiClient.get<{ courses: Course[] }>('/courses'),
    ]).then(([taskResult, courseResult]) => {
      if (!active) return
      if (taskResult.status === 'fulfilled') setTasks(taskResult.value.tasks)
      if (courseResult.status === 'fulfilled') {
        setCourseOptions(courseResult.value.courses)
        setDraft((current) => ({
          ...current,
          course: courseResult.value.courses[0]?.title ?? current.course,
        }))
      }
    })
    return () => {
      active = false
    }
  }, [])

  const tasksFor = (day: number) =>
    tasks.filter((task) => task.day === day).sort((a, b) => a.start.localeCompare(b.start))

  const minutesFor = (day: number) => tasksFor(day).reduce((sum, task) => sum + task.duration, 0)

  const planned = tasks.reduce((sum, task) => sum + task.duration, 0)
  const completed = tasks
    .filter((task) => task.done)
    .reduce((sum, task) => sum + task.duration, 0)

  const toggleTask = async (task: PlannerTask) => {
    const nowDone = !task.done
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, done: nowDone } : item)),
    )
    try {
      const { task: saved } = await apiClient.patch<{ task: PlannerTask }>(`/planner/${task.id}`, {
        done: nowDone,
      })
      setTasks((current) => current.map((item) => (item.id === saved.id ? saved : item)))
      notify(
        nowDone ? t('Study block completed') : t('Study block reopened'),
        task.title,
        nowDone ? 'success' : 'info',
      )
    } catch {
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, done: task.done } : item)),
      )
      notify(t('Could not update block'), t('Your change was not saved. Please try again.'), 'error')
    }
  }

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draft.title.trim()
    if (!title || saving) return

    const parsedDuration = Number(draft.duration)
    setSaving(true)
    try {
      const { task: saved } = await apiClient.post<{ task: PlannerTask }>('/planner', {
        title,
        course: draft.course,
        day: Number(draft.day),
        start: draft.start,
        duration: Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 20,
        type: draft.type,
      })
      setTasks((current) => [...current, saved])
      notify(t('Study block added'), t('{title} · {day} at {time}', {
        title: saved.title,
        day: t(DAY_NAMES[saved.day]),
        time: saved.start,
      }))
      setDraft({ ...emptyDraft, course: courseOptions[0]?.title ?? emptyDraft.course })
      setFormOpen(false)
    } catch {
      notify(t('Could not add block'), t('Your study block was not saved. Please try again.'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const cancelForm = () => {
    setDraft({ ...emptyDraft })
    setFormOpen(false)
  }

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('STUDY ROUTINE')}
        title={t('Study planner')}
        description={t('Shape a realistic week of learning blocks around your energy and class schedule.')}
        actions={
          <Button
            icon={Plus}
            onClick={() => setFormOpen((open) => !open)}
            aria-expanded={formOpen}
            aria-controls="study-block-form"
          >
            {t('Add study block')}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('Planned this week')} value={formatDuration(planned, t)} icon={Clock3} footnote={t('across 5 study days')} />
        <StatCard
          label={t('Completed so far')}
          value={formatDuration(completed, t)}
          icon={CircleCheck}
          tone="info"
          footnote={t('{percent}% of plan', { percent: Math.round((completed / (planned || 1)) * 100) })}
        />
        <StatCard
          label={t('Focus streak')}
          value={t('{count} days', { count: student.streak })}
          icon={Flame}
          tone="amber"
          footnote={t('keep it going with one block a day')}
        />
      </div>

      {formOpen && (
        <Card id="study-block-form" className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="section-title">{t('New study block')}</h2>
              <p className="mt-1 text-xs text-muted">{t('Add a focused session to your weekly routine.')}</p>
            </div>
            <button
              type="button"
              onClick={cancelForm}
              className="icon-btn"
              aria-label={t('Cancel adding a study block')}
            >
              <ChevronDown size={16} className="rotate-180" aria-hidden />
            </button>
          </div>
          <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="sm:col-span-2 xl:col-span-1">
              <label className="label" htmlFor="block-title">{t('Title')}</label>
              <input
                id="block-title"
                className="input"
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                placeholder={t('e.g. Review earthing notes')}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label" htmlFor="block-course">{t('Course')}</label>
              <select
                id="block-course"
                className="input"
                value={draft.course}
                onChange={(event) => setDraft((current) => ({ ...current, course: event.target.value }))}
              >
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.title}>{course.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="block-type">{t('Type')}</label>
              <select
                id="block-type"
                className="input"
                value={draft.type}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    type: event.target.value as PlannerTask['type'],
                  }))
                }
              >
                {TASK_TYPES.map((type) => <option key={type} value={type}>{t(type)}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="block-day">{t('Day')}</label>
              <select
                id="block-day"
                className="input"
                value={draft.day}
                onChange={(event) => setDraft((current) => ({ ...current, day: event.target.value }))}
              >
                {DAY_NAMES.map((day, index) => <option key={day} value={index}>{t(day)}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="block-start">{t('Start time')}</label>
              <input
                id="block-start"
                type="time"
                className="input"
                value={draft.start}
                onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="block-duration">{t('Duration (minutes)')}</label>
              <input
                id="block-duration"
                type="number"
                min={5}
                max={180}
                step={5}
                className="input"
                value={draft.duration}
                onChange={(event) => setDraft((current) => ({ ...current, duration: event.target.value }))}
                required
              />
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-3">
              <Button type="submit" icon={Check} disabled={saving}>{saving ? t('Saving…') : t('Add block')}</Button>
              <Button type="button" variant="ghost" onClick={cancelForm}>{t('Cancel')}</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">{t('This week')}</h2>
            <p className="mt-1 text-xs text-muted">{t('Tick off blocks as you finish them. Your plan updates instantly.')}</p>
          </div>
          <Badge tone="emerald" dot>{t('Week 1 of 4')}</Badge>
        </div>

        {/* Desktop: scrollable day columns */}
        <div className="hidden overflow-x-auto pb-2 md:block">
          <div className="grid min-w-[880px] grid-cols-5 gap-3">
            {DAY_NAMES.map((day, index) => {
              const dayTasks = tasksFor(index)
              return (
                <div key={day} className="card flex min-h-[320px] flex-col p-3">
                  <div className="mb-3 flex items-start justify-between gap-2 px-1">
                    <div>
                      <p className="text-[13px] font-bold">{t(day)}</p>
                      <p className="text-[11px] text-muted">
                        {dayTasks.length === 1
                          ? t('{count} block · {time}', { count: dayTasks.length, time: formatDuration(minutesFor(index), t) })
                          : t('{count} blocks · {time}', { count: dayTasks.length, time: formatDuration(minutesFor(index), t) })}
                      </p>
                    </div>
                    {index === 2 && <Badge tone="amber">{t('Low focus')}</Badge>}
                  </div>
                  <div className="stack gap-2.5">
                    {dayTasks.length ? (
                      dayTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} />)
                    ) : (
                      <p className="rounded-xl border border-dashed border-line px-3 py-8 text-center text-[11px] text-muted">
                        {t('No blocks planned')}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile: stacked accordion */}
        <div className="space-y-2.5 md:hidden">
          {DAY_NAMES.map((day, index) => {
            const dayTasks = tasksFor(index)
            return (
              <details key={day} className="card group p-4" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-bold">{t(day)}</p>
                    <p className="text-[11px] text-muted">
                      {dayTasks.length === 1
                        ? t('{count} block · {time}', { count: dayTasks.length, time: formatDuration(minutesFor(index), t) })
                        : t('{count} blocks · {time}', { count: dayTasks.length, time: formatDuration(minutesFor(index), t) })}
                    </p>
                  </div>
                  <ChevronDown size={16} className="text-muted transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="mt-3 space-y-2.5 border-t border-line pt-3">
                  {dayTasks.length ? (
                    dayTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={toggleTask} />)
                  ) : (
                    <p className="py-3 text-center text-[11px] text-muted">{t('No blocks planned')}</p>
                  )}
                </div>
              </details>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-alt/60 p-4">
          <div>
            <p className="text-[13px] font-bold">{t('Weekend — keep it light')}</p>
            <p className="mt-1 text-[11px] text-muted">
              {t('An optional 15-minute review is enough to protect your streak without burning out.')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {['Saturday', 'Sunday'].map((day, index) => (
              <span key={day} className="chip">
                {t('{day} · {count} blocks', {
                  day: t(day),
                  count: tasks.filter((task) => task.day === index + 5).length,
                })}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <AIInsightFeed
        context="planner"
        fallback={[
          {
            title: t('Best next slot: Wednesday, 18:00–18:30'),
            description: t('Wednesday dips to 31 focused minutes — well below your 45-minute rhythm. A short review block there protects your streak without overloading your busiest day, Thursday.'),
            factors: [
              t('Wednesday logged 31 min against a 45 min daily goal'),
              t('Thursday is your peak at 68 min — keep that day lighter'),
              t('Evening blocks around 18:00 have fewer interruptions in your history'),
            ],
          },
        ]}
      />
    </div>
  )
}
