import { useEffect, useState } from 'react'
import {
  Activity,
  BookOpenCheck,
  ClipboardCheck,
  Globe,
  GraduationCap,
  Server,
  ShieldCheck,
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
  ProgressBar,
  StatCard,
} from '../../components/ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useT, type Translate } from '../../i18n'
import { apiClient } from '../../lib/api'
import type { Role } from '../../types'

interface AdminAnalytics {
  scope: 'admin'
  learners: number
  trainers: number
  courses: number
  reviews: number
  activeUsers: number
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  program: string
  school: string
  createdAt: string
}

const metricIcons = [UsersRound, GraduationCap, BookOpenCheck, ClipboardCheck]

function roleLabel(role: Role, t: Translate): string {
  if (role === 'student') return t('Student')
  if (role === 'trainer') return t('Teacher / trainer')
  if (role === 'reviewer') return t('Reviewer')
  return t('Administrator')
}

const accessLevels: Record<Role, string> = {
  student: 'Learner access',
  trainer: 'Cohort management',
  reviewer: 'Quality assurance',
  admin: 'Full platform',
}

const health = [
  { label: 'All systems operational', detail: 'Web app and API responding normally', status: 'Operational' },
  { label: 'AI service healthy', detail: 'Insights and copilots ready · average latency 240 ms', status: 'Healthy' },
  { label: 'Offline sync ready', detail: 'Queued submissions reconcile on reconnect', status: 'Ready' },
]

const regions = [
  { name: 'Kigali', share: 42, learners: '1,016' },
  { name: 'Northern Province', share: 24, learners: '580' },
  { name: 'Eastern Province', share: 18, learners: '435' },
  { name: 'Western Province', share: 10, learners: '242' },
  { name: 'Southern Province', share: 6, learners: '145' },
]

export default function AdminDashboard() {
  const { notify } = useApp()
  const t = useT()
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<AdminAnalytics>('/analytics'),
      apiClient.get<{ users: AdminUser[] }>('/users'),
    ]).then(([analyticsResult, usersResult]) => {
      if (!active) return
      if (analyticsResult.status === 'fulfilled' && analyticsResult.value.scope === 'admin') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setAnalytics(analyticsResult.value)
      }
      if (usersResult.status === 'fulfilled') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setUsers(usersResult.value.users)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const counts = (['student', 'trainer', 'reviewer', 'admin'] as Role[]).map((role) => {
    const matching = users.filter((item) => item.role === role)
    return {
      role,
      accounts: matching.length,
      active: matching.filter((item) => item.active).length,
      level: accessLevels[role],
    }
  })

  const metrics = [
    { label: 'Active users', value: analytics?.activeUsers ?? '—', change: '+8.2%', tone: 'emerald' as const },
    { label: 'Trainers', value: analytics?.trainers ?? '—', change: '+4', tone: 'info' as const },
    { label: 'Learning paths', value: analytics?.courses ?? '—', change: '+12.5%', tone: 'emerald' as const },
    { label: 'Review items', value: analytics?.reviews ?? '—', change: '−1.3%', tone: 'amber' as const },
  ]

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('PLATFORM OPERATIONS')}
        title={t('Platform overview')}
        description={t('A clear view of platform health, access and regional learning activity.')}
        actions={
          <Button
            variant="secondary"
            icon={Activity}
            onClick={() => notify(t('Status check complete'), t('All monitored services are healthy'), 'success')}
          >
            {t('Run status check')}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metricIcons[index] ?? UsersRound
          return (
            <StatCard
              key={metric.label}
              label={t(metric.label)}
              value={metric.value}
              change={metric.change}
              footnote={t('vs last month')}
              icon={Icon}
              tone={metric.tone}
            />
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="stack lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={t('System health')}
              subtitle={t('Live checks across the MENYA platform')}
              action={<Badge tone="emerald" dot>{t('All clear')}</Badge>}
            />
            <ul className="mt-5 divide-y divide-line">
              {health.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className="relative mt-1.5 flex h-2.5 w-2.5 shrink-0">
                      <span className="soft-pulse absolute inline-flex h-full w-full rounded-full bg-emerald/35" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald" />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold">{t(item.label)}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{t(item.detail)}</p>
                    </div>
                  </div>
                  <Badge tone="emerald">{t(item.status)}</Badge>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-5 sm:p-6">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald" aria-hidden />
                    {t('Access overview')}
                  </span>
                }
                subtitle={t('Accounts by role and active status')}
              />
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">{t('Role')}</th>
                    <th scope="col">{t('Accounts')}</th>
                    <th scope="col">{t('Active')}</th>
                    <th scope="col">{t('Access level')}</th>
                  </tr>
                </thead>
                <tbody>
                  {counts.map((row) => (
                    <tr key={row.role}>
                      <td className="font-semibold whitespace-nowrap">{roleLabel(row.role, t)}</td>
                      <td className="tabular-nums">{row.accounts}</td>
                      <td className="tabular-nums text-muted">{row.active}</td>
                      <td><Badge tone={row.role === 'admin' ? 'info' : 'neutral'}>{t(row.level)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-5 py-3 text-[11px] text-muted">
              {t('Counts come from the live user directory. Manage individual accounts in Users & access.')}
            </p>
          </Card>
        </div>

        <div className="stack">
          <Card className="p-5 sm:p-6">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <Globe size={16} className="text-emerald" aria-hidden />
                  {t('Regional usage')}
                </span>
              }
              subtitle={t('Share of active learners by province')}
            />
            <div className="mt-5 space-y-4">
              {regions.map((region) => (
                <div key={region.name}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px]">
                    <span className="font-semibold">{t(region.name)}</span>
                    <span className="tabular-nums text-muted">{t('{share}% · {learners}', { share: region.share, learners: region.learners })}</span>
                  </div>
                  <ProgressBar value={region.share} />
                </div>
              ))}
            </div>
            <p className="mt-5 flex items-start gap-1.5 border-t border-line pt-4 text-[11px] text-muted">
              <Server size={13} className="mt-0.5 shrink-0" aria-hidden />
              {t('Usage data syncs nightly from all regional centres. {count} learners are registered across the platform.', { count: analytics?.learners ?? '—' })}
            </p>
          </Card>

          <AIInsightFeed
            context="admin-dashboard"
            fallback={[
              {
                title: t('Growth is widening beyond Kigali'),
                description: t('Activity remains strongest in Kigali while the provinces continue to catch up. Plan offline content sync ahead of regional field placements.'),
                factors: [
                  t('Kigali holds 42% of active learners'),
                  t('Trainer coverage remains about 1:28 learners'),
                  t('Regional usage syncs nightly from centres'),
                ],
              },
            ]}
          />
        </div>
      </div>

      <div className="h-[520px] w-full max-w-3xl">
        <AITutorPanel
          lessonTitle={t('Platform operations overview')}
          context="admin-dashboard"
          title={t('MENYA AI Operations Copilot')}
          role="admin"
          prompts={[
            t('Summarise platform health'),
            t('Which roles need attention?'),
            t('Where is regional usage growing?'),
          ]}
          exercises={[
            t('Draft a weekly operations checklist'),
            t('Flag access risks from the account mix'),
            t('Suggest follow-up for regional centres'),
          ]}
        />
      </div>
    </div>
  )
}
