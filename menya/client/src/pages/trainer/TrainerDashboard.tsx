import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardCheck,
  Target,
  UserCheck,
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
  ProgressBar,
  StatCard,
} from '../../components/ui/Primitives'
import { useAuth } from '../../context/AuthContext'
import { trainerData } from '../../data/mock'
import { useT } from '../../i18n'
import { apiClient } from '../../lib/api'

interface TrainerAnalytics {
  scope: string
  learners: number
  pendingReviews: number
  courses: Array<{ code: string; learners: number; avgMastery: number }>
}

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

type StatusTone = 'emerald' | 'amber' | 'info' | 'neutral'

interface SubmissionRow {
  id: string
  learner: string
  artifact: string
  course: string
  criterion: string
  submitted: string
  status: string
  tone: StatusTone
}

function toneForStatus(status: string): StatusTone {
  if (status === 'Passed') return 'emerald'
  if (status === 'In review') return 'info'
  if (status === 'Pending' || status === 'Changes requested') return 'amber'
  return 'neutral'
}

const quickLinks = [
  { label: 'Cohort learners', to: '/trainer/cohorts', icon: UsersRound },
  { label: 'Course oversight', to: '/trainer/courses', icon: BookOpenCheck },
  { label: 'Submission oversight', to: '/trainer/reviews', icon: ClipboardCheck },
] as const

export default function TrainerDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const t = useT()
  const [analytics, setAnalytics] = useState<TrainerAnalytics | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<TrainerAnalytics>('/analytics'),
      apiClient.get<{ reviews: ReviewItem[] }>('/reviews'),
    ]).then(([analyticsResult, reviewsResult]) => {
      if (!active) return
      if (analyticsResult.status === 'fulfilled' && analyticsResult.value.scope === 'trainer') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setAnalytics(analyticsResult.value)
      }
      if (reviewsResult.status === 'fulfilled') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setReviews(reviewsResult.value.reviews)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const learners = analytics?.learners ?? trainerData.learners
  const activeLearners = Math.min(learners, Math.round(learners * 0.85))
  const engagement = learners ? Math.round((activeLearners / learners) * 100) : 0
  const averageMastery = analytics?.courses.length
    ? Math.round(
        analytics.courses.reduce((sum, course) => sum + course.avgMastery, 0) /
          analytics.courses.length,
      )
    : trainerData.avgMastery
  const pendingFromReviews = reviews.filter(
    (review) => review.status === 'Pending' || review.status === 'In review',
  ).length
  const fallbackPending = trainerData.submissions.filter(
    (item) => item.status === 'Needs review',
  ).length
  const needsReview =
    analytics?.pendingReviews ?? (reviews.length ? pendingFromReviews : fallbackPending)

  const submissions: SubmissionRow[] = reviews.length
    ? reviews.slice(0, 6).map((review) => ({
        id: review.id,
        learner: review.learnerName,
        artifact: review.artifact,
        course: review.course,
        criterion: review.criterion,
        submitted: new Date(review.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
        }),
        status: review.status,
        tone: toneForStatus(review.status),
      }))
    : trainerData.submissions.slice(0, 6).map((item) => ({
        id: item.id,
        learner: item.learner,
        artifact: item.task,
        course: item.course,
        criterion: t('Practical evidence'),
        submitted: item.submitted,
        status: item.status,
        tone: item.status === 'Needs review' ? 'amber' : 'emerald',
      }))

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('TEACHER / TRAINER WORKSPACE')}
        title={t('Trainer dashboard')}
        description={t('A teaching overview of cohort health, course mastery and the evidence moving through review.')}
        actions={<Badge tone="emerald" dot>{t('Trainer view')}</Badge>}
      />

      <Card className="flex flex-col gap-4 border-emerald/25 bg-emerald-soft/55 p-5 dark:bg-emerald-soft/25 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-solid text-white">
            <UsersRound size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="eyebrow text-emerald-dark dark:text-emerald">{t('Cohort health')}</p>
            <h2 className="mt-0.5 text-[15px] font-bold">{user?.program ?? trainerData.cohort}</h2>
            <p className="mt-1 text-xs text-muted">
              {t('{learners} learners enrolled · {activeLearners} active this week · {needsReview} submissions in the review flow.', {
                learners,
                activeLearners,
                needsReview,
              })}
            </p>
            <ProgressBar value={engagement} className="mt-3 max-w-xs" tone="emerald" showValue />
          </div>
        </div>
        <Badge tone="emerald" dot>
          {t('Engagement steady')}
        </Badge>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Learners')}
          value={learners}
          change={t('+6 this term')}
          footnote={t('cohort roster')}
          icon={UsersRound}
        />
        <StatCard
          label={t('Active learners')}
          value={activeLearners}
          change={t('{percent}% engaged', { percent: engagement })}
          footnote={t('last 7 days')}
          icon={UserCheck}
          tone="info"
        />
        <StatCard
          label={t('Average mastery')}
          value={`${averageMastery}%`}
          change={t('+4 pts')}
          footnote={t('across courses')}
          icon={Target}
        />
        <StatCard
          label={t('Submissions needing review')}
          value={needsReview}
          change={t('awaiting reviewer feedback')}
          icon={ClipboardCheck}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="stack lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <CardHeader
                title={t('Recent submissions')}
                subtitle={t('Learner evidence moving through the review flow. Final decisions sit with reviewers.')}
                action={<Badge tone="amber">{t('{count} to review', { count: needsReview })}</Badge>}
              />
            </div>
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
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={item.learner} size="sm" />
                          <span className="font-semibold whitespace-nowrap">{item.learner}</span>
                        </div>
                      </td>
                      <td className="font-medium whitespace-nowrap">{item.artifact}</td>
                      <td className="whitespace-nowrap text-muted">{item.course}</td>
                      <td className="whitespace-nowrap text-muted">{item.criterion}</td>
                      <td className="whitespace-nowrap text-muted">{item.submitted}</td>
                      <td>
                        <Badge tone={item.tone} dot>
                          {t(item.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('Teaching shortcuts')}
              subtitle={t('Move between the four areas of your trainer workplace.')}
            />
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {quickLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Button
                    key={link.to}
                    variant="secondary"
                    icon={Icon}
                    iconRight={ArrowRight}
                    className="justify-start"
                    onClick={() => navigate(link.to)}
                  >
                    {t(link.label)}
                  </Button>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="stack">
          <AIInsightFeed
            context="trainer-dashboard"
            fallback={[
              {
                title: t('A nudge could lift this cohort'),
                description: t('{count} submissions are in the review flow and circuits remain the weakest skill. A short check-in plus targeted practice is the fastest route back on track.', { count: needsReview }),
                factors: [
                  t('{active} of {total} learners are active this week.', { active: activeLearners, total: learners }),
                  t('Circuit calculations average below the cohort target.'),
                  t('Reviewers make the final pass or change decisions.'),
                ],
                tone: 'emerald',
              },
            ]}
          />
          <div className="h-[620px]">
            <AITutorPanel
              lessonTitle={t('Trainer dashboard')}
              context={t('trainer dashboard overview')}
              title={t('Trainer briefing copilot')}
              prompts={[
                t('What needs my attention today?'),
                t('Where is cohort engagement slipping?'),
                t('How should I prepare the next class check-in?'),
              ]}
              exercises={[
                t('Draft a three-line cohort update for my team'),
                t('List follow-ups for quiet learners'),
                t('Summarise the submission flow in plain language'),
              ]}
              role="trainer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
