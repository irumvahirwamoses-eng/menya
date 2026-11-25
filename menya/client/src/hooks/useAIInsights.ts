import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { AIInsightData, AIInsightsResponse } from '../types'

interface InsightState {
  context: string
  insights: AIInsightData[]
}

export function useAIInsights(context: string) {
  const [state, setState] = useState<InsightState>({ context, insights: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api<AIInsightsResponse>(`/ai/insights?context=${encodeURIComponent(context)}`)
      .then((data) => {
        if (active) setState({ context, insights: data.insights })
      })
      .catch(() => {
        if (active) setState({ context, insights: [] })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [context])

  return {
    insights: state.context === context ? state.insights : [],
    loading: loading || state.context !== context,
  }
}
