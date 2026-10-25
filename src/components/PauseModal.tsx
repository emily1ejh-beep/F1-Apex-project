import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Settings } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuit,
  onOpenSettings,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 text-center">
        {/* Title */}
        <div className="border-b border-slate-800 pb-3">
          <h2 className="font-racing text-4xl font-black italic tracking-wider text-white">
            SESSION <span className="text-amber-400">PAUSED</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Press Esc to resume immediately</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5 my-2">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-racing text-xl font-black italic tracking-wider shadow-lg active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME RACE</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Restart Session</span>
          </button>

          <button
            onClick={onToggleMute}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </button>

          <button
            onClick={onQuit}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-950/80 border border-red-900/60 text-red-300 font-semibold text-xs transition-colors mt-2"
          >
            <Home className="w-4 h-4" />
            <span>Quit to Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
