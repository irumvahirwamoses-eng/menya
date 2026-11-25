import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from 'react'
import {
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { useT } from '../../i18n'
import { cn, initials } from '../../lib/utils'

/* Button ------------------------------------------------------------------ */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'amber'
  size?: 'sm' | 'md'
  icon?: LucideIcon
  iconRight?: LucideIcon
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  className,
  children,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    amber: 'btn-amber',
  }[variant]

  return (
    <button className={cn(variantClass, size === 'sm' && 'px-3 py-1.5 text-xs', className)} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.2} aria-hidden />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} strokeWidth={2.2} aria-hidden />}
    </button>
  )
}

/* Card -------------------------------------------------------------------- */
export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
  icon: Icon,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  className?: string
  icon?: LucideIcon
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 section-title">
          {Icon && <Icon size={16} className="shrink-0 text-emerald" aria-hidden />}
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

/* Badge ------------------------------------------------------------------- */
type Tone = 'emerald' | 'amber' | 'info' | 'neutral' | 'danger'
const badgeTones: Record<Tone, string> = {
  emerald: 'bg-emerald-soft text-emerald-dark dark:text-emerald',
  amber: 'bg-amber-soft text-amber-dark dark:text-amber',
  info: 'bg-info-soft text-info',
  neutral: 'bg-surface-alt text-muted border border-line',
  danger: 'bg-danger-soft text-danger',
}

export function Badge({
  tone = 'neutral',
  children,
  className,
  dot = false,
}: {
  tone?: Tone
  children: ReactNode
  className?: string
  dot?: boolean
}) {
  return (
    <span className={cn('badge', badgeTones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}

/* Progress ---------------------------------------------------------------- */
export function ProgressBar({
  value,
  tone = 'emerald',
  className,
  showValue = false,
}: {
  value: number
  tone?: 'emerald' | 'amber' | 'info'
  className?: string
  showValue?: boolean
}) {
  const fill = {
    emerald: 'bg-emerald',
    amber: 'bg-amber',
    info: 'bg-info',
  }[tone]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="progress-track flex-1"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn('progress-fill', fill)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {showValue && <span className="w-9 text-right text-xs font-bold tabular-nums text-muted">{Math.round(value)}%</span>}
    </div>
  )
}

/* Avatar ------------------------------------------------------------------ */
export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-10 w-10 text-xs', lg: 'h-12 w-12 text-sm' }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-navy font-bold text-white dark:bg-emerald-dark',
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

/* Stat card ---------------------------------------------------------------- */
export function StatCard({
  label,
  value,
  change,
  icon: Icon,
  tone = 'emerald',
  footnote,
}: {
  label: string
  value: string | number
  change?: string
  icon: LucideIcon
  tone?: Tone
  footnote?: string
}) {
  const iconTone = {
    emerald: 'bg-emerald-soft text-emerald-dark dark:text-emerald',
    amber: 'bg-amber-soft text-amber-dark dark:text-amber',
    info: 'bg-info-soft text-info',
    neutral: 'bg-surface-alt text-muted',
    danger: 'bg-danger-soft text-danger',
  }[tone]

  return (
    <Card className="card-interactive p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-[-0.03em] tabular-nums">{value}</p>
        </div>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconTone)}>
          <Icon size={19} strokeWidth={2} aria-hidden />
        </span>
      </div>
      {change && (
        <p className={cn('mt-3 flex items-center gap-1 text-[11px] font-semibold', tone === 'danger' ? 'text-danger' : 'text-emerald')}>
          {change}
          {footnote && <span className="font-normal text-muted">· {footnote}</span>}
        </p>
      )}
    </Card>
  )
}

/* Section header ----------------------------------------------------------- */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon: Icon,
}: {
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  icon?: LucideIcon
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-[-0.01em]">
          {Icon && <Icon size={17} className="text-emerald" aria-hidden />}
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald hover:text-emerald-dark dark:hover:text-emerald"
        >
          {actionLabel}
          <ArrowRight size={14} aria-hidden />
        </button>
      )}
    </div>
  )
}

/* Empty state -------------------------------------------------------------- */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-alt text-muted">
        <Icon size={24} strokeWidth={1.8} aria-hidden />
      </span>
      <h3 className="text-[15px] font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* Tabs --------------------------------------------------------------------- */
export interface TabItem<T extends string> {
  id: T
  label: string
  icon?: LucideIcon
  count?: number
}

export function Tabs<T extends string>({
  items,
  active,
  onChange,
  className,
}: {
  items: TabItem<T>[]
  active: T
  onChange: (id: T) => void
  className?: string
}) {
  const t = useT()
  return (
    <div className={cn('flex gap-1 overflow-x-auto rounded-[11px] border border-line bg-surface-alt p-1', className)} role="tablist">
      {items.map((item) => {
        const Icon = item.icon
        const isActive = active === item.id
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              isActive ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
            )}
          >
            {Icon && <Icon size={14} aria-hidden />}
            {t(item.label)}
            {item.count !== undefined && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', isActive ? 'bg-emerald-soft text-emerald-dark dark:text-emerald' : 'bg-surface-alt text-muted')}>
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* Skeleton ----------------------------------------------------------------- */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden />
}

export function DashboardSkeleton() {
  const t = useT()
  return (
    <div className="stack animate-fade-up" aria-busy="true" aria-label={t('Loading dashboard')}>
      <SkeletonBlock className="h-40 w-full rounded-card" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} className="h-28 rounded-card" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-72 rounded-card lg:col-span-2" />
        <SkeletonBlock className="h-72 rounded-card" />
      </div>
    </div>
  )
}

/* Toggle ------------------------------------------------------------------- */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-emerald' : 'bg-line-strong',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
