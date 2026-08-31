import React, { useState, useEffect } from 'react';
import { extractRoomCodeFromUrl, subscribeRoomUrlChanges } from 'p2play-core';
import { loadProfile, saveProfile } from '../../../core/profile';
import { Sparkles, Swords, Zap, Rocket, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import { ConnectionBackdropCanvas } from './ConnectionBackdropCanvas';
import { PlayerProfileCard } from './PlayerProfileCard';
import { ConnectionActions } from './ConnectionActions';
import { useFullscreen } from '../../../hooks/useFullscreen';

export interface SlugWarsConnectionScreenProps {
  status: string;
  error?: string | null;
  isConnecting?: boolean;
  onHost: (username: string, avatar: string) => void;
  onJoin: (username: string, avatar: string, roomCode: string) => void;
}

export function getRoomCodeFromLocation(): string {
  if (typeof window === 'undefined') return '';
  const fromCore = extractRoomCodeFromUrl();
  if (fromCore) return fromCore;

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('room') || params.get('code') || params.get('r') || params.get('join');
  if (fromQuery) return decodeURIComponent(fromQuery).trim().toUpperCase();

  const pathSegment = window.location.pathname.replace(/^\/+/, '').split('/')[0];
  if (pathSegment && pathSegment.length >= 3 && pathSegment.length <= 16 && !pathSegment.includes('.') && pathSegment !== 'index.html') {
    return decodeURIComponent(pathSegment).trim().toUpperCase();
  }

  const hash = window.location.hash.replace(/^[#/]+/, '');
  if (hash) return decodeURIComponent(hash).trim().toUpperCase();

  return '';
}

export const SlugWarsConnectionScreen: React.FC<SlugWarsConnectionScreenProps> = ({
  error,
  isConnecting,
  onHost,
  onJoin,
}) => {
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();
  const initialCode = getRoomCodeFromLocation();
  const savedProfile = loadProfile();
  const [username, setUsername] = useState(() => {
    return savedProfile?.username || ('Limace_' + Math.floor(100 + Math.random() * 900));
  });
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    return savedProfile?.avatar || '🐌';
  });
  const [invitationCode, setInvitationCode] = useState<string>(initialCode);
  const [roomCode, setRoomCode] = useState<string>(initialCode);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeRoomUrlChanges((code) => {
      const activeCode = code || getRoomCodeFromLocation();
      if (activeCode) {
        setInvitationCode(activeCode);
        setRoomCode(activeCode);
      }
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const isAutoJoin = params.get('autojoin') === '1' || params.get('autojoin') === 'true' || params.get('auto') === '1';
    const targetRoom = getRoomCodeFromLocation();
    if (isAutoJoin && targetRoom && !isConnecting) {
      const guestName = `Invité_${Math.floor(100 + Math.random() * 900)}`;
      onJoin(guestName, selectedAvatar || '🐌', targetRoom);
    }
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 16);
    setUsername(val);
    if (validationError) setValidationError(null);
  };

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setRoomCode(val);
    if (validationError) setValidationError(null);
  };

  const validateAndSave = (): string | null => {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return "Veuillez entrer un pseudo d'agent tactique";
    }
    saveProfile({ username: cleanUsername, avatar: selectedAvatar });
    return cleanUsername;
  };

  const handleHostClick = () => {
    const cleanUsername = validateAndSave();
    if (!cleanUsername) return;
    onHost(cleanUsername, selectedAvatar);
  };

  const handleJoinClick = () => {
    const cleanUsername = validateAndSave();
    if (!cleanUsername) return;
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setValidationError('Veuillez entrer un code de salon valide');
      return;
    }
    onJoin(cleanUsername, selectedAvatar, cleanCode);
  };

  if (isConnecting) {
    return (
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <ConnectionBackdropCanvas />
        <div className="relative z-10 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/40 rounded-2xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl animate-pulse">
          <div className="w-16 h-16 rounded-full bg-violet-600/20 border-2 border-violet-500 mx-auto flex items-center justify-center text-3xl animate-bounce">
            🐌
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Déploiement en cours...</h2>
            <p className="text-xs text-zinc-400 mt-1">Connexion sécurisée P2P WebRTC</p>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-zinc-700">
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 relative overflow-x-hidden overflow-y-auto selection:bg-violet-500 selection:text-white">
      <ConnectionBackdropCanvas />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Controls Bar */}
      {isFullscreenSupported && (
        <div className="absolute top-3 right-3 z-20">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-lg backdrop-blur-md active:scale-95 bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 cursor-pointer"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran immersif"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-zinc-300" /> : <Maximize2 className="w-4 h-4 text-zinc-300" />}
            <span className="text-[11px] hidden sm:inline">{isFullscreen ? "Réduire" : "Plein écran"}</span>
          </button>
        </div>
      )}

      {/* Main Foreground Container */}
      <div className="relative z-10 max-w-md w-full space-y-5 my-auto py-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-950/80 border border-violet-500/40 rounded-full text-xs font-bold text-violet-300 shadow-md backdrop-blur">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Artillerie Tactique Multijoueur & Terrains Destructibles</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl md:text-5xl drop-shadow-[0_0_20px_rgba(168,85,247,0.6)]">🐌</span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-violet-100 to-violet-400 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              SLUG WARS
            </h1>
            <span className="text-4xl md:text-5xl drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">💣</span>
          </div>

          <p className="text-xs md:text-sm text-zinc-400 max-w-sm mx-auto font-medium">
            Formez vos escouades, armez vos bazookas et détruisez le terrain adverse !
          </p>
        </div>

        {/* Unified Glass Card */}
        <div className="bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
          {(error || validationError) && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{validationError || error}</span>
            </div>
          )}

          <PlayerProfileCard
            username={username}
            onChangeUsername={setUsername}
            selectedAvatar={selectedAvatar}
            onSelectAvatar={setSelectedAvatar}
          />

          <ConnectionActions
            invitationCode={invitationCode}
            roomCode={roomCode}
            onChangeRoomCode={setRoomCode}
            onClearInvitation={() => {
              setInvitationCode('');
              setRoomCode('');
            }}
            onHost={handleHostClick}
            onJoin={handleJoinClick}
          />
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" /> WebRTC Direct
          </span>
          <span className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
            <Rocket className="w-3 h-3 text-violet-400" /> 18+ Armes & Véhicules
          </span>
          <span className="px-2.5 py-1 bg-zinc-900/60 border border-zinc-800/80 rounded-lg text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
            <Swords className="w-3 h-3 text-emerald-400" /> 2 à 6 Équipes
          </span>
        </div>
      </div>
    </div>
  );
};
