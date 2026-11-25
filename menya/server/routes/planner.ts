import { Router } from 'express'
import { z } from 'zod'
import { PlannerTask } from '../models/Domain'
import { requireAuth } from '../middleware/auth'
import { asyncHandler, HttpError } from '../middleware/error'

const router = Router()

const taskSchema = z.object({
  title: z.string().min(2).max(140),
  course: z.string().max(140).optional().default(''),
  day: z.number().int().min(0).max(6),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM format'),
  duration: z.number().int().min(5).max(480),
  type: z.enum(['Learn', 'Practice', 'Assessment', 'Review']),
  done: z.boolean().optional().default(false),
})

const patchSchema = taskSchema.partial()

async function ownedTask(reqId: string, taskId: string) {
  const task = await PlannerTask.findById(taskId)
  if (!task) throw new HttpError(404, 'Study block not found.')
  if (task.userId.toString() !== reqId) throw new HttpError(403, 'This study block belongs to another learner.')
  return task
}

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const tasks = await PlannerTask.find({ userId: req.authUser!.id }).sort({ day: 1, start: 1 }).lean()
    res.json({ tasks: tasks.map((task) => ({ ...task, id: task._id.toString() })) })
  }),
)

router.post(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = taskSchema.parse(req.body)
    const task = await PlannerTask.create({ ...input, userId: req.authUser!.id })
    res.status(201).json({ task: { ...task.toObject(), id: task._id.toString() } })
  }),
)

router.patch(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = patchSchema.parse(req.body)
    const task = await ownedTask(req.authUser!.id, String(req.params.id))
    Object.assign(task, input)
    await task.save()
    res.json({ task: { ...task.toObject(), id: task._id.toString() } })
  }),
)

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const task = await ownedTask(req.authUser!.id, String(req.params.id))
    await task.deleteOne()
    res.json({ ok: true })
  }),
)

export default router
