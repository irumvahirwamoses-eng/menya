import { Router } from 'express'
import { Attempt } from '../models/Domain'
import { assessmentCatalog } from '../data/assessments'
import { requireAuth } from '../middleware/auth'
import { asyncHandler, HttpError } from '../middleware/error'

const router = Router()

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const attempts = await Attempt.find({ userId: req.authUser!.id }).sort({ completedAt: -1 }).lean()
    const latestByAssessment = new Map<string, number>()
    for (const attempt of attempts) {
      if (!latestByAssessment.has(attempt.assessmentId)) {
        latestByAssessment.set(attempt.assessmentId, attempt.score)
      }
    }

    const assessments = assessmentCatalog.map((assessment) => {
      const score = latestByAssessment.get(assessment.id)
      const status = assessment.status === 'Locked'
        ? 'Locked'
        : score !== undefined
          ? 'Completed'
          : assessment.status
      return {
        id: assessment.id,
        title: assessment.title,
        course: assessment.course,
        questionCount: assessment.questions.length,
        duration: assessment.duration,
        due: assessment.due,
        status,
        mastery: assessment.mastery,
        score,
      }
    })

    res.json({ assessments })
  }),
)

router.get(
  '/:id/questions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = String(req.params.id)
    const assessment = assessmentCatalog.find((item) => item.id === id)
    if (!assessment) throw new HttpError(404, 'Assessment not found.')
    if (assessment.status === 'Locked') {
      throw new HttpError(403, 'This assessment is not open yet.')
    }

    res.json({
      assessmentId: assessment.id,
      title: assessment.title,
      questions: assessment.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options,
        explanation: question.explanation,
      })),
    })
  }),
)

export default router
