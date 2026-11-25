import { useState, type FormEvent } from 'react'
import {
  Accessibility,
  Bell,
  Download,
  Eye,
  Globe,
  GraduationCap,
  Moon,
  Save,
  UserRound,
} from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Badge, Button, Card, CardHeader, Toggle } from '../components/ui/Primitives'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { student } from '../data/mock'
import { useT } from '../i18n'

export default function Settings() {
  const { theme, setTheme, language, setLanguage, notify } = useApp()
  const t = useT()
  const { user } = useAuth()
  const [program, setProgram] = useState(user?.program ?? student.program)
  const [school, setSchool] = useState(user?.school ?? student.school)
  const [goalMinutes, setGoalMinutes] = useState(String(student.weeklyGoal))
  const [studyReminders, setStudyReminders] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [achievementAlerts, setAchievementAlerts] = useState(false)
  const [offlineDownloads, setOfflineDownloads] = useState(true)

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    notify(t('Preferences saved'), t('Your profile and notification settings are up to date.'))
  }

  return (
    <form onSubmit={handleSave} className="stack animate-fade-up">
      <PageHeader
        eyebrow={t('PREFERENCES')}
        title={t('Settings')}
        description={t('Tune MENYA to the way you learn, on the device you use.')}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Globe size={16} className="text-emerald" aria-hidden />
                {t('Language & region')}
              </span>
            }
            subtitle={t('Choose the language used across the whole MENYA system.')}
          />
          <div className="mt-5 rounded-xl border border-line bg-surface-alt/60 p-4">
            <p className="text-[13px] font-semibold">{t('System language')}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
              {t('Switch the entire MENYA interface, including AI answers, between English and Kinyarwanda.')}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={t('System language')}>
              {(['en', 'rw'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  aria-pressed={language === option}
                  className={`rounded-[10px] border px-3 py-2 text-[12px] font-bold transition-colors ${
                    language === option
                      ? 'border-emerald bg-emerald-soft text-emerald-dark dark:text-emerald'
                      : 'border-line text-muted hover:text-ink'
                  }`}
                >
                  {t(option === 'en' ? 'English' : 'Kinyarwanda')}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Moon size={16} className="text-emerald" aria-hidden />
                {t('Appearance')}
              </span>
            }
            subtitle={t('How MENYA looks on this device.')}
          />
          <div className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-line bg-surface-alt/60 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                <Moon size={16} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-semibold">{t('Dark theme')}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                  {t('Easier on the eyes during evening study sessions.')}
                </p>
              </div>
            </div>
            <Toggle
              checked={theme === 'dark'}
              onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              label={t('Dark theme')}
            />
          </div>
          <p className="mt-3 text-[11px] text-muted">
            {t('Current theme: {theme}. Your choice is remembered on this device.', {
              theme: t(theme === 'dark' ? 'Dark' : 'Light'),
            })}
          </p>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <GraduationCap size={16} className="text-emerald" aria-hidden />
                {t('Learning profile')}
              </span>
            }
            subtitle={t('Used to personalise recommendations.')}
          />
          <div className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="settings-program">{t('Program')}</label>
              <div className="relative">
                <input
                  id="settings-program"
                  className="input pl-10"
                  value={program}
                  onChange={(event) => setProgram(event.target.value)}
                  placeholder={t('e.g. Electrical Installation — Level 3')}
                />
                <GraduationCap size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="settings-school">{t('School')}</label>
              <div className="relative">
                <input
                  id="settings-school"
                  className="input pl-10"
                  value={school}
                  onChange={(event) => setSchool(event.target.value)}
                  placeholder={t('Your institution')}
                />
                <UserRound size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="settings-goal">{t('Weekly goal (minutes)')}</label>
              <input
                id="settings-goal"
                type="number"
                min={30}
                max={1200}
                step={10}
                className="input"
                value={goalMinutes}
                onChange={(event) => setGoalMinutes(event.target.value)}
              />
              <p className="mt-1.5 text-[11px] text-muted">{t('300 minutes is about five focused hours a week.')}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Bell size={16} className="text-emerald" aria-hidden />
                {t('Notifications')}
              </span>
            }
            subtitle={t('Choose what MENYA should remind you about.')}
          />
          <div className="mt-5 divide-y divide-line">
            <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
              <div>
                <p className="text-[13px] font-semibold">{t('Study reminders')}</p>
                <p className="mt-0.5 text-[11px] text-muted">{t('A gentle nudge before a planned study block.')}</p>
              </div>
              <Toggle checked={studyReminders} onChange={setStudyReminders} label={t('Study reminders')} />
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5">
              <div>
                <p className="text-[13px] font-semibold">{t('Weekly progress digest')}</p>
                <p className="mt-0.5 text-[11px] text-muted">{t('A summary of mastery, streaks and completions.')}</p>
              </div>
              <Toggle checked={weeklyDigest} onChange={setWeeklyDigest} label={t('Weekly progress digest')} />
            </div>
            <div className="flex items-center justify-between gap-4 py-3.5 last:pb-0">
              <div>
                <p className="text-[13px] font-semibold">{t('Achievement alerts')}</p>
                <p className="mt-0.5 text-[11px] text-muted">{t('Celebrate milestones and newly unlocked skills.')}</p>
              </div>
              <Toggle checked={achievementAlerts} onChange={setAchievementAlerts} label={t('Achievement alerts')} />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Accessibility size={16} className="text-emerald" aria-hidden />
                {t('Accessibility')}
              </span>
            }
            subtitle={t('MENYA adapts to your system settings.')}
          />
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-alt/60 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                <Accessibility size={16} aria-hidden />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold">{t('Reduce motion')}</p>
                  <Badge tone="neutral">{t('Automatic')}</Badge>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {t('Animations and transitions are reduced when your device requests less motion.')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-alt/60 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                <Eye size={16} aria-hidden />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold">{t('High contrast')}</p>
                  <Badge tone="neutral">{t('Theme aware')}</Badge>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  {t('Text, borders and focus rings use contrast-aware tokens in both light and dark themes.')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 lg:col-span-2">
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Download size={16} className="text-emerald" aria-hidden />
                {t('Data & offline')}
              </span>
            }
            subtitle={t('Keep learning available when the connection is not.')}
          />
          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-line bg-surface-alt/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                <Download size={16} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-semibold">{t('Install MENYA as an app')}</p>
                <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-muted">
                  {t("Use your browser's install option to add MENYA to your home screen. Lessons you download stay available offline and sync when you reconnect.")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:shrink-0">
              <Toggle checked={offlineDownloads} onChange={setOfflineDownloads} label={t('Allow offline downloads')} />
              <span className="text-[11px] font-semibold text-muted">{t('Offline downloads')}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted">
          {t('Changes are stored on this device and apply the next time you open MENYA.')}
        </p>
        <Button type="submit" icon={Save}>{t('Save preferences')}</Button>
      </div>
    </form>
  )
}
