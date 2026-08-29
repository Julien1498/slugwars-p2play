import React from 'react';
import { WeaponDefinition } from '../../../../core/weapons/types';
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
              {weapon.radius > 0 ? `R:${weapon.radius}px` : 'Impact direct'}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
              ammo === -1
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : ammo > 0
                ? 'bg-violet-950/80 border-violet-500/40 text-violet-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-600'
            }`}
          >
            {ammo === -1 ? '∞' : `x${ammo}`}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      disabled={isDisabled}
      onClick={onSelect}
      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer ${
        isSelected
          ? 'bg-gradient-to-b from-violet-900/60 to-purple-950/80 border-violet-400 ring-2 ring-violet-500/80 shadow-[0_0_25px_rgba(139,92,246,0.4)]'
          : isDisabled
          ? 'bg-zinc-950/50 border-zinc-800/40 text-zinc-600 opacity-40 cursor-not-allowed'
          : 'bg-zinc-900/80 border-zinc-800/90 hover:border-violet-500/60 hover:bg-zinc-850 hover:shadow-lg text-zinc-200'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 p-1 bg-violet-600 border border-violet-300 text-white rounded-full shadow z-10 animate-in zoom-in-50 duration-150">
          <Check className="w-3 h-3" />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
            {weapon.icon}
          </div>
          <div
            className={`text-xs font-black px-2 py-1 rounded-lg border ${
              ammo === -1
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : ammo > 0
                ? 'bg-violet-950/80 border-violet-500/50 text-violet-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-600'
            }`}
          >
            {ammo === -1 ? '∞ Illimité' : `x${ammo} dispo`}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-1">
          <h4 className="font-extrabold text-sm text-zinc-100 group-hover:text-white transition-colors truncate">
            {weapon.name}
          </h4>
          {weapon.craftable && (
            <span className="text-[9px] font-black uppercase bg-amber-950 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full shrink-0">
              Rare
            </span>
          )}
        </div>

        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed mb-3">
          {weapon.description}
        </p>
      </div>

      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-medium text-zinc-400">
        <div className="flex items-center gap-1 text-red-400 font-bold">
          <Zap className="w-3 h-3 text-red-400" />
          <span>{weapon.damage} Dégâts</span>
        </div>
        <div>
          {weapon.radius > 0 ? (
            <span className="text-zinc-400">Rayon: {weapon.radius}px</span>
          ) : (
            <span className="text-zinc-500 italic">Impact direct</span>
          )}
        </div>
      </div>
    </button>
  );
};
