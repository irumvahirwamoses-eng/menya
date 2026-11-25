import { config } from '../../config'

export type AIEngine = 'gemini' | 'deterministic'

export interface AIUsage {
  provider: string
  model: string
  tokens: number
  fallback: boolean
}

export interface AIChatMessage {
  role: 'user' | 'ai'
  text: string
}

export interface AIGenerationRequest {
  system: string
  prompt: string
  history?: AIChatMessage[]
  schema: Record<string, unknown>
  maxOutputTokens?: number
  fallbackText?: string
}

export interface AIGenerationResult {
  text: string
  usage: AIUsage
}

export interface AIProvider {
  readonly name: string
  readonly model: string
  readonly configured: boolean
  generate(request: AIGenerationRequest): Promise<AIGenerationResult>
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message.replace(/\s+/g, ' ').trim().slice(0, 300))
    this.name = 'AIProviderError'
  }
}

interface GeminiErrorPayload {
  error?: { message?: string }
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> }
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
  promptFeedback?: { blockReason?: string }
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}

function errorText(raw: string, status: number): string {
  const parsed = safeJson(raw) as GeminiErrorPayload | null
  const message = parsed?.error?.message?.trim()
  return message ?? raw.replace(/\s+/g, ' ').trim().slice(0, 240) ?? `Gemini request failed (${status}).`
}

class GeminiProvider implements AIProvider {
  readonly name = 'gemini'
  readonly model = config.ai.model.replace(/^models\//, '')

  get configured(): boolean {
    return Boolean(config.ai.apiKey.trim()) && config.ai.provider.trim().toLowerCase() === 'gemini'
  }

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    if (!this.configured) {
      throw new AIProviderError('Gemini API key is not configured.')
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`
    const contents = [
      ...(request.history ?? []).map((message) => ({
        role: message.role === 'ai' ? 'model' : 'user',
        parts: [{ text: message.text }],
      })),
      { role: 'user', parts: [{ text: request.prompt }] },
    ]

    const payload = {
      systemInstruction: { parts: [{ text: request.system }] },
      contents,
      generationConfig: {
        temperature: Number.isFinite(config.ai.temperature) ? config.ai.temperature : 0.35,
        maxOutputTokens: request.maxOutputTokens ?? (Number.isFinite(config.ai.maxOutputTokens) ? config.ai.maxOutputTokens : 900),
        responseMimeType: 'application/json',
        responseSchema: request.schema,
      },
    }

    const retryable = new Set([408, 429, 500, 502, 503, 504])
    let response: Response | null = null
    let raw = ''
    let failure: AIProviderError | null = null

    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': config.ai.apiKey.trim(),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(Number.isFinite(config.ai.timeoutMs) ? config.ai.timeoutMs : 12000),
        })
        raw = await response.text().catch(() => '')
        if (response.ok) break
        failure = new AIProviderError(errorText(raw, response.status), response.status)
        if (!retryable.has(response.status)) throw failure
      } catch (error) {
        if (error instanceof AIProviderError && !retryable.has(error.status ?? 0)) throw error
        failure = error instanceof AIProviderError
          ? error
          : new AIProviderError(`Gemini request could not be completed: ${error instanceof Error ? error.message : 'Network error'}`)
      }

      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)))
      }
    }

    if (!response || !response.ok) {
      throw failure ?? new AIProviderError('Gemini request could not be completed.')
    }

    const data = safeJson(raw) as GeminiResponse | null
    if (!data) {
      throw new AIProviderError('Gemini returned an unreadable response.')
    }
    if (data.promptFeedback?.blockReason) {
      throw new AIProviderError(`Gemini blocked this prompt (${data.promptFeedback.blockReason}).`)
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.filter((part) => !part.thought)
      ?.map((part) => part.text ?? '')
      .join('')
      .trim()
    if (!text) {
      const reason = data.candidates?.[0]?.finishReason ?? 'no content'
      throw new AIProviderError(`Gemini returned no usable answer (${reason}).`)
    }

    const usageMetadata = data.usageMetadata
    const promptTokens = usageMetadata?.promptTokenCount ?? 0
    const outputTokens = usageMetadata?.candidatesTokenCount ?? 0
    const tokens = usageMetadata?.totalTokenCount ?? promptTokens + outputTokens

    return {
      text,
      usage: {
        provider: this.name,
        model: this.model,
        tokens: Number.isFinite(tokens) ? Math.max(0, Math.round(tokens)) : 0,
        fallback: false,
      },
    }
  }
}

class DeterministicProvider implements AIProvider {
  readonly name = 'deterministic'
  readonly model = 'menya-rules'
  readonly configured = true

  async generate(request: AIGenerationRequest): Promise<AIGenerationResult> {
    if (!request.fallbackText) {
      throw new AIProviderError('No deterministic fallback was supplied.')
    }
    return {
      text: request.fallbackText,
      usage: {
        provider: this.name,
        model: this.model,
        tokens: 0,
        fallback: true,
      },
    }
  }
}

let activeProvider: AIProvider | undefined
let fallbackProvider: AIProvider | undefined

export function getAIProvider(): AIProvider {
  if (!activeProvider) {
    activeProvider = config.ai.provider.trim().toLowerCase() === 'gemini' && config.ai.apiKey.trim()
      ? new GeminiProvider()
      : new DeterministicProvider()
  }
  return activeProvider
}

export function getFallbackProvider(): AIProvider {
  fallbackProvider ??= new DeterministicProvider()
  return fallbackProvider
}

export function isGeminiConfigured(): boolean {
  return config.ai.provider.trim().toLowerCase() === 'gemini' && Boolean(config.ai.apiKey.trim())
}
