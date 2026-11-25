import type { LessonType } from '../types'

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export const lessonTypeLabel: Record<LessonType, string> = {
  video: 'Video lesson',
  reading: 'Reading',
  practice: 'Practice',
  quiz: 'Knowledge check',
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
