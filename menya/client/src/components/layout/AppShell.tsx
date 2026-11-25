import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Toasts } from './Toasts'
import { AIDrawer } from '../ai/AIDrawer'
import { DashboardSkeleton } from '../ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'
import { cn } from '../../lib/utils'

export function AppShell() {
  const { sidebarCollapsed } = useApp()
  const t = useT()

  return (
    <div className="min-h-dvh bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-emerald-solid focus:px-4 focus:py-2 focus:text-white"
      >
        {t('Skip to content')}
      </a>
      <Sidebar />
      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[padding] duration-200 lg:pl-[var(--sidebar-w)]',
          sidebarCollapsed && 'lg:pl-[var(--sidebar-w-collapsed)]',
        )}
      >
        <Topbar />
        <main id="main-content" className="mx-auto w-full max-w-[1640px] flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <Suspense fallback={<DashboardSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <AIDrawer />
      <Toasts />
    </div>
  )
}
