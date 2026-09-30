const zone = 'Europe/Moscow'
export const slotTimes = ['16:00–18:00', '18:00–20:00', '20:00–22:00'] as const

function localDate(now: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: zone,
  }).formatToParts(now)
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value)
  return new Date(Date.UTC(part('year'), part('month') - 1, part('day'), 12))
}

export function slotDateKey(offset: number, now = new Date()) {
  const date = localDate(now)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export function isSlotAvailable(dateKey: string, slot: string, now = new Date()) {
  if (!slotTimes.includes(slot as typeof slotTimes[number]) || slot === '20:00–22:00') return false
  const today = slotDateKey(0, now)
  if (dateKey < today || dateKey > slotDateKey(1, now)) return false
  if (dateKey > today) return true
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: zone,
  }).formatToParts(now)
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value)
  const [hour, minute] = slot.slice(0, 5).split(':').map(Number)
  return hour * 60 + minute > part('hour') * 60 + part('minute')
}

export function recommendedSlot(now = new Date()) {
  for (const dateKey of [slotDateKey(0, now), slotDateKey(1, now)]) {
    for (const slot of slotTimes) {
      if (isSlotAvailable(dateKey, slot, now)) return { slotDate: dateKey, slot }
    }
  }
  throw new Error('No fulfillment slot available')
}

export function formatSlot(dateKey: string, slot: string) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  const day = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', timeZone: zone }).format(date)
  return `${day}, ${slot}`
}
