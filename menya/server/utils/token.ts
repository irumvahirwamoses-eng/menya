import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, type Role } from '../types'

export interface AccessPayload {
  sub: string
  role: Role
  name: string
  email: string
}

export interface RefreshPayload {
  sub: string
  jti: string
}

export function signAccessToken(user: { id: string; role: Role; name: string; email: string }) {
  const payload: AccessPayload = {
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  }
  return jwt.sign(payload, config.accessSecret, { expiresIn: ACCESS_TOKEN_TTL })
}

export function signRefreshToken(userId: string) {
  const jti = crypto.randomUUID()
  const payload: RefreshPayload = { sub: userId, jti }
  const token = jwt.sign(payload, config.refreshSecret, { expiresIn: REFRESH_TOKEN_TTL })
  return { token, jti }
}

export function verifyAccessToken(token: string): AccessPayload | null {
  try {
    const decoded = jwt.verify(token, config.accessSecret)
    if (typeof decoded === 'string') return null
    return decoded as AccessPayload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): RefreshPayload | null {
  try {
    const decoded = jwt.verify(token, config.refreshSecret)
    if (typeof decoded === 'string') return null
    return decoded as RefreshPayload
  } catch {
    return null
  }
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}
