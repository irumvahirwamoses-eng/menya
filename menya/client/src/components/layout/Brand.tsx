import { useT } from '../../i18n'
import { cn } from '../../lib/utils'

export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-[11px] bg-emerald-solid text-white shadow-sm', className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32" fill="none">
        <path d="M5 23V9h4.2l7.8 10.5L24.8 9H29v14h-4.3v-8.6L17 23l-7.7-8.6V23H5Z" fill="currentColor" />
      </svg>
    </span>
  )
}

export function Brand({ compact = false }: { compact?: boolean }) {
  const t = useT()
  return (
    <div className="flex items-center gap-2.5">
      <BrandMark size={compact ? 32 : 36} />
      {!compact && (
        <div className="leading-none">
          <div className="text-[17px] font-extrabold tracking-[0.16em] text-sidebar-active">MENYA</div>
          <div className="mt-1 text-[9px] font-medium tracking-[0.08em] text-sidebar-muted">{t('LEARN WITH INTELLIGENCE')}</div>
        </div>
      )}
    </div>
  )
}
