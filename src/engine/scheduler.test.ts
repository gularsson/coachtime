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

describe('generateSchedule', () => {
  it('handles no subs needed (squad == pitch size)', () => {
    const config: MatchConfig = {
      format: { kind: 'total', totalMinutes: 25 },
      playersOnPitch: 7,
      squadSize: 7,
      rotateGoalkeeper: false,
    }
    const players = makePlayers(7)
    const schedule = generateSchedule(config, players)

    expect(schedule.timeSlots).toHaveLength(1)
    expect(schedule.events).toHaveLength(0)
    expect(schedule.fairnessScore).toBe(0)
    expect(schedule.timeSlots[0].onPitch).toHaveLength(7)
    // Every player gets full time
    Object.values(schedule.playerMinutes).forEach(mins => {
      expect(mins).toBe(25)
    })
  })

  it('handles 1 substitute', () => {
    const config: MatchConfig = {
      format: { kind: 'total', totalMinutes: 30 },
      playersOnPitch: 7,
      squadSize: 8,
      rotateGoalkeeper: false,
    }
    const players = makePlayers(8)
    const schedule = generateSchedule(config, players)

    expect(schedule.events.length).toBeGreaterThanOrEqual(1)
    // All players should get some time
    Object.values(schedule.playerMinutes).forEach(mins => {
      expect(mins).toBeGreaterThan(0)
    })
  })

  it('gives roughly equal time with 10 players, 7 on pitch, 2x15min', () => {
    const config: MatchConfig = {
      format: { kind: 'halves', count: 2, minutesEach: 15 },
      playersOnPitch: 7,
      squadSize: 10,
      rotateGoalkeeper: false,
    }
    const players = makePlayers(10)
    const schedule = generateSchedule(config, players)

    // Ideal per rotating player: 30 * 6 / 9 = 20 min
    // Fairness should be reasonable
    expect(schedule.fairnessScore).toBeLessThan(5)

    // GK (player 0) should play full 30 minutes since rotateGoalkeeper is false
    expect(schedule.playerMinutes['p0']).toBe(30)

    // No player should have 0 minutes
    const rotationMinutes = Object.entries(schedule.playerMinutes)
      .filter(([id]) => id !== 'p0')
      .map(([, mins]) => mins)
    rotationMinutes.forEach(mins => {
      expect(mins).toBeGreaterThan(0)
    })
  })

  it('handles GK rotation enabled', () => {
    const config: MatchConfig = {
      format: { kind: 'total', totalMinutes: 30 },
      playersOnPitch: 7,
      squadSize: 10,
      rotateGoalkeeper: true,
    }
    const players = makePlayers(10)
    const schedule = generateSchedule(config, players)

    // GK should NOT play full time when rotation is on
    // All 10 players are in the rotation pool
    const allMinutes = Object.values(schedule.playerMinutes)
    expect(allMinutes.length).toBe(10)

    // Ideal: 30 * 7 / 10 = 21 min each
    const mean = allMinutes.reduce((a, b) => a + b, 0) / allMinutes.length
    expect(mean).toBeCloseTo(21, 0)
  })

  it('produces valid slot transitions (no duplicate players)', () => {
    const config: MatchConfig = {
      format: { kind: 'halves', count: 2, minutesEach: 20 },
      playersOnPitch: 7,
      squadSize: 12,
      rotateGoalkeeper: false,
    }
    const players = makePlayers(12)
    const schedule = generateSchedule(config, players)

    for (const slot of schedule.timeSlots) {
      // No duplicates on pitch
      expect(new Set(slot.onPitch).size).toBe(slot.onPitch.length)
      // Correct number on pitch
      expect(slot.onPitch.length).toBe(7)
      // On and off should not overlap
      const overlap = slot.onPitch.filter(id => slot.offPitch.includes(id))
      expect(overlap).toHaveLength(0)
    }
  })

  it('handles large squad (14 players, 7 on pitch)', () => {
    const config: MatchConfig = {
      format: { kind: 'total', totalMinutes: 40 },
      playersOnPitch: 7,
      squadSize: 14,
      rotateGoalkeeper: false,
    }
    const players = makePlayers(14)
    const schedule = generateSchedule(config, players)

    // Should have multiple substitution events
    expect(schedule.events.length).toBeGreaterThanOrEqual(2)

    // GK plays full time
    expect(schedule.playerMinutes['p0']).toBe(40)

    // Fairness should be decent
    expect(schedule.fairnessScore).toBeLessThan(8)
  })

  it('handles 5v5 with 8 players', () => {
    const config: MatchConfig = {
      format: { kind: 'halves', count: 2, minutesEach: 10 },
      playersOnPitch: 5,
      squadSize: 8,
      rotateGoalkeeper: false,
    }
    const players = makePlayers(8)
    const schedule = generateSchedule(config, players)

    // Total minutes per slot should sum correctly
    let totalSlotMinutes = 0
    for (const slot of schedule.timeSlots) {
      totalSlotMinutes += (slot.endMinute - slot.startMinute) * slot.onPitch.length
    }
    // Should equal total_minutes * players_on_pitch
    expect(totalSlotMinutes).toBe(20 * 5)
  })
})
