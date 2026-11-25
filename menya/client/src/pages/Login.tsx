import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import { BrandMark } from '../components/layout/Brand'
import { Button } from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { useAuth, type AuthResult } from '../context/AuthContext'
import { roleHome } from '../data/navigation'
import { useT } from '../i18n'

const demoAccounts = [
  { label: 'Student', email: 'student@menya.rw', icon: GraduationCap },
  { label: 'Trainer', email: 'trainer@menya.rw', icon: UsersRound },
  { label: 'Reviewer', email: 'reviewer@menya.rw', icon: CheckCircle2 },
  { label: 'Admin', email: 'admin@menya.rw', icon: ShieldCheck },
]

export default function Login() {
  const { login, register } = useAuth()
  const { language, setLanguage } = useApp()
  const t = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  const finishSignIn = (result: AuthResult) => {
    if (result.error || !result.user) {
      setError(t(result.error ?? 'Unable to sign in.'))
      return
    }
    navigate(destination ?? roleHome[result.user.role], { replace: true })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result = mode === 'login'
      ? await login(email, password)
      : await register({ name, email, password })
    setBusy(false)
    finishSignIn(result)
  }

  const signInAsDemo = async (demoEmail: string) => {
    setBusy(true)
    setError(null)
    setEmail(demoEmail)
    setPassword('Demo1234!')
    const result = await login(demoEmail, 'Demo1234!')
    setBusy(false)
    finishSignIn(result)
  }

  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-hero p-12 text-hero-fg lg:flex lg:flex-col lg:justify-between">
        <div className="grid-pattern pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden />
        <div className="relative flex items-center gap-3">
          <BrandMark size={42} />
          <div>
            <p className="text-lg font-extrabold tracking-[0.18em]">MENYA</p>
            <p className="text-[9px] tracking-[0.1em] text-hero-muted">{t('LEARN WITH INTELLIGENCE')}</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald">
            <Sparkles size={14} aria-hidden /> {t('Built for Rwandan TVET')}
          </p>
          <h1 className="text-hero-fg text-[40px] leading-[1.12] tracking-[-0.035em]">
            {t('Learning that adapts to the way you work.')}
          </h1>
          <p className="mt-5 text-[14px] leading-relaxed text-hero-muted">
            {t('Personalised lessons, contextual AI tutoring and competency checks — all in one calm, focused workspace for students, trainers and reviewers.')}
          </p>

          <ul className="mt-9 space-y-4">
            {[
              'A study path shaped by your strengths and gaps',
              'AI explanations tied to the lesson you are in',
              'Clear evidence for trainers and reviewers',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13px] text-hero-fg">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald" aria-hidden />
                {t(item)}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-8 border-t border-white/12 pt-6 text-[11px] text-hero-muted">
          <span><strong className="block text-lg text-hero-fg">2,400+</strong>{t('active learners')}</span>
          <span><strong className="block text-lg text-hero-fg">86</strong>{t('trainers')}</span>
          <span><strong className="block text-lg text-hero-fg">74%</strong>{t('average mastery')}</span>
        </div>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center justify-between gap-3 lg:hidden">
            <div className="flex items-center gap-2.5">
              <BrandMark size={36} />
              <span className="text-base font-extrabold tracking-[0.16em]">MENYA</span>
            </div>
            <div
              className="flex items-center rounded-[10px] border border-line bg-surface-alt p-0.5"
              role="group"
              aria-label={t('Change language')}
            >
              {(['en', 'rw'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  aria-pressed={language === option}
                  title={t(option === 'en' ? 'English' : 'Kinyarwanda')}
                  className={`rounded-[8px] px-2 py-1 text-[10px] font-bold tracking-wide transition-colors ${
                    language === option
                      ? 'bg-emerald-solid text-white shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {option === 'en' ? 'EN' : 'RW'}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 hidden justify-end lg:flex">
            <div
              className="flex items-center rounded-[10px] border border-line bg-surface-alt p-0.5"
              role="group"
              aria-label={t('Change language')}
            >
              {(['en', 'rw'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  aria-pressed={language === option}
                  title={t(option === 'en' ? 'English' : 'Kinyarwanda')}
                  className={`rounded-[8px] px-2.5 py-1 text-[10px] font-bold tracking-wide transition-colors ${
                    language === option
                      ? 'bg-emerald-solid text-white shadow-sm'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {option === 'en' ? 'EN' : 'RW'}
                </button>
              ))}
            </div>
          </div>

          <p className="eyebrow text-emerald">{t(mode === 'login' ? 'Welcome back' : 'Join MENYA')}</p>
          <h2 className="mt-2 text-[26px] font-bold tracking-[-0.03em]">
            {t(mode === 'login' ? 'Sign in to continue learning' : 'Create your student account')}
          </h2>
          <p className="mt-2 text-[13px] text-muted">
            {t(mode === 'login'
              ? 'Your progress, recommendations and study plan are waiting.'
              : 'New accounts are created with student access by default.')}
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label" htmlFor="name">{t('Full name')}</label>
                <input
                  id="name"
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Umurungi Aline"
                  required
                  minLength={2}
                />
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">{t('Email address')}</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@school.rw"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">{t('Password')}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-12"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('At least 8 characters')}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink"
                  aria-label={t(showPassword ? 'Hide password' : 'Show password')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-[10px] border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[12px] font-medium text-danger" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={busy} iconRight={ArrowRight}>
              {busy ? t('Please wait…') : t(mode === 'login' ? 'Sign in' : 'Create account')}
            </Button>
          </form>

          <div className="mt-5 text-center text-[12px] text-muted">
            {t(mode === 'login' ? 'New to MENYA? ' : 'Already have an account? ')}
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
              className="font-semibold text-emerald hover:underline"
            >
              {t(mode === 'login' ? 'Create an account' : 'Sign in')}
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-8 border-t border-line pt-6">
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                {t('Explore with a demo account')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => {
                  const Icon = account.icon
                  return (
                    <button
                      key={account.email}
                      onClick={() => signInAsDemo(account.email)}
                      disabled={busy}
                      className="flex items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-left text-[11px] font-semibold transition-colors hover:border-emerald/40 hover:bg-emerald-soft/40 disabled:opacity-50"
                    >
                      <Icon size={14} className="shrink-0 text-emerald" aria-hidden />
                      {t(account.label)}
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-center text-[10px] text-muted">
                {t('Demo password: {password}', { password: 'Demo1234!' })}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
