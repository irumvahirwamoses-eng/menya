import { Router } from 'express'
import { Types } from 'mongoose'
import { z } from 'zod'
import { User } from '../models/User'
import { ROLES, type Role } from '../types'
import { requireAuth, requireRoles } from '../middleware/auth'
import { asyncHandler, HttpError } from '../middleware/error'

const router = Router()

const updateSchema = z.object({
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
})

function publicUser(user: {
  _id: Types.ObjectId
  name: string
  email: string
  role: Role
  active: boolean
  program: string
  school: string
  createdAt: Date
}) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    program: user.program,
    school: user.school,
    createdAt: user.createdAt,
  }
}

router.get(
  '/',
  requireAuth,
  requireRoles('admin'),
  asyncHandler(async (req, res) => {
    const role = typeof req.query.role === 'string' ? req.query.role : undefined
    const filter: Record<string, string> = role && ROLES.includes(role as (typeof ROLES)[number]) ? { role } : {}
    const users = await User.find(filter).sort({ createdAt: -1 })
    res.json({ users: users.map(publicUser) })
  }),
)

router.get(
  '/students',
  requireAuth,
  requireRoles('trainer', 'reviewer', 'admin'),
  asyncHandler(async (_req, res) => {
    const students = await User.find({ role: 'student' })
      .select('name email program school active')
      .sort({ name: 1 })
    res.json({
      students: students.map((student) => ({
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        program: student.program,
        school: student.school,
        active: student.active,
      })),
    })
  }),
)

router.patch(
  '/:id',
  requireAuth,
  requireRoles('admin'),
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body)
    if (req.params.id === req.authUser!.id && input.active === false) {
      throw new HttpError(400, 'You cannot deactivate your own administrator account.')
    }

    const user = await User.findById(String(req.params.id))
    if (!user) throw new HttpError(404, 'User not found.')

    if (input.role) user.role = input.role
    if (input.active !== undefined) user.active = input.active
    if (input.active === false) {
      user.refreshTokenHash = undefined
      user.refreshJti = undefined
    }
    await user.save()

    res.json({ user: publicUser(user) })
  }),
)

export default router
