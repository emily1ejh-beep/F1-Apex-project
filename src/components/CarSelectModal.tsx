import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Zap } from 'lucide-react';
import { TEAMS, UNDERGLOW_PRESETS } from '../game/constants';
import { TeamConfig, UnderglowColorId } from '../game/types';
import { CarPreviewCanvas } from './CarPreviewCanvas';

interface CarSelectModalProps {
  currentTeamId: string;
  currentUnderglow: UnderglowColorId;
  onSave: (teamId: string, underglow: UnderglowColorId) => void;
  onClose: () => void;
}

export const CarSelectModal: React.FC<CarSelectModalProps> = ({
  currentTeamId,
  currentUnderglow,
  onSave,
  onClose,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState(currentTeamId);
  const [selectedUnderglow, setSelectedUnderglow] = useState<UnderglowColorId>(currentUnderglow);

  const selectedTeam: TeamConfig = TEAMS.find((t) => t.id === selectedTeamId) || TEAMS[0];

  const handleConfirm = () => {
    onSave(selectedTeamId, selectedUnderglow);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-racing text-3xl font-black italic tracking-wide text-white uppercase">
              GARAGE & <span className="text-cyan-400">LED UNDERGLOW</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your Formula team livery and customize ground-effect LED light strips.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Centerpiece */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex justify-center">
            <CarPreviewCanvas
              team={selectedTeam}
              underglow={selectedUnderglow}
              width={280}
              height={170}
            />
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full inline-block"
                style={{ backgroundColor: selectedTeam.secondaryColor }}
              />
              <span className="font-racing text-2xl font-black text-white">{selectedTeam.name}</span>
            </div>
            <div className="text-xs text-cyan-400 font-semibold">{selectedTeam.driverName}</div>
            <p className="text-xs text-slate-400">{selectedTeam.description}</p>

            {/* Ratings Bars */}
            <div className="flex flex-col gap-2 mt-2">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Top Speed</span>
                  <span className="font-telemetry text-slate-200">{selectedTeam.speedRating} / 100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                    style={{ width: `${selectedTeam.speedRating}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-cyan-400" /> Cornering Grip</span>
                  <span className="font-telemetry text-slate-200">{selectedTeam.corneringRating} / 100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    style={{ width: `${selectedTeam.corneringRating}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Underglow LED Light Color Picker */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Neon Underglow LED Lights
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {UNDERGLOW_PRESETS.map((preset) => {
              const isSelected = selectedUnderglow === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedUnderglow(preset.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-slate-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)] ring-1 ring-white'
                      : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 text-slate-300'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shadow-md shrink-0"
                    style={{
                      backgroundColor: preset.hex,
                      boxShadow: preset.id !== 'off' ? `0 0 10px ${preset.hex}` : undefined,
                    }}
                  />
                  <span className="text-xs font-semibold truncate">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Team Liveries Grid */}
        <div>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-3">
            Select Team Livery
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {TEAMS.map((team) => {
              const isSelected = selectedTeamId === team.id;
              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`flex flex-col p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.primaryColor }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.secondaryColor }} />
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="font-racing text-base font-bold text-white truncate">{team.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{team.driverName}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-racing text-lg font-black tracking-wider transition-all shadow-lg active:scale-95"
          >
            CONFIRM SELECTION
          </button>
        </div>
      </div>
    </div>
  );
};
