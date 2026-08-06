import React, { useState } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { TurnHeader } from './TurnHeader';
import { SlugWarsCanvas } from './SlugWarsCanvas';
import { WeaponPicker } from './WeaponPicker';
import { RulesModal } from './RulesModal';
import { TextChatPanel, JournalPanel } from 'p2play-core/chat';
import { Trophy, RefreshCw, MessageSquare } from 'lucide-react';
import type { ChatMessage, PeerManagerLike } from 'p2play-core';

interface SlugWarsBoardProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  peerManager: PeerManagerLike;
  chatMessages: ChatMessage[];
  sendChat: (text: string) => void;
  myPeerId: string;
  hostPeerId: string;
  isHost: boolean;
  onFire: (targetPoint?: Vector2D) => void;
  onUpdateAim: (angle: number, power: number, facing: 'left' | 'right') => void;
  onSelectWeapon: (weaponId: string) => void;
  onRestartGame: () => void;
  onExit?: () => void;
}

export const SlugWarsBoard: React.FC<SlugWarsBoardProps> = ({
  gameState,
  terrain,
  peerManager,
  chatMessages,
  sendChat,
  myPeerId,
  hostPeerId,
  isHost,
  onFire,
  onUpdateAim,
  onSelectWeapon,
  onRestartGame,
  onExit,
}) => {
  const [showWeaponPicker, setShowWeaponPicker] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const isMyTurn = activeTeam?.id === myPeerId;
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
  const myTeam = gameState.teams.find((t) => t.id === myPeerId);

  return (
    <div className="flex flex-col h-full space-y-3 p-3">
      {/* Top Header */}
      <TurnHeader
        gameState={gameState}
        hostPeerId={hostPeerId}
        isMyTurn={isMyTurn}
        onOpenWeaponPicker={() => setShowWeaponPicker(true)}
        onOpenRules={() => setShowRules(true)}
        onExit={onExit}
      />

      {/* Main Gameplay Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1">
        {/* 2D Canvas View (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-2">
          <SlugWarsCanvas
            gameState={gameState}
            terrain={terrain}
            isMyTurn={isMyTurn}
            onFire={onFire}
            onUpdateAim={onUpdateAim}
          />
        </div>

        {/* Right Panel: Activity Journal & Text Chat (1 Col) */}
        <div className="flex flex-col space-y-3 bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold text-violet-300">Journal & Chat</span>
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {showChat ? (
              <TextChatPanel
                messages={chatMessages}
                onSend={sendChat}
                scrollbarAccent="violet"
              />
            ) : (
              <JournalPanel
                entries={gameState.journal.map((j) => ({
                  id: j.id,
                  timestamp: new Date(j.timestamp).toLocaleTimeString(),
                  message: j.message,
                  type: j.type === 'combat' ? 'action' : j.type === 'death' ? 'system' : 'info',
                }))}
                scrollbarAccent="violet"
              />
            )}
          </div>
        </div>
      </div>

      {/* Victory / Game Over Modal */}
      {gameState.phase === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-violet-500/50 rounded-2xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto animate-bounce" />
            <div>
              <h2 className="text-2xl font-black text-violet-300">Fin de la Partie !</h2>
              <p className="text-sm text-zinc-300 mt-1">
                {gameState.winnerTeamId
                  ? `Victoire écrasante de l'équipe ${gameState.teams.find((t) => t.id === gameState.winnerTeamId)?.name} !`
                  : 'Égalité parfaite ! Aucune survivante.'}
              </p>
            </div>
            {isHost && (
              <button
                onClick={onRestartGame}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" /> Revenir au Salon d'Avant-Partie
              </button>
            )}
          </div>
        </div>
      )}

      {/* Weapon Picker Modal */}
      {showWeaponPicker && myTeam && (
        <WeaponPicker
          inventory={myTeam.inventory}
          selectedWeaponId={activeSlug?.selectedWeaponId || 'bazooka'}
          onSelectWeapon={onSelectWeapon}
          onClose={() => setShowWeaponPicker(false)}
        />
      )}

      {/* Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
};
