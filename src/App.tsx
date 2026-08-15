import React from 'react';
import { useGame } from './hooks/useGame';
import { SlugWarsLobby } from './components/game/SlugWarsLobby';
import { SlugWarsBoard } from './components/game/SlugWarsBoard';
import { SlugWarsConnectionScreen } from './components/game/SlugWarsConnectionScreen';
import type { PeerManagerLike } from 'p2play-core';
import { loadProfile } from './core/profile';

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
  playerName: propName,
  playerAvatar: propAvatar,
}) => {
  const savedProfile = loadProfile();
  const playerName = propName || savedProfile?.username;
  const playerAvatar = propAvatar || savedProfile?.avatar;

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

  // Standalone Mode: If not connected to a room and not embedded in Hub, render stylish SlugWars connection & landing screen
  if (!isEmbedded && !isConnected) {
    return (
      <SlugWarsConnectionScreen
        status={status}
        error={error}
        isConnecting={isConnecting}
        onHost={(username, avatar) => {
          void hostRoom(username, avatar);
        }}
        onJoin={(username, avatar, roomCode) => {
          void joinRoom(username, avatar, roomCode);
        }}
      />
    );
  }

  // Pre-Game Configuration Lobby
  if (gameState.phase === 'LOBBY') {
    return (
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
