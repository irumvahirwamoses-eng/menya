import { Router } from 'express'
import { z } from 'zod'
import { Course } from '../models/Domain'
import { requireAuth, requireRoles } from '../middleware/auth'
import { asyncHandler, HttpError } from '../middleware/error'

const router = Router()

const courseSchema = z.object({
  code: z.string().min(3).max(20),
  title: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  level: z.enum(['Foundation', 'Intermediate', 'Advanced']),
  description: z.string().max(600).optional().default(''),
  trainer: z.string().max(120).optional().default(''),
  lessonCount: z.number().int().min(0).optional().default(0),
  duration: z.string().max(40).optional().default(''),
  tags: z.array(z.string().max(40)).optional().default([]),
  accent: z.enum(['emerald', 'amber', 'info', 'navy']).optional().default('emerald'),
})

router.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const courses = await Course.find().sort({ code: 1 }).lean()
    res.json({ courses: courses.map((course) => ({ ...course, id: course._id.toString() })) })
  }),
)

router.get(
  '/:code',
  requireAuth,
  asyncHandler(async (req, res) => {
    const course = await Course.findOne({ code: String(req.params.code).toUpperCase() }).lean()
    if (!course) throw new HttpError(404, 'Course not found.')
    res.json({ course: { ...course, id: course._id.toString() } })
  }),
)

router.post(
  '/',
  requireAuth,
  requireRoles('trainer', 'admin'),
  asyncHandler(async (req, res) => {
    const input = courseSchema.parse(req.body)
    const course = await Course.create({ ...input, code: input.code.toUpperCase() })
    res.status(201).json({ course })
  }),
)

router.patch(
  '/:code',
  requireAuth,
  requireRoles('trainer', 'admin'),
  asyncHandler(async (req, res) => {
    const input = courseSchema.partial().parse(req.body)
    const course = await Course.findOneAndUpdate(
      { code: String(req.params.code).toUpperCase() },
      { $set: input },
      { new: true, runValidators: true },
    )
    if (!course) throw new HttpError(404, 'Course not found.')
    res.json({ course: { ...course, id: course._id.toString() } })
  }),
)

router.delete(
  '/:code',
  requireAuth,
  requireRoles('admin'),
  asyncHandler(async (req, res) => {
    const course = await Course.findOneAndDelete({ code: String(req.params.code).toUpperCase() })
    if (!course) throw new HttpError(404, 'Course not found.')
    res.json({ ok: true })
  }),
)

export default router
