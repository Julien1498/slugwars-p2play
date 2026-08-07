import React from 'react';
import { Trophy, RefreshCw, Shield, Swords, Skull, Heart, Award } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-violet-500/60 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Victory Banner Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 border border-amber-500/30 rounded-full mb-1">
            <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-wide">Fin de la Partie !</h1>
          {winnerTeam ? (
            <div className="flex items-center justify-center gap-2 text-lg font-bold text-emerald-400">
              <span className="text-2xl">{winnerTeam.avatar}</span>
              <span>Victoire de l'équipe <span style={{ color: winnerTeam.color }}>{winnerTeam.name}</span> !</span>
            </div>
          ) : (
            <p className="text-zinc-400 font-semibold">Égalité parfaite ! Aucune équipe n'a survécu.</p>
          )}
          <p className="text-xs text-zinc-500">Partie terminée en {gameState.turnCount || 1} tours d'anthologie</p>
        </div>

        {/* Match Awards Section */}
        <div className="grid grid-cols-2 gap-3">
          {mvpTeam && mvpTeam.damageDealt > 0 && (
            <div className="bg-zinc-800/60 border border-amber-500/40 p-3 rounded-xl flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                  <Award className="w-3 h-3" /> MVP Démolisseur
                </div>
                <div className="font-extrabold text-xs text-zinc-100">{mvpTeam.team.name}</div>
                <div className="text-[11px] text-zinc-400">{mvpTeam.damageDealt} dégâts infligés</div>
              </div>
            </div>
          )}

          {reaperTeam && reaperTeam.kills > 0 && (
            <div className="bg-zinc-800/60 border border-red-500/40 p-3 rounded-xl flex items-center gap-3">
              <span className="text-2xl">☠️</span>
              <div>
                <div className="text-[10px] font-bold uppercase text-red-400 flex items-center gap-1">
                  <Skull className="w-3 h-3" /> Faucheuse Ultime
                </div>
                <div className="font-extrabold text-xs text-zinc-100">{reaperTeam.team.name}</div>
                <div className="text-[11px] text-zinc-400">{reaperTeam.kills} éliminations</div>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Stats Table */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase text-zinc-400 tracking-wider flex items-center gap-2">
            <Swords className="w-4 h-4 text-violet-400" /> Tableau des Scores & Statistiques
          </h2>

          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-[11px] font-bold text-zinc-400 bg-zinc-900/60">
                  <th className="py-2.5 px-3">Rang & Équipe</th>
                  <th className="py-2.5 px-3 text-center">Kills ☠️</th>
                  <th className="py-2.5 px-3 text-center">Morts 🪦</th>
                  <th className="py-2.5 px-3 text-center">Dégâts ⚔️</th>
                  <th className="py-2.5 px-3 text-center">PV 💖</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-xs">
                {teamSummaries.map((s, idx) => (
                  <tr key={s.team.id} className={s.isWinner ? 'bg-amber-950/20' : ''}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-zinc-400 w-4">
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                        </span>
                        <span className="text-xl">{s.team.avatar}</span>
                        <div>
                          <div className="font-extrabold text-zinc-200 flex items-center gap-1.5">
                            <span style={{ color: s.team.color }}>{s.team.name}</span>
                            {s.isWinner && (
                              <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-800 text-[9px] rounded font-black uppercase">
                                Vainqueur
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-red-400">{s.kills}</td>
                    <td className="py-3 px-3 text-center font-semibold text-zinc-400">{s.deaths}</td>
                    <td className="py-3 px-3 text-center font-bold text-amber-300">{s.damageDealt}</td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-400">{s.totalRemainingHp} HP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2">
          {isHost ? (
            <button
              onClick={onRestartGame}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-base rounded-2xl shadow-xl shadow-violet-950/60 flex items-center justify-center gap-3 transition active:scale-[0.98]"
            >
              <RefreshCw className="w-5 h-5" /> Relancer Une Nouvelle Partie 🚀
            </button>
          ) : (
            <div className="p-3 bg-zinc-800/40 border border-zinc-700/40 rounded-xl text-center text-xs text-zinc-400">
              En attente de l'hôte pour relancer une partie...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
