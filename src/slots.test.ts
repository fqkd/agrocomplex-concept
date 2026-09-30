import { describe, expect, it } from 'vitest'
import { formatSlot, isSlotAvailable, recommendedSlot, slotDateKey } from './slots'

describe('fulfillment slots in Krasnodar', () => {
  it('disables elapsed intervals and the unavailable evening slot', () => {
    const now = new Date('2026-09-30T16:20:00Z') // 19:20 local
    expect(isSlotAvailable(slotDateKey(0, now), '16:00–18:00', now)).toBe(false)
    expect(isSlotAvailable(slotDateKey(0, now), '18:00–20:00', now)).toBe(false)
    expect(isSlotAvailable(slotDateKey(1, now), '16:00–18:00', now)).toBe(true)
    expect(isSlotAvailable(slotDateKey(1, now), '20:00–22:00', now)).toBe(false)
    expect(recommendedSlot(now)).toEqual({ slotDate: '2026-10-01', slot: '16:00–18:00' })
  })

  it('keeps the selected calendar date across midnight', () => {
    const beforeMidnight = new Date('2026-09-30T20:59:00Z')
    const afterMidnight = new Date('2026-09-30T21:01:00Z')
    const dateKey = slotDateKey(0, beforeMidnight)
    expect(dateKey).toBe('2026-09-30')
    expect(isSlotAvailable(dateKey, '18:00–20:00', afterMidnight)).toBe(false)
    expect(formatSlot('2026-10-01', '16:00–18:00')).toBe('1 октября, 16:00–18:00')
  })
})
