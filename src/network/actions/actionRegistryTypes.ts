import { GamePhase, GameState, Slug } from '../../core/types';
import { SlugWarsEngine } from '../../core/gameEngine';
import { PeerManagerLike } from 'p2play-core';
import { SlugWarsNetworkPayload } from '../protocol';

export type ActionPermission =
  | 'HOST_ONLY'
  | 'ACTIVE_TURN_ONLY'
  | 'ANY'
  | 'DEV_OR_HOST';

export interface HostActionContext {
  engine: SlugWarsEngine;
  playerId: string;
  hostId: string;
  peerManager: PeerManagerLike;
  syncState: () => void;
  broadcastState: (state: GameState) => void;
}

export interface NetworkActionDefinition<TPayload = SlugWarsNetworkPayload> {
  permission: ActionPermission;
  allowedPhases?: GamePhase[];
  applyOptimistic?: (state: GameState, activeSlug: Slug, payload: TPayload) => void;
  executeHost: (ctx: HostActionContext, payload: TPayload) => void;
}
