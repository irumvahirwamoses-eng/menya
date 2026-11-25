export type Role = 'student' | 'trainer' | 'reviewer' | 'admin'
export type Theme = 'light' | 'dark'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  program: string
  school: string
}
export type LessonType = 'video' | 'reading' | 'practice' | 'quiz'

export interface Lesson {
  id: string
  title: string
  type: LessonType
  duration: number
  completed: boolean
  description: string
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export interface Course {
  id: string
  title: string
  code: string
  category: string
  level: 'Foundation' | 'Intermediate' | 'Advanced'
  progress: number
  lessonCount: number
  duration: string
  trainer: string
  description: string
  tags: string[]
  accent: 'emerald' | 'amber' | 'info' | 'navy'
}

export interface Recommendation {
  id: string
  kind: 'practice' | 'course' | 'resource' | 'assessment'
  title: string
  reason: string
  impact: string
  actionLabel: string
  target: string
  minutes: number
}

export interface Resource {
  id: string
  title: string
  type: 'Video' | 'Article' | 'Simulation' | 'Workbook' | 'Audio'
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  source: string
  description: string
  tags: string[]
  rating: number
}

export interface Assessment {
  id: string
  title: string
  course: string
  questionCount: number
  duration: number
  due: string
  status: 'Ready' | 'In progress' | 'Completed' | 'Locked'
  score?: number
  mastery: string
}

export interface Question {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export interface PlannerTask {
  id: string
  title: string
  course: string
  day: number
  start: string
  duration: number
  type: 'Learn' | 'Practice' | 'Assessment' | 'Review'
  done: boolean
}

export interface Toast {
  id: number
  title: string
  message?: string
  tone: 'success' | 'info' | 'error'
}

export type AIInsightTone = 'emerald' | 'amber' | 'info'

export interface AIInsightData {
  id: string
  title: string
  description: string
  factors: string[]
  tone: AIInsightTone
}

export interface AIInsightsResponse {
  role: Role
  context: string
  generatedAt: string
  insights: AIInsightData[]
}

export type AILanguage = 'en' | 'rw'
export type AIEngine = 'gemini' | 'deterministic'
export type AITask = 'general' | 'tutor' | 'assessment' | 'evaluation' | 'planning' | 'resource'
export type AITutorTask = Extract<AITask, 'tutor' | 'assessment' | 'evaluation' | 'planning' | 'resource'>
export type AIAssessmentType = 'mcq' | 'theory' | 'practical' | 'mixed'

export interface AISource {
  id: string
  title: string
}

export interface AIUsage {
  provider: string
  model: string
  tokens: number
  fallback: boolean
}

export interface AIHistoryMessage {
  role: 'user' | 'ai'
  text: string
}

export type AIAction =
  | { type: 'navigate'; to: string; label: string }
  | { type: 'setTheme'; theme: Theme; label: string }
  | {
      type: 'notify'
      title: string
      message?: string
      tone?: 'success' | 'info' | 'error'
      label: string
    }

export interface AIAssistResponse {
  role: Role
  context: string
  intent: string
  reply: string
  steps: string[]
  sources: AISource[]
  suggestions: string[]
  actions: AIAction[]
  engine: AIEngine
  grounded: boolean
  usage: AIUsage
  notice?: string
}

export interface AITutorResponse {
  role: Role
  context: string | null
  reply: string
  prompts: string[]
  sources?: AISource[]
  actions?: AIAction[]
  engine?: AIEngine
  usage?: AIUsage
  notice?: string
}

export interface AIGeneratedQuestion {
  id: string
  prompt: string
  type: Exclude<AIAssessmentType, 'mixed'>
  options: string[]
  explanation: string
}

export interface AIAssessmentResponse {
  title: string
  topic: string
  questions: AIGeneratedQuestion[]
  sources: AISource[]
  engine: string
  notice: string
}

export interface AIEvaluateResponse {
  feedback: string
  gaps: string[]
  suggestions: string[]
  indicativeScore: number
  sources: AISource[]
  engine: string
  notice: string
}

export interface AIPlanItem {
  day: number
  slot: string
  task: string
  minutes: number
  reason: string
}

export interface AIPlanResponse {
  plan: AIPlanItem[]
  engine: string
  deterministic: true
}

export interface AIQuota {
  limit: number
  used: number
  resetAt: string
}

export interface AIStatusResponse {
  provider: string
  model: string
  configured: boolean
  cacheEntries: number
  quota: AIQuota
  usage: { requests: number; tokens: number; errors: number; fallbacks: number }
  lastError: string | null
}
