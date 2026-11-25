import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldCheck, UsersRound } from 'lucide-react'
import { AIInsightFeed } from '../../components/ai/AIInsight'
import { AITutorPanel } from '../../components/ai/AITutorPanel'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Toggle,
} from '../../components/ui/Primitives'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useT, type Translate } from '../../i18n'
import { apiClient } from '../../lib/api'
import type { Role } from '../../types'

interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  program: string
  school: string
  createdAt: string
}

interface UserPatch {
  role?: Role
  active?: boolean
}

const roleOptions: Role[] = ['student', 'trainer', 'reviewer', 'admin']

function roleLabel(role: Role, t: Translate): string {
  if (role === 'student') return t('Student')
  if (role === 'trainer') return t('Teacher / trainer')
  if (role === 'reviewer') return t('Reviewer')
  return t('Administrator')
}

function joinedOn(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AdminUsers() {
  const { notify } = useApp()
  const { user } = useAuth()
  const t = useT()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [query, setQuery] = useState('')
  const [pendingIds, setPendingIds] = useState<string[]>([])

  useEffect(() => {
    let active = true
    Promise.allSettled([
      apiClient.get<{ users: AdminUser[] }>('/users'),
    ]).then(([usersResult]) => {
      if (!active) return
      if (usersResult.status === 'fulfilled') {
        // oxlint-disable-next-line react/set-state-in-effect -- loads server data once
        setUsers(usersResult.value.users)
      }
    })
    return () => {
      active = false
    }
  }, [])

  const visibleUsers = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term),
    )
  }, [query, users])

  const patchUser = async (target: AdminUser, patch: UserPatch) => {
    if (patch.active === false && target.id === user?.id) {
      notify(t('Cannot deactivate your account'), t('Ask another administrator to change your own access.'), 'error')
      return
    }
    if (pendingIds.includes(target.id)) return

    setPendingIds((current) => [...current, target.id])
    try {
      const response = await apiClient.patch<{ user: AdminUser }>(`/users/${target.id}`, patch)
      const updated = response.user
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      notify(
        t('Access updated'),
        t('{name} is now {role} · {status}.', {
          name: updated.name,
          role: roleLabel(updated.role, t),
          status: t(updated.active ? 'active' : 'inactive'),
        }),
      )
    } catch {
      notify(t('Update failed'), t('That change could not be saved. Please try again.'), 'error')
    } finally {
      setPendingIds((current) => current.filter((id) => id !== target.id))
    }
  }

  return (
    <div className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('PLATFORM OPERATIONS')}
        title={t('Users & access')}
        description={t('Review every account, assign roles and control who can sign in.')}
        actions={<Badge tone="info">{t('{count} accounts', { count: users.length })}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="space-y-4 p-5 sm:p-6">
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald" aria-hidden />
                  {t('Account directory')}
                </span>
              }
              subtitle={t('Role and status changes save immediately to the server.')}
              action={<Badge tone="emerald" dot>{t('{count} active', { count: users.filter((item) => item.active).length })}</Badge>}
            />
            <div className="relative max-w-sm">
              <label className="sr-only" htmlFor="admin-user-search">{t('Search users by name or email')}</label>
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                id="admin-user-search"
                type="search"
                className="input pl-10"
                placeholder={t('Search by name or email…')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          {visibleUsers.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">{t('User')}</th>
                    <th scope="col">{t('Program / school')}</th>
                    <th scope="col">{t('Role')}</th>
                    <th scope="col">{t('Status')}</th>
                    <th scope="col">{t('Joined')}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((row) => {
                    const isSelf = row.id === user?.id
                    const isPending = pendingIds.includes(row.id)
                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={row.name} size="sm" />
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 font-semibold whitespace-nowrap">
                                {row.name}
                                {isSelf && <Badge tone="info">{t('You')}</Badge>}
                              </p>
                              <p className="text-[11px] text-muted">{row.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-[12px] font-medium whitespace-nowrap">{row.program || '—'}</p>
                          <p className="text-[11px] text-muted">{row.school || '—'}</p>
                        </td>
                        <td>
                          <select
                            aria-label={t('Role for {name}', { name: row.name })}
                            className="input w-[150px] py-1.5 text-[11px]"
                            value={row.role}
                            disabled={isPending}
                            onChange={(event) => void patchUser(row, { role: event.target.value as Role })}
                          >
                            {roleOptions.map((role) => (
                              <option key={role} value={role}>{roleLabel(role, t)}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <Badge tone={row.active ? 'emerald' : 'neutral'} dot>
                              {t(row.active ? 'Active' : 'Inactive')}
                            </Badge>
                            {isSelf ? (
                              <span className="text-[10px] text-muted" title={t('You cannot deactivate your own account')}>
                                {t('Locked')}
                              </span>
                            ) : (
                              <Toggle
                                checked={row.active}
                                onChange={(checked) => void patchUser(row, { active: checked })}
                                label={t(row.active ? 'Deactivate {name}' : 'Activate {name}', { name: row.name })}
                              />
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-[11px] text-muted">{joinedOn(row.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={UsersRound}
              title={t(users.length ? 'No matching accounts' : 'No accounts yet')}
              description={
                users.length
                  ? t('Try a different name or email address to find the account you need.')
                  : t('Accounts will appear here as people register on the platform.')
              }
            />
          )}
          <p className="border-t border-line px-5 py-3 text-[11px] text-muted">
            {t('You cannot deactivate your own administrator account. Another administrator can change it for you.')}
          </p>
        </Card>

        <div className="stack">
          <AIInsightFeed
            context="admin-users"
            fallback={[
              {
                title: t('Review access before the next term'),
                description: t('Check inactive accounts and confirm that every trainer and reviewer still matches their current responsibilities.'),
                factors: [
                  t('Deactivated accounts lose their active session and tokens'),
                  t('Role changes take effect on the next request'),
                  t('Your own account cannot be deactivated here'),
                ],
              },
            ]}
          />
          <div className="h-[520px]">
            <AITutorPanel
              lessonTitle={t('Users and access')}
              context="admin-users"
              title={t('MENYA AI Access Copilot')}
              role="admin"
              prompts={[
                t('Who should review their access?'),
                t('What does an inactive account mean?'),
                t('Summarise roles across the platform'),
              ]}
              exercises={[
                t('Draft a review note for trainer access'),
                t('List checks before changing a role'),
                t('Explain why self-deactivation is blocked'),
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
