import { GameState, Vector2D } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import type { ChatMessage, PeerManagerLike } from 'p2play-core';

export interface SlugWarsBoardProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  peerManager: PeerManagerLike;
  chatMessages: ChatMessage[];
  sendChat: (text: string) => void;
  myPeerId: string;
  hostPeerId: string;
  isHost: boolean;
  onFire: (targetPoint?: Vector2D) => void;
  onPlaceSlug?: (point: Vector2D) => void;
  onUpdateAim: (aimAngle: number, aimPower: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void;
  onSelectWeapon: (weaponId: string) => void;
  onSetFuseTimer?: (seconds: number) => void;
  onStartMove: (dir: 'left' | 'right') => void;
  onStopMove: () => void;
  onJump: () => void;
  onStartSteer?: (dir: 'left' | 'right') => void;
  onStopSteer?: () => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  onDetonate?: () => void;
  onEnterVehicle?: () => void;
  onExitVehicle?: () => void;
  onSteerVehicle?: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onRestartGame: () => void;
  onExit?: () => void;
  engine?: any;
  onDevAction?: (devMethod: string, devArgs?: any[]) => void;
}
