import React from 'react';
import { LogIn, PlusCircle } from 'lucide-react';
import { clearRoomUrlFromAddressBar } from 'p2play-core';

interface ConnectionActionsProps {
  invitationCode: string;
  roomCode: string;
  onChangeRoomCode: (code: string) => void;
  onClearInvitation: () => void;
  onHost: () => void;
  onJoin: () => void;
}

export const ConnectionActions: React.FC<ConnectionActionsProps> = ({
  invitationCode,
  roomCode,
  onChangeRoomCode,
  onClearInvitation,
  onHost,
  onJoin,
}) => {
  if (invitationCode) {
    return (
      <div className="space-y-3 pt-1">
        {/* Invitation Banner */}
        <div className="p-3 bg-violet-950/90 border border-violet-500/60 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-lg">💌</span>
            <div>
              <div className="text-zinc-400 text-[11px]">Invitation reçue pour la partie :</div>
              <div className="font-mono font-bold text-amber-300 text-sm">#{invitationCode}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClearInvitation();
              clearRoomUrlFromAddressBar();
            }}
            className="text-[11px] text-zinc-400 hover:text-zinc-200 underline"
          >
            Changer
          </button>
        </div>

        <button
          type="button"
          onClick={onJoin}
          className="w-full py-3 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-black text-sm rounded-xl transition shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2 animate-pulse"
        >
          <LogIn className="w-4 h-4" />
          <span>Rejoindre la partie ({invitationCode})</span>
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onHost}
            className="text-xs font-semibold text-zinc-400 hover:text-violet-300 transition flex items-center justify-center gap-1.5 mx-auto py-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ou créer une nouvelle partie</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={onHost}
        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] text-white font-black text-sm rounded-xl transition shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Créer un salon</span>
      </button>

      <div className="relative flex items-center justify-center py-1">
        <div className="border-t border-zinc-800 w-full" />
        <span className="bg-zinc-900 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest absolute">
          OU
        </span>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Rejoindre un salon</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => onChangeRoomCode(e.target.value.toUpperCase())}
            placeholder="Code du salon..."
            className="flex-1 bg-zinc-950/80 border border-zinc-700/80 focus:border-violet-500 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white placeholder-zinc-500 focus:outline-none transition uppercase tracking-wider"
          />
          <button
            type="button"
            onClick={onJoin}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] border border-zinc-700 hover:border-zinc-600 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <LogIn className="w-4 h-4 text-violet-400" />
            <span>Rejoindre</span>
          </button>
        </div>
      </div>
    </>
  );
};
