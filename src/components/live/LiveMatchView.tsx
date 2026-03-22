import { useCallback } from 'react'
import { useMatch } from '../../context/MatchContext'
import { useTimer } from '../../hooks/useTimer'
import { getTotalMinutes } from '../../utils/time'
import { CurrentLineup } from './CurrentLineup'
import { UpcomingSub } from './UpcomingSub'

export function LiveMatchView() {
  const { state, dispatch } = useMatch()
  const { schedule, players, config, liveMinute, isRunning } = state

  const totalMinutes = getTotalMinutes(config.format)

  const onTick = useCallback((seconds: number) => {
    const minute = seconds / 60
    dispatch({ type: 'TICK', minute })
  }, [dispatch])

  const { reset } = useTimer(isRunning, onTick)

  if (!schedule) return null

  // Find current time slot
  const currentSlot = schedule.timeSlots.find(
    s => liveMinute >= s.startMinute && liveMinute < s.endMinute
  ) ?? schedule.timeSlots[schedule.timeSlots.length - 1]

  // Find next upcoming sub event
  const nextEvent = schedule.events.find(e => e.minute > liveMinute)
  const isImminent = nextEvent ? (nextEvent.minute - liveMinute) <= 2 : false

  // Check if match is over
  const matchOver = liveMinute >= totalMinutes

  const onPitch = currentSlot.onPitch.map(id => players.find(p => p.id === id)!).filter(Boolean)
  const offPitch = currentSlot.offPitch.map(id => players.find(p => p.id === id)!).filter(Boolean)

  const displayMinutes = Math.floor(liveMinute)
  const displaySeconds = Math.floor((liveMinute - displayMinutes) * 60)

  return (
    <div className="space-y-4 pt-4">
      {/* Timer */}
      <div className="text-center py-6">
        <div className={`text-6xl font-mono font-bold tracking-tight ${
          matchOver ? 'text-danger' : 'text-text'
        }`}>
          {String(displayMinutes).padStart(2, '0')}:{String(displaySeconds).padStart(2, '0')}
        </div>
        <div className="text-sm text-text-muted mt-1">
          {matchOver ? 'Full time' : `of ${totalMinutes} minutes`}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => {
              reset()
              dispatch({ type: 'TICK', minute: 0 })
              if (isRunning) dispatch({ type: 'TOGGLE_TIMER' })
            }}
            className="min-h-12 px-5 rounded-xl border-2 border-border text-sm font-medium text-text-muted
              hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TIMER' })}
            className={`min-h-14 px-8 rounded-xl font-bold text-lg text-white transition-colors shadow-lg ${
              isRunning
                ? 'bg-warning hover:bg-warning/90 shadow-warning/25'
                : 'bg-primary hover:bg-primary-dark shadow-primary/25'
            }`}
          >
            {isRunning ? 'Pause' : liveMinute > 0 ? 'Resume' : 'Start'}
          </button>
        </div>
      </div>

      {/* Upcoming sub alert */}
      {nextEvent && !matchOver && (
        <UpcomingSub event={nextEvent} players={players} isImminent={isImminent} />
      )}

      {/* Current lineup */}
      <CurrentLineup onPitch={onPitch} offPitch={offPitch} />

      {/* Back to schedule */}
      <button
        onClick={() => dispatch({ type: 'SET_STEP', step: 'schedule' })}
        className="w-full min-h-10 rounded-lg text-sm font-medium text-text-muted
          hover:bg-gray-50 active:bg-gray-100 transition-colors"
      >
        View full schedule
      </button>
    </div>
  )
}
