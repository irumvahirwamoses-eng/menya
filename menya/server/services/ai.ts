import { z } from 'zod'
import { config } from '../config'
import { assessmentCatalog } from '../data/assessments'
import { curriculumSources, retrieveCurriculum, type CurriculumSource } from '../data/curriculum'
import { Attempt, Course, PlannerTask, Progress, Review } from '../models/Domain'
import { User } from '../models/User'
import type { AILanguage, AITask, Role } from '../types'
import {
  getAIProvider,
  getFallbackProvider,
  isGeminiConfigured,
  type AIChatMessage,
  type AIEngine,
  type AIGenerationResult,
  type AIUsage,
} from './ai/provider'
import {
  getUsageSnapshot,
  makeCacheKey,
  readCached,
  recordAIRequest,
  reserveQuota,
  writeCached,
} from './ai/usage'
import { allowedRoutesForRole, suggestedActions, validateAIActions, type AIAction } from './ai/tools'

export type AIContext =
  | 'dashboard'
  | 'workspace'
  | 'curriculum'
  | 'resources'
  | 'assessments'
  | 'assessment-result'
  | 'analytics'
  | 'planner'
  | 'trainer-dashboard'
  | 'trainer-cohorts'
  | 'trainer-courses'
  | 'trainer-reviews'
  | 'reviewer-dashboard'
  | 'reviewer-queue'
  | 'reviewer-history'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-courses'
  | 'admin-settings'

export interface AIInsight {
  id: string
  title: string
  description: string
  factors: string[]
  tone: 'emerald' | 'amber' | 'info'
}

interface AIActor {
  id: string
  role: Role
  name: string
}

const insight = (id: string, tone: AIInsight['tone'], title: string, description: string, factors: string[]): AIInsight => ({
  id,
  tone,
  title,
  description,
  factors,
})

const rounded = (value: number) => Math.round(value)

async function studentFacts(actor: AIActor) {
  const [progress, attempts, tasks, reviews] = await Promise.all([
    Progress.find({ userId: actor.id }).lean(),
    Attempt.find({ userId: actor.id }).sort({ completedAt: -1 }).limit(12).lean(),
    PlannerTask.find({ userId: actor.id }).lean(),
    Review.find({ learnerName: actor.name }).lean(),
  ])

  const mastery = progress.length ? rounded(progress.reduce((sum, item) => sum + item.mastery, 0) / progress.length) : 0
  const weeklyMinutes = progress.reduce((sum, item) => sum + item.weeklyMinutes, 0)
  const weakest = [...progress].sort((a, b) => a.mastery - b.mastery)[0]
  const strongest = [...progress].sort((a, b) => b.mastery - a.mastery)[0]
  const pendingTasks = tasks.filter((task) => !task.done)
  const latestAttempt = attempts[0]
  const lowAttempts = attempts.filter((attempt) => attempt.score < 80).length

  return {
    progress,
    attempts,
    tasks,
    reviews,
    mastery,
    weeklyMinutes,
    weakest,
    strongest,
    pendingTasks,
    latestAttempt,
    lowAttempts,
  }
}

async function trainerFacts() {
  const [learners, courseRows, pendingReviews, recentReviews] = await Promise.all([
    User.countDocuments({ role: 'student', active: true }),
    Progress.aggregate<{ _id: string; learners: number; avgMastery: number }>([
      { $group: { _id: '$courseCode', learners: { $sum: 1 }, avgMastery: { $avg: '$mastery' } } },
      { $sort: { avgMastery: 1 } },
    ]),
    Review.countDocuments({ status: 'Pending' }),
    Review.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(4).lean(),
  ])
  const weakestCourse = courseRows[0]
  const strongestCourse = [...courseRows].sort((a, b) => b.avgMastery - a.avgMastery)[0]

  return { learners, courseRows, pendingReviews, recentReviews, weakestCourse, strongestCourse }
}

async function reviewerFacts() {
  const [pending, inReview, passed, changes, recent] = await Promise.all([
    Review.countDocuments({ status: 'Pending' }),
    Review.countDocuments({ status: 'In review' }),
    Review.countDocuments({ status: 'Passed' }),
    Review.countDocuments({ status: 'Changes requested' }),
    Review.find().sort({ createdAt: -1 }).limit(8).lean(),
  ])
  const decided = passed + changes
  const criteria = new Set(recent.map((item) => item.criterion).filter(Boolean))
  return {
    pending,
    inReview,
    passed,
    changes,
    passRate: decided ? rounded((passed / decided) * 100) : 0,
    recent,
    criteria: [...criteria],
  }
}

async function adminFacts() {
  const [students, trainers, reviewers, courses, reviews, activeUsers] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'trainer' }),
    User.countDocuments({ role: 'reviewer' }),
    Course.countDocuments(),
    Review.countDocuments(),
    User.countDocuments({ active: true }),
  ])
  return { students, trainers, reviewers, courses, reviews, activeUsers }
}

function studentInsights(context: AIContext, facts: Awaited<ReturnType<typeof studentFacts>>): AIInsight[] {
  const courseLabel = facts.weakest?.courseCode ?? 'your current course'
  const weakestMastery = facts.weakest ? rounded(facts.weakest.mastery) : facts.mastery
  const strongestLabel = facts.strongest?.courseCode ?? 'your strongest course'
  const attemptScore = facts.latestAttempt ? rounded(facts.latestAttempt.score) : null

  switch (context) {
    case 'workspace':
      return [
        insight(
          'workspace-focus',
          'emerald',
          `Start with ${courseLabel}`,
          `Your mastery in ${courseLabel} is ${weakestMastery}%. A short practice block here will move your overall profile faster than another full lesson.`,
          [`${courseLabel} is your lowest mastery course.`, `${facts.strongest?.courseCode ?? 'Your strongest course'} is already above ${facts.strongest ? rounded(facts.strongest.mastery) : 0}%.`, `You have ${facts.pendingTasks.length} planned blocks still open.`],
        ),
      ]
    case 'curriculum':
      return [
        insight(
          'curriculum-fit',
          'emerald',
          `Stay on ${courseLabel} for the next step`,
          `Your current path already builds on ${strongestLabel}. Completing the next ${courseLabel} module keeps your learning sequence intact.`,
          [`${facts.progress.length} courses are in progress.`, `Average mastery across courses is ${facts.mastery}%.`, `Recent attempts show ${facts.lowAttempts} result${facts.lowAttempts === 1 ? '' : 's'} below 80%.`],
        ),
      ]
    case 'resources':
      return [
        insight(
          'resource-match',
          'info',
          'Use resources that match your weakest skill',
          `Prioritise practical guides and worked examples for ${courseLabel}. They match the skill pattern in your recent attempts.`,
          [`${courseLabel} has the lowest mastery in your profile.`, `You have logged ${facts.weeklyMinutes} focused minutes this week.`, 'Saved resources are kept for offline revision.'],
        ),
      ]
    case 'assessments':
      return [
        insight(
          'assessment-ready',
          'amber',
          'A short quiz now gives the clearest signal',
          attemptScore === null
            ? `No attempt is recorded yet. Start with ${courseLabel}; five focused questions will show where to revise first.`
            : `Your latest attempt scored ${attemptScore}%. Review the explanations, then retry ${facts.latestAttempt?.assessmentTitle ?? 'the assessment'} within a day.`,
          [`${facts.attempts.length} attempts recorded.`, `${facts.lowAttempts} attempt${facts.lowAttempts === 1 ? '' : 's'} fell below the 80% benchmark.`, `${facts.pendingTasks.length} study blocks remain on your plan.`],
        ),
      ]
    case 'assessment-result':
      return [
        insight(
          'attempt-review',
          attemptScore !== null && attemptScore >= 80 ? 'emerald' : 'amber',
          attemptScore !== null && attemptScore >= 80
            ? 'Strong result — keep the momentum'
            : 'Your next practice session has a clear target',
          attemptScore !== null && attemptScore >= 80
            ? `You met the 80% benchmark with ${attemptScore}%. A spaced review will protect the result before the final competency check.`
            : `You scored ${attemptScore ?? 0}%. Correct the missed explanations today, then retry ${facts.latestAttempt?.assessmentTitle ?? 'the assessment'}.`,
          [`Latest recorded score: ${attemptScore ?? 0}%.`, `Correct answers: ${facts.latestAttempt?.correctCount ?? 0} of ${facts.latestAttempt?.total ?? 0}.`, `${courseLabel} remains your development focus.`],
        ),
      ]
    case 'analytics':
      return [
        insight(
          'analytics-gap',
          'emerald',
          `${courseLabel} at ${weakestMastery}% is your growth opportunity`,
          `It is the lowest of your active courses. A focused practice set can lift it into the same band as ${strongestLabel}.`,
          [`Average mastery is ${facts.mastery}%.`, `${facts.weeklyMinutes} minutes logged this week.`, `Your latest attempt scored ${attemptScore ?? 0}%.`],
        ),
      ]
    case 'planner':
      return [
        insight(
          'planner-slot',
          'info',
          'Protect one short daily block',
          `You still have ${facts.pendingTasks.length} planned blocks. Keep them short and place the hardest task on your highest-energy day.`,
          [`${facts.tasks.length} blocks are on your plan.`, `${facts.pendingTasks.filter((task) => task.type === 'Practice').length} practice blocks remain.`, `${facts.weeklyMinutes} focused minutes were logged this week.`],
        ),
      ]
    case 'dashboard':
    default:
      return [
        insight(
          'student-focus',
          'emerald',
          'One focused session can close your biggest gap',
          `${courseLabel} mastery is ${weakestMastery}% while ${strongestLabel} is stronger. A short practice set on your weakest skill is the fastest route to a balanced profile.`,
          [`${facts.attempts.length} recent attempts analysed.`, `${facts.pendingTasks.length} study blocks still open this week.`, facts.reviews.some((item) => item.status === 'Pending') ? 'One submitted artifact is waiting for review.' : 'Your submissions are up to date.'],
        ),
      ]
  }
}

function trainerInsights(context: AIContext, facts: Awaited<ReturnType<typeof trainerFacts>>): AIInsight[] {
  const focusCode = facts.weakestCourse?._id ?? 'your lowest-scoring course'
  const focusMastery = facts.weakestCourse ? rounded(facts.weakestCourse.avgMastery) : 0
  const cohortSize = facts.learners

  switch (context) {
    case 'trainer-cohorts':
      return [
        insight('cohort-checkin', 'amber', 'Prioritise a check-in with quiet learners', `Across ${cohortSize} active learners, the biggest signal is the gap in ${focusCode}. A short targeted intervention is more useful than a broad announcement.`, [`${cohortSize} active learners.`, `${focusCode} averages ${focusMastery}% mastery.`, `${facts.pendingReviews} artifacts are waiting for feedback.`]),
      ]
    case 'trainer-courses':
      return [
        insight('course-focus', 'emerald', `${focusCode} needs targeted practice`, `Course mastery is ${focusMastery}%. Add a worked example before the next assessment and pair it with a short competency check.`, [`${facts.courseRows.length} courses have progress data.`, `${facts.strongestCourse?._id ?? 'Your strongest course'} leads the cohort.`, `${facts.pendingReviews} submissions remain in the review queue.`]),
      ]
    case 'trainer-reviews':
      return [
        insight('trainer-reviews', 'amber', 'Clear the oldest submissions first', `${facts.pendingReviews} artifacts are pending. Focus on the earliest submissions so learners get feedback while the task is still fresh.`, [facts.recentReviews.map((item) => item.learnerName).filter(Boolean).join(', ') || 'No pending submissions', 'Criterion-based feedback keeps decisions consistent.', 'Reviewers can pass or request changes from their workspace.']),
      ]
    case 'trainer-dashboard':
    default:
      return [
        insight('trainer-cohort', 'emerald', 'A nudge could lift this cohort', `${facts.pendingReviews} submissions are waiting and ${focusCode} averages ${focusMastery}% mastery. A short check-in plus targeted practice is the fastest route back on track.`, [`${cohortSize} active learners.`, `${focusCode} averages ${focusMastery}% mastery.`, facts.recentReviews.length ? `${facts.recentReviews.length} recent submissions need attention.` : 'The submission queue is clear.']),
      ]
  }
}

function reviewerInsights(context: AIContext, facts: Awaited<ReturnType<typeof reviewerFacts>>): AIInsight[] {
  const focusCriterion = facts.criteria[0] ?? 'the shared rubric'

  switch (context) {
    case 'reviewer-queue':
      return [
        insight('review-priority', 'amber', 'Prioritise safety and evidence checks', `${facts.pending} artifacts are pending. Apply the same four rubric checks in the same order, and treat ${focusCriterion} as the first check when it appears.`, [`${facts.pending} pending, ${facts.inReview} in review.`, `Recent pass rate is ${facts.passRate}%.`, `${facts.changes} changes requested so far.`]),
      ]
    case 'reviewer-history':
      return [
        insight('review-consistency', 'info', 'Your decisions are steady', `You have recorded ${facts.passed} passes and ${facts.changes} change requests. Use the history to check that similar evidence received similar decisions.`, [`Pass rate: ${facts.passRate}%.`, `${facts.recent.length} recent decisions reviewed.`, 'Rubric alignment remains the main consistency check.']),
      ]
    case 'reviewer-dashboard':
    default:
      return [
        insight('reviewer-brief', 'emerald', 'Keep decisions consistent', `Pass rates vary most on evidence and safety criteria. Check the shared rubric before you record a decision, especially when ${focusCriterion} is involved.`, [`${facts.pending} items awaiting a decision.`, `Median turnaround is under 20 minutes.`, `Recent pass rate is ${facts.passRate}%.`]),
      ]
  }
}

function adminInsights(context: AIContext, facts: Awaited<ReturnType<typeof adminFacts>>): AIInsight[] {
  switch (context) {
    case 'admin-users':
      return [
        insight('admin-users', 'amber', 'Check access before the next intake', `${facts.students} learner accounts and ${facts.trainers} trainer accounts are provisioned. Review inactive accounts and role changes before onboarding a new cohort.`, [`${facts.activeUsers} active accounts.`, `${facts.reviewers} reviewer accounts.`, 'Role changes take effect on the next token refresh.']),
      ]
    case 'admin-courses':
      return [
        insight('admin-courses', 'emerald', 'Course coverage matches core TVET trades', `${facts.courses} learning paths are live. Keep practical and emerging-trade courses balanced as regional enrolment grows.`, [`${facts.students} learners across the platform.`, `${facts.trainers} trainers assigned.`, `${facts.reviews} review items generated so far.`]),
      ]
    case 'admin-settings':
      return [
        insight('admin-settings', 'info', 'AI service is ready for scale', 'Role-aware AI insights and tutoring are served by the MENYA API. No external key is required for the deterministic MVP service.', ['Insights are generated from secure server-side data.', 'Tutoring respects the signed-in role and page context.', 'Safety guidance always defers to the trainer and rubric.']),
      ]
    case 'admin-dashboard':
    default:
      return [
        insight('admin-growth', 'emerald', 'Growth is widening beyond Kigali', `${facts.activeUsers} accounts are active and ${facts.courses} learning paths are live. Regional centres are catching up with the capital.`, [`${facts.students} learner accounts.`, `${facts.trainers} trainers and ${facts.reviewers} reviewers.`, `${facts.reviews} review items processed.`]),
      ]
  }
}

export async function buildInsights(actor: AIActor, context: AIContext): Promise<AIInsight[]> {
  if (actor.role === 'student') return studentInsights(context, await studentFacts(actor))
  if (actor.role === 'trainer') return trainerInsights(context, await trainerFacts())
  if (actor.role === 'reviewer') return reviewerInsights(context, await reviewerFacts())
  return adminInsights(context, await adminFacts())
}

const starterPromptsEn: Record<Role, string[]> = {
  trainer: ['Who needs a check-in?', 'Which course needs practice?', 'Summarise the review queue'],
  reviewer: ['How do I apply the rubric?', 'What should I prioritise?', 'Check consistency of decisions'],
  admin: ['Summarise platform health', 'Where is coverage thin?', 'What should I check before intake?'],
  student: [
    'Explain this in simpler terms',
    'Give me a hint for the activity',
    'Why did I miss that quiz question?',
    'Suggest practice exercises',
  ],
}

const starterPromptsRw: Record<Role, string[]> = {
  trainer: [
    'Ni nde ukeneye gusurwa?',
    'Ni iyihe nzira ikeneye imyitozo?',
    'Sobanura akazi ko kugenzura',
  ],
  reviewer: [
    'Nkoresha gute rubriki?',
    'Ntangire he?',
    'Reba niba ibyemezo bihuje',
  ],
  admin: [
    'Sobanura imiterere ya sisitemu',
    'Aho ubumenyi budahagije ni he?',
    'Ni iki nakwitaho mbere yo kwakira abanyeshuri?',
  ],
  student: [
    'Sobera mu buryo bworoshye',
    'Mpa ikimenyetso',
    'Kuki nabuze kuri quiz?',
    'Tanga imyitozo',
  ],
}

export function starterPromptsForRole(role: Role, language: AILanguage = 'en'): string[] {
  return language === 'rw' ? starterPromptsRw[role] : starterPromptsEn[role]
}

const conceptRules: Array<{ match: RegExp; answer: string }> = [
  {
    match: /ohm|voltage|current|circuit/i,
    answer: 'Think of a circuit like water in a pipe: voltage is the pressure, current is the flow, and resistance is how narrow the pipe is. So Ohm’s law is I = V ÷ R. Substitute the known values last, then check that the answer is realistic for the installation.',
  },
  {
    match: /solar|panel|inverter|pv/i,
    answer: 'For a safe PV installation, size the charge controller using short-circuit current × 1.25. Then check that the inverter can handle the peak load, not just the average. The safety factor is the step learners most often miss.',
  },
  {
    match: /excel|spreadsheet|formula|table/i,
    answer: 'Use a relative reference like =B2*C2 when the formula should follow the row, and $B$2 when the value must stay fixed. For an inventory sheet, the tax rate should be absolute so every row uses the same cell.',
  },
  {
    match: /quiz|test|exam|assessment|answer/i,
    answer: 'Look at the missed explanations first. Mastery grows fastest when you correct an error within a day and then retry with a short practice set. The attempt score alone is less useful than the skill pattern behind it.',
  },
  {
    match: /explain|simpl|simple|don.t understand|confus/i,
    answer: 'Here is the simpler version: identify what you already know, write the one formula that connects it to what you need, and substitute the numbers last. Let’s try it together on your current example.',
  },
  {
    match: /hint|stuck|help/i,
    answer: 'Start from the labelled diagram. The value next to the resistor is resistance; the supply value is voltage. Put those into I = V ÷ R, then check the units before you finalise the answer.',
  },
  {
    match: /practice|exercise|question/i,
    answer: 'I would create a short adaptive set: two calculation items, one safety scenario and one worked example. It should adapt after each answer so a miss immediately triggers a worked solution.',
  },
  {
    match: /progress|performance|score|mastery/i,
    answer: 'Use mastery by skill rather than a single course percentage. The lowest active course is usually the highest-value focus, especially when a recent attempt confirms the same gap.',
  },
]

const roleRules: Record<Exclude<Role, 'student'>, Array<{ match: RegExp; answer: string }>> = {
  trainer: [
    {
      match: /check|quiet|nudge|engag/i,
      answer: 'Start with learners whose progress has not moved this week, then pair them with the lowest-mastery course. A two-minute check-in is more effective than a broad reminder to the whole cohort.',
    },
    {
      match: /course|mastery|skill|practice/i,
      answer: 'Compare average mastery by course, then schedule a worked example for the weakest course before the next assessment. Keep the strongest course as a retrieval-practice block so it does not regress.',
    },
    {
      match: /review|submission|queue/i,
      answer: 'Clear the oldest pending artifacts first and give criterion-based feedback. Reviewers make the final pass or change decision; your workspace should focus on cohort patterns and follow-up.',
    },
  ],
  reviewer: [
    {
      match: /rubric|criterion|consistent|fair/i,
      answer: 'Apply the four checks in the same order every time: explicit safety steps, correct ratings, legible evidence, and a clear reflection. If two artifacts differ only in evidence quality, keep the decision consistent with the rubric.',
    },
    {
      match: /priorit|queue|pending|first/i,
      answer: 'Prioritise pending artifacts that include a safety criterion, then anything older than two days. Leave clearly complete evidence for a quick pass so the queue keeps moving.',
    },
    {
      match: /feedback|change|request/i,
      answer: 'When requesting changes, name the exact criterion that is not met and one concrete correction. This turns a rejection into a learning step instead of a blocked learner.',
    },
  ],
  admin: [
    {
      match: /health|status|service|system/i,
      answer: 'The API, web client, database connection and AI service are the four health signals to watch. AI insights are generated server-side from live records, so no separate external key is required for this MVP.',
    },
    {
      match: /coverage|course|region|growth/i,
      answer: 'Look at course count alongside active learners and trainer coverage. When regional enrolment rises, check whether practical trades have enough trainers before adding new learning paths.',
    },
    {
      match: /access|role|intake|account/i,
      answer: 'Review inactive accounts and role assignments before a new intake. Role changes take effect on the next token refresh, and deactivated accounts lose refresh access immediately.',
    },
  ],
}

const fallbackByRole: Record<Role, string> = {
  student: 'Good question. Connect it to the lesson: identify the given values, choose the formula from the summary box, then check whether your answer makes sense in a real installation. Would you like a worked example?',
  trainer: 'I can help with cohort patterns, course mastery and submission flow. Ask about a learner group, a course, or the review queue and I will keep the answer tied to your trainer workspace.',
  reviewer: 'I can help you apply the rubric consistently, prioritise the queue and write useful feedback. Ask about a criterion or a decision pattern.',
  admin: 'I can summarise platform health, access and course coverage. Ask about accounts, regional growth or the AI service and I will answer from the administrator view.',
}

export function tutorReply(input: string, role: Role, context: string, simpleMode: boolean) {
  const rules = role === 'student' ? conceptRules : [...roleRules[role], ...conceptRules]
  const match = rules.find((rule) => rule.match.test(input))?.answer ?? fallbackByRole[role]
  const contextual = context.trim() ? `${match} This is based on your current ${context} view.` : match
  return simpleMode ? `In simple terms: ${contextual.split('. ')[0]}. Then apply the same idea to the task in front of you.` : contextual
}

export interface AIRecommendation {
  id: string
  kind: 'practice' | 'course' | 'resource' | 'assessment'
  title: string
  reason: string
  impact: string
  actionLabel: string
  target: string
  minutes: number
}

export async function buildRecommendations(actor: AIActor): Promise<AIRecommendation[]> {
  if (actor.role !== 'student') return []
  const facts = await studentFacts(actor)
  const course = facts.weakest?.courseCode ?? 'EIL-301'
  const mastery = facts.weakest ? rounded(facts.weakest.mastery) : facts.mastery
  const lowAttempts = facts.lowAttempts
  const pendingTasks = facts.pendingTasks.length

  return [
    {
      id: 'ai-practice',
      kind: 'practice',
      title: `Practice ${course} for 8 minutes`,
      reason: `${course} mastery is ${mastery}%, your lowest active course. A short targeted set is the fastest way to balance your profile.`,
      impact: 'Highest impact',
      actionLabel: 'Start practice',
      target: '/workspace',
      minutes: 8,
    },
    {
      id: 'ai-assessment',
      kind: 'assessment',
      title: lowAttempts ? 'Retry your weakest assessment' : 'Take a readiness quiz',
      reason: lowAttempts
        ? `${lowAttempts} recent result${lowAttempts === 1 ? '' : 's'} fell below the 80% benchmark. Correcting errors within a day builds mastery fastest.`
        : 'A short quiz will confirm that your current mastery is ready for the next competency check.',
      impact: lowAttempts ? 'Close the gap' : 'Confirm readiness',
      actionLabel: 'Open assessments',
      target: '/assessments',
      minutes: 12,
    },
    {
      id: 'ai-planner',
      kind: 'course',
      title: pendingTasks ? `Finish ${pendingTasks} planned blocks` : 'Plan your next study block',
      reason: pendingTasks
        ? `You still have ${pendingTasks} blocks on your plan. Keeping them short protects your study streak.`
        : 'Your plan is clear, so add one focused block before the next assessment.',
      impact: 'Protect your streak',
      actionLabel: 'Open planner',
      target: '/planner',
      minutes: 15,
    },
    {
      id: 'ai-resource',
      kind: 'resource',
      title: 'Review practical safety examples',
      reason: `Worked examples match the skill pattern in your ${facts.attempts.length} recent attempts and remain available offline.`,
      impact: 'Build confidence',
      actionLabel: 'Browse resources',
      target: '/resources',
      minutes: 10,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/* Gemini-backed intelligence                                                 */
/* -------------------------------------------------------------------------- */

export interface AISource {
  id: string
  title: string
}

export type AIUsageInfo = AIUsage

export interface AssistInput {
  actor: AIActor
  message: string
  context?: string
  language?: AILanguage
  simpleMode?: boolean
  task?: AITask
  response?: string
  rubric?: string[]
  history?: AIChatMessage[]
}

export interface AssistResult {
  role: Role
  context: string | null
  intent: string
  reply: string
  steps: string[]
  sources: AISource[]
  suggestions: string[]
  actions: AIAction[]
  engine: AIEngine
  grounded: boolean
  usage: AIUsageInfo
  notice?: string
}

interface AssistantModelPayload {
  reply: string
  steps: string[]
  sources: string[]
  suggestions: string[]
  actions: unknown[]
}

interface StructuredGenerationOptions<T> {
  system: string
  prompt: string
  history?: AIChatMessage[]
  schema: Record<string, unknown>
  maxOutputTokens?: number
  fallback: T
  validator: (value: unknown) => T
  userId: string
  cacheKey?: string
}

interface StructuredGenerationResult<T> {
  data: T
  engine: AIEngine
  usage: AIUsage
  notice?: string
}

function clampText(value: string, max: number): string {
  const trimmed = value.replace(/\r/g, '').trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function cleanJsonText(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function detectIntent(input: AssistInput): string {
  if (input.task && input.task !== 'general') return input.task
  const text = `${input.message} ${input.response ?? ''}`.toLowerCase()
  if (/quiz|exam|assessment|generate|question|practice/.test(text)) return 'assessment'
  if (/feedback|evaluate|mark|score|rubric|written answer/.test(text)) return 'evaluation'
  if (/plan|schedule|routine|timetable|study time/.test(text)) return 'planning'
  if (/resource|library|offline|source|reference/.test(text)) return 'resource'
  if (/progress|mastery|analytics|performance|weak topic/.test(text)) return 'analytics'
  return 'tutor'
}

function retrieveSources(query: string, task?: AITask): CurriculumSource[] {
  if (task === 'resource' && /list|all|which sources|approved sources|sources you can cite/i.test(query)) {
    return curriculumSources.slice(0, 8)
  }
  const found = retrieveCurriculum(query, 3)
  if (found.length) return found
  if (task === 'resource') return curriculumSources.slice(0, 6)
  return []
}

function sourceChips(sources: CurriculumSource[]): AISource[] {
  return sources.map((source) => ({ id: source.id, title: source.title }))
}

function authorizedSourceIds(sources: CurriculumSource[], ids: string[]): CurriculumSource[] {
  const byId = new Map(sources.map((source) => [source.id, source]))
  const seen = new Set<string>()
  const matched: CurriculumSource[] = []
  for (const id of ids) {
    const clean = id.trim().toUpperCase()
    if (seen.has(clean)) continue
    seen.add(clean)
    const source = byId.get(clean)
    if (source) matched.push(source)
  }
  return matched
}

async function authorizedFacts(actor: AIActor): Promise<string> {
  try {
    if (actor.role === 'student') {
      const facts = await studentFacts(actor)
      return `Average mastery ${facts.mastery}%. Weakest recorded course ${facts.weakest?.courseCode ?? 'not recorded'}. Latest attempt ${facts.latestAttempt ? `${rounded(facts.latestAttempt.score)}%` : 'none recorded'}. Open planner blocks ${facts.pendingTasks.length}.`
    }
    if (actor.role === 'trainer') {
      const facts = await trainerFacts()
      return `${facts.learners} active learners. Weakest course ${facts.weakestCourse?._id ?? 'not recorded'} at ${facts.weakestCourse ? rounded(facts.weakestCourse.avgMastery) : 0}%. Pending submissions ${facts.pendingReviews}.`
    }
    if (actor.role === 'reviewer') {
      const facts = await reviewerFacts()
      return `${facts.pending} pending, ${facts.inReview} in review, ${facts.passed} passed and ${facts.changes} change requests. Recent pass rate ${facts.passRate}%.`
    }
    const facts = await adminFacts()
    return `${facts.activeUsers} active accounts, ${facts.students} learners, ${facts.trainers} trainers, ${facts.reviewers} reviewers, ${facts.courses} courses and ${facts.reviews} reviews.`
  } catch {
    return 'Learning data is temporarily unavailable; do not assume any figures.'
  }
}

function sourceBlock(sources: CurriculumSource[]): string {
  if (!sources.length) {
    return 'No approved curriculum chunk matched this request. Do not invent curriculum facts, numbers, references or exam answers.'
  }
  return sources
    .map(
      (source) =>
        `[${source.id}] ${source.title} (${source.courseCode} · ${source.module})\n` +
        `Outcomes: ${source.outcomes.join('; ')}\n` +
        `Approved text: ${clampText(source.text, 1200)}`,
    )
    .join('\n\n')
}

function taskInstruction(task: AITask, simpleMode: boolean): string {
  const simple = simpleMode
    ? 'Use very short sentences, one idea per step, and one concrete example. Check understanding at the end.'
    : 'Teach in clear ordered steps with one worked example and one short check question.'
  switch (task) {
    case 'assessment':
      return 'Draft practice questions only. Never reveal an official answer key or claim these are official exam items. Label every item as practice.'
    case 'evaluation':
      return 'Give formative feedback, name exact knowledge gaps and suggest one improvement action. Do not assign an official grade.'
    case 'planning':
      return 'Explain a realistic study plan. Never claim to change the planner or any stored record.'
    case 'resource':
      return 'Recommend only sources listed in SOURCES. If none fit, say approved material is unavailable.'
    case 'general':
      return `Answer from the authorized role view. ${simple}`
    case 'tutor':
    default:
      return simple
  }
}

function buildAssistSystem(input: AssistInput, sources: CurriculumSource[], facts: string): string {
  const language = input.language ?? 'en'
  const languageRule =
    language === 'rw'
      ? 'Write only in natural, respectful Kinyarwanda (Ikinyarwanda). Use simple TVET vocabulary.'
      : 'Write only in clear, natural English.'
  return [
    'You are MENYA AI, an assistant inside an authenticated Rwandan TVET platform.',
    languageRule,
    `Authorized user role: ${input.actor.role}. Authorized facts: ${facts}`,
    'GROUNDING: Use only SOURCES for curriculum facts, numbers, examples, references and assessment content.',
    'If SOURCES do not cover the question, say that approved material is unavailable and give general study guidance without inventing facts.',
    'Never claim to access unseen records, change data, record grades, or provide official exam answers.',
    `SOURCES:\n${sourceBlock(sources)}`,
    `SAFE ACTIONS: You may suggest at most two actions. navigate targets must be exact paths from: ${allowedRoutesForRole(input.actor.role).join(', ')}. Never invent a route or URL.`,
    'OUTPUT: Return JSON only, no markdown, matching this shape: {"reply":string,"steps":string[],"sources":string[],"suggestions":string[],"actions":array}. Source IDs must come from SOURCES.',
    taskInstruction(input.task ?? 'general', Boolean(input.simpleMode)),
  ].join('\n\n')
}

function buildAssistPrompt(input: AssistInput): string {
  const parts = [
    `Current page: ${oneLine(input.context ?? 'MENYA AI workspace')}`,
    `Task: ${input.task ?? 'general'}`,
    `Question: ${clampText(input.message, config.ai.maxPromptChars)}`,
  ]
  if (input.response) parts.push(`Written response to review: ${clampText(input.response, 3000)}`)
  if (input.rubric?.length) parts.push(`Rubric: ${input.rubric.map((item) => oneLine(item)).join('; ')}`)
  return parts.join('\n')
}

async function generateStructured<T>(options: StructuredGenerationOptions<T>): Promise<StructuredGenerationResult<T>> {
  type CachedValue = { data: T; engine: AIEngine; usage: AIUsage }

  if (options.cacheKey) {
    const cached = readCached<CachedValue>(options.cacheKey)
    if (cached) {
      return {
        ...cached.value,
        usage: { ...cached.value.usage, tokens: 0 },
        notice: 'Served from a recent cached answer.',
      }
    }
  }

  const provider = getAIProvider()
  let result: AIGenerationResult | null = null
  let errorOccurred = false
  let fallbackUsed = false
  let errorMessage: string | undefined
  let notice: string | undefined

  const request = {
    system: options.system,
    prompt: options.prompt,
    history: options.history,
    schema: options.schema,
    maxOutputTokens: options.maxOutputTokens,
  }

  if (provider.name === 'gemini' && provider.configured) {
    if (!reserveQuota(options.userId)) {
      fallbackUsed = true
      notice = 'Daily Gemini quota reached; using MENYA’s built-in guide.'
    } else {
      try {
        result = await provider.generate(request)
      } catch (error) {
        errorOccurred = true
        fallbackUsed = true
        errorMessage = error instanceof Error ? error.message : 'Gemini request failed.'
        notice = 'Gemini is unavailable right now; using MENYA’s built-in guide.'
      }
    }
  } else {
    fallbackUsed = true
    notice = 'Gemini key is not configured; using MENYA’s built-in guide.'
  }

  if (!result) {
    result = await getFallbackProvider().generate({
      ...request,
      fallbackText: JSON.stringify(options.fallback),
    })
  }

  let data = options.fallback
  try {
    const parsed: unknown = JSON.parse(cleanJsonText(result.text))
    data = options.validator(parsed)
  } catch (error) {
    if (!fallbackUsed) {
      errorOccurred = true
      fallbackUsed = true
      errorMessage = error instanceof Error ? error.message : 'AI response could not be validated.'
      notice = 'I could not verify the AI response, so I used MENYA’s built-in guide.'
      result = await getFallbackProvider().generate({
        ...request,
        fallbackText: JSON.stringify(options.fallback),
      })
    }
    data = options.fallback
  }

  const engine: AIEngine = result.usage.fallback ? 'deterministic' : 'gemini'
  recordAIRequest({
    engine,
    tokens: result.usage.tokens,
    error: errorOccurred,
    fallback: fallbackUsed || result.usage.fallback,
    errorMessage,
  })

  const cached: CachedValue = { data, engine, usage: result.usage }
  if (options.cacheKey && !fallbackUsed) {
    writeCached(options.cacheKey, cached, engine, result.usage)
  }

  return { ...cached, notice }
}

const assistantResponseSchema = z.object({
  reply: z.string().trim().min(1).max(3500),
  steps: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  sources: z.array(z.string().trim().max(12)).max(8).default([]),
  suggestions: z.array(z.string().trim().min(1).max(240)).max(6).default([]),
  actions: z.array(z.unknown()).max(4).default([]),
})

const assistantResponseJsonSchema: Record<string, unknown> = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    steps: { type: 'ARRAY', items: { type: 'STRING' } },
    sources: { type: 'ARRAY', items: { type: 'STRING' } },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
    actions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          type: { type: 'STRING', enum: ['navigate', 'setTheme', 'notify'] },
          label: { type: 'STRING' },
          to: { type: 'STRING' },
          theme: { type: 'STRING', enum: ['light', 'dark'] },
          title: { type: 'STRING' },
          message: { type: 'STRING' },
          tone: { type: 'STRING', enum: ['success', 'info', 'error'] },
        },
        required: ['type', 'label'],
      },
    },
  },
  required: ['reply', 'steps', 'sources', 'suggestions', 'actions'],
}

function parseAssistantPayload(value: unknown): AssistantModelPayload {
  const parsed = assistantResponseSchema.safeParse(value)
  if (!parsed.success) throw new Error('Assistant response did not match the required structure.')
  return parsed.data
}

const kinyarwandaConceptRules: Array<{ match: RegExp; answer: string }> = [
  {
    match: /safety|isolate|umutekano|amashanyarazi|gukingira|ppe/i,
    answer: 'Umutekano w’amashanyarazi utangira ukimara kuzima amashanyarazi ukagenzura ko nta muriro ugikoresha ibikoresho. Koresha ibikoresho byo kwirinda, ukuraho ibyuma byo mu ntoki, wandike aho wazimye amashanyarazi, kandi ntukoreshe amazi ku muriro w’amashanyarazi.',
  },
  {
    match: /ohm|voltage|current|circuit|umuriro/i,
    answer: 'Tekereza circuit nk’umuyoboro w’amazi: voltage ni igitutu, current ni imigenda y’amazi, naho resistance ni ubugari bw’umuyoboro. I = V ÷ R. Andika ibyo uzi, hitamo formula, hanyuma ushiremo agaciro k’ubwirizwa.',
  },
  {
    match: /solar|panel|inverter|izuba|pv/i,
    answer: 'Kuri PV, banza ubare ingufu za buri munsi (W × amasaha y’izuba), hanyuma ugenzure ko charge controller n’inverter bishobora kwakira umutwaro. Umutekano n’ibipimo bigomba kwandikwa mbere yo gukoresha sisitemu.',
  },
  {
    match: /quiz|test|exam|ibizamini|ibibazo/i,
    answer: 'Tangira usobeza ibisobanuro by’ibibazo wabuze. Kosora ikosa mu munsi umwe, hanyuma wongere ugerageze ibibazo bike by’imyitozo.',
  },
  {
    match: /practice|exercise|imyitozo|ikimenyetso/i,
    answer: 'Ngwino dukore ibibazo bitatu: kimwe cyo kubara, kimwe cy’umutekano, n’ikindi cy’urugero rwakozwe. Buri kosa rigomba kugarukwaho n’igisubizo cy’intambwe ku ntambwe.',
  },
]

function tutorReplyRw(input: string, simpleMode: boolean): string {
  const match = kinyarwandaConceptRules.find((rule) => rule.match.test(input))?.answer
  const base =
    match ??
    'Nzagufasha guhuza ikibazo n’icyigishijwe: andika ibyo uzi, hitamo formula cyangwa intambwe ikwiye, hanyuma ugenzure niba igisubizo gifite isense. Ni izihe ntambwe ziguhagarika?'
  return simpleMode ? `Mu buryo bworoshye: ${base}` : base
}

function deterministicAssistantPayload(
  input: AssistInput,
  sources: CurriculumSource[],
): AssistantModelPayload {
  const language = input.language ?? 'en'
  const role = input.actor.role
  const intent = detectIntent(input)
  const general =
    language === 'rw'
      ? tutorReplyRw(input.message, Boolean(input.simpleMode))
      : tutorReply(input.message, role, input.context ?? '', Boolean(input.simpleMode))
  const primary = sources[0]
  const excerpt = primary ? clampText(primary.text.split('. ')[0] ?? primary.text, 260) : ''
  const citation = primary ? ` [${primary.id}]` : ''
  const simplePrefix = language === 'rw' ? 'Mu buryo bworoshye:' : 'In simple terms:'
  const plainGeneral = general.replace(/^(In simple terms|Mu buryo bworoshye):\s*/i, '')
  const firstIdea = clampText(plainGeneral.split('. ')[0] ?? plainGeneral, 220)
  const simpleTail =
    language === 'rw'
      ? ' Hanyuma ukoreshe icyo gitekerezo ku kazi uri gukora.'
      : ' Then apply the same idea to the task in front of you.'
  const reply = input.simpleMode
    ? `${simplePrefix} ${firstIdea}.${simpleTail}${citation}`
    : primary
      ? language === 'rw'
        ? `[${primary.id}] ${plainGeneral}`
        : `[${primary.id}] From approved material, ${excerpt}. ${general}`
      : language === 'rw'
        ? `${plainGeneral} Ntabwo mfite ibikoresho byemewe bisobanura neza iki kibazo, ndaya nk’ubuyobozi rusange gusa.`
        : `${general} I do not have approved material that covers this exact question, so treat this as general study guidance.`

  const steps =
    language === 'rw'
      ? sources.length
        ? sources.map((source) => `Reba [${source.id}] ${source.title}: ${clampText(source.outcomes[0] ?? source.text, 120)}`)
        : ['Andika ibyo uzi.', 'Hitamo uburyo bukwiye.', 'Genzura igisubizo cyawe.']
      : sources.length
        ? sources.map((source) => `Check [${source.id}] ${source.title}: ${clampText(source.outcomes[0] ?? source.text, 120)}`)
        : ['Write down what is given.', 'Choose the relevant method.', 'Check your answer against the lesson.']

  return {
    reply,
    steps,
    sources: sources.map((source) => source.id),
    suggestions: starterPromptsForRole(role, language).slice(0, 3),
    actions: suggestedActions(role, intent, language) as unknown[],
  }
}

export async function assist(input: AssistInput): Promise<AssistResult> {
  const language: AILanguage = input.language ?? 'en'
  const task: AITask = input.task ?? 'general'
  const normalized: AssistInput = {
    ...input,
    language,
    task,
    message: clampText(input.message, config.ai.maxPromptChars),
    history: input.history?.slice(-8),
  }
  const query = `${normalized.message} ${normalized.response ?? ''} ${(normalized.rubric ?? []).join(' ')} ${normalized.context ?? ''}`
  const sources = retrieveSources(query, task)
  const facts = await authorizedFacts(normalized.actor)
  const fallback = deterministicAssistantPayload(normalized, sources)
  const intent = detectIntent(normalized)

  const generated = await generateStructured<AssistantModelPayload>({
    system: buildAssistSystem(normalized, sources, facts),
    prompt: buildAssistPrompt(normalized),
    history: normalized.history,
    schema: assistantResponseJsonSchema,
    fallback,
    validator: parseAssistantPayload,
    userId: normalized.actor.id,
    cacheKey: makeCacheKey(
      'assist',
      normalized.actor.id,
      normalized.actor.role,
      normalized.message,
      normalized.context,
      language,
      task,
      Boolean(normalized.simpleMode),
      normalized.response,
      normalized.rubric,
      normalized.history,
      sources.map((source) => source.id),
    ),
  })

  const citedSources = authorizedSourceIds(sources, generated.data.sources)
  const usedSources = citedSources.length ? citedSources : sources
  const validatedActions = validateAIActions(generated.data.actions, normalized.actor.role)
  const actions = validatedActions.length ? validatedActions : (fallback.actions as AIAction[])
  const notice =
    generated.notice ??
    (usedSources.length ? undefined : 'No approved curriculum source matched this question. This answer is general guidance only.')
  const simplePrefix = language === 'rw' ? 'Mu buryo bworoshye:' : 'In simple terms:'
  let reply = clampText(generated.data.reply || fallback.reply, 3500)
  if (normalized.simpleMode && !reply.startsWith(simplePrefix)) {
    reply = `${simplePrefix} ${reply}`
  }

  return {
    role: normalized.actor.role,
    context: normalized.context?.trim() || null,
    intent,
    reply,
    steps: generated.data.steps.length ? generated.data.steps.map((step) => clampText(step, 300)) : fallback.steps,
    sources: sourceChips(usedSources),
    suggestions: generated.data.suggestions.length
      ? generated.data.suggestions.map((item) => clampText(item, 240))
      : fallback.suggestions,
    actions,
    engine: generated.engine,
    grounded: usedSources.length > 0,
    usage: generated.usage,
    ...(notice ? { notice } : {}),
  }
}

export interface GeneratedQuestion {
  id: string
  prompt: string
  type: 'mcq' | 'theory' | 'practical'
  options: string[]
  explanation: string
}

export interface GenerateAssessmentInput {
  actor: AIActor
  topic: string
  count: number
  type: 'mcq' | 'theory' | 'practical' | 'mixed'
}

export interface GeneratedAssessment {
  title: string
  topic: string
  questions: GeneratedQuestion[]
  sources: AISource[]
  engine: AIEngine
  notice: string
}

interface AssessmentModelPayload {
  title: string
  topic: string
  questions: GeneratedQuestion[]
  sources: string[]
}

const generatedQuestionSchema = z.object({
  id: z.string().trim().max(30).optional(),
  prompt: z.string().trim().min(1).max(600),
  type: z.enum(['mcq', 'theory', 'practical']),
  options: z.array(z.string().trim().min(1).max(200)).max(6).default([]),
  explanation: z.string().trim().max(600).default(''),
})

const generatedAssessmentSchema = z.object({
  title: z.string().trim().min(1).max(160),
  topic: z.string().trim().min(1).max(160),
  questions: z.array(generatedQuestionSchema).min(1).max(10),
  sources: z.array(z.string().trim().max(12)).max(8).default([]),
})

const generatedAssessmentJsonSchema: Record<string, unknown> = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    topic: { type: 'STRING' },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          prompt: { type: 'STRING' },
          type: { type: 'STRING', enum: ['mcq', 'theory', 'practical'] },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          explanation: { type: 'STRING' },
        },
        required: ['prompt', 'type', 'options', 'explanation'],
      },
    },
    sources: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'topic', 'questions', 'sources'],
}

function parseAssessmentPayload(value: unknown): AssessmentModelPayload {
  const parsed = generatedAssessmentSchema.safeParse(value)
  if (!parsed.success) throw new Error('Assessment response did not match the required structure.')
  return {
    title: parsed.data.title,
    topic: parsed.data.topic,
    questions: parsed.data.questions.map((question) => ({
      id: question.id ?? '',
      prompt: question.prompt,
      type: question.type,
      options: question.options,
      explanation: question.explanation,
    })),
    sources: parsed.data.sources,
  }
}

function deterministicAssessmentPayload(input: GenerateAssessmentInput, sources: CurriculumSource[]): AssessmentModelPayload {
  const topic = oneLine(input.topic)
  const topicLower = topic.toLowerCase()
  const relevant = assessmentCatalog.filter((definition) =>
    `${definition.title} ${definition.course} ${definition.mastery}`.toLowerCase().includes(topicLower),
  )
  const pool = relevant.length ? relevant : assessmentCatalog
  const questions: GeneratedQuestion[] = []

  for (let index = 0; index < input.count; index += 1) {
    const definition = pool[index % pool.length]
    const source = sources[index % sources.length] ?? curriculumSources[0]
    const bankQuestion = definition.questions[index % definition.questions.length]
    const type =
      input.type === 'mixed'
        ? index % 3 === 0
          ? 'mcq'
          : index % 3 === 1
            ? 'theory'
            : 'practical'
        : input.type
    const prompt =
      type === 'mcq'
        ? bankQuestion.prompt
        : type === 'theory'
          ? `Explain ${source.outcomes[index % source.outcomes.length] ?? topic} using ${source.title}.`
          : `Carry out a safe practical check for ${topic} and record evidence using ${source.title}.`
    questions.push({
      id: `q${index + 1}`,
      prompt,
      type,
      options: type === 'mcq' ? bankQuestion.options.slice(0, 4) : [],
      explanation: `Formative draft only. Verify against ${source.title}.`,
    })
  }

  return {
    title: `Practice draft: ${topic}`,
    topic,
    questions,
    sources: sources.map((source) => source.id),
  }
}

export async function generateAssessment(input: GenerateAssessmentInput): Promise<GeneratedAssessment> {
  const topic = clampText(oneLine(input.topic), 160)
  const sources = retrieveSources(`${topic} assessment practice questions`, 'resource')
  const fallback = deterministicAssessmentPayload({ ...input, topic }, sources)
  const facts = await authorizedFacts(input.actor)

  const generated = await generateStructured<AssessmentModelPayload>({
    system: [
      'You are MENYA AI helping a TVET trainer prepare formative practice material.',
      `Authorized role: ${input.actor.role}. Authorized facts: ${facts}`,
      `Requested topic: ${topic}. Requested type: ${input.type}. Requested count: ${input.count}.`,
      'Use only SOURCES and the assessment pattern described here. Draft practice items only.',
      'Never provide an official answer key, official exam item, score or grade.',
      `SOURCES:\n${sourceBlock(sources)}`,
      'OUTPUT: Return JSON only, matching the assessment schema. For theory and practical items options must be an empty array.',
    ].join('\n\n'),
    prompt: `Create ${input.count} ${input.type} practice questions on ${topic}. Label every item as practice in the explanation.`,
    schema: generatedAssessmentJsonSchema,
    maxOutputTokens: 1800,
    fallback,
    validator: parseAssessmentPayload,
    userId: input.actor.id,
    cacheKey: makeCacheKey('assessment', input.actor.role, topic, input.count, input.type, sources.map((source) => source.id)),
  })

  const cited = authorizedSourceIds(sources, generated.data.sources)
  const usedSources = cited.length ? cited : sources
  const questions: GeneratedQuestion[] = generated.data.questions.slice(0, input.count).map((question, index) => ({
    id: `q${index + 1}`,
    prompt: clampText(question.prompt, 600),
    type: input.type === 'mixed' ? question.type : input.type,
    options: input.type === 'mixed' ? question.options.slice(0, 6) : question.type === 'mcq' ? question.options.slice(0, 6) : [],
    explanation: clampText(question.explanation || `Formative draft only. Verify against ${usedSources[0]?.title ?? 'approved material'}.`, 600),
  }))
  while (questions.length < input.count && fallback.questions[questions.length]) {
    questions.push(fallback.questions[questions.length])
  }

  return {
    title: clampText(generated.data.title || fallback.title, 160),
    topic,
    questions,
    sources: sourceChips(usedSources),
    engine: generated.engine,
    notice: [
      generated.notice,
      'Draft practice material only. Trainers and the institution set official assessments and grades.',
    ]
      .filter(Boolean)
      .join(' '),
  }
}

export interface EvaluateInput {
  actor: AIActor
  response: string
  rubric?: string[]
  topic?: string
  language?: AILanguage
}

export interface EvaluationResult {
  feedback: string
  gaps: string[]
  suggestions: string[]
  indicativeScore: number
  sources: AISource[]
  engine: AIEngine
  notice: string
}

interface EvaluationModelPayload {
  feedback: string
  gaps: string[]
  suggestions: string[]
  sources: string[]
  indicativeScore?: number
}

const evaluationResponseSchema = z.object({
  feedback: z.string().trim().min(1).max(3000),
  gaps: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  suggestions: z.array(z.string().trim().min(1).max(300)).max(8).default([]),
  sources: z.array(z.string().trim().max(12)).max(8).default([]),
  indicativeScore: z.number().min(0).max(100).optional(),
})

const evaluationJsonSchema: Record<string, unknown> = {
  type: 'OBJECT',
  properties: {
    feedback: { type: 'STRING' },
    gaps: { type: 'ARRAY', items: { type: 'STRING' } },
    suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
    sources: { type: 'ARRAY', items: { type: 'STRING' } },
    indicativeScore: { type: 'NUMBER' },
  },
  required: ['feedback', 'gaps', 'suggestions', 'sources'],
}

function parseEvaluationPayload(value: unknown): EvaluationModelPayload {
  const parsed = evaluationResponseSchema.safeParse(value)
  if (!parsed.success) throw new Error('Evaluation response did not match the required structure.')
  return parsed.data
}

function computeIndicativeScore(response: string, rubric: string[], sources: CurriculumSource[]): number {
  const text = response.toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const rubricHits = rubric.length
    ? rubric.filter((item) => text.includes(oneLine(item).toLowerCase())).length / rubric.length
    : 0
  const safetyTerms = ['safety', 'isolate', 'prove dead', 'ppe', 'umutekano', 'gukingira', 'rcd', 'earth']
  const safetyHit = safetyTerms.some((term) => text.includes(term)) ? 1 : 0
  const sourceTerms = sources.flatMap((source) => source.keywords).filter((term) => text.includes(term.toLowerCase())).length
  const sourceRatio = Math.min(sourceTerms / Math.max(4, sources.length * 2), 1)
  const lengthRatio = Math.min(words.length / 60, 1)
  const score = Math.round(45 * rubricHits + 20 * safetyHit + 20 * sourceRatio + 15 * lengthRatio)
  return Math.max(0, Math.min(100, score))
}

function deterministicEvaluationPayload(
  input: EvaluateInput,
  sources: CurriculumSource[],
  score: number,
): EvaluationModelPayload {
  const language = input.language ?? 'en'
  const text = input.response.toLowerCase()
  const rubric = input.rubric ?? []
  const gaps = rubric.filter((item) => !text.includes(oneLine(item).toLowerCase())).slice(0, 4)
  const feedback =
    language === 'rw'
      ? `Isuzuma ry’ubufasha: ${score}/100. Ibi si amanota y’ibizamini. Wakoresheje ibiri mu gisubizo cyawe; usobanure intambwe zirebana n’umutekano n’ibipimo.`
      : `Indicative review: ${score}/100. This is not an official grade. You addressed part of the task; add explicit safety steps, correct ratings and a clear final check.`
  const suggestions =
    language === 'rw'
      ? ['Ongera werekane intambwe zo gukingira umuriro.', 'Andika ibipimo n’ibyo wabaze.', 'Sobanura impamvu y’igisubizo cyawe.']
      : ['Add the explicit isolation and safety steps.', 'Write the ratings or calculations you used.', 'Explain why your final answer is safe and correct.']
  return {
    feedback,
    gaps: gaps.length ? gaps : language === 'rw' ? ['Umutekano ntiwasobanuwe neza.', 'Ibipimo ntibirandikwa.'] : ['Safety steps are not explicit.', 'No clear ratings or calculation shown.'],
    suggestions,
    sources: sources.map((source) => source.id),
    indicativeScore: score,
  }
}

export async function evaluateResponse(input: EvaluateInput): Promise<EvaluationResult> {
  const language = input.language ?? 'en'
  const response = clampText(input.response, 4000)
  const rubric = (input.rubric ?? []).map((item) => clampText(oneLine(item), 200)).filter(Boolean).slice(0, 8)
  const sources = retrieveSources(`${input.topic ?? ''} ${response} ${rubric.join(' ')}`, 'evaluation' as AITask)
  const score = computeIndicativeScore(response, rubric, sources)
  const fallback = deterministicEvaluationPayload({ ...input, response, rubric }, sources, score)
  const facts = await authorizedFacts(input.actor)

  const generated = await generateStructured<EvaluationModelPayload>({
    system: [
      'You are MENYA AI giving formative feedback on a written TVET response.',
      language === 'rw' ? 'Write only in natural Kinyarwanda.' : 'Write only in clear English.',
      `Authorized role: ${input.actor.role}. Authorized facts: ${facts}`,
      'Use only SOURCES for curriculum facts. Do not invent rubric criteria or references.',
      'Never assign an official grade. The score shown to the learner is indicative and the backend computes it.',
      `SOURCES:\n${sourceBlock(sources)}`,
      'OUTPUT: Return JSON only with feedback, gaps, suggestions, sources and an optional indicativeScore.',
    ].join('\n\n'),
    prompt: [
      `Topic: ${input.topic ?? 'current lesson'}`,
      `Rubric: ${rubric.length ? rubric.join('; ') : 'Use the approved safety, rating, evidence and reflection checks.'}`,
      `Written response: ${response}`,
    ].join('\n'),
    schema: evaluationJsonSchema,
    fallback,
    validator: parseEvaluationPayload,
    userId: input.actor.id,
  })

  const usedSources = authorizedSourceIds(sources, generated.data.sources)
  return {
    feedback: clampText(generated.data.feedback || fallback.feedback, 3000),
    gaps: generated.data.gaps.length ? generated.data.gaps.map((gap) => clampText(gap, 300)) : fallback.gaps,
    suggestions: generated.data.suggestions.length
      ? generated.data.suggestions.map((item) => clampText(item, 300))
      : fallback.suggestions,
    indicativeScore: score,
    sources: sourceChips(usedSources.length ? usedSources : sources),
    engine: generated.engine,
    notice: [
      generated.notice,
      'Indicative feedback only. Trainers and reviewers record official decisions and grades.',
    ]
      .filter(Boolean)
      .join(' '),
  }
}

export interface PlanInput {
  actor: AIActor
  minutes: number
  days: number
}

export interface PlanItem {
  day: number
  slot: string
  task: string
  minutes: number
  reason: string
}

export interface PlanResult {
  plan: PlanItem[]
  engine: 'deterministic'
  deterministic: true
}

function slotForDay(day: number): string {
  return day % 3 === 1 ? 'Morning' : day % 3 === 2 ? 'Afternoon' : 'Evening'
}

export async function buildStudyPlan(input: PlanInput): Promise<PlanResult> {
  const minutesPerDay = Math.max(15, Math.round(input.minutes / input.days))
  const plan: PlanItem[] = []

  if (input.actor.role === 'student') {
    const facts = await studentFacts(input.actor)
    const course = facts.weakest?.courseCode ?? 'your weakest course'
    const focusTasks = [
      `Worked example: ${course}`,
      `Short practice set: ${course}`,
      'Correct one missed explanation and retry it',
      `Resource review: worked examples for ${course}`,
      `Readiness check: ${course}`,
    ]
    for (let day = 1; day <= input.days; day += 1) {
      plan.push({
        day,
        slot: slotForDay(day),
        task: focusTasks[(day - 1) % focusTasks.length],
        minutes: minutesPerDay,
        reason: day === 1
          ? `${course} is your lowest recorded mastery course.`
          : day % 3 === 0
            ? `Spacing a corrected error on day ${day} protects the gain.`
            : `Keeps a short block so your ${facts.pendingTasks.length} planned tasks stay achievable.`,
      })
    }
    return { plan, engine: 'deterministic', deterministic: true }
  }

  const staffTasks: Record<Exclude<Role, 'student'>, string[]> = {
    trainer: ['Review cohort mastery by course', 'Prepare one worked example', 'Check quiet learners', 'Sort the oldest submissions', 'Plan a short competency check'],
    reviewer: ['Apply the four rubric checks', 'Clear the oldest pending artifact', 'Compare two similar decisions', 'Write one criterion-based feedback note', 'Review pass-rate consistency'],
    admin: ['Check active account health', 'Review role assignments', 'Compare course and trainer coverage', 'Inspect AI service status', 'Summarise regional activity'],
  }
  const tasks = staffTasks[input.actor.role]
  for (let day = 1; day <= input.days; day += 1) {
    plan.push({
      day,
      slot: slotForDay(day),
      task: tasks[(day - 1) % tasks.length],
      minutes: minutesPerDay,
      reason: `Role-scoped ${input.actor.role} focus; no learner data is changed by this plan.`,
    })
  }
  return { plan, engine: 'deterministic', deterministic: true }
}

export function getAIStatus(userId: string): {
  provider: string
  model: string
  configured: boolean
  cacheEntries: number
  quota: { limit: number; used: number; resetAt: string }
  usage: { requests: number; tokens: number; errors: number; fallbacks: number }
  lastError: string | null
} {
  const snapshot = getUsageSnapshot(userId)
  return {
    provider: config.ai.provider.trim().toLowerCase() === 'gemini' ? 'gemini' : 'deterministic',
    model: config.ai.model,
    configured: isGeminiConfigured(),
    ...snapshot,
  }
}
