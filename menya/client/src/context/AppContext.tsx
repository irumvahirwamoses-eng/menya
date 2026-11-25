import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { modules } from '../data/mock'
import type { AILanguage, Role, Theme, Toast } from '../types'

interface AppContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  language: AILanguage
  setLanguage: (language: AILanguage) => void
  role: Role
  setRole: (role: Role) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  aiDrawerOpen: boolean
  aiDrawerPrompt: string | null
  openAIDrawer: (prompt?: string) => void
  closeAIDrawer: () => void
  toggleAIDrawer: () => void
  completedLessons: string[]
  toggleLessonComplete: (id: string) => void
  dismissedRecommendations: string[]
  dismissRecommendation: (id: string) => void
  savedResources: string[]
  toggleSavedResource: (id: string) => void
  toasts: Toast[]
  notify: (title: string, message?: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

const AppContext = createContext<AppContextValue | null>(null)

function stored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`menya:${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(`menya:${key}`, JSON.stringify(value))
  } catch {
    /* storage may be unavailable in private browsing */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() =>
    stored<Theme>('theme', window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  )
  const [language, setLanguageState] = useState<AILanguage>(() => stored<AILanguage>('language', 'en'))
  const [role, setRoleState] = useState<Role>(() => stored<Role>('role', 'student'))
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => stored<boolean>('sidebarCollapsed', false))
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [aiDrawerOpen, setAIDrawerOpen] = useState(false)
  const [aiDrawerPrompt, setAIDrawerPrompt] = useState<string | null>(null)
  const [completedLessons, setCompletedLessons] = useState<string[]>(() =>
    stored<string[]>('completedLessons', modules.flatMap((m) => m.lessons.filter((l) => l.completed).map((l) => l.id))),
  )
  const [dismissedRecommendations, setDismissed] = useState<string[]>(() =>
    stored<string[]>('dismissedRecommendations', []),
  )
  const [savedResources, setSavedResources] = useState<string[]>(() => stored<string[]>('savedResources', ['res1']))
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    persist('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = language
    persist('language', language)
  }, [language])

  useEffect(() => persist('role', role), [role])
  useEffect(() => persist('sidebarCollapsed', sidebarCollapsed), [sidebarCollapsed])
  useEffect(() => persist('completedLessons', completedLessons), [completedLessons])
  useEffect(() => persist('dismissedRecommendations', dismissedRecommendations), [dismissedRecommendations])
  useEffect(() => persist('savedResources', savedResources), [savedResources])

  const setTheme = useCallback((value: Theme) => setThemeState(value), [])
  const toggleTheme = useCallback(
    () => setThemeState((current) => (current === 'light' ? 'dark' : 'light')),
    [],
  )
  const setLanguage = useCallback((value: AILanguage) => setLanguageState(value), [])
  const setRole = useCallback((value: Role) => setRoleState(value), [])
  const toggleSidebar = useCallback(() => setSidebarCollapsed((value) => !value), [])

  const openAIDrawer = useCallback((prompt?: string) => {
    setAIDrawerPrompt(prompt?.trim() ? prompt : null)
    setAIDrawerOpen(true)
  }, [])
  const closeAIDrawer = useCallback(() => setAIDrawerOpen(false), [])
  const toggleAIDrawer = useCallback(() => {
    setAIDrawerPrompt(null)
    setAIDrawerOpen((value) => !value)
  }, [])

  const toggleLessonComplete = useCallback((id: string) => {
    setCompletedLessons((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  const dismissRecommendation = useCallback((id: string) => {
    setDismissed((current) => (current.includes(id) ? current : [...current, id]))
  }, [])

  const toggleSavedResource = useCallback((id: string) => {
    setSavedResources((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (title: string, message?: string, tone: Toast['tone'] = 'success') => {
      const id = ++toastId.current
      setToasts((current) => [...current, { id, title, message, tone }].slice(-3))
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
      }, 4200)
    },
    [],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      language,
      setLanguage,
      role,
      setRole,
      sidebarCollapsed,
      toggleSidebar,
      mobileNavOpen,
      setMobileNavOpen,
      aiDrawerOpen,
      aiDrawerPrompt,
      openAIDrawer,
      closeAIDrawer,
      toggleAIDrawer,
      completedLessons,
      toggleLessonComplete,
      dismissedRecommendations,
      dismissRecommendation,
      savedResources,
      toggleSavedResource,
      toasts,
      notify,
      dismissToast,
    }),
    [
      theme,
      setTheme,
      toggleTheme,
      language,
      setLanguage,
      role,
      setRole,
      sidebarCollapsed,
      toggleSidebar,
      mobileNavOpen,
      aiDrawerOpen,
      aiDrawerPrompt,
      openAIDrawer,
      closeAIDrawer,
      toggleAIDrawer,
      completedLessons,
      toggleLessonComplete,
      dismissedRecommendations,
      dismissRecommendation,
      savedResources,
      toggleSavedResource,
      toasts,
      notify,
      dismissToast,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- co-locating the hook keeps the context private
export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
