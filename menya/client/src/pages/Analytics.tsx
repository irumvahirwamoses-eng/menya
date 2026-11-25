import { BookOpen, Clock, Flame, Info, TrendingUp } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { AIInsightFeed } from '../components/ai/AIInsight'
import {
  CompletionTrendChart,
  MasteryChart,
  WeeklyActivityChart,
} from '../components/charts/Charts'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ProgressBar,
  StatCard,
} from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { courses, student } from '../data/mock'
import { useT } from '../i18n'

export default function Analytics() {
  const { notify } = useApp()
  const t = useT()

  const goalProgress = Math.round((student.weeklyMinutes / student.weeklyGoal) * 100)
  const minutesToGoal = Math.max(0, student.weeklyGoal - student.weeklyMinutes)
  const nearlyDone = courses.filter((course) => course.progress >= 80).length

  return (
    <div className="animate-fade-up stack">
      <PageHeader
        eyebrow={t('LEARNING INSIGHTS')}
        title={t('Progress & analytics')}
        description={t('See how your study habits translate into real skill growth, week by week.')}
        actions={
          <Button
            variant="secondary"
            icon={Info}
            onClick={() =>
              notify(
                t('About these metrics'),
                t('Minutes come from completed lessons, mastery from quiz results and completion from curriculum progress. Data refreshes daily.'),
                'info',
              )
            }
          >
            {t('About these metrics')}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('Overall mastery')}
          value={`${student.mastery}%`}
          change={t('+6% this term')}
          footnote={t('across core skills')}
          icon={TrendingUp}
          tone="emerald"
        />
        <StatCard
          label={t('Weekly study time')}
          value={t('{count} min', { count: student.weeklyMinutes })}
          change={t('{percent}% of weekly goal', { percent: goalProgress })}
          footnote={t('{count} min to go', { count: minutesToGoal })}
          icon={Clock}
          tone="info"
        />
        <StatCard
          label={t('Current streak')}
          value={t('{count} days', { count: student.streak })}
          change={t('Personal best: 18 days')}
          footnote={t('keep it going')}
          icon={Flame}
          tone="amber"
        />
        <StatCard
          label={t('Courses in progress')}
          value={courses.length}
          change={t('{count} nearly complete', { count: nearlyDone })}
          footnote={t('active enrolments')}
          icon={BookOpen}
          tone="emerald"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="card-pad lg:col-span-2">
          <CardHeader
            title={t('Study time this week')}
            subtitle={t('Daily learning minutes against your goal')}
            action={<Badge tone="info">{t('{count} min total', { count: student.weeklyMinutes })}</Badge>}
          />
          <div className="mt-5">
            <WeeklyActivityChart height={230} />
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-line pt-3 text-[11px] text-muted">
            <span className="h-0 w-6 shrink-0 border-t-2 border-dashed border-amber" aria-hidden />
            {t('The dashed line marks your 45-minute daily goal.')}
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader title={t('Skill mastery')} subtitle={t('Five core electrical skills')} />
          <div className="mt-5">
            <MasteryChart />
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('Colour bands')}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald" aria-hidden /> {t('80%+ strong')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-info" aria-hidden /> {t('60–79% developing')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber" aria-hidden /> {t('Below 60% needs focus')}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="card-pad lg:col-span-2">
          <CardHeader
            title={t('Curriculum completion')}
            subtitle={t('Percentage of your learning path completed over six weeks')}
            action={
              <Badge tone="emerald" dot>
                {t('+12 pts since W4')}
              </Badge>
            }
          />
          <div className="mt-5">
            <CompletionTrendChart height={220} />
          </div>
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-muted">
            {t('Completion has risen every week. Your current pace puts the next milestone within reach.')}
          </p>
        </Card>

        <AIInsightFeed
          className="h-full"
          context="analytics"
          fallback={[
            {
              title: t('Circuits at 61% is your growth opportunity'),
              description: t('It is the lowest of your core Electrical skills and appears in recent quiz errors. A short focused practice set can lift it into the strong band.'),
              factors: [
                t('Circuits mastery is 61%, below the 80% proficiency band.'),
                t('Two of three missed quiz items applied Ohm’s law in a new context.'),
                t('Electrical Installation is 68% complete — your highest-value course.'),
              ],
            },
          ]}
        />
      </div>

      <Card>
        <div className="card-pad pb-0">
          <CardHeader
            title={t('Course progress')}
            subtitle={t('A quick view of every enrolled course')}
            action={<Badge tone="neutral">{t('{count} courses', { count: courses.length })}</Badge>}
          />
        </div>
        <div className="table-wrap mt-4">
          <table className="data-table">
            <caption className="sr-only">{t('Progress across enrolled courses')}</caption>
            <thead>
              <tr>
                <th scope="col">{t('Course')}</th>
                <th scope="col">{t('Progress')}</th>
                <th scope="col">{t('Lessons')}</th>
                <th scope="col">{t('Time invested')}</th>
                <th scope="col">{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const status =
                  course.progress >= 80
                    ? { label: t('Nearly done'), tone: 'emerald' as const }
                    : course.progress >= 50
                      ? { label: t('On track'), tone: 'info' as const }
                      : { label: t('Getting started'), tone: 'amber' as const }
                const barTone =
                  course.progress >= 80 ? 'emerald' : course.progress >= 50 ? 'info' : 'amber'

                return (
                  <tr key={course.id}>
                    <td>
                      <p className="font-semibold text-ink">{course.title}</p>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {course.code} · {t(course.category)}
                      </p>
                    </td>
                    <td>
                      <ProgressBar value={course.progress} tone={barTone} showValue className="min-w-[140px]" />
                    </td>
                    <td className="tabular-nums text-muted">{t('{count} lessons', { count: course.lessonCount })}</td>
                    <td className="tabular-nums text-muted">{course.duration}</td>
                    <td>
                      <Badge tone={status.tone} dot>
                        {status.label}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
