import { useMatch } from '../../context/MatchContext'
import { getTotalMinutes } from '../../utils/time'
import { generateSchedule } from '../../engine/scheduler'

export function ReviewStep() {
  const { state, dispatch } = useMatch()
  const { config, players } = state
  const totalMinutes = getTotalMinutes(config.format)
  const idealMinutes = (totalMinutes * config.playersOnPitch) / config.squadSize

  const positionCounts = players.reduce((acc, p) => {
    acc[p.position] = (acc[p.position] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleGenerate = () => {
    const schedule = generateSchedule(config, players)
    dispatch({ type: 'SET_SCHEDULE', schedule })
    dispatch({ type: 'SET_STEP', step: 'schedule' })
  }

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h2 className="text-xl font-bold text-text mb-1">Review</h2>
        <p className="text-sm text-text-muted">Confirm settings before generating schedule</p>
      </div>

      {/* Match info */}
      <div className="rounded-xl border-2 border-border p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-text-muted">Duration</span>
          <span className="text-sm font-medium text-text">
            {config.format.kind === 'total'
              ? `${totalMinutes} min`
              : `${config.format.count} × ${config.format.minutesEach} min`}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-muted">Format</span>
          <span className="text-sm font-medium text-text">{config.playersOnPitch}v{config.playersOnPitch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-muted">Squad size</span>
          <span className="text-sm font-medium text-text">{config.squadSize} players</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-muted">Substitutes</span>
          <span className="text-sm font-medium text-text">{config.squadSize - config.playersOnPitch}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-text-muted">GK rotation</span>
          <span className="text-sm font-medium text-text">{config.rotateGoalkeeper ? 'Yes' : 'No'}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="text-sm font-medium text-primary">Target per player</span>
          <span className="text-sm font-bold text-primary">~{Math.round(idealMinutes)} min</span>
        </div>
      </div>

      {/* Players by position */}
      <div className="rounded-xl border-2 border-border p-4">
        <h3 className="text-sm font-medium text-text mb-3">Squad</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(positionCounts).map(([pos, count]) => (
            <span key={pos} className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-text-muted">
              {pos}: {count}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1">
          {players.map(p => (
            <div key={p.id} className="text-xs text-text flex items-center gap-1.5 py-0.5">
              <span className={`w-2 h-2 rounded-full ${
                p.position === 'GK' ? 'bg-pos-gk' :
                p.position === 'DEF' ? 'bg-pos-def' :
                p.position === 'MID' ? 'bg-pos-mid' : 'bg-pos-fwd'
              }`} />
              {p.name}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="w-full min-h-14 rounded-xl bg-primary text-white font-bold text-lg
          hover:bg-primary-dark active:bg-primary-dark transition-colors shadow-lg shadow-primary/25"
      >
        Generate Schedule
      </button>
    </div>
  )
}
