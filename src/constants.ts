
import { Position, LeagueSettings, Standing, DefenseRule, Coach, ChatChannel, Player, ScheduleEvent, TeamProfile } from './types';

export const LEAGUE_LEVELS = [
  { group: 'Youth / Travel (Age Based)', levels: ['8U', '9U', '10U', '11U', '12U', '13U', '14U', '15U', '16U', '17U', '18U'] },
  { group: 'Little League', levels: ['Tee Ball', 'Minors (Coach Pitch)', 'Minors (Player Pitch)', 'Majors', 'Intermediate (50/70)', 'Junior League', 'Senior League'] },
  { group: 'Cal Ripken / Babe Ruth', levels: ['Cal Ripken - Rookie', 'Cal Ripken - Minor', 'Cal Ripken - Major/60', 'Cal Ripken - Major/70', 'Babe Ruth 13-15', 'Babe Ruth 16-18'] },
  { group: 'Perfect Game', levels: ['PG 9U', 'PG 10U', 'PG 11U', 'PG 12U', 'PG 13U', 'PG 14U', 'PG 15U', 'PG 16U', 'PG 17U', 'PG 18U'] },
  { group: 'Scholastic', levels: ['Middle School', 'High School Freshman', 'High School JV', 'High School Varsity'] },
  { group: 'Collegiate', levels: ['JUCO', 'NAIA', 'NCAA D3', 'NCAA D2', 'NCAA D1'] },
  { group: 'Softball', levels: ['Softball 8U', 'Softball 10U', 'Softball 12U', 'Softball 14U', 'Softball 16U', 'Softball 18U', 'Softball Collegiate'] },
];

export const INITIAL_LEAGUE_SETTINGS: LeagueSettings = {
  name: 'SeamStrike Elite',
  sport: 'Baseball',
  level: '12U',
  fielderCount: 9,
  rulesContext: 'Standard rules. Strict pitch counts.',
  pitchCountLimit: 85,
  innings: 6,
  dhRule: false
};

export const MOCK_TEAMS: TeamProfile[] = [
    { id: 't1', name: 'SeamStrike Elite', sport: 'Baseball', level: '12U', logoUrl: '' },
    { id: 't2', name: 'Lady Vipers', sport: 'Softball', level: 'Softball 14U', logoUrl: '' },
    { id: 't3', name: 'North High Varsity', sport: 'Baseball', level: 'High School Varsity', logoUrl: '' },
];

export const POSITIONS_LIST = [
  Position.P, Position.C, Position.TB, Position.SB, Position.FB, Position.SS, Position.LF, Position.CF, Position.RF, Position.DH
];

export const MOCK_STANDINGS: Standing[] = [
  { id: '1', rank: 1, teamName: 'SeamStrike Elite', wins: 14, losses: 2, ties: 0, winPct: .875, gamesBack: 0 },
  { id: '2', rank: 2, teamName: 'Diamond Dogs', wins: 12, losses: 4, ties: 0, winPct: .750, gamesBack: 2.0 },
  { id: '3', rank: 3, teamName: 'River Cats', wins: 10, losses: 6, ties: 0, winPct: .625, gamesBack: 4.0 },
  { id: '4', rank: 4, teamName: 'Thunder', wins: 8, losses: 8, ties: 0, winPct: .500, gamesBack: 6.0 },
  { id: '5', rank: 5, teamName: 'Cyclones', wins: 4, losses: 12, ties: 0, winPct: .250, gamesBack: 10.0 },
  { id: '6', rank: 6, teamName: 'Vipers', wins: 0, losses: 16, ties: 0, winPct: .000, gamesBack: 14.0 },
];

export const DEFENSIVE_RULES: DefenseRule[] = [
  { id: 'fair_play', label: 'Fair Play (Equal Innings)', description: 'Ensure all players sit on the bench approximately the same amount of times.', active: true },
  { id: 'no_consecutive_bench', label: 'No Consecutive Bench Innings', description: 'A player cannot sit on the bench for two innings in a row.', active: true },
  { id: 'infield_rotation', label: 'Mandatory Infield Play', description: 'Every player must play at least 1 inning in the infield.', active: false },
  { id: 'no_sit_starters', label: 'Starters Never Sit', description: 'Top 4 players by defense rating play 100% of innings.', active: false },
  { id: 'rotate_catcher', label: 'Rotate Catcher Every 2 Innings', description: 'Switch catchers frequently to save legs.', active: false },
  { id: 'protect_pitcher', label: 'Pitcher Rests After Outing', description: 'Pitchers must go to Bench or DH after pitching (cannot go to field).', active: false },
];

// Helper to create blank stats
const baseStats = {
  // Hit Std
  sluggingPct: 0, hits: 0, homeRuns: 0, rbi: 0, stolenBases: 0,
  // Hit Adv
  iso: 0, babip: 0, wOBA: 0, wRCPlus: 0, strikeoutRate: 0, walkRate: 0, hardHitPct: 0, lineDrivePct: 0,
  // Pitch Std
  gamesPlayed: 0,
  // Pitch Adv
  fip: 0, xFip: 0, kPer9: 0, bbPer9: 0, hrPer9: 0, pitchingBabip: 0, lobPct: 0, eraPlus: 0,
  // Field Std
  fieldingPct: 0, putouts: 0, assists: 0, doublePlays: 0, passedBalls: 0, caughtStealing: 0, stolenBasesAllowed: 0,
  // Field Adv
  drs: 0, uzr: 0, oaa: 0, rangeFactor: 0, catcherEra: 0, popTime: 0, framingRuns: 0, armStrength: 50
};

export const MOCK_ROSTER: Player[] = [
  { 
    ...baseStats,
    id: '1', name: 'Alex Rodriguez', number: '13', gender: 'Male', primaryPosition: Position.SS, secondaryPositions: [Position.FB], 
    battingAvg: .350, onBasePct: .420, ops: .980, speedRating: 8, defenseRating: 9, throwHand: 'R', batHand: 'R',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 12,
    homeRuns: 35, rbi: 110, hits: 180, sluggingPct: .560, iso: .210, wRCPlus: 140,
    fieldingNotes: 'Great range but tends to rush throws on slow rollers. Shifts deep for righties.',
    seamStats: {
      sprayChart: [
        { id: '1', type: 'HR', directionAngle: -20, distance: 380, exitVelocity: 105 },
        { id: '2', type: 'Single', directionAngle: 15, distance: 150, exitVelocity: 90 },
        { id: '3', type: 'Double', directionAngle: -40, distance: 290, exitVelocity: 98 },
        { id: '4', type: 'Out', directionAngle: 5, distance: 300, exitVelocity: 92 },
        { id: '5', type: 'Out', directionAngle: -10, distance: 180, exitVelocity: 85 },
      ],
      pitchArsenal: [],
      battingTrends: [{ date: 'Apr', value: .280 }, { date: 'May', value: .310 }, { date: 'Jun', value: .350 }],
      eraTrends: []
    }
  },
  { 
    ...baseStats,
    id: '2', name: 'Derek Jeter', number: '2', gender: 'Male', primaryPosition: Position.SS, secondaryPositions: [], 
    battingAvg: .310, onBasePct: .380, ops: .850, speedRating: 7, defenseRating: 8, throwHand: 'R', batHand: 'R',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 8,
    hits: 200, stolenBases: 15, fieldingPct: .980, drs: 5,
    fieldingNotes: 'Consistent. Not the best range to the left but very reliable hands. Jump throw specialist.'
  },
  { 
    ...baseStats,
    id: '3', name: 'David Ortiz', number: '34', gender: 'Male', primaryPosition: Position.DH, secondaryPositions: [Position.TB], 
    battingAvg: .286, onBasePct: .380, ops: .950, speedRating: 2, defenseRating: 3, throwHand: 'L', batHand: 'L',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 0,
    homeRuns: 40, rbi: 120, iso: .250, wOBA: .390,
    seamStats: {
        sprayChart: [
          { id: '1', type: 'HR', directionAngle: 35, distance: 390, exitVelocity: 108 },
          { id: '2', type: 'HR', directionAngle: 40, distance: 380, exitVelocity: 106 },
          { id: '3', type: 'Double', directionAngle: 42, distance: 310, exitVelocity: 100 },
          { id: '4', type: 'Single', directionAngle: 5, distance: 180, exitVelocity: 95 },
        ],
        pitchArsenal: [],
        battingTrends: [{ date: 'Apr', value: .220 }, { date: 'May', value: .260 }, { date: 'Jun', value: .286 }],
        eraTrends: []
    }
  },
  { 
    ...baseStats,
    id: '4', name: 'Ichiro Suzuki', number: '51', gender: 'Male', primaryPosition: Position.RF, secondaryPositions: [Position.CF], 
    battingAvg: .330, onBasePct: .390, ops: .800, speedRating: 10, defenseRating: 10, throwHand: 'R', batHand: 'L',
    era: 4.50, whip: 1.50, wins: 1, losses: 0, strikeouts: 5, inningsPitched: 5.2, saves: 0, fieldingErrors: 1,
    hits: 240, stolenBases: 45, armStrength: 95, drs: 15, uzr: 12,
    fieldingNotes: 'Elite arm. Do not run on him. Covers gaps extremely well.'
  },
  { 
    ...baseStats,
    id: '5', name: 'Mike Trout', number: '27', gender: 'Male', primaryPosition: Position.CF, secondaryPositions: [Position.LF], 
    battingAvg: .305, onBasePct: .410, ops: 1.050, speedRating: 9, defenseRating: 9, throwHand: 'R', batHand: 'R',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 2,
    homeRuns: 30, wRCPlus: 180, oaa: 8
  },
  { 
    ...baseStats,
    id: '6', name: 'Clayton Kershaw', number: '22', gender: 'Male', primaryPosition: Position.P, secondaryPositions: [], 
    battingAvg: .150, onBasePct: .180, ops: .350, speedRating: 3, defenseRating: 7, throwHand: 'L', batHand: 'L',
    era: 2.43, whip: 1.00, wins: 18, losses: 4, strikeouts: 200, inningsPitched: 180, saves: 0, fieldingErrors: 0,
    fip: 2.50, kPer9: 10.5, bbPer9: 1.8, pitchingBabip: .270,
    fieldingNotes: 'Excellent move to first. Quick to the plate with runners on.',
    seamStats: {
        sprayChart: [],
        pitchArsenal: [
            { name: '4-Seam Fastball', velocity: 92, usagePct: 40, color: '#ef4444' },
            { name: 'Slider', velocity: 86, usagePct: 35, color: '#f59e0b' },
            { name: 'Curveball', velocity: 74, usagePct: 25, color: '#3b82f6' }
        ],
        battingTrends: [],
        eraTrends: [{ date: 'Apr', value: 3.10 }, { date: 'May', value: 2.80 }, { date: 'Jun', value: 2.43 }],
        recentPitchLog: [
            { date: '10/1', velocity: 91.5, usage: 45 },
            { date: '10/2', velocity: 92.0, usage: 48 },
            { date: '10/3', velocity: 91.8, usage: 42 },
            { date: '10/4', velocity: 92.2, usage: 50 },
            { date: '10/5', velocity: 91.0, usage: 38 },
            { date: '10/6', velocity: 92.5, usage: 52 },
            { date: '10/7', velocity: 93.1, usage: 55 },
        ]
    }
  },
  { 
    ...baseStats,
    id: '7', name: 'Buster Posey', number: '28', gender: 'Male', primaryPosition: Position.C, secondaryPositions: [Position.TB], 
    battingAvg: .302, onBasePct: .370, ops: .880, speedRating: 4, defenseRating: 9, throwHand: 'R', batHand: 'R',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 3,
    catcherEra: 3.10, framingRuns: 10, popTime: 1.95,
    fieldingNotes: 'Elite framing. Manages staff well. Pop time is average but accuracy is high.'
  },
  { 
    ...baseStats,
    id: '8', name: 'Nolan Arenado', number: '28', gender: 'Male', primaryPosition: Position.FB, secondaryPositions: [], 
    battingAvg: .290, onBasePct: .350, ops: .900, speedRating: 5, defenseRating: 10, throwHand: 'R', batHand: 'R',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 5,
    drs: 15, uzr: 10,
    fieldingNotes: 'Gold glove. Plays shallow. Barehand specialist on bunts.'
  },
  { 
    ...baseStats,
    id: '9', name: 'Mookie Betts', number: '50', gender: 'Male', primaryPosition: Position.RF, secondaryPositions: [Position.SB], 
    battingAvg: .300, onBasePct: .380, ops: .920, speedRating: 9, defenseRating: 10, throwHand: 'R', batHand: 'R',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 1,
    drs: 20, armStrength: 92
  },
  { 
    ...baseStats,
    id: '10', name: 'Shohei Ohtani', number: '17', gender: 'Male', primaryPosition: Position.P, secondaryPositions: [Position.DH], 
    battingAvg: .295, onBasePct: .390, ops: 1.020, speedRating: 9, defenseRating: 8, throwHand: 'R', batHand: 'L',
    era: 3.14, whip: 1.08, wins: 15, losses: 9, strikeouts: 219, inningsPitched: 150, saves: 0, fieldingErrors: 2,
    homeRuns: 45, kPer9: 12.5, fip: 2.90,
    seamStats: {
        sprayChart: [
            { id: '1', type: 'HR', directionAngle: 0, distance: 410, exitVelocity: 110 },
            { id: '2', type: 'HR', directionAngle: -35, distance: 385, exitVelocity: 108 },
            { id: '3', type: 'Double', directionAngle: 30, distance: 320, exitVelocity: 105 },
            { id: '4', type: 'Single', directionAngle: 10, distance: 190, exitVelocity: 98 },
        ],
        pitchArsenal: [
            { name: '4-Seam', velocity: 98, usagePct: 45, color: '#ef4444' },
            { name: 'Sweeper', velocity: 84, usagePct: 30, color: '#8b5cf6' },
            { name: 'Splitter', velocity: 89, usagePct: 25, color: '#10b981' }
        ],
        battingTrends: [{ date: 'Apr', value: .250 }, { date: 'May', value: .285 }, { date: 'Jun', value: .295 }],
        eraTrends: [{ date: 'Apr', value: 4.10 }, { date: 'May', value: 3.50 }, { date: 'Jun', value: 3.14 }],
        recentPitchLog: [
            { date: '10/1', velocity: 97.2, usage: 40 },
            { date: '10/2', velocity: 98.1, usage: 45 },
            { date: '10/3', velocity: 96.9, usage: 35 },
            { date: '10/4', velocity: 98.5, usage: 50 },
            { date: '10/5', velocity: 99.0, usage: 55 },
            { date: '10/6', velocity: 97.8, usage: 48 },
            { date: '10/7', velocity: 98.2, usage: 52 },
        ]
    }
  },
  { 
    ...baseStats,
    id: '11', name: 'Freddie Freeman', number: '5', gender: 'Male', primaryPosition: Position.TB, secondaryPositions: [], 
    battingAvg: .315, onBasePct: .400, ops: .940, speedRating: 5, defenseRating: 8, throwHand: 'R', batHand: 'L',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 4,
    hits: 190
  },
  { 
    ...baseStats,
    id: '12', name: 'Jose Altuve', number: '27', gender: 'Male', primaryPosition: Position.SB, secondaryPositions: [], 
    battingAvg: .307, onBasePct: .360, ops: .870, speedRating: 8, defenseRating: 7, throwHand: 'R', batHand: 'R',
    era: 0.00, whip: 0.00, wins: 0, losses: 0, strikeouts: 0, inningsPitched: 0, saves: 0, fieldingErrors: 7,
    hits: 175
  },
];

export const MOCK_COACHES: Coach[] = [
  { id: 'me', name: 'Head Coach (You)', role: 'Manager', isOnline: true },
  { id: 'c1', name: 'Coach Miller', role: 'Pitching', isOnline: true },
  { id: 'c2', name: 'Coach Davis', role: 'Hitting', isOnline: false },
  { id: 'c3', name: 'Coach Wilson', role: 'Bench / Stats', isOnline: true },
];

export const MOCK_CHATS: ChatChannel[] = [
  {
    id: 'general',
    name: 'All Coaches',
    isGroup: true,
    participantIds: ['me', 'c1', 'c2', 'c3'],
    unreadCount: 0,
    messages: [
      { id: 'm1', senderId: 'c1', text: 'Practice field confirmed for Tuesday at 5pm.', timestamp: new Date(Date.now() - 86400000) },
      { id: 'm2', senderId: 'me', text: 'Great. Let\'s focus on bunt defense.', timestamp: new Date(Date.now() - 86000000) },
      { id: 'm3', senderId: 'c2', text: 'I will bring the new bats.', timestamp: new Date(Date.now() - 3600000) },
    ]
  },
  {
    id: 'pitching_strat',
    name: 'Pitching Strategy',
    isGroup: true,
    participantIds: ['me', 'c1'],
    unreadCount: 2,
    messages: [
      { id: 'm4', senderId: 'c1', text: 'Kershaw looks good for the opener.', timestamp: new Date(Date.now() - 7200000) },
      { id: 'm5', senderId: 'c1', text: 'Ohtani can close if needed.', timestamp: new Date(Date.now() - 7100000) },
    ]
  },
  {
    id: 'dm_c3',
    name: 'Coach Wilson',
    isGroup: false,
    participantIds: ['me', 'c3'],
    unreadCount: 0,
    messages: [
      { id: 'm6', senderId: 'c3', text: 'Did you see the scouting report?', timestamp: new Date(Date.now() - 120000) },
    ]
  }
];

export const MOCK_SCHEDULE: ScheduleEvent[] = [
  { 
      id: 's1', date: '2023-10-15', time: '17:00', type: 'Practice', title: 'Team Practice', location: 'Field 4', 
      address: '123 Park Ave, Springfield', notes: 'Full gear. Focus on infield drills.',
      weather: { condition: 'Sunny', temp: 75, precipChance: 0, windSpeed: 5, radarUrl: 'mock-radar' }
  },
  { 
      id: 's2', date: '2023-10-17', time: '18:30', type: 'Game', opponent: 'Diamond Dogs', location: 'Home', isHome: true, result: 'W 5-3',
      address: 'SeamStrike Stadium, 500 Main St', notes: 'Arrive 1 hour early for warmups. Wearing Grey uniforms.',
      weather: { condition: 'Cloudy', temp: 68, precipChance: 10, windSpeed: 8, radarUrl: 'mock-radar' }
  },
  { 
      id: 's3', date: '2023-10-21', time: '14:00', type: 'Game', opponent: 'River Cats', location: 'Away', isHome: false,
      address: 'Riverside Park, 99 River Rd', notes: 'Wear White uniforms.',
      weather: { condition: 'Rain', temp: 60, precipChance: 60, windSpeed: 12, radarUrl: 'mock-radar' }
  },
  { 
      id: 's4', date: '2023-10-24', time: '17:30', type: 'Practice', title: 'Batting Cage', location: 'Sluggers Gym',
      address: '445 Industrial Way', notes: 'Bring turf shoes.',
      weather: { condition: 'Storm', temp: 55, precipChance: 90, windSpeed: 15, radarUrl: 'mock-radar' }
  },
  { 
      id: 's5', date: '2023-10-28', time: '10:00', type: 'Tournament', opponent: 'Regional Qualifier', location: 'Complex A', isHome: true,
      address: 'Sportsplex Dr, Metro City', notes: 'Double header possible.',
      weather: { condition: 'Sunny', temp: 72, precipChance: 0, windSpeed: 3, radarUrl: 'mock-radar' }
  },
];
