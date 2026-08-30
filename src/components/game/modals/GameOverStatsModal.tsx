import React from 'react';
import { Trophy, RefreshCw, Gamepad2 } from 'lucide-react';
import { GameState } from '../../../core/types';
import { TeamSummary } from './gameOver/gameOverTypes';
import { Top1SpotlightCard } from './gameOver/Top1SpotlightCard';
import { RunnerUpsLeaderboard } from './gameOver/RunnerUpsLeaderboard';
import { TacticalDistinctions } from './gameOver/TacticalDistinctions';

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
  const teamSummaries: TeamSummary[] = gameState.teams.map((team) => {
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

  const topTeam = teamSummaries[0];
  const runnerUps = teamSummaries.slice(1);
  const maxTeamHp = Math.max(1, gameState.config.slugsPerTeam * gameState.config.slugHp);

  // Calculate Awards
  const mvpTeam = [...teamSummaries].sort((a, b) => b.damageDealt - a.damageDealt)[0];
  const reaperTeam = [...teamSummaries].sort((a, b) => b.kills - a.kills)[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto select-none animate-in fade-in duration-200">
      <div
        className="bg-zinc-950/95 border border-amber-500/40 rounded-2xl sm:rounded-3xl w-[96vw] max-w-5xl p-3 sm:p-4 md:p-5 flex flex-col max-h-[96vh] shadow-2xl shadow-amber-500/10 pointer-events-auto space-y-2.5 sm:space-y-3.5"
        style={{
          boxShadow: winnerTeam
            ? `0 0 60px -10px ${winnerTeam.color}33, 0 0 30px rgba(245,158,11,0.2)`
            : '0 0 50px rgba(124,58,237,0.25)',
        }}
      >
        {/* 3-Column Tactical Landscape Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 landscape:grid-cols-12 gap-2.5 sm:gap-3.5 flex-1 min-h-0 items-stretch">
          {/* ZONE 1: Left Column (Trophy, Winner Announcement, Accolades) */}
          <div className="md:col-span-4 landscape:col-span-4 flex flex-col justify-between space-y-2">
            <div>
              {/* Glowing Trophy Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-950/80 to-purple-950/80 border border-violet-500/50 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-1.5">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-bounce" />
                <span className="text-xs sm:text-sm font-black uppercase text-amber-300 tracking-wider">
                  {winnerTeam ? 'Victoire !' : 'Fin de partie'}
                </span>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-lg sm:text-2xl font-black tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 truncate">
                {winnerTeam ? `Victoire : ${winnerTeam.name} !` : 'Match Nul !'}
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                Rapport Tactique & Bilan des Combats ({gameState.turnCount} tour{gameState.turnCount > 1 ? 's' : ''} joué{gameState.turnCount > 1 ? 's' : ''})
              </p>
            </div>

            {/* Distinctions Tactiques */}
            <TacticalDistinctions mvpTeam={mvpTeam} reaperTeam={reaperTeam} />
          </div>

          {/* ZONE 2: Center Column (Top 1 Winner Spotlight Card) */}
          {topTeam && (
            <Top1SpotlightCard topTeam={topTeam} maxTeamHp={maxTeamHp} />
          )}

          {/* ZONE 3: Right Column (Runner-ups Leaderboard) */}
          <RunnerUpsLeaderboard runnerUps={runnerUps} />
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-400 font-medium">
            <Gamepad2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {isHost ? 'Vous êtes l’hôte : vous pouvez relancer.' : 'En attente de l’hôte pour relancer...'}
            </span>
          </div>

          {isHost && (
            <button
              onClick={onRestartGame}
              className="flex items-center gap-1.5 px-5 sm:px-7 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:scale-95 text-zinc-950 text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950" />
              Rejouer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
