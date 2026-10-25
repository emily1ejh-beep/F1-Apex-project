import { TEAMS } from './constants';
import { soundEngine } from './audio';
import { updateAICar } from './ai';
import { getTrackSurface, InputState, resolveCarCollisions, updateCarPhysics } from './physics';
import { GameRenderer } from './renderer';
import { TRACKS } from './tracks';
import { Car, GameMode, LeaderboardEntry, Particle, RaceSettings, SkidMark, TrackConfig } from './types';

export interface GameTelemetry {
  speed: number;
  rpm: number;
  gear: number;
  position: number;
  totalRacers: number;
  currentLap: number;
  totalLaps: number;
  currentLapTime: number;
  bestLapTime: number | null;
  lastLapTime: number | null;
  gapToLeader: string;
  wrongWay: boolean;
  countdownState: number; // 0 = off, 1-5 = red lights, 6 = green / lights out!
  isFinished: boolean;
  isPaused: boolean;
  leaderboard: LeaderboardEntry[];
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private minimapCanvas: HTMLCanvasElement | null = null;
  private renderer: GameRenderer;
  private track: TrackConfig;
  private settings: RaceSettings;
  private onTelemetryUpdate: (telemetry: GameTelemetry) => void;
  private onRaceFinish: (results: LeaderboardEntry[]) => void;

  private cars: Car[] = [];
  private playerCar!: Car;
  private skidMarks: SkidMark[] = [];
  private particles: Particle[] = [];

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private gameTime: number = 0;

  // Countdown
  private countdownState: number = 0; // 0: inactive, 1-5: red lights, 6: lights out!
  private countdownTimer: number = 0;
  private countdownRandomHold: number = 1.2;

  // Race timing
  private raceStartTime: number = 0;
  private raceFinished: boolean = false;
  private resetCooldown: number = 0;
  private pauseStartTime: number = 0;

  // Inputs
  private keyInputs: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    handbrake: false,
    reset: false,
  };
  private touchInputs: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    handbrake: false,
    reset: false,
  };

  constructor(
    canvas: HTMLCanvasElement,
    settings: RaceSettings,
    onTelemetryUpdate: (telemetry: GameTelemetry) => void,
    onRaceFinish: (results: LeaderboardEntry[]) => void
  ) {
    this.canvas = canvas;
    this.settings = settings;
    this.onTelemetryUpdate = onTelemetryUpdate;
    this.onRaceFinish = onRaceFinish;

    this.renderer = new GameRenderer(canvas);
    this.track = TRACKS[settings.trackId] || TRACKS.coastal;

    this.bindKeyboard();
    this.setupCars();
  }

  public setMinimapCanvas(canvas: HTMLCanvasElement) {
    this.minimapCanvas = canvas;
  }

  public setTouchInput(key: keyof InputState, active: boolean) {
    this.touchInputs[key] = active;
  }

  public resize(width: number, height: number) {
    this.renderer.resize(width, height);
  }

  private bindKeyboard() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  private unbindKeyboard() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Prevent scrolling with arrows/space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keyInputs.up = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keyInputs.down = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keyInputs.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keyInputs.right = true;
        break;
      case 'Space':
        this.keyInputs.handbrake = true;
        break;
      case 'KeyR':
        this.triggerPlayerReset();
        break;
      case 'Escape':
        this.togglePause();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keyInputs.up = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keyInputs.down = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keyInputs.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keyInputs.right = false;
        break;
      case 'Space':
        this.keyInputs.handbrake = false;
        break;
    }
  };

  private handleBlur = () => {
    // Clear all inputs on window blur to avoid stuck accelerator
    this.keyInputs = {
      up: false,
      down: false,
      left: false,
      right: false,
      handbrake: false,
      reset: false,
    };
  };

  private setupCars() {
    this.cars = [];
    const playerTeam = TEAMS.find((t) => t.id === this.settings.playerTeamId) || TEAMS[0];

    // Pick 7 distinct AI teams
    const aiTeams = TEAMS.filter((t) => t.id !== playerTeam.id).slice(0, 7);

    // Grid spots
    const grid = this.track.gridSpots;

    // In Quick Race: Player starts P4 or P1; in Time Trial / Practice: P1 alone
    const playerGridIndex = this.settings.mode === 'quick_race' ? 3 : 0;
    const playerSpot = grid[playerGridIndex] || grid[0];

    // 1. Create Player Car
    this.playerCar = {
      id: 'player',
      name: playerTeam.driverName,
      isPlayer: true,
      team: playerTeam,
      underglow: this.settings.underglowColor,
      x: playerSpot.x,
      y: playerSpot.y,
      angle: playerSpot.angle,
      vx: 0,
      vy: 0,
      angularVelocity: 0,
      steerAngle: 0,
      speed: 0,
      rpm: 4000,
      gear: 1,
      throttle: 0,
      brake: 0,
      driftSlip: 0,
      isReversing: false,
      surfaceType: 'asphalt',
      currentLap: 1,
      currentCheckpoint: 0,
      lapTimes: [],
      currentLapStartTime: 0,
      currentLapTime: 0,
      bestLapTime: this.getPersonalBest(),
      lastLapTime: null,
      totalRaceTime: 0,
      isFinished: false,
      finishRank: 0,
      distanceAlongTrack: 0,
      wrongWay: false,
      targetSpeed: 300,
      aiWayIndex: 0,
      aiOvertakeOffset: 0,
      aiAggression: 0.8,
      aiStuckTimer: 0,
      radius: 17,
      collidedWithCar: false,
      collidedWithWall: false,
    };
    this.cars.push(this.playerCar);

    // 2. Create 7 AI Cars (Quick Race only)
    if (this.settings.mode === 'quick_race') {
      let aiSlotCounter = 0;
      for (let i = 0; i < 8; i++) {
        if (i === playerGridIndex) continue;
        const aiTeam = aiTeams[aiSlotCounter % aiTeams.length];
        aiSlotCounter++;
        const spot = grid[i] || grid[0];

        // Random underglow for AI from presets
        const aiUnderglow = ['cyan', 'lime', 'crimson', 'purple', 'gold', 'ice', 'off'][
          i % 7
        ] as Car['underglow'];

        const aiCar: Car = {
          id: `ai_${i}`,
          name: aiTeam.driverName,
          isPlayer: false,
          team: aiTeam,
          underglow: aiUnderglow,
          x: spot.x,
          y: spot.y,
          angle: spot.angle,
          vx: 0,
          vy: 0,
          angularVelocity: 0,
          steerAngle: 0,
          speed: 0,
          rpm: 4000,
          gear: 1,
          throttle: 0,
          brake: 0,
          driftSlip: 0,
          isReversing: false,
          surfaceType: 'asphalt',
          currentLap: 1,
          currentCheckpoint: 0,
          lapTimes: [],
          currentLapStartTime: 0,
          currentLapTime: 0,
          bestLapTime: null,
          lastLapTime: null,
          totalRaceTime: 0,
          isFinished: false,
          finishRank: 0,
          distanceAlongTrack: 0,
          wrongWay: false,
          targetSpeed: 280,
          aiWayIndex: 0,
          aiOvertakeOffset: 0,
          aiAggression: 0.7 + Math.random() * 0.3,
          aiStuckTimer: 0,
          radius: 17,
          collidedWithCar: false,
          collidedWithWall: false,
        };
        this.cars.push(aiCar);
      }
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.raceFinished = false;

    // Start countdown sequence
    this.countdownState = 1;
    this.countdownTimer = 0;
    this.countdownRandomHold = 0.8 + Math.random() * 0.9;
    soundEngine.playCountdownBeep(false);

    soundEngine.startEngine();
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  public togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.pauseStartTime = performance.now();
      soundEngine.stopEngine();
    } else {
      if (this.pauseStartTime > 0) {
        const pausedDuration = performance.now() - this.pauseStartTime;
        if (pausedDuration > 0) {
          for (const car of this.cars) {
            if (car.currentLapStartTime > 0) {
              car.currentLapStartTime += pausedDuration;
            }
          }
        }
        this.pauseStartTime = 0;
      }
      soundEngine.startEngine();
      this.lastTime = performance.now();
    }
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public triggerPlayerReset() {
    if (this.resetCooldown > 0) return;
    this.resetCooldown = 2.0; // 2 second cooldown

    // Safely place player back on the nearest track centerline facing track direction
    const trackInfo = getTrackSurface(this.playerCar.x, this.playerCar.y, this.track);
    const pts = this.track.centerline;
    const centerPoint = pts[trackInfo.nearestIndex];
    const nextPoint = pts[(trackInfo.nearestIndex + 1) % pts.length];
    const angle = Math.atan2(nextPoint.y - centerPoint.y, nextPoint.x - centerPoint.x);

    this.playerCar.x = centerPoint.x;
    this.playerCar.y = centerPoint.y;
    this.playerCar.angle = angle;
    this.playerCar.vx = 0;
    this.playerCar.vy = 0;
    this.playerCar.angularVelocity = 0;
    this.playerCar.speed = 0;
  }

  private gameLoop = (currentTime: number) => {
    if (!this.isRunning) return;

    const rawDt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    const dt = Math.min(rawDt, 0.05); // Frame clamp

    if (!this.isPaused) {
      this.update(dt);
      this.render();
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private update(dt: number) {
    this.gameTime += dt;
    if (this.resetCooldown > 0) {
      this.resetCooldown -= dt;
    }

    // 1. Starting Lights Countdown Logic
    if (this.countdownState >= 1 && this.countdownState <= 5) {
      this.countdownTimer += dt;
      if (this.countdownTimer >= 0.8) {
        this.countdownTimer = 0;
        this.countdownState += 1;

        if (this.countdownState <= 5) {
          soundEngine.playCountdownBeep(false);
        } else {
          // All 5 red lights are on; wait random duration before turning off
          this.countdownState = 5.5; // holding
        }
      }
    } else if (this.countdownState === 5.5) {
      this.countdownTimer += dt;
      if (this.countdownTimer >= this.countdownRandomHold) {
        // LIGHTS OUT AND AWAY WE GO!
        this.countdownState = 6;
        this.countdownTimer = 0;
        this.raceStartTime = performance.now();
        const now = performance.now();
        for (const car of this.cars) {
          car.currentLapStartTime = now;
        }
        soundEngine.playCountdownBeep(true);
      }
    } else if (this.countdownState === 6) {
      // Show "GO!" for 1.5s then turn off countdown indicator
      this.countdownTimer += dt;
      if (this.countdownTimer >= 1.5) {
        this.countdownState = 0;
      }
    }

    const canDrive = this.countdownState === 0 || this.countdownState === 6;

    // 2. Combine Player Inputs (Keyboard + Touch)
    const combinedPlayerInput: InputState = {
      up: canDrive && (this.keyInputs.up || this.touchInputs.up),
      down: canDrive && (this.keyInputs.down || this.touchInputs.down),
      left: canDrive && (this.keyInputs.left || this.touchInputs.left),
      right: canDrive && (this.keyInputs.right || this.touchInputs.right),
      handbrake: canDrive && (this.keyInputs.handbrake || this.touchInputs.handbrake),
      reset: false,
    };

    // 3. Update Player Physics
    updateCarPhysics(
      this.playerCar,
      combinedPlayerInput,
      this.track,
      dt,
      this.particles,
      this.skidMarks
    );

    // 4. Update AI Opponents
    for (const car of this.cars) {
      if (car.isPlayer) continue;

      let aiInputs: InputState = {
        up: false,
        down: false,
        left: false,
        right: false,
        handbrake: false,
        reset: false,
      };

      if (canDrive && !car.isFinished) {
        aiInputs = updateAICar(car, this.cars, this.track, this.settings.difficulty);
      }

      updateCarPhysics(car, aiInputs, this.track, dt, this.particles, this.skidMarks);
    }

    // 5. Resolve Car-to-Car Collisions
    resolveCarCollisions(this.cars, this.particles);

    // 6. Update Lap Progress & Checkpoints for All Cars
    const now = performance.now();
    for (const car of this.cars) {
      if (car.currentLapStartTime === 0) car.currentLapStartTime = now;
      car.currentLapTime = (now - car.currentLapStartTime) / 1000;

      this.updateCarProgress(car, now);
    }

    // 7. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 8. Update Sound Engine with Player Telemetry
    if (canDrive) {
      const rpmRatio = (this.playerCar.rpm - 4000) / 10500;
      soundEngine.updateEngine(
        rpmRatio,
        combinedPlayerInput.up ? 1.0 : 0.0,
        this.playerCar.driftSlip
      );
    }

    // 9. Check Wrong-Way Driving for Player
    const trackInfo = getTrackSurface(this.playerCar.x, this.playerCar.y, this.track);
    const pts = this.track.centerline;
    const nextPt = pts[(trackInfo.nearestIndex + 1) % pts.length];
    const currPt = pts[trackInfo.nearestIndex];
    const trackTangentAngle = Math.atan2(nextPt.y - currPt.y, nextPt.x - currPt.x);
    let headingDiff = Math.abs(this.playerCar.angle - trackTangentAngle);
    while (headingDiff > Math.PI) headingDiff = 2 * Math.PI - headingDiff;
    this.playerCar.wrongWay = headingDiff > 2.2 && this.playerCar.speed > 25;

    // 10. Compute Leaderboard & Check Race Finish
    const leaderboard = this.computeLeaderboard();

    // Check if player or whole grid finished
    if (this.playerCar.isFinished && !this.raceFinished) {
      this.raceFinished = true;
      soundEngine.playCheckeredFlagFanfare();
      this.onRaceFinish(leaderboard);
    }

    // 11. Broadcast Telemetry to UI
    const leader = leaderboard[0];
    let gapStr = 'LEADER';
    if (!this.playerCar.isFinished && leader && leader.carId !== 'player') {
      const gapLaps = leader.lap - this.playerCar.currentLap;
      if (gapLaps > 0) {
        gapStr = `+${gapLaps} LAP`;
      } else {
        const distDiff = Math.max(0, leader.lap * 10000 - (this.playerCar.currentLap * 10000 + this.playerCar.distanceAlongTrack));
        const gapSeconds = (distDiff / 1800).toFixed(1);
        gapStr = `+${gapSeconds}s`;
      }
    }

    this.onTelemetryUpdate({
      speed: Math.round(this.playerCar.speed),
      rpm: Math.round(this.playerCar.rpm),
      gear: this.playerCar.gear,
      position: this.playerCar.finishRank || this.getPlayerRank(leaderboard),
      totalRacers: this.cars.length,
      currentLap: Math.min(this.playerCar.currentLap, this.settings.laps),
      totalLaps: this.settings.laps,
      currentLapTime: this.playerCar.currentLapTime,
      bestLapTime: this.playerCar.bestLapTime,
      lastLapTime: this.playerCar.lastLapTime,
      gapToLeader: gapStr,
      wrongWay: this.playerCar.wrongWay,
      countdownState: Math.floor(this.countdownState),
      isFinished: this.playerCar.isFinished,
      isPaused: this.isPaused,
      leaderboard,
    });
  }

  /**
   * Validates checkpoints sequentially to prevent track-cutting, and records lap times.
   */
  private updateCarProgress(car: Car, now: number) {
    if (car.isFinished) return;

    const checkpoints = this.track.checkpoints;
    const numCheckpoints = checkpoints.length;
    const nextCpIndex = (car.currentCheckpoint + 1) % numCheckpoints;
    const targetCp = checkpoints[nextCpIndex];

    const distToCp = Math.hypot(car.x - targetCp.x, car.y - targetCp.y);

    if (distToCp < targetCp.radius) {
      car.currentCheckpoint = nextCpIndex;

      // Crossed the start/finish line after completing all prior checkpoints
      if (nextCpIndex === 0) {
        const lapTime = (now - car.currentLapStartTime) / 1000;
        // Require at least 15s elapsed to prevent false lap count on grid launch
        if (lapTime > 15) {
          car.lapTimes.push(lapTime);
          car.lastLapTime = lapTime;

          if (!car.bestLapTime || lapTime < car.bestLapTime) {
            car.bestLapTime = lapTime;
            if (car.isPlayer) {
              this.savePersonalBest(lapTime);
            }
          }

          if (car.isPlayer) {
            soundEngine.playLapChime();
          }

          // Check if finished target laps
          if (car.currentLap >= this.settings.laps && this.settings.mode !== 'practice') {
            car.isFinished = true;
            car.finishRank = this.cars.filter((c) => c.isFinished).length;
          } else {
            car.currentLap += 1;
          }

          car.currentLapStartTime = now;
        }
      }
    }

    // Compute approximate continuous track progress for leaderboard ranking
    car.distanceAlongTrack = car.currentCheckpoint * 200 - distToCp;
  }

  private computeLeaderboard(): LeaderboardEntry[] {
    // Sort cars by (lap * 100000 + checkpoint * 1000 - distToNext)
    const sorted = [...this.cars].sort((a, b) => {
      if (a.isFinished && b.isFinished) return a.finishRank - b.finishRank;
      if (a.isFinished) return -1;
      if (b.isFinished) return 1;

      if (a.currentLap !== b.currentLap) {
        return b.currentLap - a.currentLap;
      }
      return b.distanceAlongTrack - a.distanceAlongTrack;
    });

    return sorted.map((car, idx) => ({
      rank: idx + 1,
      carId: car.id,
      driverName: car.name,
      teamName: car.team.name,
      primaryColor: car.team.primaryColor,
      lap: Math.min(car.currentLap, this.settings.laps),
      gap: idx === 0 ? 'INTERVAL' : `+${(idx * 1.4).toFixed(1)}s`,
      lastLap: car.lastLapTime ? this.formatTime(car.lastLapTime) : '--:--',
      bestLap: car.bestLapTime ? this.formatTime(car.bestLapTime) : '--:--',
      isPlayer: car.isPlayer,
      isFinished: car.isFinished,
    }));
  }

  private getPlayerRank(leaderboard: LeaderboardEntry[]): number {
    const entry = leaderboard.find((l) => l.isPlayer);
    return entry ? entry.rank : 1;
  }

  private render() {
    this.renderer.render(
      this.track,
      this.cars,
      this.playerCar,
      this.skidMarks,
      this.particles,
      this.gameTime
    );

    if (this.minimapCanvas) {
      const ctx = this.minimapCanvas.getContext('2d');
      if (ctx) {
        this.renderer.renderMinimap(
          ctx,
          this.track,
          this.cars,
          this.playerCar,
          this.minimapCanvas.width,
          this.minimapCanvas.height
        );
      }
    }
  }

  public getPersonalBest(): number | null {
    try {
      const saved = localStorage.getItem(this.track.recordsKey);
      return saved ? parseFloat(saved) : null;
    } catch {
      return null;
    }
  }

  private savePersonalBest(time: number) {
    try {
      const existing = this.getPersonalBest();
      if (!existing || time < existing) {
        localStorage.setItem(this.track.recordsKey, time.toFixed(3));
      }
    } catch {
      // Safe no-op
    }
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  public restart() {
    this.stop();
    this.setupCars();
    this.skidMarks = [];
    this.particles = [];
    this.start();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    soundEngine.stopEngine();
    this.unbindKeyboard();
  }
}
