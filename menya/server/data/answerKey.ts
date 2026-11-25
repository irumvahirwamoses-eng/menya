import { assessmentCatalog } from './assessments'

export interface AssessmentKey {
  id: string
  title: string
  course: string
  duration: number
  answers: number[]
}

export const assessmentKeys: AssessmentKey[] = assessmentCatalog
  .filter((assessment) => assessment.questions.length > 0)
  .map((assessment) => ({
    id: assessment.id,
    title: assessment.title,
    course: assessment.course,
    duration: assessment.duration,
    answers: assessment.questions.map((question) => question.answer),
  }))

export function findAssessment(id: string) {
  return assessmentKeys.find((assessment) => assessment.id === id)
}
