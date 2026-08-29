import React from 'react';
import { WeaponDefinition } from '../../../core/weapons/types';
import { Check, Zap } from 'lucide-react';

interface WeaponGridCardProps {
  weapon: WeaponDefinition;
  ammo: number;
  isSelected: boolean;
  isTouch: boolean;
  onSelect: () => void;
}

export const WeaponGridCard: React.FC<WeaponGridCardProps> = ({
  weapon,
  ammo,
  isSelected,
  isTouch,
  onSelect,
}) => {
  const isDisabled = ammo === 0;

  if (isTouch) {
    return (
      <button
        disabled={isDisabled}
        onClick={onSelect}
        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all relative overflow-hidden ${
          isSelected
            ? 'bg-gradient-to-br from-violet-950 to-purple-950/90 border-violet-400 ring-2 ring-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
            : isDisabled
            ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-600 opacity-40 cursor-not-allowed'
            : 'bg-zinc-900/80 border-zinc-800/80 hover:border-violet-500/50 hover:bg-zinc-800/90 text-zinc-200'
        }`}
      >
        {isSelected && (
          <div className="absolute top-1 left-1 p-0.5 bg-violet-600 border border-violet-300 text-white rounded-full shadow z-10">
            <Check className="w-2.5 h-2.5" />
          </div>
        )}

        <div className="w-10 h-10 rounded-lg bg-zinc-950/90 border border-zinc-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
          {weapon.icon}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1">
            <span className="font-bold text-xs text-zinc-100 truncate">{weapon.name}</span>
            {weapon.craftable && (
              <span className="text-[8px] font-black uppercase bg-amber-950/90 text-amber-300 border border-amber-500/50 px-1 py-0.2 rounded shrink-0">
                WMD
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="text-red-400 font-bold flex items-center gap-0.5 shrink-0">
              <Zap className="w-2.5 h-2.5 text-red-400" /> {weapon.damage} Dgt
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400 font-medium truncate">
              {weapon.windAffected ? '💨 Vent' : '🎯 Direct'}
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-1 rounded-lg text-xs font-black shrink-0 shadow-sm ${
            weapon.id === 'blowtorch'
              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
              : ammo === -1
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
              : ammo > 0
              ? 'bg-violet-950/90 text-violet-300 border border-violet-500/60'
              : 'bg-zinc-900 text-zinc-600'
          }`}
        >
          {weapon.id === 'blowtorch' ? `${Math.round(ammo)}%` : ammo === -1 ? '∞' : `x${ammo}`}
        </span>
      </button>
    );
  }

  return (
    <button
      disabled={isDisabled}
      onClick={onSelect}
      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all relative overflow-hidden ${
        isSelected
          ? 'bg-gradient-to-br from-violet-950/90 to-purple-950/80 border-violet-400 ring-2 ring-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.35)] scale-[1.02]'
          : isDisabled
          ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-600 opacity-40 cursor-not-allowed'
          : 'bg-zinc-900/70 border-zinc-800/80 hover:border-violet-500/50 hover:bg-zinc-800/90 text-zinc-200 hover:shadow-lg'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 p-1 bg-violet-600 text-white rounded-full shadow">
          <Check className="w-3 h-3" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-center text-2xl shadow-inner">
          {weapon.icon}
        </div>
        <span
          className={`text-xs font-black px-2.5 py-1 rounded-lg ${
            weapon.id === 'blowtorch'
              ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
              : ammo === -1
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
              : ammo > 0
              ? 'bg-violet-950/90 text-violet-300 border border-violet-500/60'
              : 'bg-zinc-900 text-zinc-600'
          }`}
        >
          {weapon.id === 'blowtorch' ? `${Math.round(ammo)}% ⛽` : ammo === -1 ? '∞' : `x${ammo}`}
        </span>
      </div>

      <div>
        <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
          <span>{weapon.name}</span>
          {weapon.craftable && (
            <span className="text-[9px] font-black uppercase bg-amber-950/90 text-amber-300 border border-amber-500/50 px-1.5 py-0.2 rounded">
              W.M.D
            </span>
          )}
        </div>
        <div className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
          {weapon.description}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-zinc-800/80">
        <span className="flex items-center gap-1 text-red-400 font-bold">
          <Zap className="w-3 h-3 text-red-400" /> {weapon.damage} Dgt
        </span>
        <span className="font-semibold text-zinc-400">
          {weapon.windAffected ? 'Vent 💨' : 'Sans vent'}
        </span>
      </div>
    </button>
  );
};
