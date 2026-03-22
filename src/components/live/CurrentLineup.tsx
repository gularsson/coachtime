import type { Player } from '../../models/types'
import { PlayerChip } from '../common/PlayerChip'

interface Props {
  onPitch: Player[]
  offPitch: Player[]
}

export function CurrentLineup({ onPitch, offPitch }: Props) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
        <h3 className="text-xs font-bold text-primary mb-2 uppercase tracking-wide">On Pitch</h3>
        <div className="flex flex-wrap gap-1.5">
          {onPitch.map(p => (
            <PlayerChip key={p.id} player={p} size="md" />
          ))}
        </div>
      </div>

      {offPitch.length > 0 && (
        <div className="rounded-xl border-2 border-border p-3">
          <h3 className="text-xs font-bold text-text-muted mb-2 uppercase tracking-wide">Bench</h3>
          <div className="flex flex-wrap gap-1.5">
            {offPitch.map(p => (
              <PlayerChip key={p.id} player={p} size="md" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
