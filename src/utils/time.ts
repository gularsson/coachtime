import type { MatchFormat } from '../models/types'

export function getTotalMinutes(format: MatchFormat): number {
  if (format.kind === 'total') return format.totalMinutes
  return format.count * format.minutesEach
}

export function getBreakpoints(format: MatchFormat): number[] {
  const total = getTotalMinutes(format)
  const points = [0, total]
  if (format.kind === 'halves') {
    for (let i = 1; i < format.count; i++) {
      points.push(i * format.minutesEach)
    }
  }
  return [...new Set(points)].sort((a, b) => a - b)
}

export function formatMinutes(min: number): string {
  const m = Math.floor(min)
  const s = Math.round((min - m) * 60)
  if (s === 0) return `${m}'`
  return `${m}:${s.toString().padStart(2, '0')}'`
}
