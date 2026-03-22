import { useState } from 'react'
import { useMatch } from '../../context/MatchContext'
import { loadRosters, saveRoster, deleteRoster } from '../../storage/roster'
import type { SavedRoster } from '../../models/types'

export function PlayerEntryStep() {
  const { state, dispatch } = useMatch()
  const { players } = state
  const [showRosterModal, setShowRosterModal] = useState(false)
  const [rosterName, setRosterName] = useState('')
  const rosters = loadRosters()

  const allNamed = players.every(p => p.name.trim().length > 0)

  const handleLoadRoster = (roster: SavedRoster) => {
    const loaded = roster.players.slice(0, state.config.squadSize).map((p, i) => ({
      id: crypto.randomUUID(),
      name: p.name,
      position: p.position,
      isGoalkeeper: p.isGoalkeeper ?? i === 0,
    }))
    // Pad with empty players if roster is smaller than squad
    while (loaded.length < state.config.squadSize) {
      loaded.push({
        id: crypto.randomUUID(),
        name: '',
        position: 'MID',
        isGoalkeeper: false,
      })
    }
    dispatch({ type: 'SET_PLAYERS', players: loaded })
    setShowRosterModal(false)
  }

  const handleSaveRoster = () => {
    if (!rosterName.trim()) return
    saveRoster({
      id: crypto.randomUUID(),
      name: rosterName.trim(),
      players: players.map(p => ({
        name: p.name,
        position: p.position,
        isGoalkeeper: p.isGoalkeeper,
      })),
      updatedAt: Date.now(),
    })
    setRosterName('')
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-text mb-1">Players</h2>
          <p className="text-sm text-text-muted">Enter names for all {state.config.squadSize} players</p>
        </div>
        <button
          onClick={() => setShowRosterModal(true)}
          className="text-sm text-primary font-medium px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
        >
          Load roster
        </button>
      </div>

      {/* Player name inputs */}
      <div className="space-y-2">
        {players.map((player, i) => (
          <div key={player.id} className="flex items-center gap-2">
            <span className="w-7 text-sm text-text-muted text-right shrink-0">{i + 1}.</span>
            <input
              type="text"
              placeholder={`Player ${i + 1}`}
              value={player.name}
              onChange={e => dispatch({
                type: 'UPDATE_PLAYER',
                id: player.id,
                updates: { name: e.target.value },
              })}
              className="flex-1 min-h-12 px-4 rounded-xl border-2 border-border text-base
                focus:border-primary focus:outline-none transition-colors
                placeholder:text-gray-300"
              autoFocus={i === 0 && !player.name}
            />
          </div>
        ))}
      </div>

      {/* Save roster */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Roster name (e.g. U10 Tigers)"
          value={rosterName}
          onChange={e => setRosterName(e.target.value)}
          className="flex-1 min-h-10 px-3 rounded-lg border border-border text-sm
            focus:border-primary focus:outline-none transition-colors"
        />
        <button
          onClick={handleSaveRoster}
          disabled={!rosterName.trim() || !allNamed}
          className="px-4 min-h-10 rounded-lg bg-gray-100 text-sm font-medium text-text
            hover:bg-gray-200 active:bg-gray-200 transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>

      {/* Next button */}
      <button
        disabled={!allNamed}
        onClick={() => dispatch({ type: 'NEXT_STEP' })}
        className="w-full min-h-12 rounded-xl bg-primary text-white font-semibold text-base
          hover:bg-primary-dark active:bg-primary-dark transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next: Assign Positions
      </button>

      {/* Roster modal */}
      {showRosterModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-text">Saved Rosters</h3>
              <button
                onClick={() => setShowRosterModal(false)}
                className="p-1 text-text-muted hover:text-text"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {rosters.length === 0 ? (
              <p className="p-6 text-sm text-text-muted text-center">No saved rosters yet</p>
            ) : (
              <div className="divide-y divide-border">
                {rosters.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4">
                    <button
                      onClick={() => handleLoadRoster(r)}
                      className="text-left flex-1"
                    >
                      <div className="font-medium text-text">{r.name}</div>
                      <div className="text-xs text-text-muted">{r.players.length} players</div>
                    </button>
                    <button
                      onClick={() => { deleteRoster(r.id); setShowRosterModal(false); setTimeout(() => setShowRosterModal(true), 10) }}
                      className="p-2 text-danger hover:bg-danger/5 rounded-lg transition-colors"
                      aria-label="Delete roster"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
