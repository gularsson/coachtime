export type Position = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface Player {
  id: string;
  name: string;
  position: Position;
  isGoalkeeper: boolean;
}

export type MatchFormat =
  | { kind: 'total'; totalMinutes: number }
  | { kind: 'halves'; count: number; minutesEach: number };

export type SubstitutionMode = 'grouped' | 'rolling';

export interface MatchConfig {
  format: MatchFormat;
  playersOnPitch: number;
  squadSize: number;
  rotateGoalkeeper: boolean;
  substitutionMode: SubstitutionMode;
}

export interface SubstitutionEvent {
  minute: number;
  playersOut: string[]; // player IDs
  playersIn: string[];  // player IDs
}

export interface TimeSlot {
  startMinute: number;
  endMinute: number;
  onPitch: string[];  // player IDs
  offPitch: string[]; // player IDs
}

export interface SubstitutionSchedule {
  timeSlots: TimeSlot[];
  events: SubstitutionEvent[];
  playerMinutes: Record<string, number>; // playerId -> total minutes
  fairnessScore: number; // std deviation — 0 is perfect
}

export interface SavedRoster {
  id: string;
  name: string;
  players: { name: string; position: Position; isGoalkeeper: boolean }[];
  updatedAt: number;
}

export type WizardStep =
  | 'match-setup'
  | 'player-entry'
  | 'position-assign'
  | 'review'
  | 'schedule'
  | 'live';

export interface MatchState {
  currentStep: WizardStep;
  config: MatchConfig;
  players: Player[];
  schedule: SubstitutionSchedule | null;
  liveMinute: number;
  isRunning: boolean;
}
