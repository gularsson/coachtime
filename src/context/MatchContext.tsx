import { createContext, useContext, useReducer, useEffect, type ReactNode, type Dispatch } from 'react'
import type { MatchState, MatchConfig, Player, SubstitutionSchedule, WizardStep } from '../models/types'

const STORAGE_KEY = 'coachtime_match_state'

const WIZARD_STEPS: WizardStep[] = [
  'match-setup', 'player-entry', 'position-assign', 'review', 'schedule', 'live',
]

const defaultConfig: MatchConfig = {
  format: { kind: 'halves', count: 2, minutesEach: 15 },
  playersOnPitch: 7,
  squadSize: 10,
  rotateGoalkeeper: false,
  substitutionMode: 'rolling',
}

const initialState: MatchState = {
  currentStep: 'match-setup',
  config: defaultConfig,
  players: [],
  schedule: null,
  liveMinute: 0,
  isRunning: false,
}

export type MatchAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'UPDATE_CONFIG'; payload: Partial<MatchConfig> }
  | { type: 'SET_PLAYERS'; players: Player[] }
  | { type: 'UPDATE_PLAYER'; id: string; updates: Partial<Player> }
  | { type: 'SET_SCHEDULE'; schedule: SubstitutionSchedule }
  | { type: 'TICK'; minute: number }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'RESET_MATCH' }

function reducer(state: MatchState, action: MatchAction): MatchState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step }
    case 'NEXT_STEP': {
      const idx = WIZARD_STEPS.indexOf(state.currentStep)
      if (idx < WIZARD_STEPS.length - 1) {
        return { ...state, currentStep: WIZARD_STEPS[idx + 1] }
      }
      return state
    }
    case 'PREV_STEP': {
      const idx = WIZARD_STEPS.indexOf(state.currentStep)
      if (idx > 0) {
        return { ...state, currentStep: WIZARD_STEPS[idx - 1] }
      }
      return state
    }
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } }
    case 'SET_PLAYERS':
      return { ...state, players: action.players }
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.id ? { ...p, ...action.updates } : p
        ),
      }
    case 'SET_SCHEDULE':
      return { ...state, schedule: action.schedule }
    case 'TICK':
      return { ...state, liveMinute: action.minute }
    case 'TOGGLE_TIMER':
      return { ...state, isRunning: !state.isRunning }
    case 'RESET_MATCH':
      return { ...initialState }
    default:
      return state
  }
}

function loadState(): MatchState {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      return {
        ...initialState,
        ...parsed,
        config: { ...defaultConfig, ...parsed.config },
        isRunning: false,
      }
    }
  } catch { /* ignore */ }
  return initialState
}

interface MatchContextValue {
  state: MatchState;
  dispatch: Dispatch<MatchAction>;
}

const MatchContext = createContext<MatchContextValue | null>(null)

export function MatchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    const { isRunning, ...rest } = state
    void isRunning // intentionally not persisted
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
    } catch { /* quota exceeded */ }
  }, [state])

  return (
    <MatchContext.Provider value={{ state, dispatch }}>
      {children}
    </MatchContext.Provider>
  )
}

export function useMatch() {
  const ctx = useContext(MatchContext)
  if (!ctx) throw new Error('useMatch must be used within MatchProvider')
  return ctx
}

export { WIZARD_STEPS }
