import React from 'react';
import { X, Volume2, VolumeX, Sparkles, Smartphone, Trash2, Check } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface SettingsModalProps {
  isMuted: boolean;
  onToggleMute: () => void;
  showTouchControls: boolean;
  onToggleTouchControls: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isMuted,
  onToggleMute,
  showTouchControls,
  onToggleTouchControls,
  onClose,
}) => {
  const [cleared, setCleared] = React.useState(false);

  const handleClearRecords = () => {
    try {
      localStorage.removeItem('apex_rush_record_coastal');
      localStorage.removeItem('apex_rush_record_neon');
      localStorage.removeItem('apex_rush_record_desert');
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } catch {
      // Safe no-op
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-racing text-2xl font-black italic tracking-wide text-white uppercase">
            GAME <span className="text-cyan-400">SETTINGS</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        <div className="flex flex-col gap-4">
          {/* Audio */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              <div>
                <div className="text-xs font-bold text-white">Synthesized Audio</div>
                <div className="text-[11px] text-slate-400">V6 Turbo Engine, screeches & collisions</div>
              </div>
            </div>
            <button
              onClick={onToggleMute}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !isMuted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {!isMuted ? 'ENABLED' : 'MUTED'}
            </button>
          </div>

          {/* Touch Controls */}
          <div className="flex items-center justify-between p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-2xl">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs font-bold text-white">Mobile Touch Controls</div>
                <div className="text-[11px] text-slate-400">On-screen steer pads & throttle pedals</div>
              </div>
            </div>
            <button
              onClick={onToggleTouchControls}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                showTouchControls
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {showTouchControls ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Controls Reference */}
          <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Keyboard Reference
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="font-mono text-slate-400">W / ↑</span>
                <span>Accelerate</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-mono text-slate-400">S / ↓</span>
                <span>Brake / Reverse</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-mono text-slate-400">A/D / ←/→</span>
                <span>Steering</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-mono text-slate-400">Space</span>
                <span>Handbrake Drift</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-mono text-slate-400">R</span>
                <span>Reset to Track</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="font-mono text-slate-400">Esc</span>
                <span>Pause</span>
              </div>
            </div>
          </div>

          {/* Reset Records */}
          <div className="flex items-center justify-between p-3.5 bg-red-950/20 border border-red-900/40 rounded-2xl">
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div>
                <div className="text-xs font-bold text-red-300">Reset Lap Records</div>
                <div className="text-[11px] text-slate-500">Clears personal best times from device</div>
              </div>
            </div>
            <button
              onClick={handleClearRecords}
              className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-xs font-bold text-red-300 transition-colors"
            >
              {cleared ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3.5 h-3.5" /> Cleared
                </span>
              ) : (
                'Clear'
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
