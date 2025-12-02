export const Position = {
  P: 'P',
  C: 'C',
  TB: '1B',
  SB: '2B',
  SS: 'SS',
  FB: '3B',
  LF: 'LF',
  CF: 'CF',
  RF: 'RF',
  DH: 'DH',
  BENCH: 'BN'
} as const;

export type Position = typeof Position[keyof typeof Position];

export type Gender = 'Male' | 'Female' | 'Non-Binary';

export interface SprayChartPoint {
  id: string;
  type: 'Single' | 'Double' | 'Triple' | 'HR' | 'Out';
  directionAngle: number;
  distance: number;
  exitVelocity?: number;
}

export interface PitchType {
  name: string;
  velocity: number;
  usagePct: number;
  color: string;
}

export interface StatTrend {
  date: string;
  value: number;
}

export interface DailyPitchStat {
    date: string;
    velocity: number;
    usage: number;
}

export interface SeamStatsData {
  sprayChart: SprayChartPoint[];
  pitchArsenal: PitchType[];
  battingTrends: StatTrend[];
  eraTrends: StatTrend[];
  recentPitchLog?: DailyPitchStat[];
}

export interface Player {
  id: string;
  name: string;
  number: string;
  gender: Gender;
  imageUrl?: string;
  primaryPosition: Position;
  secondaryPositions: Position[];
  throwHand: 'R' | 'L';
  batHand: 'R' | 'L' | 'S';
  fieldingNotes?: string;
  
  // Hitting
  battingAvg: number;
  onBasePct: number;
  sluggingPct: number;
  ops: number;
  hits: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  iso: number;
  babip: number;
  wOBA: number;
  wRCPlus: number;
  strikeoutRate: number;
  walkRate: number;
  hardHitPct: number;
  lineDrivePct: number;

  // Pitching
  wins: number;
  losses: number;
  era: number;
  whip: number;
  gamesPlayed: number;
  saves: number;
  inningsPitched: number;
  strikeouts: number;
  fip: number;
  xFip: number;
  kPer9: number;
  bbPer9: number;
  hrPer9: number;
  pitchingBabip: number;
  lobPct: number;
  eraPlus: number;

  // Fielding
  fieldingPct: number;
  putouts: number;
  assists: number;
  fieldingErrors: number;
  doublePlays: number;
  passedBalls: number;
  caughtStealing: number;
  stolenBasesAllowed: number;
  drs: number;
  uzr: number;
  oaa: number;
  rangeFactor: number;
  catcherEra: number;
  popTime: number;
  framingRuns: number;
  armStrength: number;

  // Ratings
  speedRating: number;
  defenseRating: number;
  
  seamStats?: SeamStatsData;
}

export interface Standing {
  id: string;
  rank: number;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  gamesBack: number;
  logoUrl?: string;
}

export interface WeatherInfo {
  condition: 'Sunny' | 'Cloudy' | 'Rain' | 'Storm' | 'Windy' | 'Snow';
  temp: number;
  precipChance: number;
  windSpeed?: number;
  radarUrl?: string;
}

export interface ScheduleEvent {
  id: string;
  date: string;
  time: string;
  type: 'Game' | 'Practice' | 'Tournament';
  opponent?: string;
  title?: string;
  location: string;
  address?: string;
  notes?: string;
  isHome?: boolean;
  result?: string;
  aiValidation?: string;
  weather?: WeatherInfo;
}

export interface ScheduleSuggestion {
  reason: string;
  originalEventId?: string;
  suggestedEvent: ScheduleEvent;
}

export interface CalendarStrategy {
  analysis: string;
  suggestions: ScheduleSuggestion[];
}

export interface GameState {
  inning: number;
  isTop: boolean;
  outs: number;
  balls: number;
  strikes: number;
  scoreUs: number;
  scoreThem: number;
  runners: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
  pitchCount: number;
  lineup: Player[]; 
  currentBatterIndex: number;
}

export interface LeagueSettings {
  name: string;
  teamLogoUrl?: string;
  sport: 'Baseball' | 'Softball';
  level: string;
  fielderCount: 9 | 10;
  rulesContext: string;
  pitchCountLimit: number;
  innings: number;
  dhRule: boolean;
}

export interface TeamProfile {
  id: string;
  name: string;
  logoUrl?: string;
  sport: 'Baseball' | 'Softball';
  level: string;
}

export type SubscriptionTier = 'Free' | 'SingleGame' | 'SeasonPass' | 'ProMonthly' | 'ProAnnual';

export type SeasonPhase = 'Preseason' | 'Regular Season' | 'Postseason' | 'Offseason';

export interface PracticePlanRequest {
  numPractices: number;
  practiceDurationMinutes: number;
  numberOfPlayers: number;
  seasonPhase: SeasonPhase;
  opponentName?: string;
  scoutingNotes?: string;
  selectedFocuses: string[];
  focusAreas: string;
}

export interface IndividualWorkoutRequest {
  playerId: string;
  playerName: string;
  position: string;
  focusArea: string;
  intensity: 'Recovery' | 'Maintenance' | 'High Performance';
  durationMinutes: number;
}

export interface DefenseRule {
  id: string;
  label: string;
  description: string;
  active: boolean;
}

export interface Coach {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  isSystem?: boolean;
}

export interface ChatChannel {
  id: string;
  name: string;
  isGroup: boolean;
  participantIds: string[];
  messages: ChatMessage[];
  unreadCount: number;
}

export type Screen = 'dashboard' | 'roster' | 'lineup' | 'defense' | 'gamemode' | 'scouting' | 'settings' | 'standings' | 'practice' | 'chat' | 'faq' | 'schedule' | 'subscription' | 'video' | 'account';