import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Flag,
  HelpCircle,
  Info,
  ListChecks,
  Lock,
  Play,
  RotateCcw,
  Target,
  Timer,
  Trophy,
  XCircle,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { AIInsightFeed } from '../components/ai/AIInsight'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  StatCard,
  Tabs,
  type TabItem,
} from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { assessments as mockAssessments, student } from '../data/mock'
import { useT, type Translate } from '../i18n'
import { apiClient } from '../lib/api'
import { cn } from '../lib/utils'
import type { Assessment } from '../types'

type AssessmentTab = 'available' | 'completed' | 'all'
type RunnerMode = 'take' | 'review'

interface PublicQuestion {
  id: string
  prompt: string
  options: string[]
  explanation: string
}

interface AttemptResult {
  id: string
  assessmentId: string
  answers: number[]
  score: number
  correctCount: number
  total: number
  correctAnswers: number[]
  completedAt: string
}

interface RunnerState {
  assessment: Assessment
  mode: RunnerMode
  questions: PublicQuestion[]
  attempt?: AttemptResult
}

const statusTone: Record<Assessment['status'], 'emerald' | 'amber' | 'info' | 'neutral'> = {
  Ready: 'info',
  'In progress': 'amber',
  Completed: 'emerald',
  Locked: 'neutral',
}

const statusIconClass: Record<Assessment['status'], string> = {
  Ready: 'bg-info-soft text-info',
  'In progress': 'bg-amber-soft text-amber-dark dark:text-amber',
  Completed: 'bg-emerald-soft text-emerald-dark dark:text-emerald',
  Locked: 'bg-surface-alt text-muted',
}

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDuration(minutes: number, translate: Translate) {
  if (minutes < 60) return translate('{minutes} min', { minutes })
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? translate('{hours}h {rest}m', { hours, rest }) : translate('{hours}h', { hours })
}

function errorMessage(error: unknown, translate: Translate) {
  return error instanceof Error ? error.message : translate('Please try again.')
}

/* Quiz runner -------------------------------------------------------------- */
function QuizRunner({
  assessment,
  mode,
  questions,
  attempt,
  onComplete,
  onExit,
}: {
  assessment: Assessment
  mode: RunnerMode
  questions: PublicQuestion[]
  attempt?: AttemptResult
  onComplete: (assessmentId: string, result: AttemptResult) => void
  onExit: () => void
}) {
  const { notify } = useApp()
  const t = useT()
  const [retaking, setRetaking] = useState(false)
  const [answers, setAnswers] = useState<Array<number | null>>(() =>
    attempt?.answers ?? questions.map(() => null),
  )
  const [index, setIndex] = useState(0)
  const [flagged, setFlagged] = useState<number[]>([])
  const [secondsLeft, setSecondsLeft] = useState(assessment.duration * 60)
  const [submitted, setSubmitted] = useState(mode === 'review' && Boolean(attempt))
  const [serverResult, setServerResult] = useState<AttemptResult | null>(attempt ?? null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const submittedRef = useRef(mode === 'review' && Boolean(attempt))

  const isReview = mode === 'review' && !retaking
  const isTaking = !isReview && !submitted
  const timeUp = isTaking && secondsLeft === 0
  const showResults = submitted || isReview
  const question = questions[index]
  const answeredCount = answers.filter((answer) => answer !== null).length
  const displayScore = serverResult?.score ?? assessment.score ?? 0

  useEffect(() => {
    if (!isTaking || timeUp) return
    const id = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [isTaking, timeUp])

  const finish = useCallback(async () => {
    if (submittedRef.current || submitting) return
    const firstUnanswered = answers.findIndex((answer) => answer === null)
    if (firstUnanswered !== -1) {
      setIndex(firstUnanswered)
      notify(
        t('A few answers are missing'),
        t('Answer every question before submitting, or flag it to revisit.'),
        'error',
      )
      return
    }

    submittedRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      const data = await apiClient.post<{ attempt: AttemptResult }>('/attempts', {
        assessmentId: assessment.id,
        answers: answers.filter((answer): answer is number => answer !== null),
      })
      setServerResult(data.attempt)
      setSubmitted(true)
      onComplete(assessment.id, data.attempt)
      notify(
        t('{score}% — assessment complete', { score: data.attempt.score }),
        t('You answered {correct} of {total} questions correctly.', {
          correct: data.attempt.correctCount,
          total: data.attempt.total,
        }),
        data.attempt.score >= 80 ? 'success' : 'info',
      )
    } catch (error) {
      submittedRef.current = false
      setSubmitError(errorMessage(error, t))
      notify(t('Could not submit assessment'), errorMessage(error, t), 'error')
    } finally {
      setSubmitting(false)
    }
  }, [answers, assessment.id, notify, onComplete, submitting, t])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- timer expiry submits the attempt
    if (timeUp && !submitted && !submitting) void finish()
  }, [timeUp, submitted, submitting, finish])

  const selectOption = (optionIndex: number) => {
    setAnswers((current) => current.map((answer, i) => (i === index ? optionIndex : answer)))
  }

  const toggleFlag = () => {
    setFlagged((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    )
  }

  const handleSubmit = () => {
    void finish()
  }

  const tryAgain = () => {
    setRetaking(true)
    setAnswers(questions.map(() => null))
    setIndex(0)
    setFlagged([])
    setSecondsLeft(assessment.duration * 60)
    setSubmitted(false)
    setServerResult(null)
    setSubmitError(null)
    submittedRef.current = false
    notify(t('Assessment restarted'), t('The timer has been reset. Take your time.'), 'info')
  }

  if (!question) {
    return (
      <Card className="card-pad">
        <EmptyState
          icon={HelpCircle}
          title={t('Questions are unavailable')}
          description={t('This assessment could not be loaded. Return to the assessment centre and try again.')}
          action={<Button variant="secondary" onClick={onExit}>{t('All assessments')}</Button>}
        />
      </Card>
    )
  }

  if (showResults) {
    const verdict = displayScore >= 80 ? t('Passed') : displayScore >= 60 ? t('Nearly there') : t('Needs review')
    const correctAnswers = serverResult?.correctAnswers ?? []
    const correctCount = serverResult?.correctCount ?? 0

    return (
      <div className="animate-fade-up stack">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow mb-2 text-emerald">
              {isReview ? t('Saved attempt') : t('Assessment complete')}
            </p>
            <h2 className="text-xl font-bold">{assessment.title}</h2>
            <p className="mt-1 text-xs text-muted">
              {t('{course} · {count} questions · {mastery} mastery', {
                course: assessment.course,
                count: questions.length,
                mastery: assessment.mastery,
              })}
            </p>
          </div>
          <Badge tone={displayScore >= 80 ? 'emerald' : displayScore >= 60 ? 'amber' : 'danger'} dot>
            {verdict}
          </Badge>
        </div>

        {submitError && (
          <div className="rounded-[10px] border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[12px] font-medium text-danger" role="alert">
            {submitError}
          </div>
        )}

        <Card className="card-pad">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-soft text-emerald-dark dark:text-emerald">
                <Trophy size={28} strokeWidth={1.9} aria-hidden />
              </span>
              <div>
                <p className="text-3xl font-bold tracking-[-0.03em] tabular-nums">{displayScore}%</p>
                <p className="mt-0.5 text-xs text-muted">
                  {t('{correct} of {total} correct · scored by MENYA', { correct: correctCount, total: questions.length })}
                </p>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <ProgressBar value={displayScore} />
              <p className="mt-2 text-[11px] text-muted">{t('Certification benchmark: 80% mastery')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={RotateCcw} onClick={tryAgain}>
                {t('Try again')}
              </Button>
              <Button variant="ghost" icon={ArrowLeft} onClick={onExit}>
                {t('All assessments')}
              </Button>
            </div>
          </div>
        </Card>

        <AIInsightFeed
          context="assessment-result"
          fallback={[
            {
              title: displayScore >= 80 ? t('Strong result — certification is on track') : t('Your next practice session has a clear target'),
              description:
                displayScore >= 80
                  ? t('You met the 80% benchmark. Keep the momentum with a short spaced review before the final competency check.')
                  : t('You scored {score}%. Review the explanations below, then retry — mastery builds fastest when you correct errors within a day.', { score: displayScore }),
              factors: [
                t('You answered {correct} of {total} questions correctly.', { correct: correctCount, total: questions.length }),
                flagged.length
                  ? flagged.length === 1
                    ? t('1 question flagged for a closer look.')
                    : t('{count} questions flagged for a closer look.', { count: flagged.length })
                  : t('No questions were flagged — revisit any explanation that feels unsure.'),
                correctAnswers.length
                  ? t('The answer key was applied securely by the MENYA assessment service.')
                  : t('Review the guidance below before your next attempt.'),
              ],
            },
          ]}
        />

        <Card className="card-pad">
          <CardHeader
            title={t('Question review')}
            subtitle={t('Work through each explanation before you retry')}
            action={<Badge tone="neutral">{t('{count} items', { count: questions.length })}</Badge>}
          />
          <div className="mt-5 space-y-3.5">
            {questions.map((item, i) => {
              const chosen = answers[i]
              const correct = chosen !== null && correctAnswers[i] === chosen
              const knownResult = chosen !== null && correctAnswers.length === questions.length
              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-[12px] border p-4',
                    knownResult && correct
                      ? 'border-emerald/30 bg-emerald-soft/40'
                      : knownResult
                        ? 'border-danger/30 bg-danger-soft/40'
                        : 'border-line bg-surface-alt/60',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[13px] font-semibold leading-snug">
                      <span className="mr-2 font-bold tabular-nums text-muted">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {item.prompt}
                    </p>
                    {knownResult && (
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 text-[11px] font-bold',
                          correct ? 'text-emerald' : 'text-danger',
                        )}
                      >
                        {correct ? <CheckCircle2 size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}
                        {correct ? t('Correct') : t('Incorrect')}
                      </span>
                    )}
                  </div>
                  {chosen !== null && (
                    <p className="mt-2 text-xs text-muted">
                      {t('Your answer:')}{' '}
                      <span className={cn('font-semibold', knownResult && !correct ? 'text-danger' : 'text-ink')}>
                        {item.options[chosen]}
                      </span>
                    </p>
                  )}
                  {correctAnswers.length === questions.length && (
                    <p className="mt-2 text-xs">
                      <span className="font-semibold text-ink">{t('Correct answer:')} </span>
                      <span className="font-semibold text-emerald">
                        {item.options[correctAnswers[i]] ?? '—'}
                      </span>
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-muted">{item.explanation}</p>
                  {flagged.includes(i) && (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-dark dark:text-amber">
                      <Flag size={12} aria-hidden /> {t('Flagged for review')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    )
  }

  const flagActive = flagged.includes(index)

  return (
    <div className="animate-fade-up grid gap-5 lg:grid-cols-3">
      <Card className="card-pad lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow mb-2 text-emerald">
              {t('Question {current} of {total}', { current: index + 1, total: questions.length })}
            </p>
            <h2 className="text-lg font-semibold leading-snug">{question.prompt}</h2>
          </div>
          <Button
            variant={flagActive ? 'amber' : 'secondary'}
            size="sm"
            icon={Flag}
            aria-pressed={flagActive}
            onClick={toggleFlag}
          >
            {flagActive ? t('Flagged') : t('Flag for review')}
          </Button>
        </div>

        <div className="mt-4">
          <ProgressBar value={((index + 1) / questions.length) * 100} />
        </div>

        <div role="radiogroup" aria-label={t('Answer options')} className="mt-6 space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const selected = answers[index] === optionIndex
            return (
              <button
                key={`${question.id}-${optionIndex}`}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectOption(optionIndex)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left text-[13px] transition-colors',
                  selected
                    ? 'border-emerald/50 bg-emerald-soft/60 text-ink'
                    : 'border-line bg-surface hover:border-line-strong hover:bg-surface-alt',
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    selected ? 'border-emerald bg-emerald' : 'border-line-strong',
                  )}
                  aria-hidden
                >
                  {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="font-medium">{option}</span>
                <span className="ml-auto text-[11px] font-bold text-muted" aria-hidden>
                  {String.fromCharCode(65 + optionIndex)}
                </span>
              </button>
            )
          })}
        </div>

        {submitError && (
          <p className="mt-4 rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-[12px] font-medium text-danger" role="alert">
            {submitError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <Button
            variant="secondary"
            icon={ChevronLeft}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={index === 0}
          >
            {t('Previous')}
          </Button>
          <span className="text-xs font-medium tabular-nums text-muted">
            {t('{answered} of {total} answered', { answered: answeredCount, total: questions.length })}
          </span>
          {index < questions.length - 1 ? (
            <Button
              iconRight={ChevronRight}
              onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}
            >
              {t('Next question')}
            </Button>
          ) : (
            <Button icon={CheckCircle2} onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('Submitting…') : t('Submit assessment')}
            </Button>
          )}
        </div>
      </Card>

      <aside className="space-y-4">
        <Card className="card-pad">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="label mb-0">{t('Time remaining')}</p>
              <p
                className={cn(
                  'mt-1 text-2xl font-bold tabular-nums',
                  secondsLeft < 60 ? 'text-danger' : 'text-ink',
                )}
                aria-label={t('Time remaining {clock}', { clock: formatClock(secondsLeft) })}
              >
                {formatClock(secondsLeft)}
              </p>
            </div>
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                secondsLeft < 60 ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info',
              )}
            >
              <Timer size={18} strokeWidth={2} aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            {t('The assessment submits securely when the timer reaches zero.')}
          </p>
          <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted">{t('Answered')}</span>
              <span className="font-bold tabular-nums">
                {answeredCount}/{questions.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">{t('Flagged')}</span>
              <span className="font-bold tabular-nums">{flagged.length}</span>
            </div>
          </div>
        </Card>

        <Card className="card-pad">
          <CardHeader title={t('Before you submit')} subtitle={t('A quick checklist')} />
          <ul className="mt-4 space-y-3 text-xs leading-relaxed text-muted">
            <li className="flex gap-2">
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald" aria-hidden />
              {t('Answer every question — you can change a choice at any time.')}
            </li>
            <li className="flex gap-2">
              <Flag size={14} className="mt-0.5 shrink-0 text-amber-dark dark:text-amber" aria-hidden />
              {t('Flag a question if you want to come back to it.')}
            </li>
            <li className="flex gap-2">
              <HelpCircle size={14} className="mt-0.5 shrink-0 text-info" aria-hidden />
              {t('Explanations appear on the results screen.')}
            </li>
          </ul>
        </Card>
      </aside>
    </div>
  )
}

/* Assessment centre -------------------------------------------------------- */
export default function Assessments() {
  const { notify } = useApp()
  const t = useT()
  const [assessmentList, setAssessmentList] = useState<Assessment[]>(mockAssessments)
  const [attempts, setAttempts] = useState<AttemptResult[]>([])
  const [activeTab, setActiveTab] = useState<AssessmentTab>('available')
  const [runner, setRunner] = useState<RunnerState | null>(null)
  const [opening, setOpening] = useState(false)

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<{ assessments: Assessment[] }>('/assessments'),
      apiClient.get<{ attempts: AttemptResult[] }>('/attempts'),
    ]).then(([assessmentResult, attemptResult]) => {
      if (!active) return
      if (assessmentResult.status === 'fulfilled') {
        setAssessmentList(assessmentResult.value.assessments)
      }
      if (attemptResult.status === 'fulfilled') {
        setAttempts(attemptResult.value.attempts)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const onComplete = useCallback((assessmentId: string, result: AttemptResult) => {
    setAttempts((current) => [result, ...current.filter((item) => item.assessmentId !== assessmentId)])
    setAssessmentList((current) =>
      current.map((item) =>
        item.id === assessmentId ? { ...item, status: 'Completed', score: result.score } : item,
      ),
    )
  }, [])

  const openRunner = async (item: Assessment, mode: RunnerMode) => {
    setOpening(true)
    try {
      const [questionsResult, attemptsResult] = await Promise.all([
        apiClient.get<{ questions: PublicQuestion[] }>(`/assessments/${item.id}/questions`),
        attempts.length
          ? Promise.resolve({ attempts })
          : apiClient.get<{ attempts: AttemptResult[] }>('/attempts'),
      ])
      const latestAttempt = questionsResult.questions.length
        ? attemptsResult.attempts.find((attempt) => attempt.assessmentId === item.id)
        : undefined
      if (!attempts.length) setAttempts(attemptsResult.attempts)
      setRunner({
        assessment: item,
        mode,
        questions: questionsResult.questions,
        attempt: mode === 'review' ? latestAttempt : undefined,
      })
    } catch (error) {
      notify(t('Could not open assessment'), errorMessage(error, t), 'error')
    } finally {
      setOpening(false)
    }
  }

  const closeRunner = useCallback(() => setRunner(null), [])

  const readyCount = assessmentList.filter((item) => item.status === 'Ready').length
  const inProgressCount = assessmentList.filter((item) => item.status === 'In progress').length
  const scoredAssessments = assessmentList.filter(
    (item) => item.status === 'Completed' && typeof item.score === 'number',
  )
  const averageScore = scoredAssessments.length
    ? Math.round(
        scoredAssessments.reduce((total, item) => total + (item.score ?? 0), 0) /
          scoredAssessments.length,
      )
    : 0
  const readiness = Math.round((averageScore + student.mastery) / 2)

  const tabs: TabItem<AssessmentTab>[] = [
    {
      id: 'available',
      label: t('Available'),
      icon: ClipboardCheck,
      count: readyCount + inProgressCount,
    },
    {
      id: 'completed',
      label: t('Completed'),
      icon: CheckCircle2,
      count: scoredAssessments.length,
    },
    { id: 'all', label: t('All'), icon: ListChecks, count: assessmentList.length },
  ]

  const visible = useMemo(() => {
    if (activeTab === 'available') {
      return assessmentList.filter(
        (item) => item.status === 'Ready' || item.status === 'In progress',
      )
    }
    if (activeTab === 'completed') return assessmentList.filter((item) => item.status === 'Completed')
    return assessmentList
  }, [activeTab, assessmentList])

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={t('ASSESSMENT CENTRE')}
        title={runner ? runner.assessment.title : t('Assessment centre')}
        description={
          runner
            ? t('{course} · {mastery} mastery · {count} questions', {
                course: runner.assessment.course,
                mastery: runner.assessment.mastery,
                count: runner.questions.length,
              })
            : t('Practise, demonstrate and certify the skills that matter for your trade.')
        }
        actions={
          runner ? (
            <Button variant="secondary" icon={ArrowLeft} onClick={closeRunner}>
              {t('Exit assessment')}
            </Button>
          ) : (
            <Button
              variant="secondary"
              icon={Info}
              onClick={() =>
                notify(
                  t('How assessment works'),
                  t('Answer each question, then MENYA scores it securely against the answer key. Aim for the 80% certification benchmark.'),
                  'info',
                )
              }
            >
              {t('How assessment works')}
            </Button>
          )
        }
      />

      {runner ? (
        <QuizRunner
          key={`${runner.assessment.id}-${runner.mode}-${runner.attempt?.id ?? 'new'}`}
          assessment={runner.assessment}
          mode={runner.mode}
          questions={runner.questions}
          attempt={runner.attempt}
          onComplete={onComplete}
          onExit={closeRunner}
        />
      ) : (
        <div className="stack">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label={t('Ready assessments')}
              value={readyCount + inProgressCount}
              change={t('{count} ready to start', { count: readyCount })}
              footnote={t('{count} in progress', { count: inProgressCount })}
              icon={ClipboardCheck}
              tone="emerald"
            />
            <StatCard
              label={t('Average score')}
              value={`${averageScore}%`}
              change={t('+4% vs last term')}
              footnote={t('completed assessments')}
              icon={Target}
              tone="info"
            />
            <StatCard
              label={t('Certification readiness')}
              value={`${readiness}%`}
              change={t('On track')}
              footnote={t('80% benchmark')}
              icon={Trophy}
              tone="amber"
            />
          </div>

          <section aria-labelledby="assessment-list-heading">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="assessment-list-heading" className="section-title">
                  {t('Your assessments')}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {t('Start a quiz, resume an attempt or review past feedback.')}
                </p>
              </div>
              <Tabs items={tabs} active={activeTab} onChange={setActiveTab} />
            </div>

            {visible.length === 0 ? (
              <Card>
                <EmptyState
                  icon={ListChecks}
                  title={t('No assessments in this view')}
                  description={t('Switch tabs to see your available, completed or all assessments.')}
                />
              </Card>
            ) : (
              <div className="grid gap-3">
                {visible.map((item) => (
                  <Card key={item.id} className="card-interactive card-pad">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                            statusIconClass[item.status],
                          )}
                        >
                          {item.status === 'Locked' ? (
                            <Lock size={18} strokeWidth={2} aria-hidden />
                          ) : (
                            <ClipboardCheck size={18} strokeWidth={2} aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[14px] font-bold">{item.title}</h3>
                            <Badge tone={statusTone[item.status]} dot>
                              {t(item.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                            <BookOpen size={13} aria-hidden /> {item.course}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted">
                            <span className="inline-flex items-center gap-1.5">
                              <ListChecks size={13} aria-hidden /> {t('{count} questions', { count: item.questionCount })}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock size={13} aria-hidden /> {formatDuration(item.duration, t)}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays size={13} aria-hidden /> {t('Due {due}', { due: t(item.due) })}
                            </span>
                            <span className="rounded-full bg-surface-alt px-2 py-0.5 font-semibold">
                              {t('Mastery: {skill}', { skill: t(item.mastery) })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-3 lg:justify-end">
                        {item.score !== undefined && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald">
                            <Trophy size={14} aria-hidden /> {item.score}%
                          </span>
                        )}
                        {item.status === 'Locked' ? (
                          <Button variant="secondary" size="sm" icon={Lock} disabled>
                            {t('Locked')}
                          </Button>
                        ) : item.status === 'Completed' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={HelpCircle}
                            disabled={opening}
                            onClick={() => void openRunner(item, 'review')}
                          >
                            {t('Review')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            icon={Play}
                            disabled={opening}
                            onClick={() => void openRunner(item, 'take')}
                          >
                            {item.status === 'In progress' ? t('Resume') : t('Start')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <AIInsightFeed
            context="assessments"
            fallback={[
              {
                title: t('A short quiz now could lift your certification readiness'),
                description: t('Circuit Fundamentals is due today and targets your lowest core mastery. Five focused questions give you instant feedback.'),
                factors: [
                  t('Circuits is at 61%, below the 80% proficiency band.'),
                  t('Your completed assessment average is above the pass benchmark.'),
                  t('The final competency check unlocks after module 4.'),
                ],
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
