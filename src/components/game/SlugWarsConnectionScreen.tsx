import React, { useState, useEffect } from 'react';
import { extractRoomCodeFromUrl, subscribeRoomUrlChanges } from 'p2play-core';
import { loadProfile, saveProfile } from '../../core/profile';
import { Sparkles, Swords, Zap, Rocket, AlertCircle } from 'lucide-react';
import { ConnectionBackdropCanvas } from './connection/ConnectionBackdropCanvas';
import { PlayerProfileCard } from './connection/PlayerProfileCard';
import { ConnectionActions } from './connection/ConnectionActions';

interface SlugWarsConnectionScreenProps {
  status: string;
  error?: string | null;
  isConnecting?: boolean;
  onHost: (username: string, avatar: string) => void;
  onJoin: (username: string, avatar: string, roomCode: string) => void;
}

export const SlugWarsConnectionScreen: React.FC<SlugWarsConnectionScreenProps> = ({
  error,
  isConnecting,
  onHost,
  onJoin,
}) => {
  const initialCode = extractRoomCodeFromUrl() || '';
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
      if (code) {
        setInvitationCode(code);
        setRoomCode(code);
      }
    });
  }, []);

  const handleHostClick = () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setValidationError('Veuillez entrer un pseudo');
      return;
    }
    saveProfile({ username: trimmed, avatar: selectedAvatar });
    setValidationError(null);
    onHost(trimmed, selectedAvatar);
  };

  const handleJoinClick = () => {
    const trimmedUser = username.trim();
    const trimmedCode = (invitationCode || roomCode).trim().toUpperCase();
    if (!trimmedUser) {
      setValidationError('Veuillez entrer un pseudo');
      return;
    }
    if (!trimmedCode) {
      setValidationError('Veuillez entrer un code de salon');
      return;
    }
    saveProfile({ username: trimmedUser, avatar: selectedAvatar });
    setValidationError(null);
    onJoin(trimmedUser, selectedAvatar, trimmedCode);
  };

  if (isConnecting) {
    return (
      <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 overflow-hidden">
        <ConnectionBackdropCanvas />
        <div className="relative z-10 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/50 p-8 rounded-2xl text-center space-y-4 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="relative inline-block">
            <div className="text-6xl animate-bounce">🐌</div>
            <div className="absolute -top-1 -right-2 text-2xl animate-spin" style={{ animationDuration: '3s' }}>
              🎯
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-amber-300">
              Connexion en cours...
            </h2>
            <p className="text-xs text-zinc-400">Établissement du tunnel WebRTC P2P direct</p>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden border border-zinc-700">
            <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-zinc-950 text-zinc-100 p-4 touch-pan-y z-10 selection:bg-violet-500 selection:text-white">
      <ConnectionBackdropCanvas />

      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Foreground Container */}
      <div className="relative z-10 max-w-md w-full space-y-5 mx-auto my-auto py-6 pb-16 flex flex-col">
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
