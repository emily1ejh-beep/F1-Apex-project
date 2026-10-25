import React from 'react';
import { Play, Settings, Trophy, Gauge, Flag, Zap, ChevronRight, Palette } from 'lucide-react';
import { GameMode, RaceSettings, TrackConfig, TeamConfig, UnderglowColorId } from '../game/types';
import { TRACKS } from '../game/tracks';
import { TEAMS, UNDERGLOW_PRESETS } from '../game/constants';
import { CarPreviewCanvas } from './CarPreviewCanvas';

interface TitleScreenProps {
  settings: RaceSettings;
  onUpdateSettings: (partial: Partial<RaceSettings>) => void;
  onStartRace: () => void;
  onOpenCarSelect: () => void;
  onOpenTrackSelect: () => void;
  onOpenSettings: () => void;
  personalBest: number | null;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  settings,
  onUpdateSettings,
  onStartRace,
  onOpenCarSelect,
  onOpenTrackSelect,
  onOpenSettings,
  personalBest,
}) => {
  const currentTrack: TrackConfig = TRACKS[settings.trackId] || TRACKS.coastal;
  const currentTeam: TeamConfig = TEAMS.find((t) => t.id === settings.playerTeamId) || TEAMS[0];
  const activeUnderglow = UNDERGLOW_PRESETS.find((u) => u.id === settings.underglowColor) || UNDERGLOW_PRESETS[0];

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--:--.---';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-6 md:p-12 z-10 overflow-y-auto">
      {/* Top Bar: Brand, Quick Status & Settings */}
      <div className="flex items-center justify-between gap-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Flag className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-racing text-2xl font-black italic tracking-wider text-white">
              APEX RUSH <span className="text-red-500">F1</span>
            </span>
            <div className="text-[11px] text-slate-400 font-medium">GRAND PRIX SIMULATION</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md active:scale-95"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Main Center Hero & Configuration Hub */}
      <div className="max-w-7xl mx-auto w-full my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Game Title & Mode Selector (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Championship Season 2026</span>
            </div>
            <h1 className="font-racing text-5xl sm:text-6xl md:text-7xl font-black italic tracking-tight text-white uppercase leading-[0.95]">
              DOMINATE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400">APEX</span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-3 max-w-xl font-normal leading-relaxed">
              Top-down Formula racing engine engineered with realistic tire grip, power slides, aerodynamic downforce, and custom neon LED underglow styling.
            </p>
          </div>

          {/* Game Mode Selector Cards */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Mode</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quick Race */}
              <button
                onClick={() => onUpdateSettings({ mode: 'quick_race' })}
                className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                  settings.mode === 'quick_race'
                    ? 'bg-slate-900 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Trophy className={`w-5 h-5 ${settings.mode === 'quick_race' ? 'text-red-400' : 'text-slate-500'}`} />
                  {settings.mode === 'quick_race' && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}
                </div>
                <div className="font-racing text-lg font-bold text-white">Quick Race</div>
                <div className="text-xs text-slate-400 mt-1">Full 8-car grid with starting lights</div>
              </button>

              {/* Time Trial */}
              <button
                onClick={() => onUpdateSettings({ mode: 'time_trial' })}
                className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                  settings.mode === 'time_trial'
                    ? 'bg-slate-900 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Gauge className={`w-5 h-5 ${settings.mode === 'time_trial' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  {settings.mode === 'time_trial' && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>
                <div className="font-racing text-lg font-bold text-white">Time Trial</div>
                <div className="text-xs text-slate-400 mt-1">Solo hot lap battle against personal best</div>
              </button>

              {/* Practice */}
              <button
                onClick={() => onUpdateSettings({ mode: 'practice' })}
                className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                  settings.mode === 'practice'
                    ? 'bg-slate-900 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-500'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Zap className={`w-5 h-5 ${settings.mode === 'practice' ? 'text-amber-400' : 'text-slate-500'}`} />
                  {settings.mode === 'practice' && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="font-racing text-lg font-bold text-white">Free Practice</div>
                <div className="text-xs text-slate-400 mt-1">Master braking points & racing lines</div>
              </button>
            </div>
          </div>

          {/* Prominent F1 Team & Constructor Picker */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-red-500" />
                <span>Choose Constructor & Driver</span>
              </span>
              <button
                onClick={onOpenCarSelect}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
              >
                <span>Underglow LED Studio</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEAMS.map((team) => {
                const isSelected = settings.playerTeamId === team.id;
                return (
                  <button
                    key={team.id}
                    onClick={() => onUpdateSettings({ playerTeamId: team.id })}
                    className={`flex flex-col p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] ring-1 ring-red-500'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: team.primaryColor }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm"
                          style={{ backgroundColor: team.secondaryColor }}
                        />
                      </div>
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">ACTIVE</span>
                      ) : (
                        <span className="text-[10px] font-telemetry text-slate-500">{team.speedRating} SPD</span>
                      )}
                    </div>
                    <div className="font-racing text-sm font-bold text-white truncate leading-tight">
                      {team.name}
                    </div>
                    <div className="text-[10px] text-cyan-400 font-medium truncate">
                      {team.driverName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Race Distance & AI Difficulty (Only in Quick Race) */}
          {settings.mode === 'quick_race' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Race Distance
                </span>
                <div className="flex gap-2">
                  {[3, 5, 10].map((laps) => (
                    <button
                      key={laps}
                      onClick={() => onUpdateSettings({ laps })}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        settings.laps === laps
                          ? 'bg-red-600 text-white shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {laps} Laps
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  AI Difficulty
                </span>
                <div className="flex gap-1.5">
                  {(['easy', 'medium', 'hard', 'pro'] as const).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => onUpdateSettings({ difficulty: diff })}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold capitalize transition-all ${
                        settings.difficulty === diff
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Big Launch CTA Button */}
          <div className="pt-2">
            <button
              onClick={onStartRace}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-racing text-2xl font-black italic tracking-wider shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-6 h-6 fill-white" />
              <span>START RACE</span>
            </button>
          </div>
        </div>

        {/* Right Column: Car & Track Selected Previews (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Selected Car & Underglow Hub */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Vehicle & Underglow
                </span>
              </div>
              <button
                onClick={onOpenCarSelect}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Customize</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Car Canvas Preview */}
            <div className="flex justify-center mb-3">
              <CarPreviewCanvas
                team={currentTeam}
                underglow={settings.underglowColor}
                width={260}
                height={150}
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <div>
                <div className="font-racing text-lg font-bold text-white">{currentTeam.name}</div>
                <div className="text-xs text-slate-400">{currentTeam.driverName}</div>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: activeUnderglow.hex }}
                />
                <span className="text-xs font-semibold text-slate-300">{activeUnderglow.name}</span>
              </div>
            </div>
          </div>

          {/* Selected Track Hub */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Grand Prix Circuit
                </span>
              </div>
              <button
                onClick={onOpenTrackSelect}
                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <span>Change Track</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentTrack.flag}</span>
                  <div className="font-racing text-xl font-bold text-white">{currentTrack.name}</div>
                </div>
                <div className="text-xs text-slate-400">{currentTrack.location}, {currentTrack.country}</div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                  PERSONAL RECORD
                </span>
                <span className="font-telemetry text-sm font-bold text-emerald-400">
                  {formatTime(personalBest)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between text-xs text-slate-500 border-t border-slate-900 pt-4">
        <div>APEX RUSH F1 · 2D High-Performance Motorsport Engine</div>
        <div className="hidden sm:block">WASD / Arrow Keys to drive · Space to drift · R to reset · Esc to pause</div>
      </div>
    </div>
  );
};
