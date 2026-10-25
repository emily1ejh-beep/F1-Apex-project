import React from 'react';
import { Trophy, RotateCcw, Home, ArrowRight, Zap } from 'lucide-react';
import { LeaderboardEntry } from '../game/types';

interface ResultsModalProps {
  results: LeaderboardEntry[];
  trackName: string;
  onRestart: () => void;
  onNextTrack: () => void;
  onQuit: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  results,
  trackName,
  onRestart,
  onNextTrack,
  onQuit,
}) => {
  const winner = results[0];
  const playerResult = results.find((r) => r.isPlayer);
  const playerRank = playerResult ? playerResult.rank : 8;

  // Podium color styling
  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-amber-400 text-slate-950 font-black';
    if (rank === 2) return 'bg-slate-300 text-slate-950 font-black';
    if (rank === 3) return 'bg-amber-700 text-white font-black';
    return 'bg-slate-800 text-slate-400 font-bold';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Podium Header */}
        <div className="text-center border-b border-slate-800 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-400 text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>CHEQUERED FLAG · {trackName.toUpperCase()}</span>
          </div>

          <h2 className="font-racing text-4xl sm:text-5xl font-black italic tracking-wide text-white uppercase">
            GRAND PRIX <span className="text-amber-400">RESULTS</span>
          </h2>

          {playerRank <= 3 ? (
            <p className="text-emerald-400 text-sm font-semibold mt-1">
              🎉 Podium Finish! You placed P{playerRank}! Outstanding drive.
            </p>
          ) : (
            <p className="text-slate-400 text-xs mt-1">
              Race complete. Final classification recorded.
            </p>
          )}
        </div>

        {/* Results Standings Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-center w-12">POS</th>
                <th className="py-2.5 px-4">DRIVER / TEAM</th>
                <th className="py-2.5 px-4 text-center">LAPS</th>
                <th className="py-2.5 px-4 text-right">BEST LAP</th>
                <th className="py-2.5 px-4 text-right">GAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {results.map((entry) => (
                <tr
                  key={entry.carId}
                  className={`transition-colors ${
                    entry.isPlayer
                      ? 'bg-cyan-950/40 hover:bg-cyan-950/60'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Position badge */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs ${getRankBadge(
                        entry.rank
                      )}`}
                    >
                      P{entry.rank}
                    </span>
                  </td>

                  {/* Driver & Team */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.primaryColor }}
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{entry.driverName}</span>
                          {entry.isPlayer && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded font-semibold">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{entry.teamName}</div>
                      </div>
                    </div>
                  </td>

                  {/* Laps */}
                  <td className="py-3 px-4 text-center font-telemetry text-slate-300">
                    {entry.lap}
                  </td>

                  {/* Best Lap */}
                  <td className="py-3 px-4 text-right font-telemetry font-bold text-cyan-400">
                    {entry.bestLap}
                  </td>

                  {/* Gap */}
                  <td className="py-3 px-4 text-right font-telemetry text-slate-400">
                    {entry.gap}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onQuit}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onRestart}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Retry Race</span>
            </button>

            <button
              onClick={onNextTrack}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-racing text-lg font-black italic tracking-wider shadow-lg active:scale-95 transition-all"
            >
              <span>NEXT GRAND PRIX</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
