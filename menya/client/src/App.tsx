import { lazy, type ReactNode } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { AppShell } from './components/layout/AppShell'
import { DashboardSkeleton, EmptyState } from './components/ui/Primitives'
import { useAuth } from './context/AuthContext'
import { roleHome } from './data/navigation'
import { useT } from './i18n'
import Login from './pages/Login'
import type { Role } from './types'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Workspace = lazy(() => import('./pages/Workspace'))
const Curriculum = lazy(() => import('./pages/Curriculum'))
const Resources = lazy(() => import('./pages/Resources'))
const Assessments = lazy(() => import('./pages/Assessments'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Planner = lazy(() => import('./pages/Planner'))
const AIWorkspace = lazy(() => import('./pages/AIWorkspace'))
const Settings = lazy(() => import('./pages/Settings'))

const TrainerDashboard = lazy(() => import('./pages/trainer/TrainerDashboard'))
const TrainerCohorts = lazy(() => import('./pages/trainer/TrainerCohorts'))
const TrainerCourses = lazy(() => import('./pages/trainer/TrainerCourses'))
const TrainerReviews = lazy(() => import('./pages/trainer/TrainerReviews'))

const ReviewerDashboard = lazy(() => import('./pages/reviewer/ReviewerDashboard'))
const ReviewerQueue = lazy(() => import('./pages/reviewer/ReviewerQueue'))
const ReviewerHistory = lazy(() => import('./pages/reviewer/ReviewerHistory'))

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

function LoadingScreen() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <DashboardSkeleton />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

function RequireRoles({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to={roleHome[user.role]} replace />
  return <>{children}</>
}

function RoleHome() {
  const { user } = useAuth()
  return <Navigate to={roleHome[user?.role ?? 'student']} replace />
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to={roleHome[user.role]} replace />
  return <>{children}</>
}

function NotFound() {
  const { user } = useAuth()
  const t = useT()
  const home = roleHome[user?.role ?? 'student']
  return (
    <div className="card mt-10">
      <EmptyState
        icon={Compass}
        title={t('This page is not on the map')}
        description={t('The link may have moved. Head back to your workspace overview and continue from there.')}
        action={<Link to={home} className="btn-primary">{t('Go to my overview')}</Link>}
      />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<RoleHome />} />

        <Route path="ai" element={<AIWorkspace />} />

        <Route element={<RequireRoles roles={['student']}><Outlet /></RequireRoles>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workspace" element={<Workspace />} />
          <Route path="curriculum" element={<Curriculum />} />
          <Route path="resources" element={<Resources />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="planner" element={<Planner />} />
        </Route>

        <Route path="trainer" element={<RequireRoles roles={['trainer']}><Outlet /></RequireRoles>}>
          <Route index element={<TrainerDashboard />} />
          <Route path="cohorts" element={<TrainerCohorts />} />
          <Route path="courses" element={<TrainerCourses />} />
          <Route path="reviews" element={<TrainerReviews />} />
        </Route>

        <Route path="reviewer" element={<RequireRoles roles={['reviewer']}><Outlet /></RequireRoles>}>
          <Route index element={<ReviewerDashboard />} />
          <Route path="queue" element={<ReviewerQueue />} />
          <Route path="history" element={<ReviewerHistory />} />
        </Route>

        <Route path="admin" element={<RequireRoles roles={['admin']}><Outlet /></RequireRoles>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
