import { useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import { useAIInsights } from '../../hooks/useAIInsights'
import { useT } from '../../i18n'
import type { AIInsightData, AIInsightTone } from '../../types'
import { cn } from '../../lib/utils'

const toneStyles: Record<AIInsightTone, { card: string; icon: string; label: string }> = {
  emerald: {
    card: 'border-emerald/25 bg-emerald-soft/55 dark:bg-emerald-soft/30',
    icon: 'bg-emerald-solid text-white',
    label: 'text-emerald-dark dark:text-emerald',
  },
  amber: {
    card: 'border-amber/30 bg-amber-soft/55 dark:bg-amber-soft/25',
    icon: 'bg-amber text-white',
    label: 'text-amber-dark dark:text-amber',
  },
  info: {
    card: 'border-info/25 bg-info-soft/55 dark:bg-info-soft/25',
    icon: 'bg-info text-white',
    label: 'text-info',
  },
}

export function AIInsight({
  title,
  description,
  factors,
  className,
  tone = 'emerald',
}: {
  title: string
  description: string
  factors?: string[]
  className?: string
  tone?: AIInsightTone
}) {
  const [open, setOpen] = useState(false)
  const t = useT()
  const styles = toneStyles[tone]

  return (
    <div className={cn('rounded-card border p-4', styles.card, className)}>
      <div className="flex items-start gap-3">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', styles.icon)}>
          <Sparkles size={15} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cn('text-[12px] font-bold', styles.label)}>{t('MENYA AI INSIGHT')}</p>
            {factors?.length ? (
              <button
                onClick={() => setOpen((value) => !value)}
                className="flex items-center gap-1 text-[10px] font-semibold text-muted hover:text-ink"
                aria-expanded={open}
              >
                {t('Why this?')}
                <ChevronDown size={13} className={cn('transition-transform', open && 'rotate-180')} aria-hidden />
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-[13px] font-semibold leading-snug">{t(title)}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">{t(description)}</p>
          {open && factors?.length ? (
            <ul className="mt-3 space-y-1.5 border-t border-line/60 pt-3">
              {factors.map((factor) => (
                <li key={factor} className="flex items-start gap-2 text-[11px] text-muted">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
                  {t(factor)}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function AIInsightFeed({
  context,
  className,
  fallback = [],
}: {
  context: string
  className?: string
  fallback?: Array<Omit<AIInsightData, 'id' | 'tone'> & { id?: string; tone?: AIInsightTone }>
}) {
  const { insights, loading } = useAIInsights(context)
  const t = useT()
  const items: AIInsightData[] = insights.length
    ? insights
    : fallback.map((item, index) => ({
        id: item.id ?? `${context}-${index}`,
        tone: item.tone ?? 'emerald',
        title: item.title,
        description: item.description,
        factors: item.factors,
      }))

  if (!items.length && loading) {
    return (
      <div className={cn('rounded-card border border-line bg-surface-alt/60 p-4', className)} aria-busy="true">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-emerald-soft" />
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-24 animate-pulse rounded bg-surface-alt" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-alt" />
            <div className="h-2.5 w-full animate-pulse rounded bg-surface-alt" />
          </div>
        </div>
        <p className="mt-3 text-[10px] text-muted">{t('MENYA AI is reading your workspace…')}</p>
      </div>
    )
  }

  if (!items.length) return null

  return (
    <div className={cn('stack', className)}>
      {items.map((item) => (
        <AIInsight
          key={item.id}
          tone={item.tone}
          title={item.title}
          description={item.description}
          factors={item.factors}
        />
      ))}
    </div>
  )
}
