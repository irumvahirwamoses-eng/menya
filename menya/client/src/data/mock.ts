import type {
  Assessment,
  Course,
  Module,
  PlannerTask,
  Question,
  Recommendation,
  Resource,
} from '../types'

export const student = {
  name: 'Umurungi Aline',
  program: 'Electrical Installation — Level 3',
  school: 'Rwanda TVET College, Kigali',
  initials: 'AU',
  streak: 12,
  weeklyMinutes: 245,
  weeklyGoal: 300,
  mastery: 74,
}

export const courses: Course[] = [
  {
    id: 'electrical-3',
    title: 'Electrical Installation',
    code: 'EIL-301',
    category: 'Electrical',
    level: 'Intermediate',
    progress: 68,
    lessonCount: 24,
    duration: '12h 40m',
    trainer: 'Eng. Rusanganwa Eric',
    description: 'Wiring systems, circuit protection and safe installation practice to Rwandan TVET standards.',
    tags: ['Core', 'Practical', 'NCC'],
    accent: 'emerald',
  },
  {
    id: 'solar-pv',
    title: 'Solar PV Systems',
    code: 'SPV-204',
    category: 'Energy',
    level: 'Intermediate',
    progress: 42,
    lessonCount: 18,
    duration: '9h 10m',
    trainer: 'Eng. Mukamana Clare',
    description: 'Design, install and maintain small-scale photovoltaic systems for real sites.',
    tags: ['Emerging', 'Field work'],
    accent: 'amber',
  },
  {
    id: 'business',
    title: 'Business & Entrepreneurship',
    code: 'BEN-202',
    category: 'Business',
    level: 'Foundation',
    progress: 31,
    lessonCount: 16,
    duration: '7h 25m',
    trainer: 'Mr. Niyonsaba Jean',
    description: 'Turn a technical skill into a viable enterprise: costing, pricing and customer care.',
    tags: ['Employability'],
    accent: 'info',
  },
  {
    id: 'digital',
    title: 'Digital Literacy for TVET',
    code: 'DLT-101',
    category: 'Digital',
    level: 'Foundation',
    progress: 86,
    lessonCount: 14,
    duration: '5h 05m',
    trainer: 'Ms. Uwase Divine',
    description: 'Essential digital tools, documentation and online safety for modern trades.',
    tags: ['Completed soon'],
    accent: 'navy',
  },
  {
    id: 'plumbing',
    title: 'Plumbing & Water Systems',
    code: 'PLB-201',
    category: 'Construction',
    level: 'Intermediate',
    progress: 12,
    lessonCount: 20,
    duration: '10h 30m',
    trainer: 'Eng. Habimana Sam',
    description: 'Water supply, drainage and sanitary installation for residential buildings.',
    tags: ['Core'],
    accent: 'emerald',
  },
  {
    id: 'welding',
    title: 'Welding & Fabrication',
    code: 'WLD-205',
    category: 'Metalwork',
    level: 'Advanced',
    progress: 57,
    lessonCount: 22,
    duration: '14h 15m',
    trainer: 'Eng. Ntihinyurwa Paul',
    description: 'Arc welding, joint preparation and workshop safety for fabrication tasks.',
    tags: ['Workshop'],
    accent: 'amber',
  },
]

export const modules: Module[] = [
  {
    id: 'm1',
    title: 'Foundations & Safety',
    lessons: [
      { id: 'l1', title: 'Electrical safety principles', type: 'reading', duration: 12, completed: true, description: 'Hazard identification, PPE and safe isolation procedures.' },
      { id: 'l2', title: 'Tools and test equipment', type: 'video', duration: 18, completed: true, description: 'Using a multimeter correctly on live and dead circuits.' },
      { id: 'l3', title: 'Workshop safety check', type: 'practice', duration: 10, completed: true, description: 'Apply the pre-work checklist to a simulated site.' },
    ],
  },
  {
    id: 'm2',
    title: 'Circuit Theory in Practice',
    lessons: [
      { id: 'l4', title: 'Ohm’s law and resistance', type: 'video', duration: 16, completed: true, description: 'Relate voltage, current and resistance in a working circuit.' },
      { id: 'l5', title: 'Series and parallel circuits', type: 'reading', duration: 14, completed: true, description: 'Calculate total resistance and current flow.' },
      { id: 'l6', title: 'Applied calculations', type: 'practice', duration: 20, completed: false, description: 'Solve three site-based circuit problems.' },
      { id: 'l7', title: 'Knowledge check: circuits', type: 'quiz', duration: 12, completed: false, description: 'Five adaptive questions on circuit calculations.' },
    ],
  },
  {
    id: 'm3',
    title: 'Installation & Protection',
    lessons: [
      { id: 'l8', title: 'Cable selection and sizing', type: 'reading', duration: 15, completed: false, description: 'Match cable rating to load and installation method.' },
      { id: 'l9', title: 'Earthing and bonding', type: 'video', duration: 22, completed: false, description: 'Why protective earth saves lives.' },
      { id: 'l10', title: 'Circuit protection devices', type: 'practice', duration: 18, completed: false, description: 'Choose the correct breaker and RCD rating.' },
    ],
  },
  {
    id: 'm4',
    title: 'Assessment & Certification',
    lessons: [
      { id: 'l11', title: 'Site simulation: lighting circuit', type: 'practice', duration: 30, completed: false, description: 'Plan, wire and test a simple lighting circuit.' },
      { id: 'l12', title: 'Final competency check', type: 'quiz', duration: 25, completed: false, description: 'Mixed questions across all modules.' },
    ],
  },
]

export const recommendations: Recommendation[] = [
  {
    id: 'r1',
    kind: 'practice',
    title: 'Close the gap in Applied Calculations',
    reason: 'You missed 2 of 3 questions using Ohm’s law in a new context.',
    impact: 'Projected mastery +12%',
    actionLabel: 'Start 8-min practice',
    target: '/workspace',
    minutes: 8,
  },
  {
    id: 'r2',
    kind: 'course',
    title: 'Continue Solar PV Systems',
    reason: 'Your electrical foundation is strong enough for the next PV wiring module.',
    impact: 'Unlocks 4 new lessons',
    actionLabel: 'Open course',
    target: '/curriculum',
    minutes: 15,
  },
  {
    id: 'r3',
    kind: 'resource',
    title: 'Watch: Solar site safety walkthrough',
    reason: 'Recommended before your field placement next week.',
    impact: 'Better field readiness',
    actionLabel: 'View resource',
    target: '/resources',
    minutes: 11,
  },
  {
    id: 'r4',
    kind: 'assessment',
    title: 'Retry Circuit Fundamentals quiz',
    reason: 'Your last score was 72%. A retry can lift it above the 80% benchmark.',
    impact: 'Certification readiness',
    actionLabel: 'Review quiz',
    target: '/assessments',
    minutes: 12,
  },
]

export const resources: Resource[] = [
  {
    id: 'res1', title: 'Ohm’s Law — Worked Site Examples', type: 'Video', category: 'Electrical', level: 'Beginner', duration: '11 min', source: 'MENYA Learning Studio', description: 'Three real installation problems solved step by step, with a downloadable formula sheet.', tags: ['Circuits', 'Calculations'], rating: 4.9,
  },
  {
    id: 'res2', title: 'Solar PV Safety Field Guide', type: 'Workbook', category: 'Energy', level: 'Intermediate', duration: '18 pages', source: 'Rwanda Energy Academy', description: 'A pocket checklist for safe inspection and maintenance of small PV systems.', tags: ['Safety', 'Solar'], rating: 4.8,
  },
  {
    id: 'res3', title: 'Multimeter Basics Simulator', type: 'Simulation', category: 'Electrical', level: 'Beginner', duration: '8 min', source: 'MENYA Labs', description: 'Practise measuring voltage, current and resistance without risking equipment.', tags: ['Tools', 'Practice'], rating: 4.7,
  },
  {
    id: 'res4', title: 'Pricing a Small Electrical Business', type: 'Article', category: 'Business', level: 'Intermediate', duration: '7 min read', source: 'TVET Enterprise Hub', description: 'A simple costing model for quoting jobs accurately in the Rwandan market.', tags: ['Entrepreneurship'], rating: 4.6,
  },
  {
    id: 'res5', title: 'Wiring a Two-Way Lighting Circuit', type: 'Video', category: 'Electrical', level: 'Intermediate', duration: '16 min', source: 'MENYA Learning Studio', description: 'Follow the complete process from diagram to continuity test.', tags: ['Wiring', 'Practical'], rating: 4.9,
  },
  {
    id: 'res6', title: 'Digital Documentation for Technicians', type: 'Article', category: 'Digital', level: 'Beginner', duration: '6 min read', source: 'MENYA Skills Lab', description: 'Keep clean job records, photos and reports using only a phone.', tags: ['Documentation'], rating: 4.5,
  },
  {
    id: 'res7', title: 'Electrical Safety Audio Refresher', type: 'Audio', category: 'Electrical', level: 'Beginner', duration: '9 min', source: 'MENYA Learning Studio', description: 'Listen through the key safety rules while commuting or between classes.', tags: ['Safety', 'Audio'], rating: 4.7,
  },
  {
    id: 'res8', title: 'Plumbing Pipe Sizing Calculator', type: 'Simulation', category: 'Construction', level: 'Intermediate', duration: '10 min', source: 'MENYA Labs', description: 'Explore how diameter, flow and pressure interact in a real water system.', tags: ['Water', 'Practice'], rating: 4.4,
  },
  {
    id: 'res9', title: 'Preparing for Your TVET Assessment', type: 'Workbook', category: 'General', level: 'Beginner', duration: '12 pages', source: 'Rwanda TVET College', description: 'A structured revision plan and self-check template for competency assessments.', tags: ['Assessment'], rating: 4.8,
  },
  {
    id: 'res10', title: 'Introduction to Inverters', type: 'Video', category: 'Energy', level: 'Advanced', duration: '14 min', source: 'Rwanda Energy Academy', description: 'How inverters convert DC to AC and what to check before commissioning.', tags: ['Solar', 'Equipment'], rating: 4.6,
  },
]

export const assessments: Assessment[] = [
  { id: 'a1', title: 'Circuit Fundamentals', course: 'Electrical Installation', questionCount: 5, duration: 15, due: 'Today, 5:00 PM', status: 'Ready', mastery: 'Circuits' },
  { id: 'a2', title: 'Workshop Safety Check', course: 'Electrical Installation', questionCount: 8, duration: 12, due: 'Tomorrow', status: 'Completed', score: 92, mastery: 'Safety' },
  { id: 'a3', title: 'PV System Sizing', course: 'Solar PV Systems', questionCount: 6, duration: 20, due: 'Fri, 22 Nov', status: 'In progress', mastery: 'Solar' },
  { id: 'a4', title: 'Spreadsheet Essentials', course: 'Digital Literacy', questionCount: 10, duration: 18, due: 'Next week', status: 'Ready', mastery: 'Digital' },
  { id: 'a5', title: 'Costing a Service Job', course: 'Business & Entrepreneurship', questionCount: 5, duration: 14, due: 'Next week', status: 'Locked', mastery: 'Business' },
  { id: 'a6', title: 'Final Competency Check', course: 'Electrical Installation', questionCount: 20, duration: 45, due: 'After module 4', status: 'Locked', mastery: 'Installation' },
]

export const questions: Question[] = [
  {
    id: 'q1',
    prompt: 'A 12 V supply is connected to a 3 Ω resistor. What is the current?',
    options: ['0.25 A', '4 A', '36 A', '9 A'],
    answer: 1,
    explanation: 'I = V ÷ R = 12 ÷ 3 = 4 A. Current depends on both voltage and resistance.',
  },
  {
    id: 'q2',
    prompt: 'Which instrument is connected in parallel to measure a voltage?',
    options: ['Ammeter', 'Voltmeter', 'Ohmmeter', 'Clamp meter'],
    answer: 1,
    explanation: 'A voltmeter is connected across (in parallel with) the component being measured.',
  },
  {
    id: 'q3',
    prompt: 'Two 6 Ω resistors in series give a total resistance of:',
    options: ['3 Ω', '6 Ω', '12 Ω', '36 Ω'],
    answer: 2,
    explanation: 'In series, resistances add: 6 + 6 = 12 Ω.',
  },
  {
    id: 'q4',
    prompt: 'What is the main purpose of a residual current device (RCD)?',
    options: ['Increase voltage', 'Disconnect on earth leakage', 'Store energy', 'Measure power'],
    answer: 1,
    explanation: 'An RCD cuts the supply when it detects current leaking to earth, protecting people.',
  },
  {
    id: 'q5',
    prompt: 'A circuit draws 8 A but the cable is rated for 6 A. What should you do?',
    options: ['Use a larger cable', 'Ignore it', 'Add another switch', 'Reduce the voltage only'],
    answer: 0,
    explanation: 'The cable must be rated above the load current. Choose a cable with a suitable higher rating.',
  },
]

export const plannerTasks: PlannerTask[] = [
  { id: 'p1', title: 'Applied calculations practice', course: 'Electrical Installation', day: 0, start: '08:00', duration: 20, type: 'Practice', done: true },
  { id: 'p2', title: 'Solar safety walkthrough', course: 'Solar PV Systems', day: 0, start: '16:30', duration: 15, type: 'Learn', done: false },
  { id: 'p3', title: 'Circuit Fundamentals quiz', course: 'Electrical Installation', day: 1, start: '10:00', duration: 15, type: 'Assessment', done: false },
  { id: 'p4', title: 'Review earthing notes', course: 'Electrical Installation', day: 1, start: '17:00', duration: 20, type: 'Review', done: false },
  { id: 'p5', title: 'PV sizing simulation', course: 'Solar PV Systems', day: 2, start: '09:30', duration: 25, type: 'Practice', done: false },
  { id: 'p6', title: 'Business costing article', course: 'Business & Entrepreneurship', day: 2, start: '18:00', duration: 10, type: 'Learn', done: false },
  { id: 'p7', title: 'Workshop placement prep', course: 'Electrical Installation', day: 3, start: '11:00', duration: 30, type: 'Review', done: false },
  { id: 'p8', title: 'Digital skills check', course: 'Digital Literacy', day: 4, start: '14:00', duration: 15, type: 'Assessment', done: false },
]

export const weeklyActivity = [
  { day: 'Mon', minutes: 42, goal: 45 },
  { day: 'Tue', minutes: 55, goal: 45 },
  { day: 'Wed', minutes: 31, goal: 45 },
  { day: 'Thu', minutes: 68, goal: 45 },
  { day: 'Fri', minutes: 49, goal: 45 },
  { day: 'Sat', minutes: 24, goal: 45 },
  { day: 'Sun', minutes: 0, goal: 45 },
]

export const masteryData = [
  { skill: 'Safety', value: 84 },
  { skill: 'Circuits', value: 61 },
  { skill: 'Wiring', value: 73 },
  { skill: 'Tools', value: 79 },
  { skill: 'Solar', value: 48 },
]

export const completionTrend = [
  { week: 'W1', value: 22 },
  { week: 'W2', value: 34 },
  { week: 'W3', value: 46 },
  { week: 'W4', value: 55 },
  { week: 'W5', value: 64 },
  { week: 'W6', value: 68 },
]

export const trainerData = {
  cohort: 'Electrical Installation L3 — Cohort B',
  learners: 34,
  active: 29,
  avgMastery: 71,
  submissions: [
    { id: 's1', learner: 'Umurungi Aline', task: 'Lighting circuit plan', course: 'EIL-301', submitted: '12 min ago', status: 'Needs review', score: '—' },
    { id: 's2', learner: 'Mugisha Samuel', task: 'Safety checklist', course: 'EIL-301', submitted: '48 min ago', status: 'Reviewed', score: '88%' },
    { id: 's3', learner: 'Nyirahabimana Joy', task: 'Cable sizing worksheet', course: 'EIL-301', submitted: '1 h ago', status: 'Needs review', score: '—' },
    { id: 's4', learner: 'Ntwari Emery', task: 'Circuit calculations', course: 'EIL-301', submitted: '2 h ago', status: 'Reviewed', score: '94%' },
    { id: 's5', learner: 'Ishimwe Grace', task: 'PV array layout', course: 'SPV-204', submitted: '3 h ago', status: 'Needs review', score: '—' },
  ],
  alerts: [
    { title: '3 learners inactive for 5+ days', detail: 'Consider a check-in message or a revised study plan.' },
    { title: 'Circuit calculations mastery is low', detail: 'Class average 61%. A targeted practice set is recommended.' },
  ],
}

export const reviewerQueue = [
  { id: 'rv1', learner: 'Umurungi Aline', artifact: 'Lighting circuit plan', course: 'EIL-301', submitted: '12 min ago', criterion: 'Correct cable sizing', status: 'Pending' },
  { id: 'rv2', learner: 'Nyirahabimana Joy', artifact: 'Cable sizing worksheet', course: 'EIL-301', submitted: '1 h ago', criterion: 'Safety factor applied', status: 'Pending' },
  { id: 'rv3', learner: 'Ishimwe Grace', artifact: 'PV array layout', course: 'SPV-204', submitted: '3 h ago', criterion: 'Array orientation', status: 'Pending' },
  { id: 'rv4', learner: 'Hakizimana Eric', artifact: 'Welding joint sample', course: 'WLD-205', submitted: 'Yesterday', criterion: 'Joint penetration', status: 'In review' },
]

export const adminMetrics = [
  { label: 'Active learners', value: '2,418', change: '+8.2%', tone: 'emerald' as const },
  { label: 'Active trainers', value: '86', change: '+4', tone: 'info' as const },
  { label: 'Course completions', value: '1,094', change: '+12.5%', tone: 'emerald' as const },
  { label: 'Avg. session time', value: '24 min', change: '−1.3%', tone: 'amber' as const },
]
