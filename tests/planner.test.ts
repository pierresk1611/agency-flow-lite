import { computePlannedHours } from '../src/lib/planner'
import { describe, it, expect } from 'vitest'
import { addDays, startOfWeek } from 'date-fns'

describe('computePlannedHours', () => {
  it('sums minutes per day correctly', () => {
    const today = new Date('2026-01-03') // Saturday
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    const entries = [
      { id: '1', date: '2026-01-03', minutes: 120 },
      { id: '2', date: '2026-01-03', minutes: 60 },
      { id: '3', date: '2026-01-04', minutes: 30 },
      { id: '4', date: 'invalid', minutes: 45 }
    ]

    const result = computePlannedHours(entries, days)
    // find the day object that matches the date '2026-01-03'
    const targetIndex = days.findIndex(d => d.toISOString().startsWith('2026-01-03'))
    expect(targetIndex).toBeGreaterThanOrEqual(0)
    const satObj = result[targetIndex]
    expect(satObj.minutes).toBe(180)
    expect(satObj.hodiny).toBeCloseTo(3)
    // ensure a day without entries has 0 minutes
    const emptyIndex = result.findIndex(r => r.minutes === 0)
    expect(emptyIndex).toBeGreaterThanOrEqual(0)
  })
})
