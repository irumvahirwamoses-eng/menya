import { Schema, model } from 'mongoose'
import { ROLES, type Role } from '../types'

export interface IUser {
  name: string
  email: string
  passwordHash: string
  role: Role
  active: boolean
  program: string
  school: string
  refreshTokenHash?: string
  refreshJti?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, default: 'student', index: true },
    active: { type: Boolean, default: true },
    program: { type: String, default: 'Electrical Installation — Level 3' },
    school: { type: String, default: 'Rwanda TVET College, Kigali' },
    refreshTokenHash: { type: String, default: undefined },
    refreshJti: { type: String, default: undefined },
  },
  { timestamps: true },
)

userSchema.index({ role: 1, active: 1 })

export const User = model<IUser>('User', userSchema)
