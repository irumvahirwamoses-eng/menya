import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenCheck,
  ClipboardCheck,
  Clock3,
  LibraryBig,
  RotateCcw,
  Search,
  SearchX,
  Target,
  UsersRound,
} from 'lucide-react'
import { AIInsightFeed } from '../../components/ai/AIInsight'
import { AITutorPanel } from '../../components/ai/AITutorPanel'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  StatCard,
} from '../../components/ui/Primitives'
import { courses as mockCourses } from '../../data/mock'
import { useT } from '../../i18n'
import { apiClient } from '../../lib/api'
import { cn } from '../../lib/utils'

interface CourseItem {
  id: string
  code: string
  title: string
  category: string
  level: string
  trainer: string
  lessonCount: number
  duration: string
  description: string
  tags: string[]
  accent: string
}

interface TrainerAnalytics {
  scope: string
  learners: number
  pendingReviews: number
  courses: Array<{ code: string; learners: number; avgMastery: number }>
}

interface CourseOverview extends CourseItem {
  learners: number
  mastery: number
}

type CourseTone = 'emerald' | 'amber' | 'info' | 'neutral'
type MasteryTone = 'emerald' | 'amber' | 'info'

const accentStrips: Record<string, string> = {
  emerald: 'bg-emerald',
  amber: 'bg-amber',
  info: 'bg-info',
  navy: 'bg-navy dark:bg-emerald-dark',
}

function accentTone(accent: string): CourseTone {
  if (accent === 'amber') return 'amber'
  if (accent === 'info') return 'info'
  if (accent === 'navy') return 'neutral'
  return 'emerald'
}

function masteryTone(mastery: number): MasteryTone {
  if (mastery >= 75) return 'emerald'
  if (mastery >= 50) return 'info'
  return 'amber'
}

function masteryLabel(mastery: number): { label: string; tone: CourseTone } {
  if (!mastery) return { label: 'No data yet', tone: 'neutral' }
  if (mastery >= 75) return { label: 'On track', tone: 'emerald' }
  if (mastery >= 50) return { label: 'Needs attention', tone: 'info' }
  return { label: 'Priority support', tone: 'amber' }
}

export default function TrainerCourses() {
  const t = useT()
  const [courseData, setCourseData] = useState<CourseItem[]>([])
  const [analytics, setAnalytics] = useState<TrainerAnalytics | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<{ courses: CourseItem[] }>('/courses'),
      apiClient.get<TrainerAnalytics>('/analytics'),
    ]).then(([coursesResult, analyticsResult]) => {
      if (!active) return
      if (coursesResult.status === 'fulfilled') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setCourseData(coursesResult.value.courses)
      }
      if (analyticsResult.status === 'fulfilled' && analyticsResult.value.scope === 'trainer') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setAnalytics(analyticsResult.value)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const masteryByCode = useMemo(
    () =>
      new Map<string, { learners: number; avgMastery: number }>(
        (analytics?.courses ?? []).map((course) => [
          course.code,
          { learners: course.learners, avgMastery: course.avgMastery },
        ]),
      ),
    [analytics],
  )

  const courseList = courseData.length ? courseData : mockCourses
  const overviews = useMemo<CourseOverview[]>(
    () =>
      courseList.map((course) => {
        const stats = masteryByCode.get(course.code)
        return {
          id: course.id,
          code: course.code,
          title: course.title,
          category: course.category,
          level: course.level,
          trainer: course.trainer,
          lessonCount: course.lessonCount,
          duration: course.duration,
          description: course.description,
          tags: course.tags,
          accent: course.accent,
          learners: stats?.learners ?? 0,
          mastery: stats?.avgMastery ?? 0,
        }
      }),
    [courseList, masteryByCode],
  )

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(overviews.map((course) => course.category)))],
    [overviews],
  )

  const visibleCourses = useMemo(() => {
    const term = query.trim().toLowerCase()
    return overviews.filter((course) => {
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
      return matchesQuery && matchesCategory
    })
  }, [overviews, query, category])

  const withMastery = overviews.filter((course) => course.mastery > 0)
  const averageMastery = withMastery.length
    ? Math.round(
        withMastery.reduce((sum, course) => sum + course.mastery, 0) / withMastery.length,
      )
    : 0
  const learnersCovered = overviews.reduce((sum, course) => sum + course.learners, 0)
  const watchlist = [...withMastery].sort((a, b) => a.mastery - b.mastery).slice(0, 4)

  const resetFilters = () => {
    setQuery('')
    setCategory('All')
  }

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('TEACHER / TRAINER WORKSPACE')}
        title={t('Course oversight')}
        description={t('Monitor catalogue coverage and cohort mastery across every learning path you teach.')}
        actions={<Badge tone="emerald" dot>{t('{count} courses', { count: overviews.length })}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Courses')}
          value={overviews.length}
          change={t('in the catalogue')}
          icon={BookOpenCheck}
        />
        <StatCard
          label={t('With mastery data')}
          value={withMastery.length}
          change={t('progress reported')}
          icon={LibraryBig}
          tone="info"
        />
        <StatCard
          label={t('Average mastery')}
          value={`${averageMastery}%`}
          change={t('cohort average')}
          icon={Target}
        />
        <StatCard
          label={t('Learners covered')}
          value={learnersCovered}
          change={t('across courses')}
          footnote={t('{count} submissions waiting', { count: analytics?.pendingReviews ?? 0 })}
          icon={UsersRound}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="stack lg:col-span-2">
          <Card className="p-4 sm:p-5">
            <div className="relative">
              <label className="sr-only" htmlFor="course-oversight-search">
                {t('Search courses')}
              </label>
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="course-oversight-search"
                className="input pl-10"
                type="search"
                placeholder={t('Search by title, code, category or tag...')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div
              role="group"
              aria-label={t('Filter courses by category')}
              className="mt-4 flex flex-wrap items-center gap-2"
            >
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
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Mastery watchlist')}
              subtitle={t('Lowest cohort averages first — start your teaching here.')}
            />
            {watchlist.length === 0 ? (
              <p className="mt-4 text-xs text-muted">
                {t('No mastery data has been recorded for these courses yet.')}
              </p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('Course')}</th>
                      <th scope="col">{t('Learners')}</th>
                      <th scope="col">{t('Average mastery')}</th>
                      <th scope="col">{t('Focus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {watchlist.map((course) => {
                      const focus = masteryLabel(course.mastery)
                      return (
                        <tr key={course.id}>
                          <td>
                            <span className="font-semibold whitespace-nowrap">{course.code}</span>
                            <span className="mt-0.5 block text-[11px] text-muted">
                              {course.title}
                            </span>
                          </td>
                          <td className="tabular-nums text-muted">{course.learners}</td>
                          <td>
                            <ProgressBar
                              value={course.mastery}
                              tone={masteryTone(course.mastery)}
                              showValue
                              className="min-w-[140px]"
                            />
                          </td>
                          <td>
                            <Badge tone={focus.tone}>{t(focus.label)}</Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {visibleCourses.length === 0 ? (
            <Card>
              <EmptyState
                icon={SearchX}
                title={t('No courses found')}
                description={t('No learning path matches these filters. Try another search term or category.')}
                action={
                  <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
                    {t('Reset filters')}
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleCourses.map((course) => {
                const focus = masteryLabel(course.mastery)
                return (
                  <Card key={course.id} className="card-interactive flex overflow-hidden">
                    <div
                      className={cn('w-1 shrink-0', accentStrips[course.accent] ?? 'bg-emerald')}
                      aria-hidden
                    />
                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge tone={accentTone(course.accent)} dot>
                          {t(course.category)}
                        </Badge>
                        <span className="text-[11px] font-semibold tracking-wide text-muted">
                          {course.code}
                        </span>
                      </div>

                      <h3 className="mt-3 text-[15px] font-bold leading-snug">{course.title}</h3>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                        {course.description}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted">
                        <span>{t(course.level)}</span>
                        <span aria-hidden>·</span>
                        <span>{t('{count} lessons', { count: course.lessonCount })}</span>
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} aria-hidden />
                          {course.duration}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] text-muted">
                        {t('Led by')} <span className="font-semibold text-ink">{course.trainer}</span>
                      </p>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold">
                          <span className="text-muted">{t('Cohort mastery')}</span>
                          <Badge tone={focus.tone}>{t(focus.label)}</Badge>
                        </div>
                        {course.mastery > 0 ? (
                          <ProgressBar
                            value={course.mastery}
                            tone={masteryTone(course.mastery)}
                            showValue
                          />
                        ) : (
                          <p className="text-[11px] text-muted">
                            {t('No mastery data yet · {count} learners enrolled', { count: course.learners })}
                          </p>
                        )}
                      </div>

                      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                        {course.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-surface-alt px-2 py-1 text-[10px] font-medium text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div className="stack">
          <AIInsightFeed
            context="trainer-courses"
            fallback={[
              {
                title: t('Give the weakest course a worked example'),
                description: t('{percent}% is the current cohort average. Add a worked example before the next assessment and follow it with a short competency check.', { percent: averageMastery }),
                factors: [
                  t('{count} courses have mastery data.', { count: withMastery.length }),
                  t('{count} learners are covered across these courses.', { count: learnersCovered }),
                  t('{count} submissions remain in the review flow.', { count: analytics?.pendingReviews ?? 0 }),
                ],
                tone: 'emerald',
              },
            ]}
          />
          <Card className="flex items-start gap-3 border-info/25 bg-info-soft/55 p-5 dark:bg-info-soft/25">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info text-white">
              <ClipboardCheck size={18} aria-hidden />
            </span>
            <div>
              <p className="eyebrow text-info">{t('Teaching note')}</p>
              <p className="mt-1 text-[13px] font-semibold">{t('Mastery guides planning')}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t('Use low averages to plan reteaching. Reviewers remain responsible for final pass or change decisions on learner evidence.')}
              </p>
            </div>
          </Card>
          <div className="h-[620px]">
            <AITutorPanel
              lessonTitle={t('Course oversight')}
              context={t('trainer course mastery')}
              title={t('Course mastery copilot')}
              prompts={[
                t('Which course needs reteaching first?'),
                t('How can I raise mastery in a weak course?'),
                t('What should I check before the next assessment?'),
              ]}
              exercises={[
                t('Plan a short worked example for the weakest course'),
                t('Draft a mastery summary for the teaching team'),
                t('Suggest a competency check for one course'),
              ]}
              role="trainer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
