import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  Play,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { AIRecommendationCard } from '../components/ai/AIRecommendationCard'
import { AIInsightFeed } from '../components/ai/AIInsight'
import { WeeklyActivityChart } from '../components/charts/Charts'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  StatCard,
} from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  assessments,
  courses,
  modules,
  plannerTasks,
  recommendations as mockRecommendations,
  student,
} from '../data/mock'
import { useT } from '../i18n'
import { apiClient } from '../lib/api'
import { cn } from '../lib/utils'
import type { PlannerTask, Recommendation } from '../types'

interface StudentAnalytics {
  scope: string
  mastery: number
  weeklyMinutes: number
  coursesInProgress: number
  latestAttempts: Array<{ id: string; score: number; title: string }>
}

interface ProgressRecord {
  courseCode: string
  mastery: number
  weeklyMinutes: number
  completedLessons: string[]
}

const dateOptions: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}
const today = new Date()
const dateLabel = today.toLocaleDateString('en-GB', dateOptions)
const dateLabelRw = today.toLocaleDateString('rw-RW', dateOptions)

function ProgressRing({ value }: { value: number }) {
  const t = useT()
  const radius = 48
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative shrink-0">
      <svg width="126" height="126" viewBox="0 0 126 126" role="img" aria-label={t('{value}% programme progress', { value })}>
        <circle cx="63" cy="63" r={radius} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="10" />
        <circle
          cx="63"
          cy="63"
          r={radius}
          fill="none"
          stroke="var(--emerald)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference * (value / 100)} ${circumference}`}
          transform="rotate(-90 63 63)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tracking-[-0.04em] text-hero-fg">{value}%</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-hero-muted">{t('complete')}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { dismissedRecommendations, completedLessons, language } = useApp()
  const { user } = useAuth()
  const t = useT()
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null)
  const [progress, setProgress] = useState<ProgressRecord[]>([])
  const [tasks, setTasks] = useState<PlannerTask[]>(plannerTasks)
  const [recommendations, setRecommendations] = useState<Recommendation[]>(mockRecommendations)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<StudentAnalytics>('/analytics'),
      apiClient.get<{ progress: ProgressRecord[] }>('/progress'),
      apiClient.get<{ tasks: PlannerTask[] }>('/planner'),
      apiClient.get<{ recommendations: Recommendation[] }>('/ai/recommendations'),
    ]).then(([analyticsResult, progressResult, tasksResult, recommendationsResult]) => {
      if (!active) return
      if (analyticsResult.status === 'fulfilled' && analyticsResult.value.scope === 'student') {
        setAnalytics(analyticsResult.value)
      }
      if (progressResult.status === 'fulfilled') setProgress(progressResult.value.progress)
      if (tasksResult.status === 'fulfilled') setTasks(tasksResult.value.tasks)
      if (recommendationsResult.status === 'fulfilled' && recommendationsResult.value.recommendations.length) {
        setRecommendations(recommendationsResult.value.recommendations)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const activeCourse = courses[0]
  const activeProgress =
    progress.find((item) => item.courseCode === activeCourse.code)?.mastery ?? activeCourse.progress
  const activeRecommendations = recommendations.filter((item) => !dismissedRecommendations.includes(item.id))
  const nextLesson = modules.flatMap((module) => module.lessons).find((lesson) => !completedLessons.includes(lesson.id))
  const todayTasks = tasks.filter((task) => task.day === 0)
  const readyAssessment = assessments.find((item) => item.status === 'Ready')
  const displayName = user?.name ?? student.name
  const weeklyMinutes = analytics?.weeklyMinutes ?? student.weeklyMinutes
  const mastery = analytics?.mastery ?? student.mastery
  const latestAttempt = analytics?.latestAttempts[0]

  return (
    <div className="stack animate-fade-up">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-card bg-hero text-hero-fg shadow-card">
        <div className="grid-pattern pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald/15 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-7 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-9">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-hero-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" /> {language === 'rw' ? dateLabelRw : dateLabel}
            </p>
            <h1 className="text-hero-fg">{t('Welcome back, {name}.', { name: displayName.split(' ')[0] })}</h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-hero-muted">
              {t('You are on a {streak}-day streak. Today, focus on Applied Calculations — MENYA AI has prepared an {minutes}-minute practice set based on your latest attempt.', {
                streak: student.streak,
                minutes: 8,
              })}
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button
                icon={Play}
                onClick={() => navigate('/workspace')}
                className="bg-emerald-solid text-white hover:bg-emerald-solid-hover"
              >
                {t('Continue learning')}
              </Button>
              <Button
                variant="secondary"
                icon={CalendarDays}
                onClick={() => navigate('/planner')}
                className="border-white/20 bg-white/8 text-hero-fg hover:bg-white/14 hover:text-hero-fg"
              >
                {t('View my plan')}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <ProgressRing value={activeProgress} />
            <div className="hidden space-y-2 text-[11px] sm:block">
              <p className="font-bold text-hero-fg">{activeCourse.code} · {t('Level 3')}</p>
              <p className="max-w-[150px] leading-relaxed text-hero-muted">{activeCourse.title}</p>
              <p className="flex items-center gap-1.5 font-semibold text-emerald">
                <Sparkles size={12} aria-hidden /> {t('On track for certification')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Learning this week')}
          value={`${weeklyMinutes}m`}
          change={t('{minutes}m to weekly goal', { minutes: Math.max(0, student.weeklyGoal - weeklyMinutes) })}
          icon={Clock3}
          tone="emerald"
        />
        <StatCard label={t('Skill mastery')} value={`${mastery}%`} change={t('↑ 6% this month')} icon={Target} tone="info" />
        <StatCard
          label={t('Current streak')}
          value={t('{count} days', { count: student.streak })}
          change={t('Personal best')}
          icon={Flame}
          tone="amber"
        />
        <StatCard label={t('Ready assessments')} value="1" change={t('Due today · 5:00 PM')} icon={BookOpen} tone="neutral" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]">
        {/* Left column */}
        <div className="stack">
          {/* Continue learning */}
          <Card className="card-interactive overflow-hidden p-0">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-soft sm:h-28 sm:w-40">
                <BookOpen size={34} className="text-emerald" strokeWidth={1.7} aria-hidden />
                <span className="absolute right-2 bottom-2 rounded-md bg-surface/90 px-2 py-1 text-[10px] font-bold text-emerald">
                  {activeCourse.code}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="emerald" dot>{t('In progress')}</Badge>
                  <span className="text-[11px] text-muted">{activeCourse.trainer}</span>
                </div>
                <h2 className="text-[15px] font-bold">{nextLesson?.title ?? t('Applied calculations')}</h2>
                <p className="mt-1 text-xs text-muted">
                  {nextLesson?.description ?? t('Continue where you left off in Electrical Installation.')}
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <ProgressBar value={activeProgress} className="flex-1" />
                  <span className="text-[11px] font-bold tabular-nums text-muted">{activeProgress}%</span>
                </div>
              </div>
              <Button iconRight={ChevronRight} onClick={() => navigate('/workspace')} className="w-full sm:w-auto">
                {t('Resume lesson')}
              </Button>
            </div>
          </Card>

          {/* Recommendations */}
          <section>
            <CardHeader
              title={t('Recommended by MENYA AI')}
              subtitle={t('Chosen from your recent answers, pace and upcoming deadlines.')}
              action={
                <span className="hidden items-center gap-1.5 text-[10px] font-semibold text-emerald sm:flex">
                  <Sparkles size={12} aria-hidden /> {t('Adaptive')}
                </span>
              }
              className="mb-4"
            />
            {activeRecommendations.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {activeRecommendations.slice(0, 4).map((item) => (
                  <AIRecommendationCard key={item.id} recommendation={item} compact />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  icon={Sparkles}
                  title={t('You are all caught up')}
                  description={t('MENYA AI has no new recommendations right now. Complete a lesson or quiz to get fresh suggestions.')}
                  action={<Button variant="secondary" onClick={() => navigate('/workspace')}>{t('Open workspace')}</Button>}
                />
              </Card>
            )}
          </section>

          {/* Study time */}
          <Card className="card-pad">
            <CardHeader
              title={t('Study time this week')}
              subtitle={t('Dashed line shows your daily goal of 45 minutes.')}
              action={<Button variant="ghost" size="sm" onClick={() => navigate('/analytics')}>{t('Full analytics')} <ArrowRight size={13} /></Button>}
            />
            <div className="mt-4">
              <WeeklyActivityChart />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="stack">
          <AIInsightFeed
            context="dashboard"
            fallback={[
              {
                title: t('One focused session can close your biggest gap'),
                description: t('Circuits mastery is 61% while Safety is 84%. An 8-minute practice set on Ohm’s law is the fastest route to a balanced profile.'),
                factors: [
                  t('You answered 2 of 3 new-context circuit questions incorrectly.'),
                  t('Your strongest skill is Safety, so the foundation is there.'),
                  t('The next assessment is due today at 5:00 PM.'),
                ],
              },
            ]}
          />

          <Card className="card-pad">
            <CardHeader
              title={t("Today's plan")}
              subtitle={t('{done} of {total} blocks complete', {
                done: todayTasks.filter((task) => task.done).length,
                total: todayTasks.length,
              })}
              action={<button onClick={() => navigate('/planner')} className="text-[11px] font-semibold text-emerald">{t('Edit plan')}</button>}
            />
            <ul className="mt-4 space-y-3">
              {todayTasks.map((task) => (
                <li key={task.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border',
                      task.done ? 'border-emerald-solid bg-emerald-solid text-white' : 'border-line-strong bg-surface',
                    )}
                  >
                    {task.done && <Check size={12} strokeWidth={3} aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate text-[12px] font-semibold', task.done && 'text-muted line-through')}>{task.title}</p>
                    <p className="text-[10px] text-muted">
                      {t('{start} · {duration} min · {type}', {
                        start: task.start,
                        duration: task.duration,
                        type: t(task.type),
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/planner')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-line py-2 text-[11px] font-semibold text-muted hover:border-emerald/50 hover:text-emerald"
            >
              {t('+ Add a study block')}
            </button>
          </Card>

          <Card className="card-pad">
            <CardHeader title={t('Upcoming assessment')} />
            {readyAssessment && (
              <div className="mt-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-soft text-amber-dark dark:text-amber">
                    <Target size={18} aria-hidden />
                  </span>
                  <div>
                    <p className="text-[13px] font-bold">{readyAssessment.title}</p>
                    <p className="text-[11px] text-muted">{readyAssessment.course}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[11px] text-muted">
                  <span>{t('{count} questions', { count: readyAssessment.questionCount })}</span>
                  <span>{t('{count} minutes', { count: readyAssessment.duration })}</span>
                  <span className="font-semibold text-amber-dark dark:text-amber">{t(readyAssessment.due)}</span>
                </div>
                <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => navigate('/assessments')}>
                  {t('Review before starting')}
                </Button>
              </div>
            )}
          </Card>

          <Card className="card-pad">
            <CardHeader title={t('Recent achievement')} />
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-soft text-amber-dark dark:text-amber">
                <Trophy size={20} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-bold">
                  {latestAttempt ? t('Latest assessment') : t('Safety Specialist')}
                </p>
                <p className="text-[11px] text-muted">
                  {latestAttempt
                    ? t('Scored {score}% on {title}', { score: latestAttempt.score, title: latestAttempt.title })
                    : t('Scored 92% on workshop safety')}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
              <Avatar name={displayName} size="sm" />
              <p className="text-[10px] leading-snug text-muted">
                {t(user?.program ?? student.program)}<br />{t(user?.school ?? student.school)}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
