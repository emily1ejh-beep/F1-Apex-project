import React from 'react';
import { Volume2, VolumeX, Pause, RotateCcw } from 'lucide-react';
import { GameTelemetry } from '../game/engine';
import { UNDERGLOW_PRESETS } from '../game/constants';
import { UnderglowColorId } from '../game/types';

interface RaceHUDProps {
  telemetry: GameTelemetry;
  underglowColor: UnderglowColorId;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onResetCar: () => void;
  onTouchInput: (key: 'up' | 'down' | 'left' | 'right' | 'handbrake', active: boolean) => void;
  showTouchControls: boolean;
}

export const RaceHUD: React.FC<RaceHUDProps> = ({
  telemetry,
  underglowColor,
  isMuted,
  onToggleMute,
  onPause,
  onResetCar,
  onTouchInput,
  showTouchControls,
}) => {
  const formatTime = (seconds: number | null): string => {
    if (seconds === null || isNaN(seconds)) return '--:--.---';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  // Shift light calculation (15 LED indicators: 5 green, 5 red, 5 purple)
  const rpmRatio = Math.max(0, Math.min(1, (telemetry.rpm - 4000) / 10500));
  const activeLeds = Math.floor(rpmRatio * 15);
  const isRedlining = rpmRatio > 0.95;

  const activeUnderglow = UNDERGLOW_PRESETS.find((u) => u.id === underglowColor) || UNDERGLOW_PRESETS[0];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 overflow-hidden select-none">
      {/* ===================================================================
          1. TOP PERIMETER CLUSTER
          =================================================================== */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Position, Lap, and Gap */}
        <div className="flex items-center gap-3 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-2.5 shadow-2xl pointer-events-auto">
          {/* Position */}
          <div className="flex items-baseline gap-1 border-r border-slate-800 pr-3">
            <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">POS</span>
            <span className="font-racing text-3xl font-black text-amber-400 leading-none">
              P{telemetry.position}
            </span>
            <span className="text-xs text-slate-500 font-telemetry">/{telemetry.totalRacers}</span>
          </div>

          {/* Lap Counter */}
          <div className="flex flex-col border-r border-slate-800 pr-3">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">LAP</span>
            <span className="font-telemetry text-sm font-bold text-slate-100">
              {telemetry.currentLap} <span className="text-slate-500">/ {telemetry.totalLaps}</span>
            </span>
          </div>

          {/* Timing */}
          <div className="flex flex-col border-r border-slate-800 pr-3">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">CURRENT LAP</span>
            <span className="font-telemetry text-sm font-bold text-cyan-400">
              {formatTime(telemetry.currentLapTime)}
            </span>
          </div>

          {/* Personal Best */}
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">BEST</span>
            <span className="font-telemetry text-sm font-bold text-emerald-400">
              {formatTime(telemetry.bestLapTime)}
            </span>
          </div>

          {/* Gap to leader */}
          {telemetry.gapToLeader && (
            <div className="hidden md:flex flex-col border-l border-slate-800 pl-3">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">GAP</span>
              <span className="font-telemetry text-sm font-bold text-amber-300">
                {telemetry.gapToLeader}
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick actions & Minimap slot */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleMute}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors shadow-lg active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            onClick={onResetCar}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-amber-400 transition-colors shadow-lg active:scale-95"
            title="Reset Car to Track (R)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onPause}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors shadow-lg active:scale-95"
            title="Pause (Esc)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ===================================================================
          2. CENTER NOTIFICATIONS & COUNTDOWN LIGHTS
          =================================================================== */}
      <div className="flex flex-col items-center justify-center -mt-12 pointer-events-none">
        {/* Starting 5 Red Lights Sequence */}
        {telemetry.countdownState > 0 && telemetry.countdownState <= 5 && (
          <div className="bg-slate-950/95 border border-slate-800 rounded-2xl px-6 py-4 shadow-2xl flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((lightIdx) => {
                const isOn = telemetry.countdownState >= lightIdx;
                return (
                  <div key={lightIdx} className="flex flex-col gap-1 items-center bg-black/60 p-1.5 rounded-lg border border-slate-900">
                    <div
                      className={`w-6 h-6 md:w-8 md:h-8 rounded-full transition-all duration-100 ${
                        isOn
                          ? 'bg-red-600 shadow-[0_0_20px_#ef4444] border-2 border-red-400'
                          : 'bg-red-950/40 border border-red-900/40'
                      }`}
                    />
                    <div className="w-3 h-1 bg-slate-800 rounded-full" />
                  </div>
                );
              })}
            </div>
            <span className="font-racing tracking-widest text-xs md:text-sm text-slate-400 font-bold uppercase">
              FORMATION GRID READY
            </span>
          </div>
        )}

        {/* Lights Out & Away We Go! */}
        {telemetry.countdownState === 6 && (
          <div className="bg-slate-950/90 border border-emerald-500/50 rounded-2xl px-8 py-4 shadow-[0_0_35px_rgba(16,185,129,0.3)] animate-bounce duration-500">
            <span className="font-racing text-3xl md:text-5xl font-black italic text-emerald-400 tracking-wider">
              LIGHTS OUT AND AWAY WE GO!
            </span>
          </div>
        )}

        {/* Wrong Way Warning */}
        {telemetry.wrongWay && (
          <div className="bg-red-950/90 border-2 border-red-500 text-red-200 px-6 py-2.5 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse">
            <span className="font-racing text-2xl font-black tracking-widest">
              ⚠️ WRONG WAY! TURN AROUND
            </span>
          </div>
        )}
      </div>

      {/* ===================================================================
          3. BOTTOM STATUS & DIGITAL F1 STEERING WHEEL TELEMETRY
          =================================================================== */}
      <div className="flex items-end justify-between gap-4">
        {/* Bottom Left: Controls Legend (Desktop) or Mobile Steer Touchpads */}
        <div className="pointer-events-auto">
          {showTouchControls ? (
            <div className="flex items-center gap-3">
              <button
                onTouchStart={(e) => { e.preventDefault(); onTouchInput('left', true); }}
                onTouchEnd={(e) => { e.preventDefault(); onTouchInput('left', false); }}
                onMouseDown={() => onTouchInput('left', true)}
                onMouseUp={() => onTouchInput('left', false)}
                className="w-18 h-18 bg-slate-900/90 active:bg-cyan-600/60 border-2 border-slate-700 active:border-cyan-400 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-2xl active:scale-95 text-white"
              >
                ◀
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); onTouchInput('right', true); }}
                onTouchEnd={(e) => { e.preventDefault(); onTouchInput('right', false); }}
                onMouseDown={() => onTouchInput('right', true)}
                onMouseUp={() => onTouchInput('right', false)}
                className="w-18 h-18 bg-slate-900/90 active:bg-cyan-600/60 border-2 border-slate-700 active:border-cyan-400 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-2xl active:scale-95 text-white"
              >
                ▶
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-4 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-4 py-2 text-xs text-slate-400 shadow-xl">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[11px] text-slate-200">W / ↑</span>
                <span>Gas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[11px] text-slate-200">S / ↓</span>
                <span>Brake</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[11px] text-slate-200">A/D / ←/→</span>
                <span>Steer</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[11px] text-slate-200">Space</span>
                <span>Drift</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Center / Right: F1 Telemetry Wheel Dashboard */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Mobile Gas / Brake Pedals */}
          {showTouchControls && (
            <div className="flex items-center gap-3 mr-2">
              <button
                onTouchStart={(e) => { e.preventDefault(); onTouchInput('down', true); }}
                onTouchEnd={(e) => { e.preventDefault(); onTouchInput('down', false); }}
                onMouseDown={() => onTouchInput('down', true)}
                onMouseUp={() => onTouchInput('down', false)}
                className="w-16 h-18 bg-red-950/80 active:bg-red-600/70 border-2 border-red-700 active:border-red-400 rounded-2xl flex flex-col items-center justify-center text-xs font-bold shadow-2xl text-red-200 active:scale-95"
              >
                <span className="text-xl">🛑</span>
                <span>BRAKE</span>
              </button>
              <button
                onTouchStart={(e) => { e.preventDefault(); onTouchInput('up', true); }}
                onTouchEnd={(e) => { e.preventDefault(); onTouchInput('up', false); }}
                onMouseDown={() => onTouchInput('up', true)}
                onMouseUp={() => onTouchInput('up', false)}
                className="w-18 h-20 bg-emerald-950/80 active:bg-emerald-600/70 border-2 border-emerald-600 active:border-emerald-400 rounded-2xl flex flex-col items-center justify-center text-xs font-bold shadow-2xl text-emerald-200 active:scale-95"
              >
                <span className="text-2xl">⚡</span>
                <span className="font-racing text-sm font-black">THROTTLE</span>
              </button>
            </div>
          )}

          {/* Formula 1 Steering Wheel Digital HUD */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 md:p-4 shadow-2xl min-w-[210px] md:min-w-[240px]">
            {/* 15-LED Shift Light Bar */}
            <div className="flex items-center justify-between gap-1 mb-2.5 bg-black/60 p-1.5 rounded-lg border border-slate-900">
              {[...Array(15)].map((_, idx) => {
                const isActive = idx < activeLeds;
                let activeColor = 'bg-emerald-500 shadow-[0_0_8px_#10b981]';
                if (idx >= 5 && idx < 10) activeColor = 'bg-amber-500 shadow-[0_0_8px_#f59e0b]';
                if (idx >= 10) activeColor = 'bg-purple-500 shadow-[0_0_8px_#a855f7]';

                if (isRedlining) {
                  activeColor = 'bg-red-600 shadow-[0_0_12px_#ef4444] animate-pulse';
                }

                return (
                  <div
                    key={idx}
                    className={`h-2.5 flex-1 rounded-xs transition-colors duration-75 ${
                      isActive ? activeColor : 'bg-slate-800/50'
                    }`}
                  />
                );
              })}
            </div>

            {/* Gear & Speed Main Display */}
            <div className="flex items-center justify-between gap-4">
              {/* Gear */}
              <div className="flex flex-col items-center bg-slate-900/70 border border-slate-800 rounded-xl px-3 py-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">GEAR</span>
                <span className="font-racing text-4xl font-black text-white leading-none">
                  {telemetry.gear}
                </span>
              </div>

              {/* Speedometer */}
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className="font-telemetry text-4xl font-black text-cyan-400 tracking-tight">
                    {telemetry.speed}
                  </span>
                  <span className="font-racing text-xs font-bold text-slate-400">KM/H</span>
                </div>
                {/* RPM & Underglow status */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-telemetry">
                  <span>{telemetry.rpm} RPM</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: activeUnderglow.hex }}
                    />
                    <span className="text-[9px] text-slate-400 uppercase">{activeUnderglow.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
