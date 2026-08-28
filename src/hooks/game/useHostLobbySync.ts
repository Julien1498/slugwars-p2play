import { useEffect } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { GameState } from '../../core/types';
import { type PeerManagerLike } from 'p2play-core';
import { TEAM_COLORS, resolveLobbyPlayerName } from './gameActionUtils';

interface UseHostLobbySyncOptions {
  engineRef: React.MutableRefObject<SlugWarsEngine>;
  isHost: boolean;
  myPeerId?: string | null;
  peerManager: PeerManagerLike;
  syncState: () => void;
  broadcastState: (state: GameState) => void;
  playerName?: string;
  playerAvatar?: string;
}

export function useHostLobbySync({
  engineRef,
  isHost,
  myPeerId,
  peerManager,
  syncState,
  broadcastState,
  playerName,
  playerAvatar,
}: UseHostLobbySyncOptions) {
  useEffect(() => {
    if (!isHost) return;

    const syncLobbyTeams = () => {
      if (engineRef.current.state.phase !== 'LOBBY') return;
      let changed = false;

      // Ensure host is present
      if (myPeerId && !engineRef.current.state.teams.some((t) => t.id === myPeerId)) {
        const hostName = playerName || peerManager.getTrustedUsername?.(myPeerId) || 'Hôte';
        const hostAvatar = playerAvatar || '🐌';
        engineRef.current.addTeam(myPeerId, hostName, TEAM_COLORS[0], hostAvatar, true);
        changed = true;
      }

      // Check all lobby players from peerManager
      if (peerManager.lobbyPlayers) {
        peerManager.lobbyPlayers.forEach((p) => {
          if (p.peerId && !engineRef.current.state.teams.some((t) => t.id === p.peerId)) {
            const resolvedName = resolveLobbyPlayerName(p.username, peerManager.getTrustedUsername?.(p.peerId), p.peerId);
            const colorIdx = engineRef.current.state.teams.length % TEAM_COLORS.length;
            engineRef.current.addTeam(
              p.peerId,
              resolvedName,
              TEAM_COLORS[colorIdx],
              p.avatar || '🐌',
              p.peerId === myPeerId
            );
            changed = true;
          }
        });
      }

      // Check all connected peer IDs from peerManager
      peerManager.connections?.forEach((conn, peerId) => {
        if (conn.open && !engineRef.current.state.teams.some((t) => t.id === peerId)) {
          const resolvedName = resolveLobbyPlayerName(undefined, peerManager.getTrustedUsername?.(peerId), peerId);
          const colorIdx = engineRef.current.state.teams.length % TEAM_COLORS.length;
          engineRef.current.addTeam(peerId, resolvedName, TEAM_COLORS[colorIdx], '🐌', false);
          changed = true;
        }
      });

      if (changed) {
        syncState();
        broadcastState(engineRef.current.state);
      }
    };

    syncLobbyTeams();

    const origPeerStatusChange = peerManager.onPeerStatusChange;
    peerManager.onPeerStatusChange = (peerId, st) => {
      origPeerStatusChange?.(peerId, st);
      if (st === 'CONNECTED') {
        syncLobbyTeams();
      }
    };

    const origPlayersUpdate = (peerManager as any).onPlayersUpdate;
    (peerManager as any).onPlayersUpdate = () => {
      origPlayersUpdate?.();
      syncLobbyTeams();
    };

    return () => {
      peerManager.onPeerStatusChange = origPeerStatusChange;
      (peerManager as any).onPlayersUpdate = origPlayersUpdate;
    };
  }, [isHost, myPeerId, playerName, playerAvatar, peerManager, syncState, broadcastState, engineRef]);
}
