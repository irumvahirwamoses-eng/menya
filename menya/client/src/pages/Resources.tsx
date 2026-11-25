import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Clock,
  FileText,
  FlaskConical,
  Headphones,
  Play,
  RotateCcw,
  Search,
  SearchX,
  Star,
  Video,
  type LucideIcon,
} from 'lucide-react'
import { AIInsightFeed } from '../components/ai/AIInsight'
import { PageHeader } from '../components/layout/PageHeader'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Toggle,
} from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { resources, student } from '../data/mock'
import { useT } from '../i18n'
import { cn } from '../lib/utils'
import type { Resource } from '../types'

type Tone = 'emerald' | 'amber' | 'info' | 'neutral'
type TypeFilter = 'All' | Resource['type']
type LevelFilter = 'All' | Resource['level']

const TYPES: TypeFilter[] = ['All', 'Video', 'Article', 'Simulation', 'Workbook', 'Audio']
const LEVELS: LevelFilter[] = ['All', 'Beginner', 'Intermediate', 'Advanced']
const CATEGORIES = ['All', ...Array.from(new Set(resources.map((resource) => resource.category)))]

const typeStyles: Record<Resource['type'], { icon: LucideIcon; tone: Tone; tile: string }> = {
  Video: {
    icon: Video,
    tone: 'info',
    tile: 'bg-info-soft text-info',
  },
  Article: {
    icon: FileText,
    tone: 'neutral',
    tile: 'bg-surface-alt text-muted',
  },
  Simulation: {
    icon: FlaskConical,
    tone: 'emerald',
    tile: 'bg-emerald-soft text-emerald-dark dark:text-emerald',
  },
  Workbook: {
    icon: BookOpen,
    tone: 'amber',
    tile: 'bg-amber-soft text-amber-dark dark:text-amber',
  },
  Audio: {
    icon: Headphones,
    tone: 'amber',
    tile: 'bg-amber-soft text-amber-dark dark:text-amber',
  },
}

export default function Resources() {
  const navigate = useNavigate()
  const { savedResources, toggleSavedResource, notify } = useApp()
  const t = useT()
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState<LevelFilter>('All')
  const [savedOnly, setSavedOnly] = useState(false)

  const visibleResources = useMemo(() => {
    const term = query.trim().toLowerCase()

    return resources.filter((resource) => {
      const matchesQuery =
        !term ||
        [
          resource.title,
          resource.description,
          resource.source,
          resource.category,
          resource.type,
          ...resource.tags,
        ].some((value) => value.toLowerCase().includes(term))
      const matchesType = typeFilter === 'All' || resource.type === typeFilter
      const matchesCategory = category === 'All' || resource.category === category
      const matchesLevel = level === 'All' || resource.level === level
      const matchesSaved = !savedOnly || savedResources.includes(resource.id)

      return matchesQuery && matchesType && matchesCategory && matchesLevel && matchesSaved
    })
  }, [query, typeFilter, category, level, savedOnly, savedResources])

  const resetFilters = () => {
    setQuery('')
    setTypeFilter('All')
    setCategory('All')
    setLevel('All')
    setSavedOnly(false)
  }

  const handleSave = (resource: Resource) => {
    const isSaved = savedResources.includes(resource.id)
    toggleSavedResource(resource.id)
    notify(
      isSaved ? t('Removed from saved') : t('Saved to your library'),
      resource.title,
      isSaved ? 'info' : 'success',
    )
  }

  const handleOpen = (resource: Resource) => {
    if (resource.type === 'Simulation') {
      notify(t('Opening simulation'), t('{title} is loading in your workspace.', { title: resource.title }), 'info')
      navigate('/workspace')
      return
    }

    notify(
      t('Resource ready'),
      t('{title} · {source}. Ask your trainer for full access.', { title: resource.title, source: resource.source }),
      'info',
    )
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={t('LIBRARY')}
        title={t('Resource library')}
        description={t('Discover trusted, curriculum-aligned materials picked for your trade and your next milestone.')}
        actions={
          <Button
            variant="secondary"
            icon={BookmarkCheck}
            onClick={() => setSavedOnly(true)}
            aria-label={t('Show your {count} saved resources', { count: savedResources.length })}
          >
            {t('Saved ({count})', { count: savedResources.length })}
          </Button>
        }
      />

      <AIInsightFeed
        className="mb-6"
        context="resources"
        fallback={[
          {
            title: t('Curated by MENYA AI'),
            description: t('Resources are matched to {program}, your current progress and the skills you are practising this week.', { program: student.program }),
            factors: [
              t('Prioritises safety and hands-on practice'),
              t('Aligned with your upcoming assessments'),
              t('Sourced from MENYA Labs and partner academies'),
            ],
          },
        ]}
      />

      <Card className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <label className="sr-only" htmlFor="resource-search">
                {t('Search resources')}
              </label>
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="resource-search"
                className="input pl-10"
                type="search"
                placeholder={t('Search by title, source, topic or tag...')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2.5 self-start rounded-[10px] border border-line bg-surface-alt px-3 py-2 sm:self-auto">
              <Toggle
                checked={savedOnly}
                onChange={(checked) => setSavedOnly(checked)}
                label={t('Show saved resources only')}
              />
              <span className="text-xs font-semibold text-ink">{t('Saved only')}</span>
            </div>
          </div>

          <div role="group" aria-label={t('Filter resources by type')} className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-1">{t('Type')}</span>
            {TYPES.map((item) => (
              <button
                key={item}
                type="button"
                className={cn('chip', typeFilter === item && 'chip-active')}
                aria-pressed={typeFilter === item}
                onClick={() => setTypeFilter(item)}
              >
                {t(item)}
              </button>
            ))}
          </div>

          <div role="group" aria-label={t('Filter resources by category')} className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-1">{t('Category')}</span>
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={cn('chip', category === item && 'chip-active')}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {t(item)}
              </button>
            ))}
          </div>

          <div role="group" aria-label={t('Filter resources by level')} className="flex flex-wrap items-center gap-2">
            <span className="eyebrow mr-1">{t('Level')}</span>
            {LEVELS.map((item) => (
              <button
                key={item}
                type="button"
                className={cn('chip', level === item && 'chip-active')}
                aria-pressed={level === item}
                onClick={() => setLevel(item)}
              >
                {t(item)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="section-title">{t('Available resources')}</h2>
        <p className="text-xs text-muted">
          {t('{shown} of {total} results', { shown: visibleResources.length, total: resources.length })}
        </p>
      </div>

      {visibleResources.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title={t('No resources found')}
            description={t('Nothing matches these filters yet. Try a different search or reset the filters.')}
            action={
              <Button variant="secondary" icon={RotateCcw} onClick={resetFilters}>
                {t('Reset filters')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleResources.map((resource) => {
            const style = typeStyles[resource.type]
            const TypeIcon = style.icon
            const isSaved = savedResources.includes(resource.id)

            return (
              <Card key={resource.id} className="card-interactive flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        style.tile,
                      )}
                    >
                      <TypeIcon size={19} strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <Badge tone={style.tone}>{t(resource.type)}</Badge>
                      <p className="mt-1.5 truncate text-[11px] font-semibold text-muted">
                        {t('{category} · {level}', { category: t(resource.category), level: t(resource.level) })}
                      </p>
                    </div>
                  </div>
                  <span
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-ink"
                    aria-label={t('Rated {rating} out of 5', { rating: resource.rating })}
                  >
                    <Star size={13} className="text-amber" aria-hidden />
                    {resource.rating.toFixed(1)}
                  </span>
                </div>

                <h3 className="mt-4 text-[15px] font-bold leading-snug">{resource.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                  {resource.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
                  <span className="truncate">{resource.source}</span>
                  <span aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} aria-hidden />
                    {resource.duration}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-alt px-2 py-1 text-[10px] font-medium text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
                  <Button
                    variant={isSaved ? 'secondary' : 'ghost'}
                    size="sm"
                    icon={isSaved ? BookmarkCheck : Bookmark}
                    aria-pressed={isSaved}
                    aria-label={
                      isSaved
                        ? t('Remove {title} from saved resources', { title: resource.title })
                        : t('Save {title}', { title: resource.title })
                    }
                    onClick={() => handleSave(resource)}
                  >
                    {isSaved ? t('Saved') : t('Save')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={resource.type === 'Simulation' ? Play : ArrowUpRight}
                    className="ml-auto"
                    aria-label={t('Open {title}', { title: resource.title })}
                    onClick={() => handleOpen(resource)}
                  >
                    {t('Open')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
