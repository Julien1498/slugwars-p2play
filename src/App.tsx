import React from 'react';
import { useGame } from './hooks/useGame';
import { SlugWarsLobby } from './components/game/SlugWarsLobby';
import { SlugWarsBoard } from './components/game/SlugWarsBoard';
import { P2PlayLobby } from 'p2play-core';
import type { PeerManagerLike } from 'p2play-core';

export interface AppProps {
  isEmbedded?: boolean;
  externalPeerManager?: PeerManagerLike;
  onExit?: () => void;
  playerName?: string;
  playerAvatar?: string;
}

export const App: React.FC<AppProps> = ({
  isEmbedded,
  externalPeerManager,
  onExit,
  playerName,
  playerAvatar,
}) => {
  const {
    peerManager,
    gameState,
    engine,
    sendAction,
    sendChat,
    chatMessages,
    status,
    error,
    isHost,
    myPeerId,
    hostPeerId,
    hostRoom,
    joinRoom,
  } = useGame({
    isEmbedded,
    externalPeerManager,
    playerName,
    playerAvatar,
  });

  const isConnected = status === 'CONNECTED' || (status as string) === 'connected';
  const isConnecting = status === 'CONNECTING' || (status as string) === 'connecting';

  // Standalone Mode: If not connected/connecting to a room and not embedded, render shared P2PlayLobby
  if (!isEmbedded && !isConnected && !isConnecting) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          <P2PlayLobby
            theme="violet"
            status={status}
            error={error}
            showVoiceToggle={false}
            compactHostSection
            joinLayout="side-by-side"
            onHost={(username, avatar) => {
              void hostRoom(username, avatar);
            }}
            onJoin={(username, avatar, roomCode) => {
              void joinRoom(username, avatar, roomCode);
            }}
          />
        </div>
      </div>
    );
  }

  // Connecting state loader for standalone mode
  if (!isEmbedded && isConnecting && !isConnected) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-bounce">🐌</div>
          <div className="text-lg font-bold text-violet-300">Connexion au salon PeerJS...</div>
          <div className="text-xs text-zinc-400">Initialisation du réseau P2P</div>
        </div>
      </div>
    );
  }

  // Pre-Game Configuration Lobby
  if (gameState.phase === 'LOBBY') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
        <SlugWarsLobby
          isHost={isHost}
          myPeerId={myPeerId}
          hostPeerId={hostPeerId}
          config={gameState.config}
          teams={gameState.teams}
          isEmbedded={isEmbedded}
          onExit={onExit}
          onChangeConfig={(config) => sendAction('CHANGE_CONFIG', { config })}
          onStartGame={() => sendAction('START_GAME')}
        />
      </div>
    );
  }

  // Active Game Board
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SlugWarsBoard
        gameState={gameState}
        terrain={engine.terrain}
        peerManager={peerManager}
        chatMessages={chatMessages}
        sendChat={sendChat}
        myPeerId={myPeerId}
        hostPeerId={hostPeerId}
        isHost={isHost}
        onFire={(targetPoint) => sendAction('FIRE', { targetPoint })}
        onPlaceSlug={(point) => sendAction('PLACE_SLUG', { point })}
        onUpdateAim={(aimAngle, aimPower, facing) => sendAction('AIM', { aimAngle, aimPower, facing })}
        onSelectWeapon={(weaponId) => sendAction('SELECT_WEAPON', { weaponId })}
        onStartMove={(dir) => sendAction('START_MOVE', { dir })}
        onStopMove={() => sendAction('STOP_MOVE')}
        onJump={() => sendAction('JUMP')}
        onStartSteer={(dir) => sendAction('START_STEER', { dir })}
        onStopSteer={() => sendAction('STOP_STEER')}
        onStartCharge={(targetPoint) => sendAction('START_CHARGE', { targetPoint })}
        onReleaseCharge={(targetPoint) => sendAction('RELEASE_CHARGE', { targetPoint })}
        onDetonate={() => sendAction('DETONATE')}
        onEnterVehicle={() => sendAction('ENTER_VEHICLE')}
        onExitVehicle={() => sendAction('EXIT_VEHICLE')}
        onSteerVehicle={(dir) => sendAction('STEER_VEHICLE', { dir })}
        onRestartGame={() => sendAction('RESTART_GAME')}
        onExit={onExit}
      />
    </div>
  );
};

export default App;
