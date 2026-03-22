import type { MatchConfig, Player, SubstitutionSchedule, TimeSlot, SubstitutionEvent } from '../models/types'
import { getTotalMinutes, getBreakpoints } from '../utils/time'

export function generateSchedule(config: MatchConfig, players: Player[]): SubstitutionSchedule {
  const totalMinutes = getTotalMinutes(config.format)
  const P = config.playersOnPitch
  const N = players.length

  // Trivial case: no substitutes needed
  if (N <= P) {
    const ids = players.map(p => p.id)
    const mins: Record<string, number> = {}
    ids.forEach(id => { mins[id] = totalMinutes })
    return {
      timeSlots: [{ startMinute: 0, endMinute: totalMinutes, onPitch: ids, offPitch: [] }],
      events: [],
      playerMinutes: mins,
      fairnessScore: 0,
    }
  }

  // Determine rotation pool
  const gk = !config.rotateGoalkeeper ? players.find(p => p.isGoalkeeper) : null
  const fixedIds = gk ? [gk.id] : []
  const rotationPool = gk ? players.filter(p => p.id !== gk.id) : [...players]
  const R = rotationPool.length
  const S = P - fixedIds.length // rotation spots per slot

  const minSlots = Math.ceil(R / S)
  const breakpoints = getBreakpoints(config.format)

  let bestResult: SubstitutionSchedule | null = null

  for (let slotCount = minSlots; slotCount <= minSlots + 2; slotCount++) {
    const slotBounds = buildSlots(slotCount, totalMinutes, breakpoints)
    const result = greedyAssign(slotBounds, rotationPool, fixedIds, S, players)
    if (!bestResult || result.fairnessScore < bestResult.fairnessScore) {
      bestResult = result
    }
    if (result.fairnessScore < 0.01) break
  }

  return bestResult!
}

function buildSlots(
  slotCount: number,
  totalMinutes: number,
  breakpoints: number[],
): { start: number; end: number }[] {
  const rawDuration = totalMinutes / slotCount
  const boundaries = [0]

  for (let i = 1; i < slotCount; i++) {
    const ideal = i * rawDuration
    let nearest = Math.round(ideal)
    for (const bp of breakpoints) {
      if (Math.abs(bp - ideal) < Math.abs(nearest - ideal) && Math.abs(bp - ideal) <= 2) {
        nearest = bp
      }
    }
    if (nearest <= boundaries[boundaries.length - 1]) {
      nearest = boundaries[boundaries.length - 1] + 1
    }
    if (nearest >= totalMinutes) {
      nearest = totalMinutes - 1
    }
    boundaries.push(nearest)
  }
  boundaries.push(totalMinutes)

  return boundaries.slice(0, -1).map((s, i) => ({ start: s, end: boundaries[i + 1] }))
}

function greedyAssign(
  slotBounds: { start: number; end: number }[],
  rotationPool: Player[],
  fixedIds: string[],
  rotationSpots: number,
  allPlayers: Player[],
): SubstitutionSchedule {
  const cumMinutes: Record<string, number> = {}
  allPlayers.forEach(p => { cumMinutes[p.id] = 0 })

  const timeSlots: TimeSlot[] = []

  for (const slot of slotBounds) {
    const duration = slot.end - slot.start

    // Sort rotation pool by cumulative minutes (ascending), break ties by roster order
    const sorted = [...rotationPool].sort((a, b) => {
      const diff = cumMinutes[a.id] - cumMinutes[b.id]
      return diff !== 0 ? diff : rotationPool.indexOf(a) - rotationPool.indexOf(b)
    })

    const onPitchRotation = sorted.slice(0, rotationSpots).map(p => p.id)
    const offPitchRotation = sorted.slice(rotationSpots).map(p => p.id)

    const onPitch = [...fixedIds, ...onPitchRotation]
    const offPitch = offPitchRotation

    // Update cumulative minutes
    for (const id of onPitch) {
      cumMinutes[id] += duration
    }

    timeSlots.push({
      startMinute: slot.start,
      endMinute: slot.end,
      onPitch,
      offPitch,
    })
  }

  // Refinement pass: try swapping between adjacent slots to improve fairness
  refine(timeSlots, slotBounds, cumMinutes, rotationPool, fixedIds)

  // Derive substitution events
  const events: SubstitutionEvent[] = []
  for (let i = 1; i < timeSlots.length; i++) {
    const prevOn = new Set(timeSlots[i - 1].onPitch)
    const currOn = new Set(timeSlots[i].onPitch)
    const playersOut = [...prevOn].filter(id => !currOn.has(id))
    const playersIn = [...currOn].filter(id => !prevOn.has(id))
    if (playersOut.length > 0 || playersIn.length > 0) {
      events.push({ minute: timeSlots[i].startMinute, playersOut, playersIn })
    }
  }

  // Compute fairness
  const rotationIds = rotationPool.map(p => p.id)
  const rotationMinutes = rotationIds.map(id => cumMinutes[id])
  const mean = rotationMinutes.reduce((a, b) => a + b, 0) / rotationMinutes.length
  const variance = rotationMinutes.reduce((sum, m) => sum + (m - mean) ** 2, 0) / rotationMinutes.length
  const fairnessScore = Math.sqrt(variance)

  return {
    timeSlots,
    events,
    playerMinutes: { ...cumMinutes },
    fairnessScore,
  }
}

function refine(
  timeSlots: TimeSlot[],
  slotBounds: { start: number; end: number }[],
  cumMinutes: Record<string, number>,
  rotationPool: Player[],
  fixedIds: string[],
): void {
  const fixedSet = new Set(fixedIds)
  let improved = true

  // Run up to 3 passes
  for (let pass = 0; pass < 3 && improved; pass++) {
    improved = false

    for (let i = 0; i < timeSlots.length - 1; i++) {
      const slotA = timeSlots[i]
      const slotB = timeSlots[i + 1]
      const durA = slotBounds[i].end - slotBounds[i].start
      const durB = slotBounds[i + 1].end - slotBounds[i + 1].start

      // Rotation players in A but not in B
      const onlyA = slotA.onPitch.filter(id => !fixedSet.has(id) && !slotB.onPitch.includes(id))
      const onlyB = slotB.onPitch.filter(id => !fixedSet.has(id) && !slotA.onPitch.includes(id))

      for (const idA of onlyA) {
        for (const idB of onlyB) {
          // Try swapping: idA plays in B instead of A, idB plays in A instead of B
          const currentScore = computeVariance(rotationPool.map(p => cumMinutes[p.id]))

          // Simulate swap
          cumMinutes[idA] = cumMinutes[idA] - durA + durB
          cumMinutes[idB] = cumMinutes[idB] - durB + durA

          const newScore = computeVariance(rotationPool.map(p => cumMinutes[p.id]))

          if (newScore < currentScore - 0.01) {
            // Apply swap in time slots
            slotA.onPitch = slotA.onPitch.map(id => id === idA ? idB : id)
            slotA.offPitch = slotA.offPitch.map(id => id === idB ? idA : id)
            slotB.onPitch = slotB.onPitch.map(id => id === idB ? idA : id)
            slotB.offPitch = slotB.offPitch.map(id => id === idA ? idB : id)
            improved = true
          } else {
            // Revert
            cumMinutes[idA] = cumMinutes[idA] - durB + durA
            cumMinutes[idB] = cumMinutes[idB] - durA + durB
          }
        }
      }
    }
  }
}

function computeVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
}
