import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config'
import { connectDatabase, disconnectDatabase } from './db'
import { errorHandler, notFound } from './middleware/error'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import courseRoutes from './routes/courses'
import progressRoutes from './routes/progress'
import plannerRoutes from './routes/planner'
import attemptRoutes from './routes/attempts'
import assessmentRoutes from './routes/assessments'
import reviewRoutes from './routes/reviews'
import analyticsRoutes from './routes/analytics'
import aiRoutes from './routes/ai'

const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: config.clientOrigin, credentials: true }))
app.use(express.json({ limit: '100kb' }))
app.use(cookieParser())

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isProduction ? 20 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
})

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'menya-api', time: new Date().toISOString() })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/planner', plannerRoutes)
app.use('/api/attempts', attemptRoutes)
app.use('/api/assessments', assessmentRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/ai', aiRoutes)

app.use(notFound)
app.use(errorHandler)

async function start() {
  await connectDatabase()
  const server = app.listen(config.port, () => {
    console.log(`MENYA API ready on http://localhost:${config.port}`)
  })

  const shutdown = async () => {
    server.close()
    await disconnectDatabase()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

start().catch((error) => {
  console.error('Failed to start MENYA API:', error)
  process.exit(1)
})
