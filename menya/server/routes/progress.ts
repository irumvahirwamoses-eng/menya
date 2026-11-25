import { Router } from 'express'
import { z } from 'zod'
import { Progress } from '../models/Domain'
import { requireAuth, requireRoles } from '../middleware/auth'
import { asyncHandler, HttpError } from '../middleware/error'

const router = Router()

const lessonSchema = z.object({
  lessonId: z.string().min(1),
  completed: z.boolean(),
})

const updateSchema = z.object({
  completedLessons: z.array(z.string()).max(200).optional(),
  lesson: lessonSchema.optional(),
  mastery: z.number().min(0).max(100).optional(),
  weeklyMinutes: z.number().min(0).max(10000).optional(),
})

function targetUserId(req: { authUser?: { id: string; role: string } }, queryUserId: unknown) {
  const isStaff = req.authUser?.role === 'admin' || req.authUser?.role === 'trainer'
  return isStaff && typeof queryUserId === 'string' ? queryUserId : req.authUser!.id
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = targetUserId(req, req.query.userId)
    if (userId !== req.authUser!.id && !['admin', 'trainer'].includes(req.authUser!.role)) {
      throw new HttpError(403, 'You cannot view another learner’s progress.')
    }
    const progress = await Progress.find({ userId }).lean()
    res.json({ progress })
  }),
)

router.patch(
  '/:courseCode',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body)
    if (req.authUser!.role === 'reviewer') {
      throw new HttpError(403, 'Reviewers cannot change learning progress.')
    }
    const userId = targetUserId(req, req.query.userId)
    if (userId !== req.authUser!.id && req.authUser!.role !== 'admin') {
      throw new HttpError(403, 'You can only update your own progress.')
    }

    const update: Record<string, unknown> = {}
    if (input.mastery !== undefined) update.mastery = input.mastery
    if (input.weeklyMinutes !== undefined) update.weeklyMinutes = input.weeklyMinutes

    if (input.completedLessons) {
      update.completedLessons = [...new Set(input.completedLessons)]
    } else if (input.lesson) {
      const current = await Progress.findOne({ userId, courseCode: req.params.courseCode }).lean()
      const existing = current?.completedLessons ?? []
      update.completedLessons = input.lesson.completed
        ? [...new Set([...existing, input.lesson.lessonId])]
        : existing.filter((id) => id !== input.lesson!.lessonId)
    }

    const progress = await Progress.findOneAndUpdate(
      { userId, courseCode: req.params.courseCode },
      { $set: update, $setOnInsert: { userId, courseCode: req.params.courseCode } },
      { new: true, upsert: true, runValidators: true },
    ).lean()

    res.json({ progress })
  }),
)

router.get(
  '/cohort/summary',
  requireAuth,
  requireRoles('trainer', 'admin'),
  asyncHandler(async (_req, res) => {
    const rows = await Progress.aggregate([
      {
        $group: {
          _id: null,
          learners: { $addToSet: '$userId' },
          avgMastery: { $avg: '$mastery' },
          totalMinutes: { $sum: '$weeklyMinutes' },
        },
      },
    ])
    const first = rows[0] ?? { learners: [], avgMastery: 0, totalMinutes: 0 }
    res.json({
      learners: first.learners.length,
      avgMastery: Math.round(first.avgMastery || 0),
      totalMinutes: first.totalMinutes || 0,
    })
  }),
)

export default router
