import { Router } from 'express'
import { Types } from 'mongoose'
import { z } from 'zod'
import { Review } from '../models/Domain'
import { requireAuth, requireRoles } from '../middleware/auth'
import { asyncHandler, HttpError } from '../middleware/error'

const router = Router()

const decisionSchema = z.object({
  status: z.enum(['In review', 'Passed', 'Changes requested']),
  feedback: z.string().max(1000).optional(),
})

const reviewStatuses = ['Pending', 'In review', 'Passed', 'Changes requested']

function publicReview(review: {
  _id: Types.ObjectId
  submissionId: string
  learnerName: string
  artifact: string
  course: string
  criterion: string
  status: string
  feedback?: string
  createdAt: Date
  decidedAt?: Date
}) {
  return {
    id: review._id.toString(),
    submissionId: review.submissionId,
    learnerName: review.learnerName,
    artifact: review.artifact,
    course: review.course,
    criterion: review.criterion,
    status: review.status,
    feedback: review.feedback,
    createdAt: review.createdAt,
    decidedAt: review.decidedAt,
  }
}

router.get(
  '/',
  requireAuth,
  requireRoles('trainer', 'reviewer', 'admin'),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const filter: Record<string, string> =
      status && reviewStatuses.includes(status) ? { status } : {}
    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ reviews: reviews.map(publicReview) })
  }),
)

router.get(
  '/stats',
  requireAuth,
  requireRoles('trainer', 'reviewer', 'admin'),
  asyncHandler(async (_req, res) => {
    const [pending, inReview, passed, changes] = await Promise.all([
      Review.countDocuments({ status: 'Pending' }),
      Review.countDocuments({ status: 'In review' }),
      Review.countDocuments({ status: 'Passed' }),
      Review.countDocuments({ status: 'Changes requested' }),
    ])
    const decided = passed + changes
    res.json({
      pending,
      inReview,
      passed,
      changesRequested: changes,
      passRate: decided ? Math.round((passed / decided) * 100) : 0,
    })
  }),
)

router.patch(
  '/:id',
  requireAuth,
  requireRoles('reviewer', 'admin'),
  asyncHandler(async (req, res) => {
    const input = decisionSchema.parse(req.body)
    const review = await Review.findById(String(req.params.id))
    if (!review) throw new HttpError(404, 'Review item not found.')

    review.status = input.status
    review.reviewerId = new Types.ObjectId(req.authUser!.id)
    review.feedback = input.feedback?.trim() || undefined
    review.decidedAt = new Date()
    await review.save()

    res.json({ review: publicReview(review) })
  }),
)

export default router
