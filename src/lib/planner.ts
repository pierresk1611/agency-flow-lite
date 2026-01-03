import { isValid, format } from 'date-fns'

export type PlannerEntry = {
  id: string
  date: string
  minutes: number
  title?: string
}

export function computePlannedHours(entries: PlannerEntry[], days: Date[]) {
  return days.map((day) => {
    const totalMinutes = entries
      .filter((e) => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
      .reduce((sum, e) => sum + (typeof e.minutes === 'number' ? e.minutes : Number(e.minutes || 0)), 0)

    return { name: format(day, 'E'), hodiny: totalMinutes / 60, minutes: totalMinutes }
  })
}

export default computePlannedHours
