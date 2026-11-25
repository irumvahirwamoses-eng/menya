import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  BookOpen,
  ClipboardCheck,
  LibraryBig,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { Badge, Button } from '../ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'
import type { Recommendation } from '../../types'
import { cn } from '../../lib/utils'

const kindIcon = {
  practice: Target,
  course: BookOpen,
  resource: LibraryBig,
  assessment: ClipboardCheck,
}

export function AIRecommendationCard({ recommendation, compact = false }: { recommendation: Recommendation; compact?: boolean }) {
  const navigate = useNavigate()
  const { dismissRecommendation, notify } = useApp()
  const t = useT()
  const Icon = kindIcon[recommendation.kind]

  return (
    <article className={cn('card relative p-5', !compact && 'card-interactive')}>
      <button
        onClick={() => {
          dismissRecommendation(recommendation.id)
          notify(t('Recommendation dismissed'), t('MENYA AI will adjust your suggestions.'), 'info')
        }}
        className="absolute top-3.5 right-3.5 rounded-md p-1 text-muted transition-colors hover:bg-surface-alt hover:text-ink"
        aria-label={t('Dismiss recommendation: {title}', { title: t(recommendation.title) })}
      >
        <X size={15} />
      </button>

      <div className="mb-3.5 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-soft text-emerald">
          <Icon size={16} strokeWidth={2.1} aria-hidden />
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.02em] text-emerald">
          <Sparkles size={12} aria-hidden /> {t('FOR YOU')}
        </span>
      </div>

      <h3 className="pr-6 text-[14px] font-bold leading-snug tracking-[-0.01em]">{t(recommendation.title)}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">{t(recommendation.reason)}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone="amber" dot>{t(recommendation.impact)}</Badge>
        <Badge tone="neutral">{t('{minutes} min', { minutes: recommendation.minutes })}</Badge>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="mt-4 w-full justify-between"
        iconRight={ArrowUpRight}
        onClick={() => navigate(recommendation.target)}
      >
        {t(recommendation.actionLabel)}
      </Button>
    </article>
  )
}
