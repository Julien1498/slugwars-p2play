import React from 'react';

interface PlayerProfileCardProps {
  username: string;
  onChangeUsername: (name: string) => void;
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
}

export const AVATARS = ['🐌', '🤠', '🤖', '🧙', '👑', '🐑', '🎯', '💣', '🚀'];

export const PlayerProfileCard: React.FC<PlayerProfileCardProps> = ({
  username,
  onChangeUsername,
  selectedAvatar,
  onSelectAvatar,
}) => {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Votre Pseudo</label>
        <input
          type="text"
          maxLength={18}
          value={username}
          onChange={(e) => onChangeUsername(e.target.value)}
          placeholder="Ex: SuperSlug"
          className="w-full bg-zinc-950/80 border border-zinc-700/80 focus:border-violet-500 rounded-xl px-3.5 py-2.5 text-sm font-bold text-white placeholder-zinc-500 focus:outline-none transition"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Choisir un Avatar</label>
        <div className="flex items-center justify-between gap-1 p-2 bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-x-auto">
          {AVATARS.map((av) => (
            <button
              key={av}
              type="button"
              onClick={() => onSelectAvatar(av)}
              className={`w-8 h-8 flex items-center justify-center text-base rounded-lg transition ${
                selectedAvatar === av
                  ? 'bg-violet-600 border border-violet-300 scale-110 shadow-md shadow-violet-950'
                  : 'hover:bg-zinc-800/80 opacity-70 hover:opacity-100'
              }`}
            >
              {av}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
