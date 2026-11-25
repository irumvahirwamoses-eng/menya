import { admin } from './admin'
import { ai } from './ai'
import { common } from './common'
import { reviewer } from './reviewer'
import { student } from './student'
import { trainer } from './trainer'

export const dictionaries: Record<string, string> = {
  ...common,
  ...ai,
  ...student,
  ...trainer,
  ...reviewer,
  ...admin,
}
