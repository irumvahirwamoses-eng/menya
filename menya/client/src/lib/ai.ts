import type { NavigateFunction } from 'react-router-dom'
import type { AIAction, AILanguage, Role, Theme, Toast } from '../types'

export const starterPrompts = [
  'Explain this in simpler terms',
  'Give me a hint for the activity',
  'Why did I miss that quiz question?',
  'Suggest practice exercises',
]

const starterPromptsRW: Record<Role, string[]> = {
  student: [
    'Sobera mu buryo bworoshye',
    'Mpa ikimenyetso',
    'Kuki nabuze kuri quiz?',
    'Tanga imyitozo',
  ],
  trainer: [
    'Ni mwene ubuhe abanyeshuri bakeneye kuvugwa?',
    'Ni iyihe nzira ikeneye imyitozo?',
    'Sobanura ibibazo byo gusuzuma',
  ],
  reviewer: [
    'Nshyira mu bikorwa rite rubriki?',
    'Ni ibiki nakwita cyane muri iki gisuzuma?',
    'Reba niba imyanzuro ijyanye na rubriki',
  ],
  admin: [
    'Sobanura ubuzima bwa MENYA',
    'Aho ubumenyi buke bukeneye kongerwa?',
    'Ndeba iki mbere y’ukwakira abashya?',
  ],
}

export function starterPromptsForRole(role: Role, language: AILanguage = 'en'): string[] {
  if (language === 'rw') return starterPromptsRW[role]
  if (role === 'trainer') {
    return ['Who needs a check-in?', 'Which course needs practice?', 'Summarise the review queue']
  }
  if (role === 'reviewer') {
    return ['How do I apply the rubric?', 'What should I prioritise?', 'Check consistency of decisions']
  }
  if (role === 'admin') {
    return ['Summarise platform health', 'Where is coverage thin?', 'What should I check before intake?']
  }
  return starterPrompts
}

export const exercisesByRole: Record<Role, string[]> = {
  student: [
    'A 24 V circuit has 6 Ω resistance — find the current',
    'Explain series vs parallel with an example',
    'Quiz me on cable sizing',
  ],
  trainer: [
    'Which learners need a check-in this week?',
    'Draft a practice block for our weakest course',
    'What feedback pattern should I use for repeat errors?',
  ],
  reviewer: [
    'Walk me through the safety criterion',
    'How should I word a change request?',
    'Check my decision against the rubric',
  ],
  admin: [
    'Summarise platform health for this week',
    'Where should we add trainer coverage?',
    'What should I verify before a new intake?',
  ],
}

const exercisesByRoleRW: Record<Role, string[]> = {
  student: [
    'Umuriro wa 24 V ufite 6 Ω — shakisha umuyaga',
    'Sobanura itandukaniro rya seri na paraleli n’urugero',
    'Mpa ibibazo ku gupima insinga',
  ],
  trainer: [
    'Ni abanyeshuri ba bandi bakeneye kuvugwa muri iki cyumweru?',
    'Tegura igice cy’imyitozo cy’amasomo adafite ubumenyi buhagije',
    'Ni ubuhe buryo bwo gutanga ibitekerezo nakoresha ku makosa asubirwamo?',
  ],
  reviewer: [
    'Nsobanurire ibipimo by’umutekano intambwe ku yindi',
    'Nandika nte icyifuzo cy’impinduka?',
    'Genzura icyemezo cyanjye ukurikije rubriki',
  ],
  admin: [
    'Sobanura ubuzima bwa sisitemu muri iki cyumweru',
    'Aho twongera abarimu?',
    'Ni ibiki tugomba kugenzura mbere y’ukwakira abashya?',
  ],
}

/** Exercise prompts follow the same global language as the rest of the AI UI. */
export function exercisesForRole(role: Role, language: AILanguage = 'en'): string[] {
  return language === 'rw' ? exercisesByRoleRW[role] : exercisesByRole[role]
}

export type QuickHelpId = 'explain' | 'quiz' | 'plan' | 'check' | 'resources'

export interface QuickHelpDefinition {
  id: QuickHelpId
  label: string
  prompt: string
  /** When present, the action opens the matching tab in the AI workspace. */
  tab?: 'practice' | 'plan' | 'evaluate' | 'sources'
}

export const quickHelpActions: QuickHelpDefinition[] = [
  { id: 'explain', label: 'Explain', prompt: starterPrompts[0] },
  { id: 'quiz', label: 'Quiz me', prompt: 'Quiz me on this topic', tab: 'practice' },
  { id: 'plan', label: 'Plan', prompt: 'Build a study plan for this week', tab: 'plan' },
  { id: 'check', label: 'Check answer', prompt: 'Check my answer against the rubric' },
  {
    id: 'resources',
    label: 'Resources',
    prompt: 'List the approved curriculum sources you can cite',
    tab: 'sources',
  },
]

export interface AIActionContext {
  navigate: NavigateFunction
  setTheme: (theme: Theme) => void
  notify: (title: string, message?: string, tone?: Toast['tone']) => void
}

/**
 * Executes only the three server-validated AI action shapes. Unknown actions,
 * external URLs and malformed navigation targets are ignored.
 */
export function runAIAction(action: AIAction, context: AIActionContext): void {
  switch (action.type) {
    case 'navigate': {
      const to = action.to
      if (!to.startsWith('/') || to.startsWith('//') || to.includes('\\')) return
      context.navigate(to)
      return
    }
    case 'setTheme':
      context.setTheme(action.theme)
      return
    case 'notify':
      context.notify(action.title, action.message, action.tone ?? 'info')
      return
    default:
      return
  }
}
