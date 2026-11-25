import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams, type SetURLSearchParams } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  LibraryBig,
  MessageCircleQuestion,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import {
  AIActionButtons,
  AISourceChips,
  AITutorPanel,
} from '../components/ai/AITutorPanel'
import { PageHeader } from '../components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  ProgressBar,
  Tabs,
  Toggle,
  type TabItem,
} from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { roleWorkspaces } from '../data/navigation'
import { useT } from '../i18n'
import { type AIActionContext } from '../lib/ai'
import { apiClient } from '../lib/api'
import type {
  AIAssistResponse,
  AIAssessmentResponse,
  AIAssessmentType,
  AIEvaluateResponse,
  AILanguage,
  AIPlanItem,
  AIPlanResponse,
  AIStatusResponse,
  PlannerTask,
  Role,
} from '../types'

type AITab = 'ask' | 'practice' | 'evaluate' | 'plan' | 'sources' | 'status'

const assessmentTypes: AIAssessmentType[] = ['mcq', 'theory', 'practical', 'mixed']

function parseTab(value: string | null, isAdmin: boolean): AITab {
  if (value === 'practice' || value === 'evaluate' || value === 'plan' || value === 'sources') return value
  if (value === 'status' && isAdmin) return 'status'
  return 'ask'
}

function parseLanguage(value: string | null): AILanguage {
  return value === 'rw' ? 'rw' : 'en'
}

function parseRubric(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

function extractStart(slot: string): string {
  const match = /\b(\d{1,2}):(\d{2})\b/.exec(slot)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '09:00'
}

function inferTaskType(task: string): PlannerTask['type'] {
  const text = task.toLowerCase()
  if (text.includes('assess') || text.includes('quiz') || text.includes('test')) return 'Assessment'
  if (text.includes('review') || text.includes('revisit')) return 'Review'
  if (text.includes('practice') || text.includes('exercise')) return 'Practice'
  return 'Learn'
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="flex items-start gap-2 rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2 text-[11px] text-danger" role="alert">
      <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden /> {message}
    </p>
  )
}

function DraftNote() {
  const t = useT()
  return (
    <p className="rounded-[10px] border border-amber/30 bg-amber-soft px-3 py-2 text-[11px] leading-relaxed text-amber-dark dark:text-amber">
      {t('Draft only — check every question and score with your trainer before using it for formal assessment.')}
    </p>
  )
}

/* ------------------------------ Practice --------------------------------- */

function PracticePanel({
  role,
  language,
  simpleMode,
  actionContext,
  initialTopic,
}: {
  role: Role
  language: AILanguage
  simpleMode: boolean
  actionContext: AIActionContext
  initialTopic: string
}) {
  const t = useT()
  const canGenerate = role === 'trainer' || role === 'admin'
  const [topic, setTopic] = useState(initialTopic)
  const [type, setType] = useState<AIAssessmentType>('mixed')
  const [count, setCount] = useState('5')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<AIAssessmentResponse | null>(null)
  const [assist, setAssist] = useState<AIAssistResponse | null>(null)

  const generate = async (event: FormEvent) => {
    event.preventDefault()
    const cleanTopic = topic.trim()
    if (!cleanTopic || busy) return
    setBusy(true)
    setError(null)
    setDraft(null)
    setAssist(null)
    const parsedCount = Math.min(20, Math.max(1, Number(count) || 5))
    try {
      if (canGenerate) {
        setDraft(
          await apiClient.post<AIAssessmentResponse>('/ai/assessments/generate', {
            topic: cleanTopic,
            count: parsedCount,
            type,
          }),
        )
      } else {
        setAssist(
          await apiClient.post<AIAssistResponse>('/ai/assist', {
            message: t('Suggest {count} {type} practice questions on {topic}', {
              count: parsedCount,
              type: t(type),
              topic: cleanTopic,
            }),
            context: t(roleWorkspaces[role].label),
            language,
            simpleMode,
            task: 'assessment',
          }),
        )
      }
    } catch (caught) {
      setError(errorMessage(caught, t('The request could not be completed.')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack animate-fade-up">
      <Card className="card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <ClipboardCheck size={16} className="text-emerald" aria-hidden /> {t('Draft practice questions')}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {canGenerate
                ? t('Generate a question draft from approved material. Answer keys stay hidden.')
                : t('Question drafting is locked for your role. Ask MENYA for guided practice instead.')}
            </p>
          </div>
          <Badge tone={canGenerate ? 'emerald' : 'amber'}>
            {canGenerate ? t('Trainer / admin') : t('Guided practice')}
          </Badge>
        </div>

        <form onSubmit={(event) => void generate(event)} className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_100px_auto] sm:items-end">
          <div>
            <label className="label" htmlFor="practice-topic">{t('Topic')}</label>
            <input
              id="practice-topic"
              className="input"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder={t('e.g. Ohm’s law')}
            />
          </div>
          <div>
            <label className="label" htmlFor="practice-type">{t('Question type')}</label>
            <select
              id="practice-type"
              className="input"
              value={type}
              onChange={(event) => setType(event.target.value as AIAssessmentType)}
            >
              {assessmentTypes.map((option) => (
                <option key={option} value={option}>{t(option)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="practice-count">{t('Count')}</label>
            <input
              id="practice-count"
              className="input"
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(event) => setCount(event.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy || !topic.trim()} icon={Sparkles}>
            {busy ? t('Drafting…') : t('Generate')}
          </Button>
        </form>
      </Card>

      {!canGenerate && (
        <p className="rounded-[10px] border border-info/30 bg-info-soft px-3 py-2 text-[11px] text-info">
          {t('Locked: only trainers and administrators can generate question sets. Your guided practice below is still available.')}
        </p>
      )}
      <DraftNote />
      {error && <ErrorNote message={error} />}

      {draft && (
        <Card className="card-pad stack">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="section-title">{t(draft.title)}</h3>
              <p className="mt-1 text-[11px] text-muted">
                {t('Topic: {topic} · {count} draft questions', { topic: t(draft.topic), count: draft.questions.length })}
              </p>
            </div>
            <Badge tone="neutral">{t('Engine: {engine}', { engine: draft.engine })}</Badge>
          </div>
          <AISourceChips sources={draft.sources} />
          <ol className="space-y-3">
            {draft.questions.map((question, index) => (
              <li key={question.id} className="rounded-xl border border-line bg-surface-alt p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold leading-snug">{index + 1}. {t(question.prompt)}</p>
                  <Badge tone="neutral">{t(question.type)}</Badge>
                </div>
                {question.options.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {question.options.map((option, optionIndex) => (
                      <li key={`${question.id}-${optionIndex}`} className="flex items-start gap-2 text-[12px] text-muted">
                        <span className="font-bold text-emerald">{String.fromCharCode(65 + optionIndex)}.</span>
                        {t(option)}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
          {draft.notice && <p className="text-[11px] leading-relaxed text-muted">{t(draft.notice)}</p>}
        </Card>
      )}

      {assist && (
        <Card className="card-pad stack">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald" dot>{t('Guided practice')}</Badge>
            <Badge tone="neutral">{t('Engine: {engine}', { engine: assist.engine })}</Badge>
          </div>
          <p className="whitespace-pre-line text-[13px] leading-relaxed">{t(assist.reply)}</p>
          {assist.steps.length > 0 && (
            <div>
              <p className="eyebrow mb-2">{t('Steps')}</p>
              <ol className="list-inside list-decimal space-y-1 text-[12px] text-muted">
                {assist.steps.map((step, index) => <li key={`${index}-${step}`}>{t(step)}</li>)}
              </ol>
            </div>
          )}
          {assist.suggestions.length > 0 && (
            <div>
              <p className="eyebrow mb-2">{t('Suggestions')}</p>
              <ul className="space-y-1 text-[12px] text-muted">
                {assist.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`}>• {t(suggestion)}</li>)}
              </ul>
            </div>
          )}
          <AISourceChips sources={assist.sources} />
          <AIActionButtons actions={assist.actions} context={actionContext} />
          {assist.notice && <p className="text-[11px] leading-relaxed text-muted">{t(assist.notice)}</p>}
        </Card>
      )}
    </div>
  )
}

/* ------------------------------ Evaluate --------------------------------- */

function EvaluatePanel({
  language,
  initialTopic,
}: {
  language: AILanguage
  initialTopic: string
}) {
  const t = useT()
  const [responseText, setResponseText] = useState('')
  const [rubricText, setRubricText] = useState('')
  const [topic, setTopic] = useState(initialTopic)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AIEvaluateResponse | null>(null)

  const evaluate = async (event: FormEvent) => {
    event.preventDefault()
    if (!responseText.trim() || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    const rubric = parseRubric(rubricText)
    try {
      setResult(
        await apiClient.post<AIEvaluateResponse>('/ai/evaluate', {
          response: responseText.trim(),
          ...(rubric.length ? { rubric } : {}),
          ...(topic.trim() ? { topic: topic.trim() } : {}),
          language,
        }),
      )
    } catch (caught) {
      setError(errorMessage(caught, t('The request could not be completed.')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack animate-fade-up">
      <Card className="card-pad">
        <h2 className="section-title flex items-center gap-2">
          <FileCheck2 size={16} className="text-emerald" aria-hidden /> {t('Check an answer')}
        </h2>
        <p className="mt-1 text-xs text-muted">
          {t('Feedback is indicative and grounded in approved material — never an official grade.')}
        </p>
        <form onSubmit={(event) => void evaluate(event)} className="mt-5 stack">
          <div>
            <label className="label" htmlFor="evaluate-response">{t('Written response')}</label>
            <textarea
              id="evaluate-response"
              className="input min-h-40 resize-y leading-relaxed"
              value={responseText}
              onChange={(event) => setResponseText(event.target.value)}
              placeholder={t('Paste the answer you want MENYA to review…')}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="evaluate-rubric">{t('Rubric criteria (comma separated)')}</label>
              <input
                id="evaluate-rubric"
                className="input"
                value={rubricText}
                onChange={(event) => setRubricText(event.target.value)}
                placeholder={t('Safety, calculation, explanation')}
              />
            </div>
            <div>
              <label className="label" htmlFor="evaluate-topic">{t('Topic (optional)')}</label>
              <input
                id="evaluate-topic"
                className="input"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder={t('e.g. Circuit calculations')}
              />
            </div>
          </div>
          <div>
            <Button type="submit" disabled={busy || !responseText.trim()} icon={FileCheck2}>
              {busy ? t('Checking…') : t('Check answer')}
            </Button>
          </div>
        </form>
      </Card>

      {error && <ErrorNote message={error} />}
      {result && (
        <Card className="card-pad stack">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="section-title">{t('Feedback')}</h3>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{t('Engine: {engine}', { engine: result.engine })}</Badge>
              <Badge tone="amber">
                {t('Indicative score: {score}/100', { score: Math.round(result.indicativeScore) })}
              </Badge>
            </div>
          </div>
          <ProgressBar value={result.indicativeScore} tone="amber" showValue />
          <p className="whitespace-pre-line text-[13px] leading-relaxed">{t(result.feedback)}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">{t('Gaps')}</p>
              {result.gaps.length ? (
                <ul className="space-y-1.5 text-[12px] text-muted">
                  {result.gaps.map((gap, index) => <li key={`${index}-${gap}`}>• {t(gap)}</li>)}
                </ul>
              ) : <p className="text-[12px] text-muted">{t('No gaps flagged.')}</p>}
            </div>
            <div>
              <p className="eyebrow mb-2">{t('Suggestions')}</p>
              {result.suggestions.length ? (
                <ul className="space-y-1.5 text-[12px] text-muted">
                  {result.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`}>• {t(suggestion)}</li>)}
                </ul>
              ) : <p className="text-[12px] text-muted">{t('No suggestions right now.')}</p>}
            </div>
          </div>
          <AISourceChips sources={result.sources} />
          <p className="rounded-[10px] border border-amber/30 bg-amber-soft px-3 py-2 text-[11px] leading-relaxed text-amber-dark dark:text-amber">
            {result.notice
              ? t(result.notice)
              : t('Indicative feedback only — your trainer or institution makes the official decision.')}
          </p>
        </Card>
      )}
    </div>
  )
}

/* -------------------------------- Plan ----------------------------------- */

function PlanPanel({ role }: { role: Role }) {
  const isStudent = role === 'student'
  const { notify } = useApp()
  const t = useT()
  const [minutes, setMinutes] = useState('60')
  const [days, setDays] = useState('5')
  const [busy, setBusy] = useState(true)
  const [savingDay, setSavingDay] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AIPlanResponse | null>(null)

  const load = async (event?: FormEvent) => {
    event?.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    const query = new URLSearchParams({
      minutes: String(Math.min(480, Math.max(15, Number(minutes) || 60))),
      days: String(Math.min(14, Math.max(1, Number(days) || 5))),
    })
    try {
      setResult(await apiClient.get<AIPlanResponse>(`/ai/plan?${query.toString()}`))
    } catch (caught) {
      setError(errorMessage(caught, t('The request could not be completed.')))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    let active = true
    apiClient.get<AIPlanResponse>('/ai/plan?minutes=60&days=5')
      .then((data) => { if (active) setResult(data) })
      .catch((caught: unknown) => { if (active) setError(errorMessage(caught, t('The request could not be completed.'))) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [t])

  const applyItem = async (item: AIPlanItem) => {
    if (!isStudent || savingDay !== null) return
    setSavingDay(item.day)
    try {
      await apiClient.post<{ task: PlannerTask }>('/planner', {
        title: item.task,
        course: 'MENYA AI study plan',
        day: Math.max(0, Math.min(4, item.day - 1)),
        start: extractStart(item.slot),
        duration: Math.max(5, item.minutes),
        type: inferTaskType(item.task),
      })
      notify(
        t('Added to study planner'),
        t('{task} · Day {day} · {slot}', { task: t(item.task), day: item.day, slot: item.slot }),
      )
    } catch (caught) {
      notify(t('Could not add study block'), errorMessage(caught, t('The request could not be completed.')), 'error')
    } finally {
      setSavingDay(null)
    }
  }

  return (
    <div className="stack animate-fade-up">
      <Card className="card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <CalendarDays size={16} className="text-emerald" aria-hidden /> {t('Study plan')}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {isStudent
                ? t('Apply a suggested block to your MENYA study planner.')
                : t('Use this plan to guide your cohort or review schedule. Planner edits remain student-only.')}
            </p>
          </div>
          {result && <Badge tone="neutral">{t('Engine: {engine}', { engine: result.engine })}</Badge>}
        </div>
        <form onSubmit={(event) => void load(event)} className="mt-5 flex flex-wrap items-end gap-3">
          <div className="w-32">
            <label className="label" htmlFor="plan-minutes">{t('Minutes / day')}</label>
            <input
              id="plan-minutes"
              className="input"
              type="number"
              min={15}
              max={480}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
          </div>
          <div className="w-32">
            <label className="label" htmlFor="plan-days">{t('Days')}</label>
            <input
              id="plan-days"
              className="input"
              type="number"
              min={1}
              max={14}
              value={days}
              onChange={(event) => setDays(event.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" icon={RefreshCw} disabled={busy}>
            {busy ? t('Loading…') : t('Refresh plan')}
          </Button>
        </form>
      </Card>

      {error && <ErrorNote message={error} />}
      {result && (
        <Card className="overflow-hidden">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t('Day')}</th>
                  <th scope="col">{t('Slot')}</th>
                  <th scope="col">{t('Task')}</th>
                  <th scope="col">{t('Minutes')}</th>
                  <th scope="col">{t('Reason')}</th>
                  {isStudent && <th scope="col">{t('Planner')}</th>}
                </tr>
              </thead>
              <tbody>
                {result.plan.map((item) => (
                  <tr key={`${item.day}-${item.slot}`}>
                    <td className="font-semibold tabular-nums">{item.day}</td>
                    <td className="whitespace-nowrap text-muted">{item.slot}</td>
                    <td className="font-medium">{t(item.task)}</td>
                    <td className="tabular-nums text-muted">{item.minutes}</td>
                    <td className="text-[12px] text-muted">{t(item.reason)}</td>
                    {isStudent && (
                      <td>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] font-semibold text-emerald transition-colors hover:border-emerald/50 disabled:opacity-50"
                          onClick={() => void applyItem(item)}
                          disabled={savingDay !== null}
                          aria-label={t('Add day {day} task to planner', { day: item.day })}
                        >
                          <Sparkles size={12} aria-hidden /> {t('Add')}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-4 py-3 text-[11px] text-muted">
            {result.deterministic
              ? t('This plan was built with MENYA’s deterministic scheduling rules.')
              : t('This plan was assembled with AI assistance.')}
            {' '}{t('Adjust it to your context and confirm safety-sensitive practice with your trainer.')}
          </div>
        </Card>
      )}
    </div>
  )
}

/* ------------------------------- Sources ---------------------------------- */

function SourcesPanel({
  role,
  language,
  simpleMode,
  actionContext,
}: {
  role: Role
  language: AILanguage
  simpleMode: boolean
  actionContext: AIActionContext
}) {
  const t = useT()
  const [result, setResult] = useState<AIAssistResponse | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    apiClient.post<AIAssistResponse>('/ai/assist', {
      message: t('List the approved curriculum sources you can cite'),
      context: t(roleWorkspaces[role].label),
      language,
      simpleMode,
      task: 'resource',
    })
      .then((data) => { if (active) setResult(data) })
      .catch((caught: unknown) => { if (active) setError(errorMessage(caught, t('The request could not be completed.'))) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [role, language, simpleMode, refreshKey, t])

  const refresh = () => {
    setBusy(true)
    setRefreshKey((value) => value + 1)
  }

  return (
    <div className="stack animate-fade-up">
      <Card className="card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <LibraryBig size={16} className="text-emerald" aria-hidden /> {t('Approved sources')}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {t('MENYA only cites approved curriculum material. References are shown as [S1] title chips.')}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refresh} disabled={busy}>
            {busy ? t('Loading…') : t('Refresh')}
          </Button>
        </div>
      </Card>

      {error && <ErrorNote message={error} />}
      {result && (
        <Card className="card-pad stack">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="emerald" dot>
              {t('{count} cited sources', { count: result.sources.length })}
            </Badge>
            <Badge tone="neutral">{t('Engine: {engine}', { engine: result.engine })}</Badge>
            {!result.grounded && <Badge tone="amber">{t('Not fully grounded')}</Badge>}
          </div>
          <p className="whitespace-pre-line text-[13px] leading-relaxed">{t(result.reply)}</p>
          <AISourceChips sources={result.sources} />
          <AIActionButtons actions={result.actions} context={actionContext} />
          {result.notice && <p className="text-[11px] leading-relaxed text-muted">{t(result.notice)}</p>}
        </Card>
      )}
    </div>
  )
}

/* ------------------------------- Status ----------------------------------- */

function StatusPanel() {
  const t = useT()
  const [result, setResult] = useState<AIStatusResponse | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    apiClient.get<AIStatusResponse>('/ai/status')
      .then((data) => { if (active) setResult(data) })
      .catch((caught: unknown) => { if (active) setError(errorMessage(caught, t('The request could not be completed.'))) })
      .finally(() => { if (active) setBusy(false) })
    return () => { active = false }
  }, [refreshKey, t])

  return (
    <div className="stack animate-fade-up">
      <Card className="card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Activity size={16} className="text-emerald" aria-hidden /> {t('AI service status')}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {t('Administrator-only view of provider health, quota and cache usage.')}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            disabled={busy}
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            {busy ? t('Loading…') : t('Refresh')}
          </Button>
        </div>
      </Card>

      {error && <ErrorNote message={error} />}
      {result && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="card-pad">
              <p className="eyebrow">{t('Provider')}</p>
              <p className="mt-2 break-words text-[15px] font-bold">{result.provider}</p>
              <p className="mt-1 truncate text-[11px] text-muted">{result.model}</p>
            </Card>
            <Card className="card-pad">
              <p className="eyebrow">{t('Configuration')}</p>
              <p className="mt-2">
                <Badge tone={result.configured ? 'emerald' : 'danger'} dot>
                  {result.configured ? t('Configured') : t('Not configured')}
                </Badge>
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {t('{count} cached entries', { count: result.cacheEntries })}
              </p>
            </Card>
            <Card className="card-pad">
              <p className="eyebrow">{t('Quota')}</p>
              <p className="mt-2 text-[15px] font-bold tabular-nums">{result.quota.used} / {result.quota.limit}</p>
              <p className="mt-1 text-[11px] text-muted">{t('Resets {resetAt}', { resetAt: result.quota.resetAt })}</p>
            </Card>
            <Card className="card-pad">
              <p className="eyebrow">{t('Requests')}</p>
              <p className="mt-2 text-[15px] font-bold tabular-nums">{result.usage.requests}</p>
              <p className="mt-1 text-[11px] text-muted">
                {t('{count} tokens used', { count: result.usage.tokens })}
              </p>
            </Card>
          </div>

          <Card className="card-pad stack">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="eyebrow">{t('Quota usage')}</p>
                <span className="text-[11px] font-semibold tabular-nums text-muted">
                  {result.quota.limit > 0 ? Math.round((result.quota.used / result.quota.limit) * 100) : 0}%
                </span>
              </div>
              <ProgressBar
                value={result.quota.limit > 0 ? (result.quota.used / result.quota.limit) * 100 : 0}
                tone={result.quota.used >= result.quota.limit ? 'amber' : 'emerald'}
                showValue
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line bg-surface-alt p-3">
                <p className="text-[11px] text-muted">{t('Errors')}</p>
                <p className="mt-1 text-[15px] font-bold tabular-nums">{result.usage.errors}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-alt p-3">
                <p className="text-[11px] text-muted">{t('Fallbacks')}</p>
                <p className="mt-1 text-[15px] font-bold tabular-nums">{result.usage.fallbacks}</p>
              </div>
              <div className="rounded-xl border border-line bg-surface-alt p-3">
                <p className="text-[11px] text-muted">{t('Last error')}</p>
                <p className="mt-1 break-words text-[11px] font-medium">
                  {result.lastError ? t(result.lastError) : t('None')}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

/* ------------------------------ Workspace --------------------------------- */

function AIWorkspaceContent({
  searchParams,
  setSearchParams,
}: {
  searchParams: URLSearchParams
  setSearchParams: SetURLSearchParams
}) {
  const { user } = useAuth()
  const { language, setLanguage, setTheme, notify } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const role: Role = user?.role ?? 'student'
  const isAdmin = role === 'admin'

  const linkedPrompt = searchParams.get('prompt') ?? ''
  const linkedContext = searchParams.get('context') ?? ''
  const [tab, setTab] = useState<AITab>(() => parseTab(searchParams.get('tab'), isAdmin))
  const [simpleMode, setSimpleMode] = useState(false)

  useEffect(() => {
    const queryLanguage = searchParams.get('language')
    if (queryLanguage === 'en' || queryLanguage === 'rw') setLanguage(parseLanguage(queryLanguage))
  }, [searchParams, setLanguage])

  const changeLanguage = (next: AILanguage) => {
    setLanguage(next)
    setSearchParams((current) => {
      const updated = new URLSearchParams(current)
      updated.set('language', next)
      updated.set('tab', tab)
      return updated
    }, { replace: true })
  }

  const actionContext: AIActionContext = { navigate, setTheme, notify }

  const tabs: TabItem<AITab>[] = [
    { id: 'ask', label: t('Ask'), icon: MessageCircleQuestion },
    { id: 'practice', label: t('Practice'), icon: ClipboardCheck },
    { id: 'evaluate', label: t('Evaluate'), icon: FileCheck2 },
    { id: 'plan', label: t('Plan'), icon: CalendarDays },
    { id: 'sources', label: t('Sources'), icon: LibraryBig },
    ...(isAdmin ? [{ id: 'status', label: t('Status'), icon: Activity } as TabItem<AITab>] : []),
  ]

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('INTELLIGENCE')}
        title={t('MENYA AI')}
        description={t('Your intelligent assistant for this workspace · {workspace}', {
          workspace: t(roleWorkspaces[role].label),
        })}
        actions={<Badge tone="emerald" dot>{t('Available to every role')}</Badge>}
      />

      <Tabs items={tabs} active={tab} onChange={setTab} />

      {tab !== 'ask' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-4 py-3 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{t('Response language')}</span>
            <div className="inline-flex rounded-lg border border-line bg-surface-alt p-0.5" role="group" aria-label={t('AI response language')}>
              {(['en', 'rw'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => changeLanguage(option)}
                  aria-pressed={language === option}
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                    language === option
                      ? 'bg-emerald-soft text-emerald-dark dark:text-emerald'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {t(option === 'en' ? 'English' : 'Kinyarwanda')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-muted">{t('Use simple language')}</span>
            <Toggle checked={simpleMode} onChange={setSimpleMode} label={t('Use simple language in AI answers')} />
          </div>
        </div>
      )}

      {tab === 'ask' && (
        <div className="h-[min(74vh,760px)] min-h-[540px] overflow-hidden">
          <AITutorPanel
            key={`${linkedPrompt}:${linkedContext}:${language}`}
            lessonTitle={linkedContext || t(roleWorkspaces[role].label)}
            context={linkedContext || t(roleWorkspaces[role].label)}
            initialMessage={linkedPrompt}
            initialTask="tutor"
            language={language}
            onLanguageChange={changeLanguage}
            simpleMode={simpleMode}
            role={role}
          />
        </div>
      )}

      {tab === 'practice' && (
        <PracticePanel
          role={role}
          language={language}
          simpleMode={simpleMode}
          actionContext={actionContext}
          initialTopic={linkedPrompt || linkedContext}
        />
      )}
      {tab === 'evaluate' && <EvaluatePanel language={language} initialTopic={linkedContext} />}
      {tab === 'plan' && <PlanPanel role={role} />}
      {tab === 'sources' && (
        <SourcesPanel
          key={`${language}:${simpleMode}`}
          role={role}
          language={language}
          simpleMode={simpleMode}
          actionContext={actionContext}
        />
      )}
      {tab === 'status' && isAdmin && <StatusPanel />}
    </div>
  )
}

export default function AIWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyParams = new URLSearchParams(searchParams)
  keyParams.delete('language')
  const searchKey = keyParams.toString() || 'default'
  return (
    <AIWorkspaceContent
      key={searchKey}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
    />
  )
}
