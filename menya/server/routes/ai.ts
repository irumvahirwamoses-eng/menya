import { Router, type Request } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { config } from '../config'
import { requireAuth, requireRoles } from '../middleware/auth'
import { asyncHandler } from '../middleware/error'
import {
  assist,
  buildInsights,
  buildRecommendations,
  buildStudyPlan,
  evaluateResponse,
  generateAssessment,
  getAIStatus,
  starterPromptsForRole,
  type AIContext,
} from '../services/ai'
import type { AIChatMessage } from '../services/ai/provider'

const router = Router()

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please try again shortly.' },
})

router.use(requireAuth, aiLimiter)

const contexts: AIContext[] = [
  'dashboard',
  'workspace',
  'curriculum',
  'resources',
  'assessments',
  'assessment-result',
  'analytics',
  'planner',
  'trainer-dashboard',
  'trainer-cohorts',
  'trainer-courses',
  'trainer-reviews',
  'reviewer-dashboard',
  'reviewer-queue',
  'reviewer-history',
  'admin-dashboard',
  'admin-users',
  'admin-courses',
  'admin-settings',
]

const languageSchema = z.enum(['en', 'rw']).default('en')
const historySchema = z
  .array(
    z.object({
      role: z.enum(['user', 'ai']),
      text: z.string().trim().min(1).max(800),
    }),
  )
  .max(8)
  .optional()

const tutorSchema = z.object({
  message: z.string().trim().min(1).max(config.ai.maxPromptChars),
  context: z.string().trim().max(120).optional(),
  language: languageSchema.optional(),
  simpleMode: z.boolean().optional(),
  history: historySchema,
})

const assistSchema = tutorSchema.extend({
  task: z.enum(['general', 'tutor', 'assessment', 'evaluation', 'planning', 'resource']).optional(),
  response: z.string().trim().max(4000).optional(),
  rubric: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
})

const assessmentGenerateSchema = z.object({
  topic: z.string().trim().min(2).max(160),
  count: z.number().int().min(1).max(10).default(5),
  type: z.enum(['mcq', 'theory', 'practical', 'mixed']).default('mixed'),
})

const evaluateSchema = z.object({
  response: z.string().trim().min(1).max(4000),
  rubric: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
  topic: z.string().trim().max(160).optional(),
  language: languageSchema.optional(),
})

const planQuerySchema = z.object({
  minutes: z.coerce.number().int().min(15).max(480).default(60),
  days: z.coerce.number().int().min(1).max(14).default(5),
})

function actorFromRequest(req: Request) {
  const authUser = req.authUser!
  return { id: authUser.id, role: authUser.role, name: authUser.name }
}

router.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const requested = typeof req.query.context === 'string' ? req.query.context : ''
    const context = (contexts.includes(requested as AIContext) ? requested : 'dashboard') as AIContext
    const insights = await buildInsights(actorFromRequest(req), context)

    res.json({
      role: req.authUser!.role,
      context,
      generatedAt: new Date().toISOString(),
      insights,
    })
  }),
)

router.get(
  '/recommendations',
  asyncHandler(async (req, res) => {
    const recommendations = await buildRecommendations(actorFromRequest(req))
    res.json({ role: req.authUser!.role, recommendations })
  }),
)

router.post(
  '/tutor',
  asyncHandler(async (req, res) => {
    const input = tutorSchema.parse(req.body)
    const language = input.language ?? 'en'
    const result = await assist({
      actor: actorFromRequest(req),
      message: input.message,
      context: input.context,
      language,
      simpleMode: input.simpleMode,
      task: 'tutor',
      history: input.history as AIChatMessage[] | undefined,
    })

    res.json({
      role: result.role,
      context: result.context,
      reply: result.reply,
      prompts: starterPromptsForRole(result.role, language),
      steps: result.steps,
      sources: result.sources,
      actions: result.actions,
      engine: result.engine,
      grounded: result.grounded,
      usage: result.usage,
      ...(result.notice ? { notice: result.notice } : {}),
    })
  }),
)

router.post(
  '/assist',
  asyncHandler(async (req, res) => {
    const input = assistSchema.parse(req.body)
    const result = await assist({
      actor: actorFromRequest(req),
      message: input.message,
      context: input.context,
      language: input.language ?? 'en',
      simpleMode: input.simpleMode,
      task: input.task ?? 'general',
      response: input.response,
      rubric: input.rubric,
      history: input.history as AIChatMessage[] | undefined,
    })
    res.json(result)
  }),
)

router.post(
  '/assessments/generate',
  requireRoles('trainer', 'admin'),
  asyncHandler(async (req, res) => {
    const input = assessmentGenerateSchema.parse(req.body)
    const result = await generateAssessment({
      actor: actorFromRequest(req),
      topic: input.topic,
      count: input.count,
      type: input.type,
    })
    res.json(result)
  }),
)

router.post(
  '/evaluate',
  asyncHandler(async (req, res) => {
    const input = evaluateSchema.parse(req.body)
    const result = await evaluateResponse({
      actor: actorFromRequest(req),
      response: input.response,
      rubric: input.rubric,
      topic: input.topic,
      language: input.language ?? 'en',
    })
    res.json(result)
  }),
)

router.get(
  '/plan',
  asyncHandler(async (req, res) => {
    const query = planQuerySchema.parse(req.query)
    res.json(await buildStudyPlan({ actor: actorFromRequest(req), minutes: query.minutes, days: query.days }))
  }),
)

router.get(
  '/status',
  requireRoles('admin'),
  (req, res) => {
    res.json(getAIStatus(req.authUser!.id))
  },
)

router.get('/prompts', (req, res) => {
  const requested = languageSchema.safeParse(req.query.language)
  const language = requested.success ? requested.data : 'en'
  res.json({ role: req.authUser!.role, prompts: starterPromptsForRole(req.authUser!.role, language) })
})

export default router
