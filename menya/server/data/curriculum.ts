/**
 * Approved teaching material used for retrieval-augmented generation.
 *
 * These chunks are the only curriculum facts MENYA AI may cite. They are a
 * MENYA demo curriculum guide derived from the platform's own lesson and
 * assessment catalogue — not an external or official NCC document. If a
 * question is not covered here, the assistant must say approved material is
 * unavailable rather than invent an answer.
 */
export interface CurriculumSource {
  id: string
  title: string
  courseCode: string
  module: string
  outcomes: string[]
  text: string
  keywords: string[]
}

export const curriculumSources: CurriculumSource[] = [
  {
    id: 'S1',
    title: 'Electrical safety principles — MENYA Level 3 guide',
    courseCode: 'EIL-301',
    module: 'Foundations & Safety',
    outcomes: ['Identify hazards', 'Apply safe isolation', 'Select PPE'],
    text: 'Before working on a circuit, isolate the supply and prove the circuit is dead. Prove the tester on a known live source before and after testing. Remove jewellery, use the correct PPE, and record the isolation point on the permit-to-work or isolation record. A damaged cable is removed from service, not taped and reused. Electrical fires are extinguished with CO2 or dry powder, never water.',
    keywords: ['safety', 'umutekano', 'isolate', 'prove dead', 'ppe', 'permit', 'rcd', 'fire', 'cable', 'tester', 'voltage', 'electrical', 'amashanyarazi'],
  },
  {
    id: 'S2',
    title: 'Ohm’s law and resistance — worked examples',
    courseCode: 'EIL-301',
    module: 'Circuit Theory in Practice',
    outcomes: ['Apply Ohm’s law', 'Calculate current and resistance'],
    text: 'Ohm’s law is I = V ÷ R, where I is current in amperes, V is voltage in volts and R is resistance in ohms. Example: a 12 V supply across a 3 Ω resistor draws 4 A. A voltmeter is connected in parallel across a component; an ammeter is connected in series with the circuit. In series, resistances add: two 6 Ω resistors give 12 Ω.',
    keywords: ['ohm', 'voltage', 'current', 'resistance', 'circuit', 'series', 'parallel', 'voltmeter', 'ammeter', 'calculate', 'ibyuma', 'umuriro', 'circuit'],
  },
  {
    id: 'S3',
    title: 'Cable selection and circuit protection',
    courseCode: 'EIL-301',
    module: 'Installation & Protection',
    outcomes: ['Size a cable', 'Choose protection', 'Explain earthing'],
    text: 'A cable rating must be above the expected load current. If a circuit draws 8 A but the cable is rated for 6 A, select a cable with a suitable higher rating. A residual current device (RCD) disconnects the supply when it detects current leaking to earth. Protective earth and bonding provide a safe path for fault current; never remove the earth bond. Restore covers and protection before testing and energising.',
    keywords: ['cable', 'rating', 'load', 'rcd', 'earthing', 'bonding', 'breaker', 'protection', 'fault', 'insulation', 'amashanyarazi', 'umutekano'],
  },
  {
    id: 'S4',
    title: 'Site simulation and final competency check',
    courseCode: 'EIL-301',
    module: 'Assessment & Certification',
    outcomes: ['Plan a lighting circuit', 'Test before energising', 'Document work'],
    text: 'A lighting circuit simulation requires a plan, correct cable selection, safe installation, continuity and insulation testing, and restoration of all covers before energising. The final competency check mixes questions from all four modules. Objective marking and official grades are recorded only by the MENYA backend and the institution, never by the AI assistant.',
    keywords: ['assessment', 'competency', 'lighting', 'simulation', 'test', 'grade', 'certification', 'practical', 'ibizamini'],
  },
  {
    id: 'S5',
    title: 'Solar PV sizing and safety',
    courseCode: 'SPV-204',
    module: 'PV System Sizing',
    outcomes: ['Estimate daily energy', 'Size a controller', 'Select an inverter'],
    text: 'Panel nameplate rating is measured under Standard Test Conditions: 1000 W/m² and 25 °C cell temperature. Daily energy is panel watts multiplied by peak-sun-hours before losses; a 300 W panel with 4.5 peak-sun-hours produces about 1.35 kWh per day. Size a charge controller from array short-circuit current with the required safety margin. Match the inverter to array DC capacity and the AC load profile. Deep-cycle batteries tolerate repeated discharge cycles.',
    keywords: ['solar', 'pv', 'panel', 'inverter', 'controller', 'battery', 'stc', 'peak sun', 'energy', 'array', 'kigali', 'izuba', 'amashanyarazi'],
  },
  {
    id: 'S6',
    title: 'PV orientation and field checks',
    courseCode: 'SPV-204',
    module: 'PV System Sizing',
    outcomes: ['Orient an array', 'Inspect a site'],
    text: 'Array orientation depends on sun path and shade. In the southern hemisphere a fixed array faces north; in Rwanda, near the equator, adjust orientation to the local sun path and avoid shading. Field inspection checks mounting, cable condition, earthing, correct ratings and a clean record of measurements before commissioning.',
    keywords: ['orientation', 'shade', 'rwanda', 'field', 'mounting', 'earthing', 'commissioning', 'inspection', 'izuba'],
  },
  {
    id: 'S7',
    title: 'Spreadsheet formulas for technicians',
    courseCode: 'DLT-101',
    module: 'Digital Documentation',
    outcomes: ['Write formulas', 'Use absolute references', 'Organise data'],
    text: 'A spreadsheet formula begins with =. Use =SUM(A1:A10) to add a range, COUNT for numeric cells and COUNTA for non-empty cells. A dollar sign, as in $A$1, makes a reference absolute so it does not move when copied. Sorting descending puts the largest value first; filtering temporarily shows only matching rows. Bar charts compare categories clearly.',
    keywords: ['excel', 'spreadsheet', 'formula', 'sum', 'absolute', 'filter', 'sort', 'chart', 'digital', 'count'],
  },
  {
    id: 'S8',
    title: 'Business costing for a service job',
    courseCode: 'BEN-202',
    module: 'Enterprise Basics',
    outcomes: ['Cost materials', 'Set a price', 'Document a quote'],
    text: 'A job quote separates materials, labour, transport and overhead before adding a margin. Record the assumption behind each line so a client can see why the price is fair. Costing practice in MENYA is formative; official business assessment rubrics are provided by the institution.',
    keywords: ['business', 'costing', 'quote', 'price', 'margin', 'labour', 'materials', 'enterprise', 'ubucuruzi'],
  },
  {
    id: 'S9',
    title: 'Assessment rubric guidance for reviewers',
    courseCode: 'QA-GUIDE',
    module: 'Quality Assurance',
    outcomes: ['Apply criteria consistently', 'Write useful feedback'],
    text: 'Apply the four MENYA checks in the same order: explicit safety steps, correct ratings, legible evidence and a clear reflection. When requesting changes, name the exact unmet criterion and one concrete correction. Reviewers and administrators make formal pass or change decisions; AI may suggest consistency checks but never assigns an official grade.',
    keywords: ['rubric', 'review', 'criterion', 'feedback', 'safety', 'evidence', 'decision', 'quality', 'ibizamini'],
  },
  {
    id: 'S10',
    title: 'Cohort teaching and intervention patterns',
    courseCode: 'TRAINER-GUIDE',
    module: 'Trainer Workspace',
    outcomes: ['Identify a mastery gap', 'Plan a check-in'],
    text: 'Use mastery by skill rather than one course percentage. When a course average is low and recent attempts confirm the same gap, schedule a worked example and a short competency check before the next assessment. A two-minute check-in with quiet learners is more useful than a broad announcement.',
    keywords: ['trainer', 'cohort', 'mastery', 'gap', 'check-in', 'practice', 'learner', 'mwalimu'],
  },
  {
    id: 'S11',
    title: 'Study planning and spaced revision',
    courseCode: 'STUDY-GUIDE',
    module: 'Learning Support',
    outcomes: ['Plan short blocks', 'Space revision'],
    text: 'Short focused blocks protect a study streak. Place the hardest task on a high-energy day, keep another day lighter, and revisit a corrected error within a day. The MENYA planner computes block times deterministically from the learner’s own progress and availability; AI may explain the plan but does not replace the scheduler.',
    keywords: ['planner', 'study', 'revision', 'schedule', 'streak', 'spaced', 'time', 'gahunda'],
  },
  {
    id: 'S12',
    title: 'Resource use and offline study',
    courseCode: 'RESOURCE-GUIDE',
    module: 'Resource Library',
    outcomes: ['Choose a resource', 'Study offline'],
    text: 'Prioritise resources that match the weakest skill and the next assessment. Worked examples, safety checklists and simulations are useful before practical tasks. Saved resources remain available for offline revision through the MENYA app shell. If approved material for a topic is not in the library, say so instead of inventing a reference.',
    keywords: ['resource', 'offline', 'library', 'worked example', 'safety', 'simulation', 'revision', 'ibikoresho'],
  },
]

const stopWords = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'is', 'are', 'for', 'on', 'with', 'me',
  'my', 'how', 'what', 'why', 'can', 'you', 'do', 'does', 'it', 'this', 'that', 'please',
  'about', 'from', 'be', 'as', 'at', 'by', 'if', 'when', 'should', 'would', 'have',
])

function terms(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1 && !stopWords.has(term))
}

export function retrieveCurriculum(query: string, limit = 3): CurriculumSource[] {
  const queryTerms = terms(query)
  if (!queryTerms.length) return []

  return curriculumSources
    .map((source) => {
      const haystack = `${source.title} ${source.courseCode} ${source.module} ${source.outcomes.join(' ')} ${source.text} ${source.keywords.join(' ')}`.toLowerCase()
      const score = queryTerms.reduce((total, term) => {
        if (!haystack.includes(term)) return total
        return total + (source.keywords.some((keyword) => keyword.includes(term)) ? 3 : 1)
      }, 0)
      return { source, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.source)
}
