import React from 'react';
import { WeaponDefinition } from '../../../../core/weapons/types';
import { Check, Zap, Lock } from 'lucide-react';

interface WeaponGridCardProps {
  weapon: WeaponDefinition;
  ammo: number;
  isSelected: boolean;
  isTouch: boolean;
  isLocked?: boolean;
  turnDelay?: number;
  roundsRemaining?: number;
  onSelect: () => void;
}

const SUPER_WEAPONS = new Set(['holy_grenade', 'banana_bomb', 'concrete_donkey', 'super_sheep']);

export const WeaponGridCard: React.FC<WeaponGridCardProps> = ({
  weapon,
  ammo,
  isSelected,
  isTouch,
  isLocked = false,
  turnDelay = 0,
  roundsRemaining = 0,
  onSelect,
}) => {
  const isOutOfAmmo = ammo === 0;
  const isDisabled = isOutOfAmmo || isLocked;
  const isSuperWeapon = SUPER_WEAPONS.has(weapon.id);

  if (isTouch) {
    return (
      <button
        disabled={isDisabled}
        onClick={onSelect}
        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all relative overflow-hidden ${
          isSelected
            ? 'bg-gradient-to-br from-violet-950 to-purple-950/90 border-violet-400 ring-2 ring-violet-500/70 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
            : isLocked
            ? 'bg-zinc-950/80 border-dashed border-zinc-700/60 text-zinc-500 opacity-60 cursor-not-allowed'
            : isOutOfAmmo
            ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-600 opacity-40 cursor-not-allowed'
            : 'bg-zinc-900/80 border-zinc-800/80 hover:border-violet-500/50 hover:bg-zinc-800/90 text-zinc-200'
        }`}
      >
        {isSelected && (
          <div className="absolute top-1 left-1 p-0.5 bg-violet-600 border border-violet-300 text-white rounded-full shadow z-10">
            <Check className="w-2.5 h-2.5" />
          </div>
        )}

        <div
          className={`w-10 h-10 rounded-lg bg-zinc-950/90 border border-zinc-800 flex items-center justify-center text-2xl shrink-0 shadow-inner ${
            isLocked ? 'grayscale opacity-50' : ''
          }`}
        >
          {weapon.icon}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <div className="flex items-center gap-1">
            <span className={`font-bold text-xs truncate ${isLocked ? 'text-zinc-400' : 'text-zinc-100'}`}>
              {weapon.name}
            </span>
            {isSuperWeapon && (
              <span className="text-[8px] font-black uppercase bg-purple-950/90 text-purple-300 border border-purple-500/50 px-1 py-0.2 rounded shrink-0">
                Super ⭐
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            {isLocked ? (
              <span className="text-amber-400 font-bold flex items-center gap-0.5 shrink-0">
                <Lock className="w-2.5 h-2.5 text-amber-400" /> Tour {turnDelay} ({roundsRemaining} rest.)
              </span>
            ) : (
              <>
                <span className="text-red-400 font-bold flex items-center gap-0.5 shrink-0">
                  <Zap className="w-2.5 h-2.5 text-red-400" /> {weapon.damage} Dgt
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400 font-medium truncate">
                  {weapon.radius > 0 ? `R:${weapon.radius}px` : 'Direct'}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="text-right shrink-0">
          {isLocked ? (
            <div className="text-[10px] font-black px-1.5 py-0.5 rounded-lg border bg-amber-950/70 border-amber-500/50 text-amber-300 flex items-center gap-0.5 shadow-sm">
              <Lock className="w-2.5 h-2.5" /> T{turnDelay}
            </div>
          ) : (
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
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      disabled={isDisabled}
      onClick={onSelect}
      className={`p-3 rounded-2xl border text-left flex flex-col justify-between min-h-[148px] h-full transition-all relative overflow-hidden group ${
        isSelected
          ? 'bg-gradient-to-b from-violet-900/60 to-purple-950/80 border-violet-400 ring-2 ring-violet-500/80 shadow-[0_0_25px_rgba(139,92,246,0.4)]'
          : isLocked
          ? 'bg-zinc-950/70 border-dashed border-zinc-700/60 text-zinc-500 opacity-60 cursor-not-allowed'
          : isOutOfAmmo
          ? 'bg-zinc-950/50 border-zinc-800/40 text-zinc-600 opacity-40 cursor-not-allowed'
          : 'bg-zinc-900/80 border-zinc-800/90 hover:border-violet-500/60 hover:bg-zinc-850 hover:shadow-lg text-zinc-200 cursor-pointer'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 p-1 bg-violet-600 border border-violet-300 text-white rounded-full shadow z-10 animate-in zoom-in-50 duration-150">
          <Check className="w-3 h-3" />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div
            className={`w-10 h-10 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-center text-2xl shadow-inner shrink-0 ${
              isLocked ? 'grayscale opacity-50' : 'group-hover:scale-105 transition-transform'
            }`}
          >
            {weapon.icon}
          </div>
          {isLocked ? (
            <div className="text-[10px] font-black px-2 py-0.5 rounded-lg border bg-amber-950/80 border-amber-500/60 text-amber-300 flex items-center gap-1 shadow-sm">
              <Lock className="w-3 h-3 text-amber-400" /> Tour {turnDelay}
            </div>
          ) : (
            <div
              className={`text-[11px] font-black px-2 py-0.5 rounded-lg border ${
                ammo === -1
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : ammo > 0
                  ? 'bg-violet-950/80 border-violet-500/50 text-violet-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-600'
              }`}
            >
              {ammo === -1 ? '∞ Illimité' : `x${ammo} dispo`}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-0.5">
          <h4
            className={`font-extrabold text-xs truncate ${
              isLocked ? 'text-zinc-400' : 'text-zinc-100 group-hover:text-white transition-colors'
            }`}
          >
            {weapon.name}
          </h4>
          {isSuperWeapon && (
            <span className="text-[8px] font-black uppercase bg-purple-950 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 rounded-full shrink-0">
              Super-Arme ⭐
            </span>
          )}
        </div>

        <p className="text-[10.5px] text-zinc-400 line-clamp-2 leading-snug mb-2">
          {weapon.description}
        </p>
      </div>

      <div className="pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-medium text-zinc-400 shrink-0">
        {isLocked ? (
          <div className="text-amber-400 font-bold flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Disponible au Tour {turnDelay} ({roundsRemaining} rest.)</span>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </button>
  );
};
