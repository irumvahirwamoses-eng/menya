import { Router, type CookieOptions, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User } from '../models/User'
import { config } from '../config'
import { REFRESH_COOKIE } from '../types'
import { asyncHandler, HttpError } from '../middleware/error'
import { requireAuth } from '../middleware/auth'
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token'

const router = Router()

const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.email().max(120),
  password: z.string().min(8).max(72),
  program: z.string().max(120).optional(),
  school: z.string().max(120).optional(),
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(72),
})

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.isProduction,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

function safeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
    program: user.program,
    school: user.school,
  }
}

async function issueSession(res: Response, user: InstanceType<typeof User>) {
  const accessToken = signAccessToken({
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
  })
  const { token, jti } = signRefreshToken(user._id.toString())
  user.refreshTokenHash = hashToken(token)
  user.refreshJti = jti
  await user.save()
  res.cookie(REFRESH_COOKIE, token, cookieOptions)
  return accessToken
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body)
    const email = input.email.toLowerCase()

    if (await User.exists({ email })) {
      throw new HttpError(409, 'An account with this email already exists.')
    }

    const user = await User.create({
      name: input.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: 'student',
      program: input.program?.trim() || 'Electrical Installation — Level 3',
      school: input.school?.trim() || 'Rwanda TVET College, Kigali',
    })

    const accessToken = await issueSession(res, user)
    res.status(201).json({ user: safeUser(user), accessToken })
  }),
)

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body)
    const user = await User.findOne({ email: input.email.toLowerCase() })

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new HttpError(401, 'Incorrect email or password.')
    }
    if (!user.active) {
      throw new HttpError(403, 'This account has been deactivated. Contact your administrator.')
    }

    const accessToken = await issueSession(res, user)
    res.json({ user: safeUser(user), accessToken })
  }),
)

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
    if (!token) {
      res.status(401).json({ error: 'No active session.' })
      return
    }

    const payload = verifyRefreshToken(token)
    const user = payload ? await User.findById(payload.sub) : null
    if (!payload || !user || !user.active || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(token)) {
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
      res.status(401).json({ error: 'Session expired. Please sign in again.' })
      return
    }

    const accessToken = await issueSession(res, user)
    res.json({ user: safeUser(user), accessToken })
  }),
)

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
    if (token) {
      const payload = verifyRefreshToken(token)
      if (payload) {
        await User.findByIdAndUpdate(payload.sub, { $unset: { refreshTokenHash: 1, refreshJti: 1 } })
      }
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
    res.json({ ok: true })
  }),
)

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.authUser!.id)
    if (!user) throw new HttpError(401, 'Account not found.')
    res.json({ user: safeUser(user) })
  }),
)

export default router
