import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  ClipboardCheck,
  Clock3,
  Eye,
  Gauge,
  ListChecks,
  X,
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
type DecisionStatus = 'Passed' | 'Changes requested'

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

const rubric = [
  'Safety steps are explicit and correctly ordered',
  'Cable and device ratings match the measured load',
  'Evidence (diagram or photo) is legible and relevant',
  'Reflection explains any correction that was made',
]

const statusTone = (status: ReviewStatus): 'emerald' | 'amber' | 'info' | 'neutral' => {
  if (status === 'Passed') return 'emerald'
  if (status === 'Changes requested') return 'amber'
  if (status === 'In review') return 'info'
  return 'neutral'
}

export default function ReviewerQueue() {
  const { notify } = useApp()
  const t = useT()
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [feedbackById, setFeedbackById] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [reviewsResult, statsResult] = await Promise.all([
        apiClient.get<{ reviews: QueueItem[] }>('/reviews'),
        apiClient.get<ReviewStats>('/reviews/stats'),
      ])
      setQueue(reviewsResult.reviews)
      setStats(statsResult)
    } catch {
      notify(t('Could not load queue'), t('Please refresh the page and try again.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [notify, t])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
    void load()
  }, [load])

  const active = queue
    .filter((item) => item.status === 'Pending' || item.status === 'In review')
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))

  const decide = async (item: QueueItem, status: DecisionStatus) => {
    if (busyId) return
    setBusyId(item.id)
    const note = feedbackById[item.id]?.trim()

    try {
      const { review } = await apiClient.patch<{ review: QueueItem }>(`/reviews/${item.id}`, {
        status,
        ...(note ? { feedback: note } : {}),
      })
      setQueue((current) => current.map((entry) => (entry.id === review.id ? review : entry)))
      const refreshed = await apiClient.get<ReviewStats>('/reviews/stats')
      setStats(refreshed)
      setFeedbackById((current) => ({ ...current, [item.id]: '' }))
      notify(
        t(status === 'Passed' ? 'Artifact passed' : 'Changes requested'),
        t('{artifact} · {name}', { artifact: item.artifact, name: item.learnerName }),
        status === 'Passed' ? 'success' : 'info',
      )
    } catch {
      notify(t('Could not record decision'), t('Your decision was not saved. Please try again.'), 'error')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('QUALITY ASSURANCE')}
        title={t('Reviewer queue')}
        description={t('Assess learner evidence against the shared rubric and give feedback that moves them forward.')}
        actions={
          <Button variant="ghost" icon={ClipboardCheck} onClick={() => void load()} disabled={loading}>
            {t('Refresh queue')}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Pending items')}
          value={stats?.pending ?? queue.filter((item) => item.status === 'Pending').length}
          change={t('awaiting a decision')}
          icon={ClipboardCheck}
          tone="amber"
        />
        <StatCard
          label={t('In review')}
          value={stats?.inReview ?? queue.filter((item) => item.status === 'In review').length}
          change={t('currently open')}
          icon={Eye}
          tone="info"
        />
        <StatCard label={t('Passed')} value={stats?.passed ?? 0} change={t('this term')} icon={Check} />
        <StatCard
          label={t('Changes requested')}
          value={stats?.changesRequested ?? 0}
          change={t('awaiting learner action')}
          icon={X}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {active.length === 0 ? (
            <Card>
              <EmptyState
                icon={Gauge}
                title={t('Queue is clear')}
                description={t('Every artifact has a decision. New submissions will appear here as soon as learners upload them.')}
                action={
                  <Button variant="secondary" onClick={() => void load()} disabled={loading}>
                    {t('Refresh queue')}
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((item) => (
                <Card key={item.id} className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={item.learnerName} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold">{item.learnerName}</p>
                        <p className="truncate text-[11px] text-muted">{item.course}</p>
                      </div>
                    </div>
                    <Badge tone={statusTone(item.status)} dot>{t(item.status)}</Badge>
                  </div>

                  <h3 className="mt-4 text-[14px] font-bold leading-snug">{item.artifact}</h3>
                  <dl className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-1 text-muted">
                        <Clock3 size={11} aria-hidden /> {t('Submitted')}
                      </dt>
                      <dd className="font-semibold">
                        {new Date(item.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-muted">{t('Criterion')}</dt>
                      <dd className="text-right font-semibold">{item.criterion}</dd>
                    </div>
                  </dl>

                  <textarea
                    rows={2}
                    value={feedbackById[item.id] ?? ''}
                    onChange={(event) =>
                      setFeedbackById((current) => ({ ...current, [item.id]: event.target.value }))
                    }
                    placeholder={t('Add feedback for the learner (optional)')}
                    aria-label={t('Feedback for {artifact}', { artifact: item.artifact })}
                    className="input mt-4 resize-none text-[11px]"
                  />

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={Eye}
                      onClick={() => notify(t('Opening evidence'), t('{artifact} · {name}', { artifact: item.artifact, name: item.learnerName }), 'info')}
                    >
                      {t('Open evidence')}
                    </Button>
                    <Button
                      size="sm"
                      icon={Check}
                      disabled={busyId === item.id}
                      onClick={() => void decide(item, 'Passed')}
                    >
                      {t('Pass')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={X}
                      disabled={busyId === item.id}
                      onClick={() => void decide(item, 'Changes requested')}
                    >
                      {t('Request changes')}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="stack">
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Assessment rubric')}
              subtitle={t('Apply the same four checks to every artifact.')}
              icon={ListChecks}
            />
            <ol className="mt-4 space-y-3">
              {rubric.map((criterion, index) => (
                <li key={criterion} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-alt text-[11px] font-bold text-muted">
                    {index + 1}
                  </span>
                  <span className="text-[12px] leading-relaxed">{t(criterion)}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-2 text-[11px] font-semibold text-muted">{t('Term pass rate')}</p>
              <ProgressBar value={stats?.passRate ?? 0} tone="emerald" showValue />
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              {t('Record a decision only after the evidence matches the criterion being assessed.')}
            </p>
          </Card>

          <AIInsightFeed context="reviewer-queue" />

          <div className="h-[560px]">
            <AITutorPanel
              lessonTitle={t('Review queue triage')}
              context="reviewer-queue-copilot"
              title={t('Assessment copilot')}
              role="reviewer"
              prompts={[
                t('Is this evidence enough to pass?'),
                t('Help me write clear change-request feedback'),
                t('Which rubric criterion applies here?'),
              ]}
              exercises={[
                t('Draft a neutral two-sentence feedback note'),
                t('List the safety checks I should verify before passing'),
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
