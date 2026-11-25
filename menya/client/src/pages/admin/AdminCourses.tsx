import { useEffect, useMemo, useState } from 'react'
import {
  BookOpenCheck,
  Clock3,
  GraduationCap,
  LibraryBig,
} from 'lucide-react'
import { AIInsightFeed } from '../../components/ai/AIInsight'
import { AITutorPanel } from '../../components/ai/AITutorPanel'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  StatCard,
} from '../../components/ui/Primitives'
import { useT } from '../../i18n'
import { cn } from '../../lib/utils'
import { apiClient } from '../../lib/api'

interface CourseItem {
  id: string
  code: string
  title: string
  category: string
  level: 'Foundation' | 'Intermediate' | 'Advanced'
  trainer: string
  lessonCount: number
  duration: string
  description: string
  tags: string[]
  accent: 'emerald' | 'amber' | 'info' | 'navy'
}

type Tone = 'emerald' | 'amber' | 'info' | 'neutral'

const accentStyles: Record<CourseItem['accent'], { strip: string; tile: string; tone: Tone }> = {
  emerald: {
    strip: 'border-l-emerald',
    tile: 'bg-emerald-soft text-emerald-dark dark:text-emerald',
    tone: 'emerald',
  },
  amber: {
    strip: 'border-l-amber',
    tile: 'bg-amber-soft text-amber-dark dark:text-amber',
    tone: 'amber',
  },
  info: {
    strip: 'border-l-info',
    tile: 'bg-info-soft text-info',
    tone: 'info',
  },
  navy: {
    strip: 'border-l-navy dark:border-l-emerald-dark',
    tile: 'bg-navy/10 text-navy dark:bg-emerald-soft/40 dark:text-emerald',
    tone: 'neutral',
  },
}

const levelTone: Record<CourseItem['level'], Tone> = {
  Foundation: 'emerald',
  Intermediate: 'info',
  Advanced: 'amber',
}

export default function AdminCourses() {
  const t = useT()
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [category, setCategory] = useState('All')

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<{ courses: CourseItem[] }>('/courses'),
    ]).then(([coursesResult]) => {
      if (!active) return
      if (coursesResult.status === 'fulfilled') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setCourses(coursesResult.value.courses)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(courses.map((course) => course.category))).sort()],
    [courses],
  )

  const visibleCourses = useMemo(
    () => (category === 'All' ? courses : courses.filter((course) => course.category === category)),
    [category, courses],
  )

  const lessonTotal = useMemo(
    () => courses.reduce((total, course) => total + course.lessonCount, 0),
    [courses],
  )

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('PLATFORM OPERATIONS')}
        title={t('Course catalogue')}
        description={t('Oversee every learning path, its owner and the coverage offered across trades.')}
        actions={<Badge tone="info">{t('{count} courses', { count: courses.length })}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('Learning paths')} value={courses.length} icon={BookOpenCheck} footnote={t('live catalogue')} />
        <StatCard label={t('Categories')} value={Math.max(0, categories.length - 1)} icon={LibraryBig} tone="info" footnote={t('across all trades')} />
        <StatCard label={t('Lessons published')} value={lessonTotal} icon={Clock3} tone="amber" footnote={t('available offline')} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="stack lg:col-span-2">
          <Card className="card-pad">
            <div role="group" aria-label={t('Filter courses by category')} className="flex flex-wrap items-center gap-2">
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

          {visibleCourses.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleCourses.map((course) => {
                const style = accentStyles[course.accent]
                return (
                  <Card key={course.id} className={cn('card-interactive border-l-[3px] p-5', style.strip)}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge tone={style.tone}>{course.code}</Badge>
                      <Badge tone={levelTone[course.level]}>{t(course.level)}</Badge>
                    </div>
                    <h3 className="mt-3 text-[14px] font-bold tracking-[-0.01em]">{course.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
                      {course.description || t('No catalogue description has been added yet.')}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-4 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1.5">
                        <LibraryBig size={13} className="shrink-0 text-emerald" aria-hidden />
                        <span className="truncate">{t(course.category)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <GraduationCap size={13} className="shrink-0 text-emerald" aria-hidden />
                        <span className="truncate">{course.trainer || t('Unassigned')}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpenCheck size={13} className="shrink-0 text-emerald" aria-hidden />
                        {t('{count} lessons', { count: course.lessonCount })}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={13} className="shrink-0 text-emerald" aria-hidden />
                        {course.duration || '—'}
                      </span>
                    </div>
                    {course.tags.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {course.tags.map((tag) => (
                          <span key={tag} className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', style.tile)}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={BookOpenCheck}
                title={t(courses.length ? 'No courses in this category' : 'No courses yet')}
                description={
                  courses.length
                    ? t('Choose another category to see the rest of the platform catalogue.')
                    : t('Published learning paths will appear here once they are added to the platform.')
                }
              />
            </Card>
          )}
        </div>

        <div className="stack">
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Catalogue control')}
              subtitle={t('Course records stay in sync with trainer and learner views.')}
            />
            <ul className="mt-4 space-y-3 text-[11px] leading-relaxed text-muted">
              <li>{t('Codes are unique and shown across progress, assessment and review tools.')}</li>
              <li>{t('Lesson counts and durations are maintained by trainers and reviewers.')}</li>
              <li>{t('Archive decisions should be confirmed with the responsible institution.')}</li>
            </ul>
          </Card>
          <AIInsightFeed
            context="admin-courses"
            fallback={[
              {
                title: t('Balance coverage across trades'),
                description: t('Compare lesson counts and assigned trainers by category before planning the next round of content work.'),
                factors: [
                  t('Codes connect courses to progress and assessment records'),
                  t('Unassigned trainers are a signal to review ownership'),
                  t('Short paths may need practical evidence added'),
                ],
              },
            ]}
          />
          <div className="h-[520px]">
            <AITutorPanel
              lessonTitle={t('Course catalogue oversight')}
              context="admin-courses"
              title={t('MENYA AI Catalogue Copilot')}
              role="admin"
              prompts={[
                t('Which courses need a trainer?'),
                t('Where is catalogue coverage thin?'),
                t('Summarise paths by category'),
              ]}
              exercises={[
                t('Draft a course review checklist'),
                t('Compare lesson counts across categories'),
                t('Suggest questions for a trainer handover'),
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
