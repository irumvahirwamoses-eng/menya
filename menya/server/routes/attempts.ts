import { Router } from 'express'
import { z } from 'zod'
import { Attempt } from '../models/Domain'
import { findAssessment } from '../data/answerKey'
import { requireAuth } from '../middleware/auth'
import { asyncHandler, HttpError } from '../middleware/error'

const router = Router()

const submitSchema = z.object({
  assessmentId: z.string().min(1),
  answers: z.array(z.number().int().min(0).max(5)).min(1).max(30),
})

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = submitSchema.parse(req.body)
    const assessment = findAssessment(input.assessmentId)
    if (!assessment) throw new HttpError(404, 'Assessment not found.')
    if (input.answers.length !== assessment.answers.length) {
      throw new HttpError(400, `This assessment has ${assessment.answers.length} questions.`)
    }

    const correctCount = input.answers.reduce(
      (total, answer, index) => total + (answer === assessment.answers[index] ? 1 : 0),
      0,
    )
    const score = Math.round((correctCount / assessment.answers.length) * 100)

    const attempt = await Attempt.create({
      userId: req.authUser!.id,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      course: assessment.course,
      answers: input.answers,
      correctCount,
      total: assessment.answers.length,
      score,
    })

    res.status(201).json({
      attempt: {
        id: attempt._id.toString(),
        score: attempt.score,
        correctCount: attempt.correctCount,
        total: attempt.total,
        assessmentId: attempt.assessmentId,
        correctAnswers: assessment.answers,
        completedAt: attempt.completedAt,
      },
    })
  }),
)

function publicAttempt(attempt: {
  _id: { toString(): string }
  assessmentId: string
  assessmentTitle: string
  course: string
  answers: number[]
  correctCount: number
  total: number
  score: number
  completedAt: Date
}) {
  return {
    id: attempt._id.toString(),
    assessmentId: attempt.assessmentId,
    assessmentTitle: attempt.assessmentTitle,
    course: attempt.course,
    answers: attempt.answers,
    correctCount: attempt.correctCount,
    total: attempt.total,
    score: attempt.score,
    correctAnswers: findAssessment(attempt.assessmentId)?.answers ?? [],
    completedAt: attempt.completedAt,
  }
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const isStaff = ['admin', 'trainer', 'reviewer'].includes(req.authUser!.role)
    const userId = isStaff && typeof req.query.userId === 'string' ? req.query.userId : req.authUser!.id
    if (userId !== req.authUser!.id && !isStaff) {
      throw new HttpError(403, 'You cannot view another learner’s results.')
    }
    const attempts = await Attempt.find({ userId }).sort({ completedAt: -1 }).lean()
    res.json({ attempts: attempts.map(publicAttempt) })
  }),
)

router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const attempt = await Attempt.findById(String(req.params.id)).lean()
    if (!attempt) throw new HttpError(404, 'Attempt not found.')
    const isStaff = ['admin', 'trainer', 'reviewer'].includes(req.authUser!.role)
    if (attempt.userId.toString() !== req.authUser!.id && !isStaff) {
      throw new HttpError(403, 'You cannot view another learner’s results.')
    }
    res.json({ attempt: publicAttempt(attempt) })
  }),
)

export default router
