import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  Gauge,
  History,
  ListChecks,
  TrendingUp,
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
  ProgressBar,
  StatCard,
} from '../../components/ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'
import { apiClient } from '../../lib/api'

type ReviewStatus = 'Pending' | 'In review' | 'Passed' | 'Changes requested'

interface QueueItem {
  id: string
  learnerName: string
  artifact: string
  course: string
  criterion: string
  status: ReviewStatus
  createdAt: string
  decidedAt?: string
  feedback?: string
}

interface ReviewStats {
  pending: number
  inReview: number
  passed: number
  changesRequested: number
  passRate: number
}

const statusTone = (status: ReviewStatus): 'emerald' | 'amber' | 'info' | 'neutral' => {
  if (status === 'Passed') return 'emerald'
  if (status === 'Changes requested') return 'amber'
  if (status === 'In review') return 'info'
  return 'neutral'
}

const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

export default function ReviewerDashboard() {
  const navigate = useNavigate()
  const { notify } = useApp()
  const t = useT()
  const [reviews, setReviews] = useState<QueueItem[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [reviewsResult, statsResult] = await Promise.all([
        apiClient.get<{ reviews: QueueItem[] }>('/reviews'),
        apiClient.get<ReviewStats>('/reviews/stats'),
      ])
      setReviews(reviewsResult.reviews)
      setStats(statsResult)
    } catch {
      notify(t('Could not load review overview'), t('Please refresh the page and try again.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [notify, t])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
    void load()
  }, [load])

  const priority = reviews
    .filter((item) => item.status === 'Pending' || item.status === 'In review')
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(0, 4)

  const recent = reviews
    .filter((item) => item.status === 'Passed' || item.status === 'Changes requested')
    .sort((a, b) => Date.parse(b.decidedAt ?? b.createdAt) - Date.parse(a.decidedAt ?? a.createdAt))
    .slice(0, 4)

  const pendingCount = stats?.pending ?? reviews.filter((item) => item.status === 'Pending').length
  const inReviewCount = stats?.inReview ?? reviews.filter((item) => item.status === 'In review').length
  const passedCount = stats?.passed ?? reviews.filter((item) => item.status === 'Passed').length
  const passRate = stats?.passRate ?? 0

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('QUALITY ASSURANCE')}
        title={t('Reviewer overview')}
        description={t('Track queue pressure, recent decisions and consistency signals before you open the next artifact.')}
        actions={
          <>
            <Button icon={ClipboardCheck} onClick={() => navigate('/reviewer/queue')}>
              {t('Review queue')}
            </Button>
            <Button variant="secondary" icon={History} onClick={() => navigate('/reviewer/history')}>
              {t('Decision history')}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Waiting for review')}
          value={pendingCount}
          change={t('awaiting a decision')}
          icon={ClipboardCheck}
          tone="amber"
        />
        <StatCard label={t('In review')} value={inReviewCount} change={t('currently open')} icon={Eye} tone="info" />
        <StatCard label={t('Passed')} value={passedCount} change={t('this term')} icon={CheckCircle2} />
        <StatCard
          label={t('Pass rate')}
          value={`${passRate}%`}
          change={t('quality signal')}
          footnote={t('recorded decisions')}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="stack lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Priority queue')}
              subtitle={t('Oldest pending and in-review artifacts appear first.')}
              icon={ListChecks}
              action={<Badge tone="amber" dot>{t('{count} to review', { count: priority.length })}</Badge>}
            />
            {priority.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Gauge}
                  title={t('Nothing needs attention')}
                  description={t('Every artifact has a decision. New submissions will appear here as soon as learners upload them.')}
                  action={
                    <Button variant="secondary" onClick={() => void load()} disabled={loading}>
                      {t('Refresh overview')}
                    </Button>
                  }
                />
              </div>
            ) : (
              <>
                <ul className="mt-4 divide-y divide-line">
                  {priority.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={item.learnerName} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-bold">{item.artifact}</p>
                          <p className="truncate text-[11px] text-muted">
                            {item.learnerName} · {item.course}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-muted">{item.criterion}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <Badge tone={statusTone(item.status)} dot>{t(item.status)}</Badge>
                        <span className="flex items-center gap-1 text-[10px] text-muted">
                          <Clock3 size={11} aria-hidden /> {dateLabel(item.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  iconRight={ArrowRight}
                  className="mt-4"
                  onClick={() => navigate('/reviewer/queue')}
                >
                  {t('Open full queue')}
                </Button>
              </>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Recent decisions')}
              subtitle={t('The latest passes and change requests recorded by reviewers.')}
              icon={CheckCircle2}
              action={<Badge tone="neutral">{t('{count} logged', { count: recent.length })}</Badge>}
            />
            {recent.length === 0 ? (
              <p className="mt-4 text-[11px] text-muted">{t('No decisions have been recorded yet.')}</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {recent.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold">{item.artifact}</p>
                        <p className="truncate text-[11px] text-muted">
                          {t('{name} · decided {date}', {
                            name: item.learnerName,
                            date: dateLabel(item.decidedAt ?? item.createdAt),
                          })}
                        </p>
                      </div>
                      <Badge tone={statusTone(item.status)} dot>{t(item.status)}</Badge>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted">
                      {item.feedback ?? t('No written feedback was recorded with this decision.')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="stack">
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Decision balance')}
              subtitle={t('How outcomes are landing across recorded reviews.')}
              icon={TrendingUp}
            />
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted">{t('Passed')}</span>
                  <span className="font-bold tabular-nums">{passedCount}</span>
                </div>
                <ProgressBar value={passRate} tone="emerald" showValue />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted">{t('Changes requested')}</span>
                  <span className="font-bold tabular-nums">{stats?.changesRequested ?? 0}</span>
                </div>
                <ProgressBar value={100 - passRate} tone="amber" showValue />
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
              {t('Apply the shared rubric consistently before recording an outcome.')}
            </p>
          </Card>

          <AIInsightFeed context="reviewer-dashboard" />

          <div className="h-[540px]">
            <AITutorPanel
              lessonTitle={t('Reviewer overview workspace')}
              context="reviewer-dashboard-copilot"
              title={t('Review overview copilot')}
              role="reviewer"
              prompts={[
                t('Where is the biggest queue bottleneck?'),
                t('Which criterion needs tighter checks?'),
                t('Summarise the latest review decisions'),
              ]}
              exercises={[
                t('Draft a consistency checklist for the next five reviews'),
                t('Flag any evidence pattern that needs trainer follow-up'),
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
