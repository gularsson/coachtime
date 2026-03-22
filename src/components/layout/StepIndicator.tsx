import type { WizardStep } from '../../models/types'
import { WIZARD_STEPS } from '../../context/MatchContext'

const STEP_LABELS: Record<WizardStep, string> = {
  'match-setup': 'Setup',
  'player-entry': 'Players',
  'position-assign': 'Positions',
  'review': 'Review',
  'schedule': 'Schedule',
  'live': 'Live',
}

export function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = WIZARD_STEPS.indexOf(current)
  // Only show wizard steps (first 4)
  const wizardSteps = WIZARD_STEPS.slice(0, 4)

  if (currentIdx >= 4) return null

  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4">
      {wizardSteps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={`
            flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors
            ${i === currentIdx
              ? 'bg-primary text-white'
              : i < currentIdx
                ? 'bg-primary/10 text-primary'
                : 'bg-gray-100 text-text-muted'
            }
          `}>
            <span className={`
              w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
              ${i === currentIdx
                ? 'bg-white/20'
                : i < currentIdx
                  ? 'bg-primary/20'
                  : 'bg-gray-200'
              }
            `}>
              {i < currentIdx ? '✓' : i + 1}
            </span>
            <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
          </div>
          {i < wizardSteps.length - 1 && (
            <div className={`w-6 h-0.5 ${i < currentIdx ? 'bg-primary' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
