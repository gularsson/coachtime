import { useMatch } from '../../context/MatchContext'
import { TimeSlotCard } from './TimeSlot'
import { getTotalMinutes } from '../../utils/time'

export function ScheduleView() {
  const { state, dispatch } = useMatch()
  const { schedule, players, config } = state

  if (!schedule) return null

  const totalMinutes = getTotalMinutes(config.format)

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-text mb-1">Schedule</h2>
          <p className="text-sm text-text-muted">
            {schedule.events.length} substitution{schedule.events.length !== 1 ? 's' : ''} planned
          </p>
        </div>
      </div>

      {/* Fairness indicator */}
      <div className={`rounded-xl p-3 text-center ${
        schedule.fairnessScore < 1 ? 'bg-primary/10 border border-primary/20' :
        schedule.fairnessScore < 3 ? 'bg-warning/10 border border-warning/20' :
        'bg-danger/10 border border-danger/20'
      }`}>
        <span className="text-sm font-medium">
          {schedule.fairnessScore < 1
            ? 'Excellent fairness'
            : schedule.fairnessScore < 3
              ? 'Good fairness'
              : 'Best achievable fairness'}
        </span>
        <span className="text-xs text-text-muted ml-2">
          (±{schedule.fairnessScore.toFixed(1)} min)
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {schedule.timeSlots.map((slot, i) => {
          const event = schedule.events.find(e => e.minute === slot.startMinute)
          return (
            <TimeSlotCard
              key={i}
              slot={slot}
              players={players}
              isFirst={i === 0}
              subsIn={event?.playersIn}
              subsOut={event?.playersOut}
            />
          )
        })}
      </div>

      {/* Player minutes table */}
      <div className="rounded-xl border-2 border-border p-4">
        <h3 className="text-sm font-bold text-text mb-3">Playing Time</h3>
        <div className="space-y-2">
          {players.map(p => {
            const mins = schedule.playerMinutes[p.id] ?? 0
            const pct = totalMinutes > 0 ? (mins / totalMinutes) * 100 : 0
            return (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-xs font-medium text-text w-20 truncate">{p.name}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.position === 'GK' ? 'bg-pos-gk' :
                      p.position === 'DEF' ? 'bg-pos-def' :
                      p.position === 'MID' ? 'bg-pos-mid' : 'bg-pos-fwd'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-text-muted w-12 text-right">{mins} min</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Start live mode */}
      <button
        onClick={() => dispatch({ type: 'SET_STEP', step: 'live' })}
        className="w-full min-h-14 rounded-xl bg-primary text-white font-bold text-lg
          hover:bg-primary-dark active:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
      >
        Start Live Match
      </button>
    </div>
  )
}
