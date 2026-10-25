import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine, GameTelemetry } from './game/engine';
import { RaceHUD } from './components/RaceHUD';
import { TitleScreen } from './components/TitleScreen';
import { CarSelectModal } from './components/CarSelectModal';
import { TrackSelectModal } from './components/TrackSelectModal';
import { PauseModal } from './components/PauseModal';
import { ResultsModal } from './components/ResultsModal';
import { SettingsModal } from './components/SettingsModal';
import { GameState, LeaderboardEntry, RaceSettings, UnderglowColorId } from './game/types';
import { soundEngine } from './game/audio';
import { TRACKS } from './game/tracks';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Game UI State Machine
  const [gameState, setGameState] = useState<GameState>('TITLE');

  // Modals
  const [carSelectOpen, setCarSelectOpen] = useState(false);
  const [trackSelectOpen, setTrackSelectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Audio & Controls
  const [isMuted, setIsMuted] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);

  // Settings
  const [settings, setSettings] = useState<RaceSettings>(() => {
    // Attempt restoring saved settings from localStorage
    try {
      const savedUnderglow = (localStorage.getItem('apex_rush_underglow') as UnderglowColorId) || 'cyan';
      let savedTeam = localStorage.getItem('apex_rush_team') || 'red_bull';
      if (savedTeam === 'apex_bull' || !['red_bull', 'ferrari', 'mercedes', 'mclaren', 'aston_martin', 'alpine', 'williams', 'haas'].includes(savedTeam)) {
        savedTeam = 'red_bull';
      }
      const savedTrack = localStorage.getItem('apex_rush_track') || 'coastal';
      return {
        mode: 'quick_race',
        trackId: savedTrack,
        laps: 5,
        difficulty: 'medium',
        playerTeamId: savedTeam,
        underglowColor: savedUnderglow,
      };
    } catch {
      return {
        mode: 'quick_race',
        trackId: 'coastal',
        laps: 5,
        difficulty: 'medium',
        playerTeamId: 'red_bull',
        underglowColor: 'cyan',
      };
    }
  });

  // Telemetry updated from Engine without causing full page re-render jitter
  const [telemetry, setTelemetry] = useState<GameTelemetry>({
    speed: 0,
    rpm: 4000,
    gear: 1,
    position: 1,
    totalRacers: 8,
    currentLap: 1,
    totalLaps: 5,
    currentLapTime: 0,
    bestLapTime: null,
    lastLapTime: null,
    gapToLeader: 'LEADER',
    wrongWay: false,
    countdownState: 0,
    isFinished: false,
    isPaused: false,
    leaderboard: [],
  });

  const [raceResults, setRaceResults] = useState<LeaderboardEntry[]>([]);

  // Detect touch capability on mount
  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setShowTouchControls(isTouch);
  }, []);

  // Update Settings helper
  const handleUpdateSettings = useCallback((partial: Partial<RaceSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      try {
        if (partial.underglowColor) localStorage.setItem('apex_rush_underglow', partial.underglowColor);
        if (partial.playerTeamId) localStorage.setItem('apex_rush_team', partial.playerTeamId);
        if (partial.trackId) localStorage.setItem('apex_rush_track', partial.trackId);
      } catch {
        // Safe no-op
      }
      return updated;
    });
  }, []);

  // Resize canvas to window dimensions
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvasRef.current.width = w;
    canvasRef.current.height = h;
    if (engineRef.current) {
      engineRef.current.resize(w, h);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Start Race
  const startRace = useCallback(() => {
    if (!canvasRef.current) return;

    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }

    const engine = new GameEngine(
      canvasRef.current,
      settings,
      (newTelemetry) => {
        setTelemetry(newTelemetry);
      },
      (results) => {
        setRaceResults(results);
        setGameState('FINISHED');
      }
    );

    if (minimapCanvasRef.current) {
      engine.setMinimapCanvas(minimapCanvasRef.current);
    }

    engineRef.current = engine;
    engine.start();
    setGameState('RACING');
  }, [settings]);

  // Attach minimap canvas if engine exists and element mounts
  useEffect(() => {
    if (engineRef.current && minimapCanvasRef.current) {
      engineRef.current.setMinimapCanvas(minimapCanvasRef.current);
    }
  }, [gameState]);

  // Pause / Resume
  const handlePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.togglePause();
    setGameState(engineRef.current.getIsPaused() ? 'PAUSED' : 'RACING');
  }, []);

  const handleResume = useCallback(() => {
    if (!engineRef.current) return;
    if (engineRef.current.getIsPaused()) {
      engineRef.current.togglePause();
    }
    setGameState('RACING');
  }, []);

  // Restart Race
  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restart();
      setGameState('RACING');
    } else {
      startRace();
    }
  }, [startRace]);

  // Quit to Title Menu
  const handleQuitToMenu = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
      engineRef.current = null;
    }
    setGameState('TITLE');
  }, []);

  // Next Track in Grand Prix
  const handleNextTrack = useCallback(() => {
    const trackKeys = Object.keys(TRACKS);
    const currIdx = trackKeys.indexOf(settings.trackId);
    const nextTrackId = trackKeys[(currIdx + 1) % trackKeys.length];

    handleUpdateSettings({ trackId: nextTrackId });
    setTimeout(() => {
      startRace();
    }, 50);
  }, [settings.trackId, handleUpdateSettings, startRace]);

  // Audio Toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Touch Input Dispatch
  const handleTouchInput = useCallback((key: 'up' | 'down' | 'left' | 'right' | 'handbrake', active: boolean) => {
    if (engineRef.current) {
      engineRef.current.setTouchInput(key, active);
    }
  }, []);

  // Car Reset
  const handleResetCar = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerPlayerReset();
    }
  }, []);

  // Fetch personal best for selected track
  const currentTrackConfig = TRACKS[settings.trackId] || TRACKS.coastal;
  const personalBest = (() => {
    try {
      const saved = localStorage.getItem(currentTrackConfig.recordsKey);
      return saved ? parseFloat(saved) : null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none">
      {/* Primary 2D Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block z-0"
      />

      {/* Floating Circuit Minimap Canvas (Active during racing or pause) */}
      {(gameState === 'RACING' || gameState === 'PAUSED') && (
        <div className="absolute top-4 right-18 sm:right-24 z-20 pointer-events-none rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black/70">
          <canvas
            ref={minimapCanvasRef}
            width={130}
            height={90}
            className="block"
          />
        </div>
      )}

      {/* Title Screen Overlay */}
      {gameState === 'TITLE' && (
        <TitleScreen
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onStartRace={startRace}
          onOpenCarSelect={() => setCarSelectOpen(true)}
          onOpenTrackSelect={() => setTrackSelectOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          personalBest={personalBest}
        />
      )}

      {/* In-Game Race HUD Overlay */}
      {(gameState === 'RACING' || gameState === 'PAUSED') && (
        <RaceHUD
          telemetry={telemetry}
          underglowColor={settings.underglowColor}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
          onResetCar={handleResetCar}
          onTouchInput={handleTouchInput}
          showTouchControls={showTouchControls}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onQuit={handleQuitToMenu}
          onOpenSettings={() => setSettingsOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Race Finished Results & Podium Modal */}
      {gameState === 'FINISHED' && (
        <ResultsModal
          results={raceResults}
          trackName={currentTrackConfig.name}
          onRestart={handleRestart}
          onNextTrack={handleNextTrack}
          onQuit={handleQuitToMenu}
        />
      )}

      {/* Car & Underglow Selection Modal */}
      {carSelectOpen && (
        <CarSelectModal
          currentTeamId={settings.playerTeamId}
          currentUnderglow={settings.underglowColor}
          onSave={(playerTeamId, underglowColor) =>
            handleUpdateSettings({ playerTeamId, underglowColor })
          }
          onClose={() => setCarSelectOpen(false)}
        />
      )}

      {/* Track Selection Modal */}
      {trackSelectOpen && (
        <TrackSelectModal
          currentTrackId={settings.trackId}
          onSelectTrack={(trackId) => handleUpdateSettings({ trackId })}
          onClose={() => setTrackSelectOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <SettingsModal
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          showTouchControls={showTouchControls}
          onToggleTouchControls={() => setShowTouchControls((prev) => !prev)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
