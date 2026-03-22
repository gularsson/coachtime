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

  if (config.substitutionMode === 'rolling') {
    return generateRollingSchedule(config, players, totalMinutes)
  }
  return generateGroupedSchedule(config, players, totalMinutes)
}

// ---------------------------------------------------------------------------
// Rolling substitutions: swap one player at a time for maximum fairness
// ---------------------------------------------------------------------------

function generateRollingSchedule(
  config: MatchConfig,
  players: Player[],
  totalMinutes: number,
): SubstitutionSchedule {
  const P = config.playersOnPitch
  const gk = !config.rotateGoalkeeper ? players.find(p => p.isGoalkeeper) : null
  const fixedIds = gk ? [gk.id] : []
  const rotationPool = gk ? players.filter(p => p.id !== gk.id) : [...players]
  const R = rotationPool.length
  const S = P - fixedIds.length // rotation spots on pitch

  // One full cycle requires R swaps: each rotation player sits out exactly once.
  // Swap interval = totalMinutes / R, clamped to be at least 2 min.
  const numSwaps = R
  const rawInterval = totalMinutes / (numSwaps + 1) // +1 to avoid swap at minute 0 and at the very end
  const swapInterval = Math.max(2, rawInterval)

  // Generate swap times
  const swapTimes: number[] = []
  let t = swapInterval
  while (t < totalMinutes - 1) {
    swapTimes.push(Math.round(t))
    t += swapInterval
  }
  // Deduplicate and ensure they don't exceed totalMinutes
  const uniqueSwapTimes = [...new Set(swapTimes)].filter(t => t > 0 && t < totalMinutes).sort((a, b) => a - b)

  // Build time slots by simulating the match
  const cumMinutes: Record<string, number> = {}
  players.forEach(p => { cumMinutes[p.id] = 0 })

  // Start with the first S rotation players on pitch
  let currentOnPitch = rotationPool.slice(0, S).map(p => p.id)
  let currentBench = rotationPool.slice(S).map(p => p.id)

  const boundaries = [0, ...uniqueSwapTimes, totalMinutes]
  const timeSlots: TimeSlot[] = []
  const events: SubstitutionEvent[] = []

  for (let i = 0; i < boundaries.length - 1; i++) {
    const start = boundaries[i]
    const end = boundaries[i + 1]
    const duration = end - start

    // Record this slot
    timeSlots.push({
      startMinute: start,
      endMinute: end,
      onPitch: [...fixedIds, ...currentOnPitch],
      offPitch: [...currentBench],
    })

    // Update cumulative minutes for on-pitch players
    for (const id of fixedIds) cumMinutes[id] += duration
    for (const id of currentOnPitch) cumMinutes[id] += duration

    // At the end of this slot (if not the last), perform a rolling swap
    if (i < boundaries.length - 2) {
      // Find the on-pitch rotation player with the MOST cumulative time
      const sortedOnPitch = [...currentOnPitch].sort((a, b) => cumMinutes[b] - cumMinutes[a])
      const playerOut = sortedOnPitch[0]

      // Find the bench player with the LEAST cumulative time
      const sortedBench = [...currentBench].sort((a, b) => cumMinutes[a] - cumMinutes[b])
      const playerIn = sortedBench[0]

      // Only swap if it actually helps (bench player has less time than on-pitch player)
      if (playerOut && playerIn && cumMinutes[playerIn] < cumMinutes[playerOut]) {
        events.push({
          minute: end,
          playersOut: [playerOut],
          playersIn: [playerIn],
        })
        currentOnPitch = currentOnPitch.map(id => id === playerOut ? playerIn : id)
        currentBench = currentBench.map(id => id === playerIn ? playerOut : id)
      }
    }
  }

  // Compute fairness score over rotation pool
  const rotationMinutes = rotationPool.map(p => cumMinutes[p.id])
  const mean = rotationMinutes.reduce((a, b) => a + b, 0) / rotationMinutes.length
  const variance = rotationMinutes.reduce((sum, m) => sum + (m - mean) ** 2, 0) / rotationMinutes.length

  return {
    timeSlots,
    events,
    playerMinutes: { ...cumMinutes },
    fairnessScore: Math.sqrt(variance),
  }
}

// ---------------------------------------------------------------------------
// Grouped substitutions: swap multiple players at once in time slots
// ---------------------------------------------------------------------------

function generateGroupedSchedule(
  config: MatchConfig,
  players: Player[],
  totalMinutes: number,
): SubstitutionSchedule {
  const P = config.playersOnPitch
  const gk = !config.rotateGoalkeeper ? players.find(p => p.isGoalkeeper) : null
  const fixedIds = gk ? [gk.id] : []
  const rotationPool = gk ? players.filter(p => p.id !== gk.id) : [...players]
  const R = rotationPool.length
  const S = P - fixedIds.length

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

    const sorted = [...rotationPool].sort((a, b) => {
      const diff = cumMinutes[a.id] - cumMinutes[b.id]
      return diff !== 0 ? diff : rotationPool.indexOf(a) - rotationPool.indexOf(b)
    })

    const onPitchRotation = sorted.slice(0, rotationSpots).map(p => p.id)
    const offPitchRotation = sorted.slice(rotationSpots).map(p => p.id)

    const onPitch = [...fixedIds, ...onPitchRotation]
    const offPitch = offPitchRotation

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

  refine(timeSlots, slotBounds, cumMinutes, rotationPool, fixedIds)

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

  const rotationIds = rotationPool.map(p => p.id)
  const rotationMinutes = rotationIds.map(id => cumMinutes[id])
  const mean = rotationMinutes.reduce((a, b) => a + b, 0) / rotationMinutes.length
  const variance = rotationMinutes.reduce((sum, m) => sum + (m - mean) ** 2, 0) / rotationMinutes.length

  return {
    timeSlots,
    events,
    playerMinutes: { ...cumMinutes },
    fairnessScore: Math.sqrt(variance),
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

  for (let pass = 0; pass < 3 && improved; pass++) {
    improved = false

    for (let i = 0; i < timeSlots.length - 1; i++) {
      const slotA = timeSlots[i]
      const slotB = timeSlots[i + 1]
      const durA = slotBounds[i].end - slotBounds[i].start
      const durB = slotBounds[i + 1].end - slotBounds[i + 1].start

      const onlyA = slotA.onPitch.filter(id => !fixedSet.has(id) && !slotB.onPitch.includes(id))
      const onlyB = slotB.onPitch.filter(id => !fixedSet.has(id) && !slotA.onPitch.includes(id))

      for (const idA of onlyA) {
        for (const idB of onlyB) {
          const currentScore = computeVariance(rotationPool.map(p => cumMinutes[p.id]))

          cumMinutes[idA] = cumMinutes[idA] - durA + durB
          cumMinutes[idB] = cumMinutes[idB] - durB + durA

          const newScore = computeVariance(rotationPool.map(p => cumMinutes[p.id]))

          if (newScore < currentScore - 0.01) {
            slotA.onPitch = slotA.onPitch.map(id => id === idA ? idB : id)
            slotA.offPitch = slotA.offPitch.map(id => id === idB ? idA : id)
            slotB.onPitch = slotB.onPitch.map(id => id === idB ? idA : id)
            slotB.offPitch = slotB.offPitch.map(id => id === idA ? idB : id)
            improved = true
          } else {
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
