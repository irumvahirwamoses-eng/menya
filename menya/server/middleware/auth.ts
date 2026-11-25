import type { NextFunction, Request, Response } from 'express'
import { User } from '../models/User'
import { verifyAccessToken } from '../utils/token'
import type { AuthUser, Role } from '../types'

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ error: 'Authentication required.' })
    return
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' })
    return
  }

  const user = await User.findById(payload.sub).select('-passwordHash -refreshTokenHash')
  if (!user || !user.active) {
    res.status(401).json({ error: 'This account is no longer active.' })
    return
  }

  req.authUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  }
  next()
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' })
      return
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'You do not have permission to perform this action.' })
      return
    }
    next()
  }
}

export function requireSelfOrRoles(paramName: string, ...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required.' })
      return
    }
    if (req.authUser.role === 'admin' || req.params[paramName] === req.authUser.id || roles.includes(req.authUser.role)) {
      next()
      return
    }
    res.status(403).json({ error: 'You can only access your own learning data.' })
  }
}
