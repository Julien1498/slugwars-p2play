import React from 'react';
import { Trophy, RefreshCw, Swords, Skull, Award, Sparkles } from 'lucide-react';
import { GameState } from '../../../core/types';

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
        {/* Header with Winner Announcement */}
        <div className="text-center space-y-0.5 sm:space-y-1">
          <div className="inline-flex items-center justify-center p-2 sm:p-3 bg-violet-950/80 border border-violet-500/40 rounded-xl sm:rounded-2xl mb-1 shadow-inner">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 animate-bounce" />
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500">
            {winnerTeam ? `Victoire : ${winnerTeam.name} !` : 'Match Nul !'}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            Rapport Tactique & Bilan des Combats ({gameState.turnCount} tours joués)
          </p>
        </div>

        {/* Highlight Badges / Accolades */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {mvpTeam && (
            <div className="bg-zinc-900/80 border border-amber-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-amber-500/20 text-amber-400 rounded-lg sm:rounded-xl">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-amber-400/90 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Artilleur MVP
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-zinc-200 truncate">
                  {mvpTeam.team.name}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                  {mvpTeam.damageDealt} dégâts infligés
                </div>
              </div>
            </div>
          )}

          {reaperTeam && (
            <div className="bg-zinc-900/80 border border-rose-500/30 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-rose-500/20 text-rose-400 rounded-lg sm:rounded-xl">
                <Skull className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider text-rose-400/90 flex items-center gap-1">
                  <Swords className="w-2.5 h-2.5" /> Faucheur
                </div>
                <div className="text-xs sm:text-sm font-extrabold text-zinc-200 truncate">
                  {reaperTeam.team.name}
                </div>
                <div className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                  {reaperTeam.kills} limace{reaperTeam.kills > 1 ? 's' : ''} éliminée{reaperTeam.kills > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Leaderboard Table */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 sm:space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
            Classement & Performances
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {teamSummaries.map((summary, idx) => {
              const { team, isWinner, totalRemainingHp, kills, damageDealt } = summary;
              return (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
                    isWinner
                      ? 'bg-amber-950/40 border-amber-500/50 shadow-lg'
                      : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700/80'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-zinc-950'
                          : idx === 1
                          ? 'bg-zinc-300 text-zinc-950'
                          : idx === 2
                          ? 'bg-amber-700 text-zinc-100'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: team.color }}
                    />

                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-black text-zinc-100 truncate flex items-center gap-1.5">
                        {team.avatar} {team.name}
                        {isWinner && (
                          <span className="text-[9px] sm:text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded-full uppercase font-bold tracking-wider">
                            Vainqueur
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-xs text-zinc-400">
                        Santé restante : <span className="font-semibold text-zinc-300">{totalRemainingHp} HP</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6 text-right shrink-0">
                    <div>
                      <div className="text-[9px] sm:text-[10px] uppercase text-zinc-400 font-bold">Kills</div>
                      <div className="text-xs sm:text-sm font-black text-rose-400">{kills}</div>
                    </div>
                    <div>
                      <div className="text-[9px] sm:text-[10px] uppercase text-zinc-400 font-bold">Dégâts</div>
                      <div className="text-xs sm:text-sm font-black text-amber-400">{damageDealt}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer / Restart Actions */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3">
          <div className="text-[11px] sm:text-xs text-zinc-400 italic">
            {isHost ? '🎮 Vous êtes l’hôte : vous pouvez relancer la partie.' : '⏳ En attente de l’hôte pour relancer...'}
          </div>

          {isHost && (
            <button
              onClick={onRestartGame}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Rejouer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
