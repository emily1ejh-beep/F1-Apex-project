import React from 'react';
import { X, Check, MapPin, Gauge } from 'lucide-react';
import { TRACKS } from '../game/tracks';
import { TrackConfig } from '../game/types';

interface TrackSelectModalProps {
  currentTrackId: string;
  onSelectTrack: (trackId: string) => void;
  onClose: () => void;
}

export const TrackSelectModal: React.FC<TrackSelectModalProps> = ({
  currentTrackId,
  onSelectTrack,
  onClose,
}) => {
  const formatTime = (recordsKey: string): string => {
    try {
      const saved = localStorage.getItem(recordsKey);
      if (!saved) return '--:--.---';
      const seconds = parseFloat(saved);
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    } catch {
      return '--:--.---';
    }
  };

  const handleSelect = (trackId: string) => {
    onSelectTrack(trackId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-racing text-3xl font-black italic tracking-wide text-white uppercase">
              SELECT <span className="text-red-500">CIRCUIT</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose from 3 championship Grand Prix layouts featuring unique surfaces and atmospheric lighting.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(TRACKS).map((track: TrackConfig) => {
            const isSelected = track.id === currentTrackId;
            const pbTime = formatTime(track.recordsKey);

            return (
              <div
                key={track.id}
                onClick={() => handleSelect(track.id)}
                className={`flex flex-col rounded-2xl border p-5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500'
                    : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                {/* Header Flag & Title */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{track.flag}</span>
                    <div>
                      <h3 className="font-racing text-xl font-bold text-white">{track.name}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-red-400" />
                        <span>{track.location}</span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="p-1 rounded-full bg-red-600 text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Circuit Miniature Outline SVG */}
                <div className="h-36 bg-black/60 rounded-xl border border-slate-800/80 p-3 my-2 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 2800 2400">
                    <path
                      d={track.centerline.reduce(
                        (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`,
                        ''
                      ) + ' Z'}
                      fill="none"
                      stroke={track.theme === 'neon' ? '#00ffff' : '#ef4444'}
                      strokeWidth="90"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Start dot */}
                    <circle
                      cx={track.startPosition.x}
                      cy={track.startPosition.y}
                      r="120"
                      fill="#ffffff"
                    />
                  </svg>
                </div>

                {/* Track Stats */}
                <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Length</span>
                    <span className="font-telemetry font-bold text-slate-200">
                      {(track.lengthMeters / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Surface & Vibe</span>
                    <span className="capitalize text-slate-300 font-semibold">{track.theme} GP</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1">
                    <span className="text-emerald-400 font-semibold">Track Record</span>
                    <span className="font-telemetry font-bold text-emerald-400">{pbTime}</span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleSelect(track.id)}
                  className={`mt-4 py-2 px-3 rounded-xl font-racing text-sm font-bold tracking-wider transition-all ${
                    isSelected
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isSelected ? 'CURRENT CIRCUIT' : 'SELECT CIRCUIT'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
