import 'dotenv/config'

export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/menya',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-before-production',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-before-production',
  isProduction: process.env.NODE_ENV === 'production',
  ai: {
    provider: process.env.AI_PROVIDER ?? 'gemini',
    apiKey: process.env.AI_API_KEY ?? '',
    model: process.env.AI_MODEL ?? 'gemini-3.1-flash-lite',
    temperature: Number(process.env.AI_TEMPERATURE ?? 0.35),
    maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS ?? 900),
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 30000),
    cacheTtlMs: Number(process.env.AI_CACHE_TTL_MS ?? 10 * 60 * 1000),
    dailyQuota: Number(process.env.AI_DAILY_QUOTA ?? 20),
    maxPromptChars: Number(process.env.AI_MAX_PROMPT_CHARS ?? 8000),
  },
}
