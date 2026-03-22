import { describe, it, expect } from 'vitest'
import { generateSchedule } from './scheduler'
import type { MatchConfig, Player } from '../models/types'

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i + 1}`,
    position: i === 0 ? 'GK' as const : 'MID' as const,
    isGoalkeeper: i === 0,
  }))
}

function makeConfig(overrides: Partial<MatchConfig> = {}): MatchConfig {
  return {
    format: { kind: 'halves', count: 2, minutesEach: 15 },
    playersOnPitch: 7,
    squadSize: 10,
    rotateGoalkeeper: false,
    substitutionMode: 'grouped',
    ...overrides,
  }
}

describe('grouped substitutions', () => {
  it('handles no subs needed (squad == pitch size)', () => {
    const config = makeConfig({
      format: { kind: 'total', totalMinutes: 25 },
      squadSize: 7,
    })
    const players = makePlayers(7)
    const schedule = generateSchedule(config, players)

    expect(schedule.timeSlots).toHaveLength(1)
    expect(schedule.events).toHaveLength(0)
    expect(schedule.fairnessScore).toBe(0)
    Object.values(schedule.playerMinutes).forEach(mins => {
      expect(mins).toBe(25)
    })
  })

  it('handles 1 substitute', () => {
    const config = makeConfig({
      format: { kind: 'total', totalMinutes: 30 },
      squadSize: 8,
    })
    const players = makePlayers(8)
    const schedule = generateSchedule(config, players)

    expect(schedule.events.length).toBeGreaterThanOrEqual(1)
    Object.values(schedule.playerMinutes).forEach(mins => {
      expect(mins).toBeGreaterThan(0)
    })
  })

  it('gives roughly equal time with 10 players, 7 on pitch, 2x15min', () => {
    const config = makeConfig()
    const players = makePlayers(10)
    const schedule = generateSchedule(config, players)

    expect(schedule.fairnessScore).toBeLessThan(5)
    expect(schedule.playerMinutes['p0']).toBe(30) // GK full time
    Object.entries(schedule.playerMinutes)
      .filter(([id]) => id !== 'p0')
      .forEach(([, mins]) => expect(mins).toBeGreaterThan(0))
  })

  it('handles GK rotation enabled', () => {
    const config = makeConfig({
      format: { kind: 'total', totalMinutes: 30 },
      rotateGoalkeeper: true,
    })
    const players = makePlayers(10)
    const schedule = generateSchedule(config, players)

    const allMinutes = Object.values(schedule.playerMinutes)
    expect(allMinutes.length).toBe(10)
    const mean = allMinutes.reduce((a, b) => a + b, 0) / allMinutes.length
    expect(mean).toBeCloseTo(21, 0)
  })

  it('produces valid slot transitions (no duplicate players)', () => {
    const config = makeConfig({
      format: { kind: 'halves', count: 2, minutesEach: 20 },
      squadSize: 12,
    })
    const players = makePlayers(12)
    const schedule = generateSchedule(config, players)

    for (const slot of schedule.timeSlots) {
      expect(new Set(slot.onPitch).size).toBe(slot.onPitch.length)
      expect(slot.onPitch.length).toBe(7)
      const overlap = slot.onPitch.filter(id => slot.offPitch.includes(id))
      expect(overlap).toHaveLength(0)
    }
  })

  it('handles large squad (14 players, 7 on pitch)', () => {
    const config = makeConfig({
      format: { kind: 'total', totalMinutes: 40 },
      squadSize: 14,
    })
    const players = makePlayers(14)
    const schedule = generateSchedule(config, players)

    expect(schedule.events.length).toBeGreaterThanOrEqual(2)
    expect(schedule.playerMinutes['p0']).toBe(40)
    expect(schedule.fairnessScore).toBeLessThan(8)
  })

  it('handles 5v5 with 8 players', () => {
    const config = makeConfig({
      format: { kind: 'halves', count: 2, minutesEach: 10 },
      playersOnPitch: 5,
      squadSize: 8,
    })
    const players = makePlayers(8)
    const schedule = generateSchedule(config, players)

    let totalSlotMinutes = 0
    for (const slot of schedule.timeSlots) {
      totalSlotMinutes += (slot.endMinute - slot.startMinute) * slot.onPitch.length
    }
    expect(totalSlotMinutes).toBe(20 * 5)
  })
})

describe('rolling substitutions', () => {
  it('swaps only one player at a time', () => {
    const config = makeConfig({ substitutionMode: 'rolling' })
    const players = makePlayers(10)
    const schedule = generateSchedule(config, players)

    for (const event of schedule.events) {
      expect(event.playersOut).toHaveLength(1)
      expect(event.playersIn).toHaveLength(1)
    }
  })

  it('achieves reasonable fairness', () => {
    const config = makeConfig({
      substitutionMode: 'rolling',
      format: { kind: 'halves', count: 2, minutesEach: 15 },
    })
    const players = makePlayers(10)
    const schedule = generateSchedule(config, players)

    // Rolling should achieve fairness within ±2 min per player
    expect(schedule.fairnessScore).toBeLessThan(3)
  })

  it('gives all players playing time', () => {
    const config = makeConfig({ substitutionMode: 'rolling' })
    const players = makePlayers(10)
    const schedule = generateSchedule(config, players)

    Object.values(schedule.playerMinutes).forEach(mins => {
      expect(mins).toBeGreaterThan(0)
    })
  })

  it('GK stays on for full match when rotation is off', () => {
    const config = makeConfig({
      substitutionMode: 'rolling',
      format: { kind: 'total', totalMinutes: 30 },
    })
    const players = makePlayers(10)
    const schedule = generateSchedule(config, players)

    expect(schedule.playerMinutes['p0']).toBe(30)
  })

  it('has correct number of players on pitch each slot', () => {
    const config = makeConfig({
      substitutionMode: 'rolling',
      format: { kind: 'halves', count: 2, minutesEach: 20 },
      squadSize: 12,
    })
    const players = makePlayers(12)
    const schedule = generateSchedule(config, players)

    for (const slot of schedule.timeSlots) {
      expect(slot.onPitch.length).toBe(7)
      expect(new Set(slot.onPitch).size).toBe(slot.onPitch.length)
      const overlap = slot.onPitch.filter(id => slot.offPitch.includes(id))
      expect(overlap).toHaveLength(0)
    }
  })

  it('produces more substitution events than grouped', () => {
    const config = makeConfig({
      format: { kind: 'total', totalMinutes: 40 },
      squadSize: 12,
    })
    const players = makePlayers(12)

    const grouped = generateSchedule({ ...config, substitutionMode: 'grouped' }, players)
    const rolling = generateSchedule({ ...config, substitutionMode: 'rolling' }, players)

    expect(rolling.events.length).toBeGreaterThanOrEqual(grouped.events.length)
  })

  it('handles no subs needed', () => {
    const config = makeConfig({
      substitutionMode: 'rolling',
      format: { kind: 'total', totalMinutes: 25 },
      squadSize: 7,
    })
    const players = makePlayers(7)
    const schedule = generateSchedule(config, players)

    expect(schedule.events).toHaveLength(0)
    expect(schedule.fairnessScore).toBe(0)
  })
})
