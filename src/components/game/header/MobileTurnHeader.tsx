import React, { useState } from 'react';
import { GameState, Team, Slug } from '../../../core/types';
import { WindIndicator } from '../WindIndicator';
import { HeaderOptionsMenu } from './HeaderOptionsMenu';
import { TeamStatItem } from './TeamStatsLeaderboard';
import { isTurnTimeUrgent } from './turnHeaderUtils';
import { Clock, Heart, Maximize2, Minimize2 } from 'lucide-react';

interface MobileTurnHeaderProps {
  gameState: GameState;
  activeTeam?: Team;
  activeSlug?: Slug;
  teamStats: TeamStatItem[];
  fpsHudActive: boolean;
  setFpsHudActive: (active: boolean) => void;
  isFullscreen: boolean;
  isFullscreenSupported: boolean;
  toggleFullscreen: () => void;
  isHost?: boolean;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
  onOpenRules: () => void;
  onOpenMetrics?: () => void;
  onRestartGame?: () => void;
  onExit?: () => void;
  onRequestConfirmLobby: () => void;
}

export const MobileTurnHeader: React.FC<MobileTurnHeaderProps> = ({
  gameState,
  activeTeam,
  activeSlug,
  teamStats,
  fpsHudActive,
  setFpsHudActive,
  isFullscreen,
  isFullscreenSupported,
  toggleFullscreen,
  isHost,
  showHitboxes,
  onToggleHitboxes,
  onOpenRules,
  onOpenMetrics,
  onRestartGame,
  onExit,
  onRequestConfirmLobby,
}) => {
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const [showScorePopover, setShowScorePopover] = useState(false);

  const turnTime = Math.max(0, Math.ceil(gameState.turnTimer));
  const isTimeUrgent = isTurnTimeUrgent(gameState.turnTimer, gameState.phase);

  return (
    <header className="h-10 min-h-[40px] max-h-[40px] bg-transparent border-b border-transparent px-1 sm:px-2 landscape:px-2 flex items-center justify-between gap-1 sm:gap-2 landscape:gap-2 shrink-0 z-30 select-none pointer-events-none">
      {/* Left: Active Slug + Turn Indicator */}
      <div className="flex items-center gap-1 sm:gap-1.5 landscape:gap-1.5 shrink-0 pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            try {
              window.dispatchEvent(new CustomEvent('slugwars:recenter-camera'));
            } catch {}
          }}
          className="flex items-center gap-1 sm:gap-1.5 landscape:gap-1.5 px-1.5 sm:px-2 landscape:px-2 py-1 rounded-xl border bg-zinc-950/60 backdrop-blur-md shadow-lg active:scale-95 transition-transform cursor-pointer"
          style={{ borderColor: activeTeam ? `${activeTeam.color}70` : '#3f3f46' }}
          title="Toucher pour centrer la caméra sur la limace active"
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: activeTeam?.color || '#a855f7' }}
          />
          <span className="font-black text-xs text-zinc-100 truncate max-w-[48px] sm:max-w-[70px] landscape:max-w-[90px]">
            {activeSlug?.name || 'Tour de jeu'}
          </span>
        </button>

        {/* Big glowing Turn Timer */}
        {gameState.phase === 'RETREAT' ? (
          <div className="flex items-center gap-1 bg-orange-950/80 border border-orange-500/80 px-1.5 sm:px-2 landscape:px-2 py-1 rounded-xl text-xs font-black text-orange-300 shadow-lg backdrop-blur-md animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>{turnTime}s (Repli)</span>
          </div>
        ) : isTimeUrgent ? (
          <div className="flex items-center gap-1 bg-red-950/80 border border-red-500 px-1.5 sm:px-2 landscape:px-2 py-1 rounded-xl text-xs font-black text-red-300 shadow-[0_0_12px_#ef4444] backdrop-blur-md animate-ping">
            <Clock className="w-3.5 h-3.5" />
            <span>{turnTime}s</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-700/80 px-1.5 sm:px-2 landscape:px-2 py-1 rounded-xl text-xs font-black text-amber-400 shadow-lg backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{turnTime}s</span>
          </div>
        )}
      </div>

      {/* Right: Wind + Scoreboard Toggle + Fullscreen + Menu */}
      <div className="flex items-center gap-1 sm:gap-1.5 landscape:gap-1.5 shrink-0 pointer-events-auto">
        <WindIndicator wind={gameState.wind} />

        {/* Scoreboard Popover Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowScorePopover(!showScorePopover)}
            className={`p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 shadow-lg backdrop-blur-md ${
              showScorePopover
                ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                : 'bg-zinc-950/60 border-zinc-700/80 text-zinc-300 active:scale-95'
            }`}
            title="Scores des équipes"
          >
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          </button>

          {showScorePopover && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-950/95 border border-zinc-800 backdrop-blur-2xl rounded-2xl p-3 shadow-2xl z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                <span className="font-black text-xs text-zinc-300">📊 SCOREBOARD</span>
                <button
                  onClick={() => setShowScorePopover(false)}
                  className="text-xs text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>
              {teamStats.map(({ team, totalHp, hpPercent, isActive, aliveSlugs, totalSlugs }) => (
                <div
                  key={team.id}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                    isActive
                      ? 'bg-zinc-900 border-amber-500/60 text-white'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <span className="font-bold text-zinc-200 truncate max-w-[80px]">
                      {team.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      ({aliveSlugs}/{totalSlugs})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-amber-400 text-xs">
                      {totalHp} HP
                    </span>
                    <div className="w-12 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${hpPercent * 100}%`,
                          backgroundColor: team.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen Button on Mobile (Only if supported) */}
        {isFullscreenSupported && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 shadow-lg backdrop-blur-md active:scale-95 bg-zinc-950/60 border-zinc-700/80 text-zinc-300"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran immersif'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-zinc-300" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-300" />
            )}
          </button>
        )}

        <HeaderOptionsMenu
          showMenuPopover={showMenuPopover}
          setShowMenuPopover={setShowMenuPopover}
          fpsHudActive={fpsHudActive}
          setFpsHudActive={setFpsHudActive}
          isFullscreen={isFullscreen}
          isFullscreenSupported={isFullscreenSupported}
          toggleFullscreen={toggleFullscreen}
          isHost={isHost}
          showHitboxes={showHitboxes}
          onToggleHitboxes={onToggleHitboxes}
          onOpenRules={onOpenRules}
          onOpenMetrics={onOpenMetrics}
          onRestartGame={onRestartGame}
          onExit={onExit}
          onRequestConfirmLobby={onRequestConfirmLobby}
          isTouch={true}
        />
      </div>
    </header>
  );
};
