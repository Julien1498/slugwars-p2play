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
  isHost?: boolean;
  lateJoin?: boolean;
  gameConfig?: any;
  hubPhase?: string;
  enableTextChat?: boolean;
}

export const App: React.FC<AppProps> = ({
  isEmbedded,
  externalPeerManager,
  onExit,
  playerName: propName,
  playerAvatar: propAvatar,
  isHost: propIsHost,
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
    isHost: propIsHost,
  });

  const isConnected = status === 'CONNECTED' || (status as string) === 'connected';
  const isConnecting = status === 'CONNECTING' || (status as string) === 'connecting';

  const handleRestartGame = React.useCallback(() => sendAction('RESTART_GAME'), [sendAction]);
  const handleFire = React.useCallback((targetPoint?: any) => sendAction('FIRE', { targetPoint }), [sendAction]);
  const handlePlaceSlug = React.useCallback((point: any) => sendAction('PLACE_SLUG', { point }), [sendAction]);
  const handleUpdateAim = React.useCallback((aimAngle: number, aimPower: number, facing: 'left' | 'right', targetPoint?: any) => sendAction('AIM', { aimAngle, aimPower, facing, targetPoint }), [sendAction]);
  const handleSelectWeapon = React.useCallback((weaponId: string) => sendAction('SELECT_WEAPON', { weaponId }), [sendAction]);
  const handleSetFuseTimer = React.useCallback((seconds: number) => sendAction('SET_FUSE_TIMER', { seconds }), [sendAction]);
  const handleStartMove = React.useCallback((dir: 'left' | 'right') => sendAction('START_MOVE', { dir }), [sendAction]);
  const handleStopMove = React.useCallback(() => sendAction('STOP_MOVE'), [sendAction]);
  const handleJump = React.useCallback(() => sendAction('JUMP'), [sendAction]);
  const handleStartSteer = React.useCallback((dir: 'left' | 'right') => sendAction('START_STEER', { dir }), [sendAction]);
  const handleStopSteer = React.useCallback(() => sendAction('STOP_STEER'), [sendAction]);
  const handleStartCharge = React.useCallback((targetPoint?: any) => sendAction('START_CHARGE', { targetPoint }), [sendAction]);
  const handleReleaseCharge = React.useCallback((targetPoint?: any) => sendAction('RELEASE_CHARGE', { targetPoint }), [sendAction]);
  const handleDetonate = React.useCallback(() => sendAction('DETONATE'), [sendAction]);
  const handleEnterVehicle = React.useCallback(() => sendAction('ENTER_VEHICLE'), [sendAction]);
  const handleExitVehicle = React.useCallback(() => sendAction('EXIT_VEHICLE'), [sendAction]);
  const handleSteerVehicle = React.useCallback((dir: any) => sendAction('STEER_VEHICLE', { dir }), [sendAction]);

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
    <div className="h-[100dvh] w-full overflow-hidden overscroll-none touch-none bg-zinc-950 text-zinc-100 fixed inset-0">
      <SlugWarsBoard
        gameState={gameState}
        terrain={engine.terrain}
        peerManager={peerManager}
        chatMessages={chatMessages}
        sendChat={sendChat}
        myPeerId={myPeerId}
        hostPeerId={hostPeerId}
        isHost={isHost}
        onFire={handleFire}
        onPlaceSlug={handlePlaceSlug}
        onUpdateAim={handleUpdateAim}
        onSelectWeapon={handleSelectWeapon}
        onSetFuseTimer={handleSetFuseTimer}
        onStartMove={handleStartMove}
        onStopMove={handleStopMove}
        onJump={handleJump}
        onStartSteer={handleStartSteer}
        onStopSteer={handleStopSteer}
        onStartCharge={handleStartCharge}
        onReleaseCharge={handleReleaseCharge}
        onDetonate={handleDetonate}
        onEnterVehicle={handleEnterVehicle}
        onExitVehicle={handleExitVehicle}
        onSteerVehicle={handleSteerVehicle}
        onRestartGame={handleRestartGame}
        onExit={onExit}
      />
    </div>
  );
};

export default App;
