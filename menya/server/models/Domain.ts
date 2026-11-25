import { Schema, model, Types } from 'mongoose'

/* Course ------------------------------------------------------------------ */
export interface ICourse {
  code: string
  title: string
  category: string
  level: 'Foundation' | 'Intermediate' | 'Advanced'
  description: string
  trainer: string
  lessonCount: number
  duration: string
  tags: string[]
  accent: 'emerald' | 'amber' | 'info' | 'navy'
}

const courseSchema = new Schema<ICourse>({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true, index: true },
  level: { type: String, enum: ['Foundation', 'Intermediate', 'Advanced'], required: true },
  description: { type: String, default: '' },
  trainer: { type: String, default: '' },
  lessonCount: { type: Number, default: 0 },
  duration: { type: String, default: '' },
  tags: { type: [String], default: [] },
  accent: { type: String, enum: ['emerald', 'amber', 'info', 'navy'], default: 'emerald' },
})

export const Course = model<ICourse>('Course', courseSchema)

/* Progress ---------------------------------------------------------------- */
export interface IProgress {
  userId: Types.ObjectId
  courseCode: string
  completedLessons: string[]
  mastery: number
  weeklyMinutes: number
}

const progressSchema = new Schema<IProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseCode: { type: String, required: true },
    completedLessons: { type: [String], default: [] },
    mastery: { type: Number, default: 0, min: 0, max: 100 },
    weeklyMinutes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)
progressSchema.index({ userId: 1, courseCode: 1 }, { unique: true })

export const Progress = model<IProgress>('Progress', progressSchema)

/* Planner task ------------------------------------------------------------ */
export interface IPlannerTask {
  userId: Types.ObjectId
  title: string
  course: string
  day: number
  start: string
  duration: number
  type: 'Learn' | 'Practice' | 'Assessment' | 'Review'
  done: boolean
}

const plannerSchema = new Schema<IPlannerTask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    course: { type: String, default: '' },
    day: { type: Number, required: true, min: 0, max: 6 },
    start: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['Learn', 'Practice', 'Assessment', 'Review'], required: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const PlannerTask = model<IPlannerTask>('PlannerTask', plannerSchema)

/* Assessment attempt ------------------------------------------------------ */
export interface IAttempt {
  userId: Types.ObjectId
  assessmentId: string
  assessmentTitle: string
  course: string
  answers: number[]
  correctCount: number
  total: number
  score: number
  completedAt: Date
}

const attemptSchema = new Schema<IAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assessmentId: { type: String, required: true },
    assessmentTitle: { type: String, required: true },
    course: { type: String, default: '' },
    answers: { type: [Number], required: true },
    correctCount: { type: Number, required: true },
    total: { type: Number, required: true },
    score: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)
attemptSchema.index({ userId: 1, assessmentId: 1 })

export const Attempt = model<IAttempt>('Attempt', attemptSchema)

/* Review ------------------------------------------------------------------ */
export interface IReview {
  submissionId: string
  learnerName: string
  artifact: string
  course: string
  criterion: string
  status: 'Pending' | 'In review' | 'Passed' | 'Changes requested'
  reviewerId?: Types.ObjectId
  feedback?: string
  decidedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const reviewSchema = new Schema<IReview>(
  {
    submissionId: { type: String, required: true, unique: true },
    learnerName: { type: String, required: true },
    artifact: { type: String, required: true },
    course: { type: String, default: '' },
    criterion: { type: String, default: '' },
    status: { type: String, enum: ['Pending', 'In review', 'Passed', 'Changes requested'], default: 'Pending', index: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', default: undefined },
    feedback: { type: String, default: undefined },
    decidedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
)

export const Review = model<IReview>('Review', reviewSchema)
