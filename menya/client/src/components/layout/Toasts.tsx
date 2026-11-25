import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'
import { cn } from '../../lib/utils'

export function Toasts() {
  const { toasts, dismissToast } = useApp()
  const t = useT()

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(360px,calc(100vw-32px))] flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = toast.tone === 'error' ? AlertCircle : toast.tone === 'info' ? Info : CheckCircle2
        return (
          <div
            key={toast.id}
            className="animate-toast-in pointer-events-auto flex items-start gap-3 rounded-card border border-line bg-surface-raised p-4 shadow-pop"
            role="status"
          >
            <span
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                toast.tone === 'error'
                  ? 'bg-danger-soft text-danger'
                  : toast.tone === 'info'
                    ? 'bg-info-soft text-info'
                    : 'bg-emerald-soft text-emerald',
              )}
            >
              <Icon size={17} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold">{toast.title}</p>
              {toast.message && <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{toast.message}</p>}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-muted transition-colors hover:text-ink"
              aria-label={t('Dismiss notification')}
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
