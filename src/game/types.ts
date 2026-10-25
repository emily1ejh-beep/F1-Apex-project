export type GameState = 'TITLE' | 'CAR_SELECT' | 'TRACK_SELECT' | 'RACE_SETUP' | 'COUNTDOWN' | 'RACING' | 'PAUSED' | 'FINISHED';

export type GameMode = 'quick_race' | 'time_trial' | 'practice';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'pro';

export type UnderglowColorId = 'cyan' | 'lime' | 'crimson' | 'purple' | 'gold' | 'ice' | 'rainbow' | 'off';

export interface UnderglowConfig {
  id: UnderglowColorId;
  name: string;
  color: string;
  hex: string;
  glow: string;
}

export interface TeamConfig {
  id: string;
  name: string;
  driverName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
  speedRating: number;
  corneringRating: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Checkpoint {
  x: number;
  y: number;
  radius: number;
  index: number;
  angle: number;
}

export interface TrackSceneryItem {
  x: number;
  y: number;
  type: 'tree' | 'light' | 'grandstand' | 'sponsor' | 'yacht' | 'barrier';
  rotation?: number;
  width?: number;
  height?: number;
  color?: string;
  label?: string;
}

export interface TrackConfig {
  id: string;
  name: string;
  location: string;
  country: string;
  flag: string;
  lengthMeters: number;
  lapsDefault: number;
  trackWidth: number;
  centerline: Point[];
  startPosition: Point;
  startAngle: number;
  gridSpots: Array<{ x: number; y: number; angle: number }>;
  checkpoints: Checkpoint[];
  scenery: TrackSceneryItem[];
  theme: 'coastal' | 'neon' | 'desert';
  skyColor: string;
  groundColor: string;
  asphaltColor: string;
  kerbColor1: string;
  kerbColor2: string;
  recordsKey: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'smoke' | 'spark' | 'flame' | 'dust';
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  width: number;
}

export interface Car {
  id: string;
  name: string;
  isPlayer: boolean;
  team: TeamConfig;
  underglow: UnderglowColorId;
  
  // Transform
  x: number;
  y: number;
  angle: number; // in radians
  vx: number;
  vy: number;
  angularVelocity: number;
  steerAngle: number;
  
  // Engine & Dynamics
  speed: number; // in km/h
  rpm: number;
  gear: number;
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  driftSlip: number; // 0 to 1
  isReversing: boolean;
  surfaceType: 'asphalt' | 'kerb' | 'grass' | 'gravel';
  
  // Race Status
  currentLap: number;
  currentCheckpoint: number;
  lapTimes: number[];
  currentLapStartTime: number;
  currentLapTime: number;
  bestLapTime: number | null;
  lastLapTime: number | null;
  totalRaceTime: number;
  isFinished: boolean;
  finishRank: number;
  distanceAlongTrack: number;
  wrongWay: boolean;
  
  // AI props
  targetSpeed: number;
  aiWayIndex: number;
  aiOvertakeOffset: number;
  aiAggression: number;
  aiStuckTimer: number;

  // Collision
  radius: number;
  collidedWithCar: boolean;
  collidedWithWall: boolean;
}

export interface RaceSettings {
  mode: GameMode;
  trackId: string;
  laps: number;
  difficulty: AIDifficulty;
  playerTeamId: string;
  underglowColor: UnderglowColorId;
}

export interface LeaderboardEntry {
  rank: number;
  carId: string;
  driverName: string;
  teamName: string;
  primaryColor: string;
  lap: number;
  gap: string;
  lastLap: string;
  bestLap: string;
  isPlayer: boolean;
  isFinished: boolean;
}
