import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardCheck,
  Clock3,
  Info,
  RotateCcw,
  Search,
  SearchX,
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
import { reviewerQueue } from '../../data/mock'
import { useT } from '../../i18n'
import { apiClient } from '../../lib/api'

interface ReviewItem {
  id: string
  learnerName: string
  artifact: string
  course: string
  criterion: string
  status: string
  createdAt: string
  decidedAt?: string
  feedback?: string
}

interface TrainerAnalytics {
  scope: string
  learners: number
  pendingReviews: number
}

type ReviewStatusFilter = 'all' | 'Pending' | 'In review' | 'Passed' | 'Changes requested'
type StatusTone = 'emerald' | 'amber' | 'info' | 'danger' | 'neutral'

interface ReviewRow {
  id: string
  learner: string
  artifact: string
  course: string
  criterion: string
  submitted: string
  status: string
  tone: StatusTone
  decision: string
}

function toneForStatus(status: string): StatusTone {
  if (status === 'Passed') return 'emerald'
  if (status === 'In review') return 'info'
  if (status === 'Changes requested') return 'danger'
  if (status === 'Pending') return 'amber'
  return 'neutral'
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function TrainerReviews() {
  const t = useT()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [analytics, setAnalytics] = useState<TrainerAnalytics | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>('all')

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<{ reviews: ReviewItem[] }>('/reviews'),
      apiClient.get<TrainerAnalytics>('/analytics'),
    ]).then(([reviewsResult, analyticsResult]) => {
      if (!active) return
      if (reviewsResult.status === 'fulfilled') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setReviews(reviewsResult.value.reviews)
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

  const rows: ReviewRow[] = reviews.length
    ? reviews.map((review) => ({
        id: review.id,
        learner: review.learnerName,
        artifact: review.artifact,
        course: review.course,
        criterion: review.criterion,
        submitted: new Date(review.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        status: review.status,
        tone: toneForStatus(review.status),
        decision:
          review.status === 'Passed' || review.status === 'Changes requested'
            ? review.decidedAt
              ? t('{status} · {date}', { status: t(review.status), date: shortDate(review.decidedAt) })
              : t(review.status)
            : t('With reviewer'),
      }))
    : reviewerQueue.map((item) => ({
        id: item.id,
        learner: item.learner,
        artifact: item.artifact,
        course: item.course,
        criterion: item.criterion,
        submitted: item.submitted,
        status: item.status,
        tone: toneForStatus(item.status),
        decision:
          item.status === 'Passed' || item.status === 'Changes requested'
            ? t(item.status)
            : t('With reviewer'),
      }))

  const visibleRows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesQuery =
        !term ||
        [row.learner, row.artifact, row.course, row.criterion].some((value) =>
          value.toLowerCase().includes(term),
        )
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [rows, query, statusFilter])

  const pendingCount =
    analytics?.pendingReviews ?? rows.filter((row) => row.status === 'Pending').length
  const inReviewCount = rows.filter((row) => row.status === 'In review').length
  const decidedCount = rows.filter(
    (row) => row.status === 'Passed' || row.status === 'Changes requested',
  ).length

  const filterTabs: TabItem<ReviewStatusFilter>[] = [
    { id: 'all', label: t('All'), count: rows.length },
    { id: 'Pending', label: t('Pending'), count: pendingCount },
    { id: 'In review', label: t('In review'), count: inReviewCount },
    { id: 'Passed', label: t('Passed'), count: rows.filter((row) => row.status === 'Passed').length },
    {
      id: 'Changes requested',
      label: t('Changes requested'),
      count: rows.filter((row) => row.status === 'Changes requested').length,
    },
  ]

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
  }

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('TEACHER / TRAINER WORKSPACE')}
        title={t('Submission oversight')}
        description={t('Follow learner evidence from upload to reviewer decision — without changing outcomes yourself.')}
        actions={<Badge tone="amber" dot>{t('Read-only view')}</Badge>}
      />

      <Card className="flex items-start gap-3 border-info/25 bg-info-soft/55 p-5 dark:bg-info-soft/25">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-info text-white">
          <Info size={18} aria-hidden />
        </span>
        <div>
          <p className="eyebrow text-info">{t('Decision authority')}</p>
          <p className="mt-1 text-[13px] font-semibold">{t('Reviewers make the final pass or change decisions')}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {t('Trainers monitor the flow and the criterion being assessed. Only reviewers record pass or change outcomes in their own queue; this page is observation only.')}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Submissions')}
          value={rows.length}
          change={t('in the oversight view')}
          icon={ClipboardCheck}
        />
        <StatCard
          label={t('Pending')}
          value={pendingCount}
          change={t('awaiting review')}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          label={t('In review')}
          value={inReviewCount}
          change={t('currently open')}
          icon={Search}
          tone="info"
        />
        <StatCard
          label={t('Decided')}
          value={decidedCount}
          change={t('by reviewers')}
          icon={ClipboardCheck}
          tone="emerald"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="stack lg:col-span-2">
          <Card className="p-4 sm:p-5">
            <div className="relative">
              <label className="sr-only" htmlFor="review-oversight-search">
                {t('Search submissions')}
              </label>
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="review-oversight-search"
                className="input pl-10"
                type="search"
                placeholder={t('Search by learner, artifact, course or criterion...')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="mt-4">
              <Tabs items={filterTabs} active={statusFilter} onChange={setStatusFilter} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <CardHeader
                title={t('Submission flow')}
                subtitle={t('Evidence, criterion and review status at a glance.')}
                action={
                  <Badge tone="neutral">
                    {t('{visible} of {total}', { visible: visibleRows.length, total: rows.length })}
                  </Badge>
                }
              />
            </div>

            {rows.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title={t('No submissions yet')}
                description={t('Learner artifacts will appear here as soon as they are uploaded for review.')}
              />
            ) : visibleRows.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title={t('No submissions match these filters')}
                description={t('Try another status or search term to find the artifact you are looking for.')}
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
                      <th scope="col">{t('Artifact')}</th>
                      <th scope="col">{t('Course')}</th>
                      <th scope="col">{t('Criterion')}</th>
                      <th scope="col">{t('Submitted')}</th>
                      <th scope="col">{t('Status')}</th>
                      <th scope="col">{t('Final decision')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.learner} size="sm" />
                            <span className="font-semibold whitespace-nowrap">{row.learner}</span>
                          </div>
                        </td>
                        <td className="font-medium whitespace-nowrap">{row.artifact}</td>
                        <td className="whitespace-nowrap text-muted">{row.course}</td>
                        <td className="whitespace-nowrap text-muted">{row.criterion}</td>
                        <td className="whitespace-nowrap text-muted">{row.submitted}</td>
                        <td>
                          <Badge tone={row.tone} dot>
                            {t(row.status)}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap text-[11px] text-muted">{row.decision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="stack">
          <AIInsightFeed
            context="trainer-reviews"
            fallback={[
              {
                title: t('Clear the oldest submissions first'),
                description: t('{count} artifacts are pending. Focus on the earliest work so learners get feedback while the task is still fresh.', { count: pendingCount }),
                factors: [
                  t('{count} items are in review.', { count: inReviewCount }),
                  t('{count} items have a reviewer decision.', { count: decidedCount }),
                  t('Reviewers make final pass or change decisions.'),
                ],
                tone: 'amber',
              },
            ]}
          />
          <Card className="p-5 sm:p-6">
            <CardHeader title={t('Criteria in focus')} subtitle={t('What reviewers check against the shared rubric')} />
            <ul className="mt-4 space-y-3">
              {[
                'Safety steps are explicit and correctly ordered',
                'Ratings match the measured load',
                'Evidence is legible and relevant',
                'Reflection explains any correction made',
              ].map((criterion) => (
                <li key={criterion} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald" aria-hidden />
                  {t(criterion)}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-4 text-[11px] text-muted">
              {t('Use the criterion column to plan teaching, not to record a decision.')}
            </p>
          </Card>
          <div className="h-[620px]">
            <AITutorPanel
              lessonTitle={t('Submission oversight')}
              context={t('trainer submission oversight')}
              title={t('Submission flow copilot')}
              prompts={[
                t('Which submissions are oldest?'),
                t('What criteria need reteaching?'),
                t('How can I prepare learners for the next review?'),
              ]}
              exercises={[
                t('Summarise the submission flow for this week'),
                t('Group artifacts by the criterion they target'),
                t('Draft a reminder about evidence quality'),
              ]}
              role="trainer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
