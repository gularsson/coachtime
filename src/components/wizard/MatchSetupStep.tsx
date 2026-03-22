import { useMatch } from '../../context/MatchContext'
import type { MatchFormat } from '../../models/types'

export function MatchSetupStep() {
  const { state, dispatch } = useMatch()
  const { config } = state
  const { format } = config

  const updateFormat = (f: MatchFormat) => dispatch({ type: 'UPDATE_CONFIG', payload: { format: f } })

  const isValid = config.squadSize >= config.playersOnPitch && config.playersOnPitch >= 3

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h2 className="text-xl font-bold text-text mb-1">Match Setup</h2>
        <p className="text-sm text-text-muted">Configure match duration and team size</p>
      </div>

      {/* Format toggle */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">Match Format</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateFormat({ kind: 'total', totalMinutes: 25 })}
            className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
              format.kind === 'total'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-text-muted hover:border-gray-400'
            }`}
          >
            Total time
          </button>
          <button
            onClick={() => updateFormat({ kind: 'halves', count: 2, minutesEach: 15 })}
            className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
              format.kind === 'halves'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-text-muted hover:border-gray-400'
            }`}
          >
            Halves / Periods
          </button>
        </div>
      </div>

      {/* Duration inputs */}
      {format.kind === 'total' ? (
        <div>
          <label className="block text-sm font-medium text-text mb-2">Total Minutes</label>
          <input
            type="number"
            inputMode="numeric"
            min={5}
            max={90}
            value={format.totalMinutes}
            onChange={e => updateFormat({ kind: 'total', totalMinutes: parseInt(e.target.value) || 0 })}
            className="w-full min-h-12 px-4 rounded-xl border-2 border-border text-lg focus:border-primary focus:outline-none transition-colors"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text mb-2">Periods</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateFormat({ ...format, count: Math.max(2, format.count - 1) })}
                className="min-h-12 w-12 rounded-xl border-2 border-border text-lg font-bold hover:bg-gray-50 active:bg-gray-100"
              >
                −
              </button>
              <span className="text-xl font-bold flex-1 text-center">{format.count}</span>
              <button
                onClick={() => updateFormat({ ...format, count: Math.min(4, format.count + 1) })}
                className="min-h-12 w-12 rounded-xl border-2 border-border text-lg font-bold hover:bg-gray-50 active:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-2">Minutes each</label>
            <input
              type="number"
              inputMode="numeric"
              min={5}
              max={45}
              value={format.minutesEach}
              onChange={e => updateFormat({ ...format, minutesEach: parseInt(e.target.value) || 0 })}
              className="w-full min-h-12 px-4 rounded-xl border-2 border-border text-lg focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* Substitution mode */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">Substitution Style</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => dispatch({ type: 'UPDATE_CONFIG', payload: { substitutionMode: 'rolling' as const } })}
            className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
              config.substitutionMode === 'rolling'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-text-muted hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">Rolling</div>
            <div className="text-xs opacity-70 mt-0.5">One at a time</div>
          </button>
          <button
            onClick={() => dispatch({ type: 'UPDATE_CONFIG', payload: { substitutionMode: 'grouped' as const } })}
            className={`py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all ${
              config.substitutionMode === 'grouped'
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-text-muted hover:border-gray-400'
            }`}
          >
            <div className="font-semibold">Grouped</div>
            <div className="text-xs opacity-70 mt-0.5">Swap multiple</div>
          </button>
        </div>
      </div>

      {/* Players on pitch */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">Players on Pitch</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'UPDATE_CONFIG', payload: { playersOnPitch: Math.max(3, config.playersOnPitch - 1) } })}
            className="min-h-12 w-12 rounded-xl border-2 border-border text-lg font-bold hover:bg-gray-50 active:bg-gray-100"
          >
            −
          </button>
          <span className="text-2xl font-bold flex-1 text-center">{config.playersOnPitch}</span>
          <button
            onClick={() => dispatch({ type: 'UPDATE_CONFIG', payload: { playersOnPitch: Math.min(11, config.playersOnPitch + 1) } })}
            className="min-h-12 w-12 rounded-xl border-2 border-border text-lg font-bold hover:bg-gray-50 active:bg-gray-100"
          >
            +
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1 text-center">{config.playersOnPitch}v{config.playersOnPitch} format</p>
      </div>

      {/* Squad size */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">Total Squad Size</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch({ type: 'UPDATE_CONFIG', payload: { squadSize: Math.max(config.playersOnPitch, config.squadSize - 1) } })}
            className="min-h-12 w-12 rounded-xl border-2 border-border text-lg font-bold hover:bg-gray-50 active:bg-gray-100"
          >
            −
          </button>
          <span className="text-2xl font-bold flex-1 text-center">{config.squadSize}</span>
          <button
            onClick={() => dispatch({ type: 'UPDATE_CONFIG', payload: { squadSize: Math.min(25, config.squadSize + 1) } })}
            className="min-h-12 w-12 rounded-xl border-2 border-border text-lg font-bold hover:bg-gray-50 active:bg-gray-100"
          >
            +
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1 text-center">
          {config.squadSize - config.playersOnPitch} substitute{config.squadSize - config.playersOnPitch !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Next button */}
      <button
        disabled={!isValid}
        onClick={() => {
          // Initialize empty players if needed
          if (state.players.length !== config.squadSize) {
            const players = Array.from({ length: config.squadSize }, (_, i) => ({
              id: crypto.randomUUID(),
              name: state.players[i]?.name ?? '',
              position: state.players[i]?.position ?? (i === 0 ? 'GK' as const : 'MID' as const),
              isGoalkeeper: state.players[i]?.isGoalkeeper ?? i === 0,
            }))
            dispatch({ type: 'SET_PLAYERS', players })
          }
          dispatch({ type: 'NEXT_STEP' })
        }}
        className="w-full min-h-12 rounded-xl bg-primary text-white font-semibold text-base
          hover:bg-primary-dark active:bg-primary-dark transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next: Enter Players
      </button>
    </div>
  )
}
