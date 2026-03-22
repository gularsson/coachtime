import type { SubstitutionEvent, Player } from '../../models/types'

interface Props {
  event: SubstitutionEvent
  players: Player[]
  isImminent: boolean
}

export function UpcomingSub({ event, players, isImminent }: Props) {
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      isImminent
        ? 'border-warning bg-warning/10 animate-pulse'
        : 'border-border bg-surface-alt'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-sm font-bold ${isImminent ? 'text-warning' : 'text-text-muted'}`}>
          {isImminent ? 'SUB NOW!' : 'Next sub'}
        </span>
        <span className="text-sm font-bold text-text">{event.minute}'</span>
      </div>
      <div className="space-y-1">
        {event.playersOut.map(id => {
          const p = players.find(pl => pl.id === id)
          return p && (
            <div key={id} className="flex items-center gap-2 text-sm">
              <span className="text-danger font-bold">&darr;</span>
              <span className="text-text">{p.name}</span>
            </div>
          )
        })}
        {event.playersIn.map(id => {
          const p = players.find(pl => pl.id === id)
          return p && (
            <div key={id} className="flex items-center gap-2 text-sm">
              <span className="text-primary font-bold">&uarr;</span>
              <span className="text-text">{p.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
