import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardCheck,
  GraduationCap,
  RotateCcw,
  Search,
  SearchX,
  UserCheck,
  UserX,
  UsersRound,
} from 'lucide-react'
import { AIInsightFeed } from '../../components/ai/AIInsight'
import { AITutorPanel } from '../../components/ai/AITutorPanel'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  StatCard,
  Tabs,
  type TabItem,
} from '../../components/ui/Primitives'
import { useT } from '../../i18n'
import { apiClient } from '../../lib/api'
import { cn } from '../../lib/utils'

interface StudentItem {
  id: string
  name: string
  email: string
  program: string
  school: string
  active: boolean
}

interface TrainerAnalytics {
  scope: string
  learners: number
  pendingReviews: number
}

type LearnerFilter = 'all' | 'active' | 'inactive'

export default function TrainerCohorts() {
  const t = useT()
  const [learners, setLearners] = useState<StudentItem[]>([])
  const [analytics, setAnalytics] = useState<TrainerAnalytics | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<LearnerFilter>('all')
  const [program, setProgram] = useState('All')

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<{ students: StudentItem[] }>('/users/students'),
      apiClient.get<TrainerAnalytics>('/analytics'),
    ]).then(([studentsResult, analyticsResult]) => {
      if (!active) return
      if (studentsResult.status === 'fulfilled') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setLearners(studentsResult.value.students)
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

  const activeCount = learners.length
    ? learners.filter((learner) => learner.active).length
    : (analytics?.learners ?? 0)
  const inactiveCount = Math.max(0, learners.length - activeCount)
  const programCount = new Set(learners.map((learner) => learner.program)).size
  const programs = useMemo(
    () => ['All', ...Array.from(new Set(learners.map((learner) => learner.program)))],
    [learners],
  )

  const visibleLearners = useMemo(() => {
    const term = query.trim().toLowerCase()
    return learners.filter((learner) => {
      const matchesQuery =
        !term ||
        [learner.name, learner.email, learner.program, learner.school].some((value) =>
          value.toLowerCase().includes(term),
        )
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? learner.active : !learner.active)
      const matchesProgram = program === 'All' || learner.program === program
      return matchesQuery && matchesStatus && matchesProgram
    })
  }, [learners, query, statusFilter, program])

  const filterTabs: TabItem<LearnerFilter>[] = [
    { id: 'all', label: t('All learners'), count: learners.length },
    { id: 'active', label: t('Active'), count: activeCount },
    { id: 'inactive', label: t('Inactive'), count: inactiveCount },
  ]

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setProgram('All')
  }

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('TEACHER / TRAINER WORKSPACE')}
        title={t('Cohort learners')}
        description={t('See who is engaged, who needs a check-in and which programs your learners are enrolled in.')}
        actions={<Badge tone="info" dot>{t('{count} on roster', { count: learners.length })}</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Roster learners')}
          value={learners.length}
          change={t('assigned to this trainer')}
          icon={UsersRound}
        />
        <StatCard
          label={t('Active')}
          value={activeCount}
          change={t('last 7 days')}
          icon={UserCheck}
          tone="info"
        />
        <StatCard
          label={t('Need a check-in')}
          value={inactiveCount}
          change={t('currently inactive')}
          icon={UserX}
          tone="amber"
        />
        <StatCard
          label={t('Programs')}
          value={programCount}
          change={t('across the cohort')}
          icon={GraduationCap}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="stack lg:col-span-2">
          {learners.length > 0 && (
            <Card className="p-4 sm:p-5">
              <div className="relative">
                <label className="sr-only" htmlFor="cohort-search">
                  {t('Search learners')}
                </label>
                <Search
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                  aria-hidden
                />
                <input
                  id="cohort-search"
                  className="input pl-10"
                  type="search"
                  placeholder={t('Search by name, email, program or school...')}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              <div className="mt-4">
                <Tabs items={filterTabs} active={statusFilter} onChange={setStatusFilter} />
              </div>

              <div
                role="group"
                aria-label={t('Filter learners by program')}
                className="mt-4 flex flex-wrap items-center gap-2"
              >
                <span className="eyebrow mr-1">{t('Program')}</span>
                {programs.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn('chip', program === item && 'chip-active')}
                    aria-pressed={program === item}
                    onClick={() => setProgram(item)}
                  >
                    {t(item)}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <CardHeader
                title={t('Learner roster')}
                subtitle={t('Read-only cohort view — account changes are handled by administrators.')}
                action={
                  <Badge tone="neutral">
                    {t('{visible} of {total}', { visible: visibleLearners.length, total: learners.length })}
                  </Badge>
                }
              />
            </div>

            {learners.length === 0 ? (
              <EmptyState
                icon={UsersRound}
                title={t('No learners in this cohort yet')}
                description={t('Learners appear here once they are enrolled and assigned to a program. Check back after the next intake.')}
              />
            ) : visibleLearners.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={t('No learners match these filters')}
                description={t('Try a different search term, activity status or program to find the learner you need.')}
                action={
                  <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
                    {t('Reset filters')}
                  </Button>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('Learner')}</th>
                      <th scope="col">{t('Program')}</th>
                      <th scope="col">{t('School')}</th>
                      <th scope="col">{t('Activity')}</th>
                      <th scope="col">{t('Follow-up')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLearners.map((learner) => (
                      <tr key={learner.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={learner.name} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold whitespace-nowrap">{learner.name}</p>
                              <p className="text-[11px] text-muted">{learner.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-muted">{learner.program}</td>
                        <td className="whitespace-nowrap text-muted">{learner.school}</td>
                        <td>
                          <Badge tone={learner.active ? 'emerald' : 'neutral'} dot>
                            {t(learner.active ? 'Active' : 'Inactive')}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={learner.active ? 'neutral' : 'amber'}>
                            {t(learner.active ? 'On track' : 'Check in')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="flex items-start gap-3 border-info/25 bg-info-soft/55 p-5 dark:bg-info-soft/25">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info text-white">
              <ClipboardCheck size={18} aria-hidden />
            </span>
            <div>
              <p className="eyebrow text-info">{t('Teaching note')}</p>
              <p className="mt-1 text-[13px] font-semibold">{t('Use the roster to plan support')}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t('{count} submissions are in the review flow. Pair a check-in with the relevant course when a learner goes quiet.', {
                  count: analytics?.pendingReviews ?? 0,
                })}
              </p>
            </div>
          </Card>
        </div>

        <div className="stack">
          <AIInsightFeed
            context="trainer-cohorts"
            fallback={[
              {
                title: t('Prioritise a check-in with quiet learners'),
                description: t('{count} learners are inactive. A short targeted conversation is more useful than a broad announcement.', { count: inactiveCount }),
                factors: [
                  t('{count} learners on the roster.', { count: learners.length }),
                  t('{count} programs represented in this cohort.', { count: programCount }),
                  t('{count} submissions are waiting in the review flow.', { count: analytics?.pendingReviews ?? 0 }),
                ],
                tone: 'amber',
              },
            ]}
          />
          <div className="h-[620px]">
            <AITutorPanel
              lessonTitle={t('Cohort learners')}
              context={t('trainer cohort roster')}
              title={t('Cohort coaching copilot')}
              prompts={[
                t('Who should I check in with first?'),
                t('How can I support inactive learners?'),
                t('What patterns do you see across programs?'),
              ]}
              exercises={[
                t('Draft a friendly check-in message'),
                t('Group learners by the support they need'),
                t('Summarise this roster for a staff meeting'),
              ]}
              role="trainer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
