import { Router } from 'express'
import { Attempt, Course, PlannerTask, Progress, Review } from '../models/Domain'
import { User } from '../models/User'
import { requireAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/error'
import type { Role } from '../types'

const router = Router()

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const role = req.authUser!.role as Role
    const userId = req.authUser!.id

    if (role === 'student') {
      const [progress, attempts, tasks] = await Promise.all([
        Progress.find({ userId }).lean(),
        Attempt.find({ userId }).sort({ completedAt: -1 }).limit(10).lean(),
        PlannerTask.find({ userId }).lean(),
      ])
      const mastery = progress.length
        ? Math.round(progress.reduce((sum, item) => sum + item.mastery, 0) / progress.length)
        : 0
      res.json({
        scope: 'student',
        mastery,
        weeklyMinutes: progress.reduce((sum, item) => sum + item.weeklyMinutes, 0),
        coursesInProgress: progress.length,
        latestAttempts: attempts.map((item) => ({ id: item._id.toString(), score: item.score, title: item.assessmentTitle })),
        plannedMinutes: tasks.reduce((sum, task) => sum + task.duration, 0),
      })
      return
    }

    if (role === 'trainer') {
      const [learners, progress, pendingReviews] = await Promise.all([
        User.countDocuments({ role: 'student', active: true }),
        Progress.aggregate([
          { $group: { _id: '$courseCode', learners: { $sum: 1 }, avgMastery: { $avg: '$mastery' } } },
          { $sort: { learners: -1 } },
        ]),
        Review.countDocuments({ status: 'Pending' }),
      ])
      res.json({
        scope: 'trainer',
        learners,
        pendingReviews,
        courses: progress.map((row) => ({
          code: row._id,
          learners: row.learners,
          avgMastery: Math.round(row.avgMastery || 0),
        })),
      })
      return
    }

    const [learners, trainers, courses, reviews, activeUsers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'trainer' }),
      Course.countDocuments(),
      Review.countDocuments(),
      User.countDocuments({ active: true }),
    ])
    res.json({
      scope: role === 'admin' ? 'admin' : 'reviewer',
      learners,
      trainers,
      courses,
      reviews,
      activeUsers,
    })
  }),
)

export default router
