import React from 'react';
import { GameConfig, Team } from '../../../core/types';
import { RoomCodeBadge } from 'p2play-core';
import { LobbyBackdropCanvas } from './LobbyBackdropCanvas';
import { LobbyMapConfig } from './LobbyMapConfig';
import { LobbyTeamList } from './LobbyTeamList';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useFullscreen } from '../../../hooks/useFullscreen';

export interface SlugWarsLobbyProps {
  isHost: boolean;
  myPeerId: string;
  hostPeerId: string;
  config: GameConfig;
  teams: Team[];
  isEmbedded?: boolean;
  onExit?: () => void;
  onChangeConfig: (partial: Partial<GameConfig>) => void;
  onStartGame: () => void;
  onSetTeamHat?: (teamId: string, hatId: string) => void;
}

export const SlugWarsLobby: React.FC<SlugWarsLobbyProps> = ({
  isHost,
  myPeerId,
  hostPeerId,
  config,
  teams,
  isEmbedded,
  onExit,
  onChangeConfig,
  onStartGame,
  onSetTeamHat,
}) => {
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

  return (
    <div className="h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col items-center p-3 md:p-5 relative overflow-x-hidden overflow-y-auto selection:bg-violet-500 selection:text-white">
      {/* Background Fixed HD Vector War Room Canvas */}
      <LobbyBackdropCanvas />

      {/* Ambient Lighting Orbs */}
      <div className="fixed top-10 left-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl w-full space-y-3 my-auto py-4">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 px-4 py-2.5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">🐌</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-violet-400">
                  SLUG WARS
                </h1>
                <span className="px-2 py-0.5 bg-violet-950/80 border border-violet-500/50 text-violet-300 text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                  QG Tactique
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Salon de préparation & d'armement</p>
            </div>
          </div>

          {/* Room Code Badge, Fullscreen & Optional Hub Exit Button */}
          <div className="flex items-center gap-2">
            {isFullscreenSupported && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 shadow-sm active:scale-95 bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 cursor-pointer"
                title={isFullscreen ? "Quitter le plein écran" : "Plein écran immersif"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-zinc-300" /> : <Maximize2 className="w-4 h-4 text-zinc-300" />}
              </button>
            )}
            <div className="select-text selection:bg-violet-600 selection:text-white cursor-text">
              <RoomCodeBadge code={hostPeerId || myPeerId} label="Code Salon" accentClassName="text-violet-400" />
            </div>
            {isEmbedded && onExit && (
              <button
                onClick={onExit}
                className="px-3 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800/50 rounded-xl text-xs font-bold text-red-300 transition cursor-pointer"
              >
                Quitter
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Battle Preparation Container */}
        <div className="grid grid-cols-1 md:grid-cols-12 landscape:grid-cols-12 gap-3.5">
          {/* Left Column: Map Radar, Weapons & Modifiers (7 Cols) */}
          <LobbyMapConfig config={config} isHost={isHost} onChangeConfig={onChangeConfig} />

          {/* Right Column: Squads List & Battle Launch (5 Cols) */}
          <LobbyTeamList
            teams={teams}
            config={config}
            isHost={isHost}
            myPeerId={myPeerId}
            onStartGame={onStartGame}
            onSetTeamHat={onSetTeamHat}
          />
        </div>
      </div>
    </div>
  );
};
