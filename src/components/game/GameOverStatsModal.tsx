import React from 'react';
import { Trophy, RefreshCw, Swords, Skull, Award, Sparkles } from 'lucide-react';
import { GameState } from '../../core/types';

interface GameOverStatsModalProps {
  gameState: GameState;
  isHost: boolean;
  onRestartGame: () => void;
}

export const GameOverStatsModal: React.FC<GameOverStatsModalProps> = ({
  gameState,
  isHost,
  onRestartGame,
}) => {
  const winnerTeam = gameState.teams.find((t) => t.id === gameState.winnerTeamId);

  // Compute total team remaining HP and sort teams by rank
  const teamSummaries = gameState.teams.map((team) => {
    const teamSlugs = gameState.slugs.filter((s) => s.teamId === team.id);
    const totalRemainingHp = teamSlugs.reduce((sum, s) => sum + (s.isAlive ? s.hp : 0), 0);
    const kills = team.stats?.kills || 0;
    const deaths = team.stats?.deaths || 0;
    const damageDealt = team.stats?.damageDealt || 0;
    const damageTaken = team.stats?.damageTaken || 0;
    const isWinner = team.id === gameState.winnerTeamId;

    return {
      team,
      isWinner,
      totalRemainingHp,
      kills,
      deaths,
      damageDealt,
      damageTaken,
    };
  });

  // Sort: Winner first, then by remaining HP, then by damage dealt
  teamSummaries.sort((a, b) => {
    if (a.isWinner) return -1;
    if (b.isWinner) return 1;
    if (b.totalRemainingHp !== a.totalRemainingHp) return b.totalRemainingHp - a.totalRemainingHp;
    return b.damageDealt - a.damageDealt;
  });

  // Calculate Awards
  const mvpTeam = [...teamSummaries].sort((a, b) => b.damageDealt - a.damageDealt)[0];
  const reaperTeam = [...teamSummaries].sort((a, b) => b.kills - a.kills)[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto pointer-events-auto select-none animate-in fade-in duration-200">
      <div
        className="bg-zinc-950/95 border border-violet-500/50 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-3.5 sm:p-5 flex flex-col max-h-[94vh] shadow-2xl pointer-events-auto space-y-3 sm:space-y-4"
        style={{
          boxShadow: winnerTeam
            ? `0 0 50px -10px ${winnerTeam.color}44, 0 20px 40px -15px rgba(0,0,0,0.8)`
            : '0 0 50px rgba(124,58,237,0.25)',
        }}
      >
        {/* Top Hero Banner */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-2.5 sm:pb-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black text-white tracking-wide">
                  Fin de la Partie !
                </h1>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-950 border border-violet-500/50 text-violet-300">
                  {gameState.turnCount || 1} tours
                </span>
              </div>
              {winnerTeam ? (
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400 mt-0.5">
                  <span className="text-base sm:text-lg">{winnerTeam.avatar}</span>
                  <span>Victoire :</span>
                  <span className="px-1.5 py-0.2 rounded font-black border" style={{ backgroundColor: `${winnerTeam.color}22`, borderColor: `${winnerTeam.color}66`, color: winnerTeam.color }}>
                    {winnerTeam.name}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                  Égalité parfaite ! Aucune équipe n'a survécu.
                </p>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-amber-400/80 text-xs font-bold bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Score Final</span>
          </div>
        </div>

        {/* Scrollable Content Body (Awards + Stats Table) */}
        <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
          {/* Match Awards Section */}
          {(mvpTeam?.damageDealt > 0 || reaperTeam?.kills > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 shrink-0">
              {mvpTeam && mvpTeam.damageDealt > 0 && (
                <div className="bg-zinc-900/90 border border-amber-500/40 p-2.5 rounded-xl flex items-center gap-2.5 shadow-sm">
                  <span className="text-xl sm:text-2xl shrink-0">🎯</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                      <Award className="w-3 h-3" /> MVP Démolisseur
                    </div>
                    <div className="font-extrabold text-xs text-zinc-100 truncate">{mvpTeam.team.name}</div>
                    <div className="text-[10px] text-zinc-400">{mvpTeam.damageDealt} dégâts infligés</div>
                  </div>
                </div>
              )}

              {reaperTeam && reaperTeam.kills > 0 && (
                <div className="bg-zinc-900/90 border border-red-500/40 p-2.5 rounded-xl flex items-center gap-2.5 shadow-sm">
                  <span className="text-xl sm:text-2xl shrink-0">☠️</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1">
                      <Skull className="w-3 h-3" /> Faucheuse Ultime
                    </div>
                    <div className="font-extrabold text-xs text-zinc-100 truncate">{reaperTeam.team.name}</div>
                    <div className="text-[10px] text-zinc-400">{reaperTeam.kills} éliminations</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Stats Table */}
          <div className="space-y-1.5">
            <h2 className="text-[11px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-violet-400" /> Tableau des Scores & Statistiques
            </h2>

            <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-950/60">
                    <th className="py-2 px-2.5 sm:px-3">Équipe</th>
                    <th className="py-2 px-1.5 sm:px-3 text-center">Kills ☠️</th>
                    <th className="py-2 px-1.5 sm:px-3 text-center">Morts 🪦</th>
                    <th className="py-2 px-1.5 sm:px-3 text-center">Dégâts ⚔️</th>
                    <th className="py-2 px-2 sm:px-3 text-center">PV Restants 💖</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40 text-[11px] sm:text-xs">
                  {teamSummaries.map((s, idx) => (
                    <tr
                      key={s.team.id}
                      className={
                        s.isWinner
                          ? 'bg-amber-950/30 font-semibold'
                          : 'hover:bg-zinc-800/30 transition-colors'
                      }
                    >
                      <td className="py-2 sm:py-2.5 px-2.5 sm:px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs shrink-0">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <span className="text-base sm:text-lg shrink-0">{s.team.avatar}</span>
                          <div className="min-w-0">
                            <span className="font-extrabold truncate block" style={{ color: s.team.color }}>
                              {s.team.name}
                            </span>
                          </div>
                          {s.isWinner && (
                            <span className="hidden sm:inline-block px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-700/80 text-[8px] rounded font-black uppercase tracking-wider shrink-0 ml-1">
                              Victoire
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 sm:py-2.5 px-1.5 sm:px-3 text-center font-bold text-red-400">
                        {s.kills}
                      </td>
                      <td className="py-2 sm:py-2.5 px-1.5 sm:px-3 text-center font-semibold text-zinc-400">
                        {s.deaths}
                      </td>
                      <td className="py-2 sm:py-2.5 px-1.5 sm:px-3 text-center font-bold text-amber-300">
                        {s.damageDealt}
                      </td>
                      <td className="py-2 sm:py-2.5 px-2 sm:px-3 text-center font-mono font-bold text-emerald-400">
                        {s.totalRemainingHp} <span className="text-[10px] text-zinc-500 font-normal">HP</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Action Button */}
        <div className="pt-1 shrink-0">
          {isHost ? (
            <button
              onClick={onRestartGame}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-xl shadow-violet-950/60 flex items-center justify-center gap-2.5 transition active:scale-[0.98] border border-violet-400/30 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Relancer Une Nouvelle Partie 🚀</span>
            </button>
          ) : (
            <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span>En attente de l'hôte pour relancer une partie...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
