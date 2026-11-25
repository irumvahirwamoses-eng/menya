import { NavLink, useLocation } from 'react-router-dom'
import {
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  X,
} from 'lucide-react'
import { Brand } from './Brand'
import { Avatar } from '../ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import {
  localizedNavGroups,
  localizedRoleLabel,
  localizedWorkspace,
} from '../../data/navigation'
import { useT } from '../../i18n'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const { role, sidebarCollapsed, toggleSidebar, mobileNavOpen, setMobileNavOpen, notify, toggleAIDrawer, openAIDrawer } = useApp()
  const { user } = useAuth()
  const location = useLocation()
  const t = useT()
  const displayName = user?.name ?? t('MENYA learner')
  const navGroups = localizedNavGroups(role, t)
  const roleLabel = localizedRoleLabel(role, t)

  const closeMobile = () => setMobileNavOpen(false)

  return (
    <>
      {mobileNavOpen && (
        <button
          className="fixed inset-0 z-40 bg-[#07111f]/55 backdrop-blur-[2px] lg:hidden"
          aria-label={t('Close navigation')}
          onClick={closeMobile}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-sidebar-bg text-sidebar-fg transition-[width,transform] duration-200 ease-out',
          'lg:translate-x-0',
          sidebarCollapsed ? 'lg:w-[var(--sidebar-w-collapsed)]' : 'lg:w-[var(--sidebar-w)]',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ borderRight: '1px solid var(--sidebar-line)' }}
      >
        {/* Brand */}
        <div className={cn('flex h-[var(--header-h)] shrink-0 items-center px-5', sidebarCollapsed && 'lg:justify-center lg:px-0')}>
          <div className={cn('flex w-full items-center justify-between', sidebarCollapsed && 'lg:justify-center')}>
            <div className={cn(sidebarCollapsed && 'lg:hidden')}>
              <Brand />
            </div>
            <div className={cn('hidden', sidebarCollapsed && 'lg:block')}>
              <Brand compact />
            </div>
            <button
              className="rounded-lg p-1.5 text-sidebar-muted hover:bg-white/10 hover:text-white lg:hidden"
              onClick={closeMobile}
              aria-label={t('Close navigation menu')}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="scroll-area flex-1 overflow-y-auto px-3 pb-4" aria-label={t('Main navigation')}>
          {navGroups.map((group) => {
            const visible = group.items
            if (!visible.length) return null
            return (
              <div key={group.label} className="mb-6">
                {!(sidebarCollapsed && group.label !== t('Learning')) && (
                  <p
                    className={cn(
                      'mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-muted/80',
                      sidebarCollapsed && 'lg:hidden',
                    )}
                  >
                    {group.label}
                  </p>
                )}
                <ul className="space-y-1">
                  {visible.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      location.pathname === item.to ||
                      (item.to.length > 1 && location.pathname.startsWith(`${item.to}/`))
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={closeMobile}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={cn(
                            'group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-colors',
                            sidebarCollapsed && 'lg:justify-center lg:px-0',
                            isActive
                              ? 'bg-white/12 text-sidebar-active shadow-[inset_2px_0_0_var(--emerald)]'
                              : 'text-sidebar-fg hover:bg-white/7 hover:text-sidebar-active',
                          )}
                        >
                          <Icon
                            size={18}
                            strokeWidth={isActive ? 2.2 : 1.9}
                            className={cn('shrink-0', isActive ? 'text-emerald' : 'text-sidebar-muted group-hover:text-sidebar-fg')}
                          />
                          <span className={cn('flex-1 truncate', sidebarCollapsed && 'lg:hidden')}>{item.label}</span>
                          {item.badge && !sidebarCollapsed && (
                            <span className="rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold text-amber">{item.badge}</span>
                          )}
                        </NavLink>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => openAIDrawer()}
            className={cn(
              'mt-2 w-full rounded-xl border border-white/10 bg-white/6 p-3.5 text-left transition-colors hover:border-white/20 hover:bg-white/10',
              sidebarCollapsed && 'lg:hidden',
            )}
            aria-label={t('Open MENYA AI help')}
          >
            <span className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber">
              <Sparkles size={14} aria-hidden /> {t('MENYA AI')}
            </span>
            <span className="block text-[11px] leading-relaxed text-sidebar-muted">
              {localizedWorkspace(role, t).description}
            </span>
          </button>
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            onClick={toggleAIDrawer}
            aria-label={t('Open MENYA AI help')}
            className={cn(
              'mb-2 flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[13px] text-sidebar-muted transition-colors hover:bg-white/8 hover:text-white',
              sidebarCollapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <LifeBuoy size={17} className="shrink-0" aria-hidden />
            <span className={cn(sidebarCollapsed && 'lg:hidden')}>{t('Help & support')}</span>
          </button>

          <button
            onClick={() => notify(t('Signed in as {name}', { name: displayName }), t('{role} access', { role: roleLabel }), 'info')}
            className={cn(
              'flex w-full items-center gap-3 rounded-[10px] p-2 text-left transition-colors hover:bg-white/8',
              sidebarCollapsed && 'lg:justify-center lg:px-0',
            )}
          >
            <Avatar name={displayName} size="sm" className="bg-emerald-solid text-white" />
            <div className={cn('min-w-0 flex-1', sidebarCollapsed && 'lg:hidden')}>
              <p className="truncate text-xs font-semibold text-white">{displayName}</p>
              <p className="truncate text-[10px] text-sidebar-muted">{roleLabel} · {user?.school ?? 'MENYA'}</p>
            </div>
          </button>

          <button
            onClick={toggleSidebar}
            className={cn(
              'mt-2 hidden w-full items-center gap-3 rounded-[10px] px-3 py-2 text-[12px] text-sidebar-muted transition-colors hover:bg-white/8 hover:text-white lg:flex',
              sidebarCollapsed && 'lg:justify-center lg:px-0',
            )}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={17} aria-hidden /> : <PanelLeftClose size={17} aria-hidden />}
            <span className={cn(sidebarCollapsed && 'lg:hidden')}>{t('Collapse sidebar')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
