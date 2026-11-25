import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  RotateCcw,
  Search,
  SearchX,
  TrendingUp,
} from 'lucide-react'
import { AIInsightFeed } from '../components/ai/AIInsight'
import { PageHeader } from '../components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
  StatCard,
} from '../components/ui/Primitives'
import { useAuth } from '../context/AuthContext'
import { useT } from '../i18n'
import { apiClient } from '../lib/api'
import { cn } from '../lib/utils'
import type { Course } from '../types'

type LevelFilter = 'All' | Course['level']
type Tone = 'emerald' | 'amber' | 'info' | 'neutral'
type ProgressTone = 'emerald' | 'amber' | 'info'

const LEVELS: LevelFilter[] = ['All', 'Foundation', 'Intermediate', 'Advanced']

const accentStyles: Record<
  Course['accent'],
  { strip: string; tile: string; tone: Tone; progress: ProgressTone }
> = {
  emerald: {
    strip: 'bg-emerald',
    tile: 'bg-emerald-soft text-emerald-dark dark:text-emerald',
    tone: 'emerald',
    progress: 'emerald',
  },
  amber: {
    strip: 'bg-amber',
    tile: 'bg-amber-soft text-amber-dark dark:text-amber',
    tone: 'amber',
    progress: 'amber',
  },
  info: {
    strip: 'bg-info',
    tile: 'bg-info-soft text-info',
    tone: 'info',
    progress: 'info',
  },
  navy: {
    strip: 'bg-navy dark:bg-emerald-dark',
    tile: 'bg-navy/10 text-navy dark:bg-emerald-soft/40 dark:text-emerald',
    tone: 'neutral',
    progress: 'emerald',
  },
}

export default function Curriculum() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const t = useT()
  const [courseList, setCourseList] = useState<Course[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState<LevelFilter>('All')

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<{ courses: Course[] }>('/courses'),
      apiClient.get<{ progress: Array<{ courseCode: string; mastery: number }> }>('/progress'),
    ]).then(([courseResult, progressResult]) => {
      if (!active) return
      if (courseResult.status === 'fulfilled') setCourseList(courseResult.value.courses)
      if (progressResult.status === 'fulfilled') {
        setProgress(
          Object.fromEntries(progressResult.value.progress.map((item) => [item.courseCode, item.mastery])),
        )
      }
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(courseList.map((course) => course.category)))],
    [courseList],
  )

  const summary = useMemo(
    () => ({
      paths: courseList.length,
      lessons: courseList.reduce((total, course) => total + course.lessonCount, 0),
      average: courseList.length
        ? Math.round(
            courseList.reduce(
              (total, course) => total + (progress[course.code] ?? 0),
              0,
            ) / courseList.length,
          )
        : 0,
    }),
    [courseList, progress],
  )

  const visibleCourses = useMemo(() => {
    const term = query.trim().toLowerCase()

    return courseList.filter((course) => {
      const matchesQuery =
        !term ||
        [
          course.title,
          course.code,
          course.category,
          course.level,
          course.description,
          ...course.tags,
        ].some((value) => value.toLowerCase().includes(term))
      const matchesCategory = category === 'All' || course.category === category
      const matchesLevel = level === 'All' || course.level === level

      return matchesQuery && matchesCategory && matchesLevel
    })
  }, [courseList, query, category, level])

  const recommended = courseList.find((course) => course.code === 'EIL-301') ?? courseList[0]
  const recommendedStyle = recommended ? accentStyles[recommended.accent] : accentStyles.emerald
  const recommendedProgress = recommended ? progress[recommended.code] ?? 0 : 0

  const resetFilters = () => {
    setQuery('')
    setCategory('All')
    setLevel('All')
  }

  if (loading || !recommended) {
    return (
      <div className="stack animate-fade-up">
        <PageHeader
          eyebrow={t('LEARNING PATHS')}
          title={t('Curriculum explorer')}
          description={t('Choose a path that fits your trade and your goal, then pick up exactly where you left off.')}
        />
        <Card className="card-pad">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 rounded-lg bg-surface-alt" />
            <div className="h-4 w-full max-w-xl rounded bg-surface-alt" />
            <div className="grid gap-4 pt-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-48 rounded-card bg-surface-alt" />
              ))}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={t('LEARNING PATHS')}
        title={t('Curriculum explorer')}
        description={t('Choose a path that fits your trade and your goal, then pick up exactly where you left off.')}
        actions={
          <Button
            variant="secondary"
            icon={Compass}
            onClick={() => navigate('/workspace')}
            aria-label={t('Go to your learning workspace')}
          >
            {t('My workspace')}
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t('Learning paths')}
          value={summary.paths}
          icon={Compass}
          tone="emerald"
          footnote={t('across all trades')}
        />
        <StatCard
          label={t('Total lessons')}
          value={summary.lessons}
          icon={BookOpen}
          tone="info"
          footnote={t('self-paced and practical')}
        />
        <StatCard
          label={t('Average progress')}
          value={`${summary.average}%`}
          icon={TrendingUp}
          tone="amber"
          footnote={t('keep your streak going')}
        />
      </div>

      <Card className="card-interactive mb-6 overflow-hidden">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="eyebrow text-emerald">{t('Recommended pathway')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-[-0.02em]">{recommended.title}</h2>
              <Badge tone={recommendedStyle.tone}>{recommended.code}</Badge>
            </div>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted">
              {recommended.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={14} aria-hidden />
                {t('{count} lessons', { count: recommended.lessonCount })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden />
                {recommended.duration}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <TrendingUp size={14} aria-hidden />
                {t('{percent}% complete', { percent: recommendedProgress })}
              </span>
            </div>
            <div className="mt-5">
              <Button
                icon={ArrowRight}
                onClick={() => navigate('/workspace')}
                aria-label={t('Continue {title} in your workspace', { title: recommended.title })}
              >
                {t('Continue recommended path')}
              </Button>
            </div>
          </div>
          <AIInsightFeed
            context="curriculum"
            fallback={[
              {
                title: t('Why {title} fits you', { title: recommended.title }),
                description: t('It builds on your {progress}% progress and matches {program}.', {
                  progress: recommendedProgress,
                  program: user?.program ?? t('your TVET program'),
                }),
                factors: [
                  t('Aligned with your current TVET program and next assessment'),
                  t('Builds on your strongest electrical safety foundations'),
                  t('Includes hands-on practice you can finish this week'),
                ],
              },
            ]}
          />
        </div>
      </Card>

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <label className="sr-only" htmlFor="curriculum-search">
              {t('Search learning paths')}
            </label>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <input
              id="curriculum-search"
              className="input pl-10"
              type="search"
              placeholder={t('Search by title, code, category or skill...')}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div role="group" aria-label={t('Filter pathways by category')} className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-1">{t('Category')}</span>
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={cn('chip', category === item && 'chip-active')}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {t(item)}
              </button>
            ))}
          </div>

          <div role="group" aria-label={t('Filter pathways by level')} className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-1">{t('Level')}</span>
            {LEVELS.map((item) => (
              <button
                key={item}
                type="button"
                className={cn('chip', level === item && 'chip-active')}
                aria-pressed={level === item}
                onClick={() => setLevel(item)}
              >
                {t(item)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title">{t('All pathways')}</h2>
        <p className="text-xs text-muted">
          {t('{shown} of {total} shown', { shown: visibleCourses.length, total: courseList.length })}
        </p>
      </div>

      {visibleCourses.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title={t('No pathways found')}
            description={t('No learning path matches these filters. Try another search, category or level.')}
            action={
              <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
                {t('Reset filters')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.map((course) => {
            const style = accentStyles[course.accent]
            const courseProgress = progress[course.code] ?? 0

            return (
              <Card key={course.id} className="card-interactive flex overflow-hidden">
                <div className={cn('w-1 shrink-0', style.strip)} aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone={style.tone} dot>
                      {t(course.category)}
                    </Badge>
                    <span className="text-[11px] font-semibold tracking-wide text-muted">
                      {course.code}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span
                      className={cn(
                        'inline-flex h-6 items-center rounded-md px-2 text-[10px] font-bold uppercase tracking-wide',
                        style.tile,
                      )}
                    >
                      {t(course.level)}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{t('{count} lessons', { count: course.lessonCount })}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} aria-hidden />
                      {course.duration}
                    </span>
                  </div>

                  <h3 className="mt-3 text-base font-bold leading-snug">{course.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                    {course.description}
                  </p>

                  <div className="mt-4 flex min-w-0 items-center gap-2.5">
                    <Avatar name={course.trainer} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-ink">{course.trainer}</p>
                      <p className="text-[10px] text-muted">{t('Course trainer')}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-surface-alt px-2 py-1 text-[10px] font-medium text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto pt-5">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-muted">{t('Your progress')}</span>
                      <span className="tabular-nums text-ink">{courseProgress}%</span>
                    </div>
                    <ProgressBar value={courseProgress} tone={style.progress} />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={ArrowRight}
                      className="mt-4 w-full"
                      onClick={() => navigate('/workspace')}
                      aria-label={t('Open {title} in your workspace', { title: course.title })}
                    >
                      {t('Continue pathway')}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
