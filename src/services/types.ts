export enum Position {
  P = 'P',
  C = 'C',
  TB = '1B',
  SB = '2B',
  SS = 'SS',
  FB = '3B',
  LF = 'LF',
  CF = 'CF',
  RF = 'RF',
  DH = 'DH',
  BENCH = 'BN'
}

export type Gender = 'Male' | 'Female' | 'Non-Binary';

export interface SprayChartPoint {
  id: string;
  type: 'Single' | 'Double' | 'Triple' | 'HR' | 'Out';
  directionAngle: number; // -45 (Left Field line) to 45 (Right Field line), 0 is Center
  distance: number; // 0-400+
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
    velocity: number; // Avg Velocity
    usage: number; // Usage % or Pitch Count
}

export interface SeamStatsData {
  sprayChart: SprayChartPoint[];
  pitchArsenal: PitchType[];
  battingTrends: StatTrend[]; // e.g., AVG over last 10 games
  eraTrends: StatTrend[]; // e.g., ERA over season
  recentPitchLog?: DailyPitchStat[]; // Last 7 days velocity/usage
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
  fieldingNotes?: string; // Pro feature: Notes on defensive tendencies
  
  // --- HITTING STANDARD (8) ---
  battingAvg: number; // AVG
  onBasePct: number; // OBP
  sluggingPct: number; // SLG
  ops: number; // OPS
  hits: number; // H
  homeRuns: number; // HR
  rbi: number; // RBI
  stolenBases: number; // SB

  // --- HITTING ADVANCED (8) ---
  iso: number; // Isolated Power
  babip: number; // Batting Avg on Balls In Play
  wOBA: number; // Weighted On-Base Average
  wRCPlus: number; // Weighted Runs Created Plus
  strikeoutRate: number; // K%
  walkRate: number; // BB%
  hardHitPct: number; // Hard Hit %
  lineDrivePct: number; // LD %

  // --- PITCHING STANDARD (8) ---
  wins: number; // W
  losses: number; // L
  era: number; // ERA
  whip: number; // WHIP
  gamesPlayed: number; // G (Pitching)
  saves: number; // SV
  inningsPitched: number; // IP
  strikeouts: number; // SO

  // --- PITCHING ADVANCED (8) ---
  fip: number; // Fielding Independent Pitching
  xFip: number; // Expected FIP
  kPer9: number; // K/9
  bbPer9: number; // BB/9
  hrPer9: number; // HR/9
  pitchingBabip: number; // BABIP against
  lobPct: number; // Left On Base %
  eraPlus: number; // ERA+

  // --- FIELDING STANDARD (8) ---
  fieldingPct: number; // FPCT
  putouts: number; // PO
  assists: number; // A
  fieldingErrors: number; // E
  doublePlays: number; // DP
  passedBalls: number; // PB
  caughtStealing: number; // CS
  stolenBasesAllowed: number; // SB-A

  // --- FIELDING ADVANCED (8) ---
  drs: number; // Defensive Runs Saved
  uzr: number; // Ultimate Zone Rating
  oaa: number; // Outs Above Average
  rangeFactor: number; // RF
  catcherEra: number; // CERA
  popTime: number; // Pop Time
  framingRuns: number; // Framing
  armStrength: number; // Arm Strength Rating (1-100) or velocity

  // Legacy Ratings (Visuals)
  speedRating: number; // 1-10
  defenseRating: number; // 1-10
  
  // Premium Analytics
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
  radarUrl?: string; // Mock URL for radar view
}

export interface ScheduleEvent {
  id: string;
  date: string;
  time: string;
  type: 'Game' | 'Practice' | 'Tournament';
  opponent?: string; // For games
  title?: string; // For practices
  location: string; // Field Name
  address?: string; // Physical Address for Maps
  notes?: string; // Arrival instructions, uniform, etc.
  isHome?: boolean;
  result?: string; // e.g. "W 5-3"
  aiValidation?: string; // Warning message from AI
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
  // SeamScore Lineup Tracking
  lineup: Player[]; 
  currentBatterIndex: number;
}

export interface LeagueSettings {
  name: string;
  teamLogoUrl?: string; // Team Logo URL
  sport: 'Baseball' | 'Softball'; // Visual context
  level: string; // e.g., "8U", "High School Varsity", "NCAA"
  fielderCount: 9 | 10; // Supports 4-outfielder leagues
  rulesContext: string; // Free text for AI context
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
  numPractices: number; // 1-20
  practiceDurationMinutes: number;
  numberOfPlayers: number;
  seasonPhase: SeasonPhase;
  opponentName?: string;
  scoutingNotes?: string;
  selectedFocuses: string[];
  focusAreas: string; // Additional custom notes
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

// Chat / Seam Meeting Types
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
  name: string; // "General" or Coach Name for DM
  isGroup: boolean;
  participantIds: string[]; // Who is in this chat
  messages: ChatMessage[];
  unreadCount: number;
}

export type Screen = 'dashboard' | 'roster' | 'lineup' | 'defense' | 'gamemode' | 'scouting' | 'settings' | 'standings' | 'practice' | 'chat' | 'faq' | 'schedule' | 'subscription' | 'video' | 'account';
