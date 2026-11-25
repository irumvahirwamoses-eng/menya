import bcrypt from 'bcryptjs'
import { connectDatabase, disconnectDatabase } from './db'
import { User } from './models/User'
import { Attempt, Course, PlannerTask, Progress, Review } from './models/Domain'
import type { Role } from './types'

const demoPassword = 'Demo1234!'

const demoUsers: Array<{ name: string; email: string; role: Role; program?: string }> = [
  { name: 'Umurungi Aline', email: 'student@menya.rw', role: 'student' },
  { name: 'Eng. Rusanganwa Eric', email: 'trainer@menya.rw', role: 'trainer' },
  { name: 'Ms. Uwase Divine', email: 'reviewer@menya.rw', role: 'reviewer' },
  { name: 'Admin MENYA', email: 'admin@menya.rw', role: 'admin' },
]

const demoCourses = [
  { code: 'EIL-301', title: 'Electrical Installation', category: 'Electrical', level: 'Intermediate', description: 'Wiring systems, circuit protection and safe installation practice to Rwandan TVET standards.', trainer: 'Eng. Rusanganwa Eric', lessonCount: 24, duration: '12h 40m', tags: ['Core', 'Practical', 'NCC'], accent: 'emerald' as const },
  { code: 'SPV-204', title: 'Solar PV Systems', category: 'Energy', level: 'Intermediate', description: 'Design, install and maintain small-scale photovoltaic systems for real sites.', trainer: 'Eng. Mukamana Clare', lessonCount: 18, duration: '9h 10m', tags: ['Emerging', 'Field work'], accent: 'amber' as const },
  { code: 'BEN-202', title: 'Business & Entrepreneurship', category: 'Business', level: 'Foundation', description: 'Turn a technical skill into a viable enterprise: costing, pricing and customer care.', trainer: 'Mr. Niyonsaba Jean', lessonCount: 16, duration: '7h 25m', tags: ['Employability'], accent: 'info' as const },
  { code: 'DLT-101', title: 'Digital Literacy for TVET', category: 'Digital', level: 'Foundation', description: 'Essential digital tools, documentation and online safety for modern trades.', trainer: 'Ms. Uwase Divine', lessonCount: 14, duration: '5h 05m', tags: ['Completed soon'], accent: 'navy' as const },
  { code: 'PLB-201', title: 'Plumbing & Water Systems', category: 'Construction', level: 'Intermediate', description: 'Water supply, drainage and sanitary installation for residential buildings.', trainer: 'Eng. Habimana Sam', lessonCount: 20, duration: '10h 30m', tags: ['Core'], accent: 'emerald' as const },
  { code: 'WLD-205', title: 'Welding & Fabrication', category: 'Metalwork', level: 'Advanced', description: 'Arc welding, joint preparation and workshop safety for fabrication tasks.', trainer: 'Eng. Ntihinyurwa Paul', lessonCount: 22, duration: '14h 15m', tags: ['Workshop'], accent: 'amber' as const },
]

const demoProgress = [
  { courseCode: 'EIL-301', completedLessons: ['l1', 'l2', 'l3', 'l4', 'l5'], mastery: 74, weeklyMinutes: 145 },
  { courseCode: 'SPV-204', completedLessons: ['s1', 's2'], mastery: 48, weeklyMinutes: 62 },
  { courseCode: 'DLT-101', completedLessons: ['d1', 'd2', 'd3'], mastery: 86, weeklyMinutes: 38 },
]

const demoTasks = [
  { title: 'Applied calculations practice', course: 'Electrical Installation', day: 0, start: '08:00', duration: 20, type: 'Practice' as const, done: true },
  { title: 'Solar safety walkthrough', course: 'Solar PV Systems', day: 0, start: '16:30', duration: 15, type: 'Learn' as const, done: false },
  { title: 'Circuit Fundamentals quiz', course: 'Electrical Installation', day: 1, start: '10:00', duration: 15, type: 'Assessment' as const, done: false },
  { title: 'Review earthing notes', course: 'Electrical Installation', day: 1, start: '17:00', duration: 20, type: 'Review' as const, done: false },
  { title: 'PV sizing simulation', course: 'Solar PV Systems', day: 2, start: '09:30', duration: 25, type: 'Practice' as const, done: false },
]

const demoReviews = [
  { submissionId: 'rv1', learnerName: 'Umurungi Aline', artifact: 'Lighting circuit plan', course: 'EIL-301', criterion: 'Correct cable sizing', status: 'Pending' as const },
  { submissionId: 'rv2', learnerName: 'Nyirahabimana Joy', artifact: 'Cable sizing worksheet', course: 'EIL-301', criterion: 'Safety factor applied', status: 'Pending' as const },
  { submissionId: 'rv3', learnerName: 'Ishimwe Grace', artifact: 'PV array layout', course: 'SPV-204', criterion: 'Array orientation', status: 'Pending' as const },
  { submissionId: 'rv4', learnerName: 'Hakizimana Eric', artifact: 'Welding joint sample', course: 'WLD-205', criterion: 'Joint penetration', status: 'In review' as const },
]

async function seed() {
  await connectDatabase()
  const passwordHash = await bcrypt.hash(demoPassword, 12)

  const users = new Map<string, InstanceType<typeof User>>()
  for (const entry of demoUsers) {
    const user = await User.findOneAndUpdate(
      { email: entry.email },
      {
        $set: {
          name: entry.name,
          role: entry.role,
          active: true,
          passwordHash,
          program: entry.program ?? 'Electrical Installation — Level 3',
          school: 'Rwanda TVET College, Kigali',
        },
      },
      { returnDocument: 'after', upsert: true, runValidators: true },
    )
    users.set(entry.role, user)
    console.log(`User ready: ${entry.email} / ${demoPassword} (${entry.role})`)
  }

  for (const course of demoCourses) {
    await Course.updateOne({ code: course.code }, { $set: course }, { upsert: true })
  }

  const student = users.get('student')!
  for (const item of demoProgress) {
    const { courseCode, ...fields } = item
    await Progress.updateOne(
      { userId: student._id, courseCode },
      { $set: fields, $setOnInsert: { userId: student._id, courseCode } },
      { upsert: true },
    )
  }

  if ((await PlannerTask.countDocuments({ userId: student._id })) === 0) {
    await PlannerTask.insertMany(demoTasks.map((task) => ({ ...task, userId: student._id })))
  }

  if ((await Attempt.countDocuments({ userId: student._id })) === 0) {
    await Attempt.create({
      userId: student._id,
      assessmentId: 'a2',
      assessmentTitle: 'Workshop Safety Check',
      course: 'Electrical Installation',
      answers: [2, 0, 1, 3, 1, 2, 0, 1],
      correctCount: 8,
      total: 8,
      score: 100,
    })
  }

  for (const review of demoReviews) {
    await Review.updateOne({ submissionId: review.submissionId }, { $set: review }, { upsert: true })
  }

  console.log('Seed complete.')
  await disconnectDatabase()
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
