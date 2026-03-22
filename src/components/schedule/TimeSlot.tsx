import type { TimeSlot as TimeSlotType, Player } from '../../models/types'
import { PlayerChip } from '../common/PlayerChip'

interface Props {
  slot: TimeSlotType
  players: Player[]
  isFirst: boolean
  subsIn?: string[]
  subsOut?: string[]
}

export function TimeSlotCard({ slot, players, isFirst, subsIn, subsOut }: Props) {
  const onPitch = slot.onPitch.map(id => players.find(p => p.id === id)!).filter(Boolean)
  const offPitch = slot.offPitch.map(id => players.find(p => p.id === id)!).filter(Boolean)

  return (
    <div className="relative">
      {/* Sub event indicator */}
      {!isFirst && (subsIn?.length || subsOut?.length) && (
        <div className="flex items-center gap-2 py-2 px-3 mb-2 rounded-lg bg-warning/10 border border-warning/20">
          <span className="text-xs font-bold text-warning">{slot.startMinute}'</span>
          <div className="flex flex-wrap gap-1 text-xs">
            {subsOut?.map(id => {
              const p = players.find(pl => pl.id === id)
              return p && (
                <span key={id} className="text-danger">
                  &darr; {p.name}
                </span>
              )
            })}
            {subsIn?.map(id => {
              const p = players.find(pl => pl.id === id)
              return p && (
                <span key={id} className="text-primary">
                  &uarr; {p.name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Slot card */}
      <div className="rounded-xl border-2 border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted">
            {slot.startMinute}' — {slot.endMinute}'
          </span>
          <span className="text-xs text-text-muted">
            {slot.endMinute - slot.startMinute} min
          </span>
        </div>

        {/* On pitch */}
        <div className="flex flex-wrap gap-1">
          {onPitch.map(p => (
            <PlayerChip key={p.id} player={p} />
          ))}
        </div>

        {/* Bench */}
        {offPitch.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
            <span className="text-[10px] text-text-muted mr-1 self-center">BENCH</span>
            {offPitch.map(p => (
              <span key={p.id} className="text-xs text-text-muted">{p.name}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
