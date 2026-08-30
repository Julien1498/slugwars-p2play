import React from 'react';
import { Infinity, Unlock, PackagePlus } from 'lucide-react';
import { WEAPON_REGISTRY } from '../../../../core/weapons/registry';

interface DevWeaponsTabProps {
  onSetInfiniteAmmo: () => void;
  onUnlockAllWeapons: () => void;
  onGrantWeapon: (weaponId: string, count: number) => void;
}

export const DevWeaponsTab: React.FC<DevWeaponsTabProps> = ({
  onSetInfiniteAmmo,
  onUnlockAllWeapons,
  onGrantWeapon,
}) => {
  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onSetInfiniteAmmo}
          className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Infinity className="w-4 h-4" /> Munitions Illimitées (∞)
        </button>

        <button
          onClick={onUnlockAllWeapons}
          className="px-3 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 font-bold border border-violet-500/40 flex items-center justify-center gap-1.5 transition-colors"
        >
          <Unlock className="w-4 h-4" /> Débloquer Tout (+5)
        </button>
      </div>

      <div className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
        Donner une arme spécifique (+3) :
      </div>

      <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
        {Object.values(WEAPON_REGISTRY).map((w) => (
          <button
            key={w.id}
            onClick={() => onGrantWeapon(w.id, 3)}
            className="px-2 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-zinc-300 font-medium truncate flex items-center gap-1.5 transition-colors"
            title={`${w.name} (+3)`}
          >
            <span className="text-sm shrink-0">{w.icon}</span>
            <span className="truncate">{w.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
