import { useMatch } from '../../context/MatchContext'
import { StepIndicator } from './StepIndicator'
import { MatchSetupStep } from '../wizard/MatchSetupStep'
import { PlayerEntryStep } from '../wizard/PlayerEntryStep'
import { PositionAssignStep } from '../wizard/PositionAssignStep'
import { ReviewStep } from '../wizard/ReviewStep'
import { ScheduleView } from '../schedule/ScheduleView'
import { LiveMatchView } from '../live/LiveMatchView'

export function AppShell() {
  const { state, dispatch } = useMatch()
  const { currentStep } = state

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto w-full">
      {/* Header */}
      <header className="bg-primary text-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        {currentStep !== 'match-setup' && (
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="p-1 -ml-1 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <h1 className="text-lg font-bold tracking-tight">CoachTime</h1>
        {currentStep !== 'match-setup' && (
          <button
            onClick={() => dispatch({ type: 'RESET_MATCH' })}
            className="ml-auto text-xs text-white/70 hover:text-white transition-colors"
          >
            New match
          </button>
        )}
      </header>

      <StepIndicator current={currentStep} />

      {/* Content */}
      <main className="flex-1 px-4 pb-6">
        {currentStep === 'match-setup' && <MatchSetupStep />}
        {currentStep === 'player-entry' && <PlayerEntryStep />}
        {currentStep === 'position-assign' && <PositionAssignStep />}
        {currentStep === 'review' && <ReviewStep />}
        {currentStep === 'schedule' && <ScheduleView />}
        {currentStep === 'live' && <LiveMatchView />}
      </main>
    </div>
  )
}
