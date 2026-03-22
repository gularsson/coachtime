import { useMatch } from '../../context/MatchContext'
import type { Position } from '../../models/types'

const POSITIONS: { value: Position; label: string; color: string }[] = [
  { value: 'GK', label: 'GK', color: 'bg-pos-gk' },
  { value: 'DEF', label: 'DEF', color: 'bg-pos-def' },
  { value: 'MID', label: 'MID', color: 'bg-pos-mid' },
  { value: 'FWD', label: 'FWD', color: 'bg-pos-fwd' },
]

export function PositionAssignStep() {
  const { state, dispatch } = useMatch()
  const { players, config } = state

  const gkCount = players.filter(p => p.isGoalkeeper).length
  const isValid = config.rotateGoalkeeper || gkCount === 1

  return (
    <div className="space-y-4 pt-4">
      <div>
        <h2 className="text-xl font-bold text-text mb-1">Positions</h2>
        <p className="text-sm text-text-muted">Assign a position to each player</p>
      </div>

      {/* GK rotation toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-surface-alt border border-border">
        <div>
          <div className="text-sm font-medium text-text">Rotate goalkeeper?</div>
          <div className="text-xs text-text-muted">GK will be included in substitution rotation</div>
        </div>
        <button
          onClick={() => dispatch({ type: 'UPDATE_CONFIG', payload: { rotateGoalkeeper: !config.rotateGoalkeeper } })}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            config.rotateGoalkeeper ? 'bg-primary' : 'bg-gray-300'
          }`}
        >
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
            config.rotateGoalkeeper ? 'translate-x-5.5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>

      {/* Player position list */}
      <div className="space-y-2">
        {players.map(player => (
          <div key={player.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
            <span className="text-sm font-medium text-text w-24 truncate">{player.name}</span>
            <div className="flex gap-1.5 flex-1">
              {POSITIONS.map(pos => (
                <button
                  key={pos.value}
                  onClick={() => {
                    const isGk = pos.value === 'GK'
                    dispatch({
                      type: 'UPDATE_PLAYER',
                      id: player.id,
                      updates: {
                        position: pos.value,
                        isGoalkeeper: isGk,
                      },
                    })
                  }}
                  className={`flex-1 min-h-10 rounded-lg text-xs font-bold transition-all ${
                    player.position === pos.value
                      ? `${pos.color} text-white shadow-sm`
                      : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Validation message */}
      {!config.rotateGoalkeeper && gkCount !== 1 && (
        <p className="text-sm text-danger text-center">
          {gkCount === 0
            ? 'Assign exactly one player as GK'
            : `${gkCount} goalkeepers selected — need exactly 1`}
        </p>
      )}

      <button
        disabled={!isValid}
        onClick={() => dispatch({ type: 'NEXT_STEP' })}
        className="w-full min-h-12 rounded-xl bg-primary text-white font-semibold text-base
          hover:bg-primary-dark active:bg-primary-dark transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next: Review
      </button>
    </div>
  )
}
