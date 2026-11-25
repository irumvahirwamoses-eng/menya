export interface AssessmentQuestion {
  id: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export interface AssessmentDefinition {
  id: string
  title: string
  course: string
  duration: number
  due: string
  status: 'Ready' | 'In progress' | 'Completed' | 'Locked'
  mastery: string
  questions: AssessmentQuestion[]
}

export const assessmentCatalog: AssessmentDefinition[] = [
  {
    id: 'a1',
    title: 'Circuit Fundamentals',
    course: 'Electrical Installation',
    duration: 15,
    due: 'Today, 5:00 PM',
    status: 'Ready',
    mastery: 'Circuits',
    questions: [
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
    ],
  },
  {
    id: 'a2',
    title: 'Workshop Safety Check',
    course: 'Electrical Installation',
    duration: 12,
    due: 'Tomorrow',
    status: 'Completed',
    mastery: 'Safety',
    questions: [
      { id: 's1', prompt: 'Before working on a circuit, the first step is to:', options: ['Remove jewellery', 'Isolate and verify it is dead', 'Put on gloves', 'Tell a colleague'], answer: 1, explanation: 'Isolate the supply and prove the circuit is dead before any work begins.' },
      { id: 's2', prompt: 'Which PPE protects against arc flash to the face?', options: ['Safety glasses', 'Face shield and arc-rated clothing', 'Cotton shirt', 'Rubber boots only'], answer: 1, explanation: 'A face shield with arc-rated clothing gives the required barrier for arc-flash exposure.' },
      { id: 's3', prompt: 'A fire involving live electrical equipment should be extinguished with:', options: ['Water', 'CO₂ or dry powder', 'Foam', 'Wet sand'], answer: 1, explanation: 'CO₂ or dry powder extinguishes electrical fires without conducting electricity.' },
      { id: 's4', prompt: 'The safe way to test a missing voltage is to:', options: ['Assume it is off', 'Use a proven tester on a known live source first', 'Touch the conductor', 'Use a neon screwdriver only'], answer: 1, explanation: 'Prove the tester on a known live source before and after testing to trust the result.' },
      { id: 's5', prompt: 'A damaged extension cable should be:', options: ['Taped and reused', 'Removed from service', 'Used outdoors only', 'Shortened'], answer: 1, explanation: 'Damaged cables are removed from service and replaced, not repaired with tape.' },
      { id: 's6', prompt: 'Which document records the isolation point for a job?', options: ['Delivery note', 'Permit-to-work / isolation record', 'Invoice', 'Timesheet'], answer: 1, explanation: 'The permit or isolation record identifies who isolated what and when.' },
      { id: 's7', prompt: 'When lifting a heavy cable drum, you should:', options: ['Twist your back', 'Use a team or mechanical aid', 'Lift with one hand', 'Run with it'], answer: 1, explanation: 'Use a team or mechanical aid and keep the load close to the body to avoid injury.' },
      { id: 's8', prompt: 'After completing work, you should:', options: ['Leave tools for next time', 'Replace covers and restore protection', 'Remove the earth bond', 'Skip testing'], answer: 1, explanation: 'Restore all covers and protective measures, then test before energising.' },
    ],
  },
  {
    id: 'a3',
    title: 'PV System Sizing',
    course: 'Solar PV Systems',
    duration: 20,
    due: 'Fri, 22 Nov',
    status: 'In progress',
    mastery: 'Solar',
    questions: [
      { id: 'v1', prompt: 'Panel rating is measured under:', options: ['Standard Test Conditions', 'Night conditions', 'Maximum load', 'Average home use'], answer: 1, explanation: 'Nameplate rating is measured at STC: 1000 W/m², 25 °C cell temperature.' },
      { id: 'v2', prompt: 'Inverter size should be based mainly on:', options: ['Roof colour', 'Array DC power and load profile', 'Cable length', 'Panel frame'], answer: 1, explanation: 'The inverter must match the array DC capacity and the AC demand pattern.' },
      { id: 'v3', prompt: 'In Kigali, a fixed array is usually oriented toward:', options: ['East', 'North', 'True south / north as appropriate', 'West'], answer: 2, explanation: 'In the southern hemisphere face north; in Rwanda near the equator, adjust for sun path and shade.' },
      { id: 'v4', prompt: 'A 300 W panel receiving 4.5 peak-sun-hours produces about:', options: ['0.3 kWh', '1.35 kWh', '4.5 kWh', '13.5 kWh'], answer: 1, explanation: '300 W × 4.5 h = 1350 Wh = 1.35 kWh per day before losses.' },
      { id: 'v5', prompt: 'Charge controller rating is selected from:', options: ['Array short-circuit current', 'Battery colour', 'Roof area', 'Inverter brand'], answer: 0, explanation: 'Size the controller for array current with the required safety margin.' },
      { id: 'v6', prompt: 'Deep-cycle batteries are preferred because they:', options: ['Cost less always', 'Tolerate repeated discharge cycles', 'Need no maintenance ever', 'Work only in cold weather'], answer: 1, explanation: 'Deep-cycle batteries are designed for regular charge/discharge cycling.' },
    ],
  },
  {
    id: 'a4',
    title: 'Spreadsheet Essentials',
    course: 'Digital Literacy',
    duration: 18,
    due: 'Next week',
    status: 'Ready',
    mastery: 'Digital',
    questions: [
      { id: 'd1', prompt: 'A formula in a spreadsheet always begins with:', options: ['=', '+', '#', '/'], answer: 0, explanation: 'Spreadsheet formulas begin with an equals sign.' },
      { id: 'd2', prompt: 'To add a range from A1 to A10, use:', options: ['=ADD(A1:A10)', '=SUM(A1:A10)', '=TOTAL(A1,A10)', '=A1+A10'], answer: 1, explanation: 'SUM adds every value in the range A1:A10.' },
      { id: 'd3', prompt: 'A dollar sign in a cell reference (e.g. $A$1) makes it:', options: ['Hidden', 'Absolute', 'Negative', 'A comment'], answer: 1, explanation: 'Absolute references do not change when a formula is copied.' },
      { id: 'd4', prompt: 'Which function counts only numeric cells in a range?', options: ['COUNTA', 'COUNT', 'LEN', 'ROW'], answer: 1, explanation: 'COUNT counts numeric entries; COUNTA counts all non-empty entries.' },
      { id: 'd5', prompt: 'Sorting data by "Total" descending means:', options: ['Smallest first', 'Largest first', 'Alphabetical', 'By date only'], answer: 1, explanation: 'Descending sort places the largest value at the top.' },
      { id: 'd6', prompt: 'A filter lets you:', options: ['Delete rows', 'Show only matching rows', 'Merge cells', 'Lock a sheet'], answer: 1, explanation: 'Filtering temporarily hides rows that do not match your criteria.' },
      { id: 'd7', prompt: 'The cell reference at column B, row 7 is:', options: ['7B', 'B7', 'B-7', 'R7C2'], answer: 1, explanation: 'Columns are letters and rows are numbers, so B7 is correct.' },
      { id: 'd8', prompt: 'Which chart is best for comparing categories?', options: ['Pie', 'Bar', 'Line', 'Scatter'], answer: 1, explanation: 'Bar charts make category-to-category comparison clear.' },
      { id: 'd9', prompt: 'To protect a sheet from accidental edits, use:', options: ['Hide gridlines', 'Sheet protection', 'Freeze panes', 'Merge cells'], answer: 1, explanation: 'Sheet protection restricts editing while allowing viewing.' },
      { id: 'd10', prompt: 'If B2 is 120 and the formula is =B2*0.15, the result is:', options: ['12', '18', '120.15', '8'], answer: 1, explanation: '120 × 0.15 = 18, which is 15% of 120.' },
    ],
  },
  {
    id: 'a5',
    title: 'Costing a Service Job',
    course: 'Business & Entrepreneurship',
    duration: 14,
    due: 'Next week',
    status: 'Locked',
    mastery: 'Business',
    questions: [],
  },
  {
    id: 'a6',
    title: 'Final Competency Check',
    course: 'Electrical Installation',
    duration: 45,
    due: 'After module 4',
    status: 'Locked',
    mastery: 'Installation',
    questions: [],
  },
]
