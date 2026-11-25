import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Gauge,
  MessageSquareText,
  TrendingUp,
  XCircle,
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
  Tabs,
} from '../../components/ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'
import { apiClient } from '../../lib/api'

type ReviewStatus = 'Pending' | 'In review' | 'Passed' | 'Changes requested'
type HistoryFilter = 'all' | 'passed' | 'changes'

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

function decisionTime(item: QueueItem) {
  const time = Date.parse(item.decidedAt ?? item.createdAt)
  return Number.isNaN(time) ? 0 : time
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ReviewerHistory() {
  const navigate = useNavigate()
  const { notify } = useApp()
  const t = useT()
  const [history, setHistory] = useState<QueueItem[]>([])
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [passedResult, changesResult] = await Promise.all([
        apiClient.get<{ reviews: QueueItem[] }>('/reviews?status=Passed'),
        apiClient.get<{ reviews: QueueItem[] }>('/reviews?status=Changes%20requested'),
      ])
      const combined = [...passedResult.reviews, ...changesResult.reviews].sort(
        (a, b) => decisionTime(b) - decisionTime(a),
      )
      setHistory(combined)
    } catch {
      notify(t('Could not load decision history'), t('Please refresh the page and try again.'), 'error')
    } finally {
      setLoading(false)
    }
  }, [notify, t])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
    void load()
  }, [load])

  const passedCount = history.filter((item) => item.status === 'Passed').length
  const changesCount = history.filter((item) => item.status === 'Changes requested').length
  const passRate = history.length ? Math.round((passedCount / history.length) * 100) : 0

  const visible = useMemo(
    () =>
      history.filter((item) => {
        if (filter === 'passed') return item.status === 'Passed'
        if (filter === 'changes') return item.status === 'Changes requested'
        return true
      }),
    [history, filter],
  )

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('QUALITY ASSURANCE')}
        title={t('Decision history')}
        description={t('Review every recorded pass and change request, with the feedback learners received.')}
        actions={
          <Button variant="secondary" icon={ClipboardCheck} onClick={() => navigate('/reviewer/queue')}>
            {t('Back to queue')}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Decisions logged')}
          value={history.length}
          change={t('all time')}
          icon={ClipboardList}
        />
        <StatCard label={t('Passed')} value={passedCount} change={t('artifacts accepted')} icon={CheckCircle2} />
        <StatCard
          label={t('Changes requested')}
          value={changesCount}
          change={t('awaiting learner action')}
          icon={XCircle}
          tone="amber"
        />
        <StatCard label={t('Pass rate')} value={`${passRate}%`} change={t('across logged decisions')} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Decision log')}
              subtitle={t('Most recent passes and change requests first.')}
              icon={ClipboardList}
              action={<Badge tone="neutral">{t('{count} shown', { count: visible.length })}</Badge>}
            />
            <Tabs<HistoryFilter>
              className="mt-4"
              items={[
                { id: 'all', label: t('All decisions'), count: history.length },
                { id: 'passed', label: t('Passed'), count: passedCount },
                { id: 'changes', label: t('Changes requested'), count: changesCount },
              ]}
              active={filter}
              onChange={setFilter}
            />
            {visible.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={Gauge}
                  title={t('No decisions in this view')}
                  description={t('Passed and change-requested artifacts will appear here once a decision is recorded.')}
                  action={
                    <Button variant="secondary" onClick={() => void load()} disabled={loading}>
                      {t('Refresh history')}
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="mt-5 divide-y divide-line">
                {visible.map((item) => (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={item.learnerName} size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold">{item.artifact}</p>
                          <p className="truncate text-[11px] text-muted">
                            {item.learnerName} · {item.course}
                          </p>
                        </div>
                      </div>
                      <Badge tone={item.status === 'Passed' ? 'emerald' : 'amber'} dot>
                        {t(item.status)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <Clock3 size={12} aria-hidden /> {t('Decided {date}', { date: formatDate(item.decidedAt ?? item.createdAt) })}
                      </span>
                      <span>
                        {t('Criterion:')} <span className="font-semibold text-ink">{item.criterion}</span>
                      </span>
                    </div>
                    <div className="mt-3 rounded-[10px] border border-line bg-surface-alt/60 p-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                        <MessageSquareText size={12} aria-hidden /> {t('Feedback recorded')}
                      </p>
                      <p className="mt-1 text-[12px] leading-relaxed">
                        {item.feedback ?? t('No written feedback was recorded with this decision.')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="stack">
          <AIInsightFeed context="reviewer-history" />

          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Decision quality')}
              subtitle={t('A quick read on recorded outcomes.')}
              icon={CheckCircle2}
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
                  <span className="font-bold tabular-nums">{changesCount}</span>
                </div>
                <ProgressBar value={100 - passRate} tone="amber" showValue />
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-4 text-[11px] leading-relaxed text-muted">
              {t('Use the log to keep feedback specific and decisions consistent across courses.')}
            </p>
          </Card>

          <div className="h-[560px]">
            <AITutorPanel
              lessonTitle={t('Decision history analysis')}
              context="reviewer-history-copilot"
              title={t('Decision history copilot')}
              role="reviewer"
              prompts={[
                t('What patterns appear in my change requests?'),
                t('Which feedback needs clearer wording?'),
                t('How consistent are my decisions?'),
              ]}
              exercises={[
                t('Summarise the most common reason for a change request'),
                t('Suggest two follow-up notes for learners who need another attempt'),
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
