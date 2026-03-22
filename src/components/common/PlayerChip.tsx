import type { Player } from '../../models/types'

const POS_COLORS: Record<string, string> = {
  GK: 'bg-pos-gk/15 text-pos-gk border-pos-gk/30',
  DEF: 'bg-pos-def/15 text-pos-def border-pos-def/30',
  MID: 'bg-pos-mid/15 text-pos-mid border-pos-mid/30',
  FWD: 'bg-pos-fwd/15 text-pos-fwd border-pos-fwd/30',
}

export function PlayerChip({ player, size = 'sm' }: { player: Player; size?: 'sm' | 'md' }) {
  const colors = POS_COLORS[player.position] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  const sizeClasses = size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${colors} ${sizeClasses}`}>
      <span className="font-bold opacity-70">{player.position}</span>
      <span>{player.name}</span>
    </span>
  )
}
