import React, { useState } from 'react';
import { WeaponCategory, WeaponDefinition } from '../../core/weapons/types';
import { getAllWeapons } from '../../core/weapons/registry';
import { X, Sparkles, Zap, ShieldAlert } from 'lucide-react';

interface WeaponPickerProps {
  inventory: Record<string, number>;
  selectedWeaponId: string;
  onSelectWeapon: (weaponId: string) => void;
  onClose: () => void;
}

const CATEGORIES: { id: WeaponCategory; label: string }[] = [
  { id: 'EXPLOSIVE', label: 'Explosifs' },
  { id: 'MELEE', label: 'Mêlée' },
  { id: 'AIR_SUPPORT', label: 'Soutien Aérien' },
  { id: 'SPECIAL', label: 'Spécial W.M.D' },
  { id: 'UTILITY', label: 'Utilitaires' },
];

export const WeaponPicker: React.FC<WeaponPickerProps> = ({
  inventory,
  selectedWeaponId,
  onSelectWeapon,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<WeaponCategory>('EXPLOSIVE');
  const allWeapons = getAllWeapons();
  const filtered = allWeapons.filter((w) => w.category === activeCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-black text-violet-300">Arsenal W.M.D</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 border-b border-zinc-800 pb-3 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-zinc-800/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Weapons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
          {filtered.map((w) => {
            const ammo = inventory[w.id] ?? w.defaultAmmo;
            const isDisabled = ammo === 0;
            const isSelected = selectedWeaponId === w.id;

            return (
              <button
                key={w.id}
                disabled={isDisabled}
                onClick={() => {
                  onSelectWeapon(w.id);
                  onClose();
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition ${
                  isSelected
                    ? 'bg-violet-950/90 border-violet-500 ring-2 ring-violet-500/50'
                    : isDisabled
                    ? 'bg-zinc-950/50 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
                    : 'bg-zinc-800/40 border-zinc-700/50 hover:bg-zinc-800 text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{w.icon}</span>
                  <span
                    className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      w.id === 'blowtorch'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : ammo === -1
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : ammo > 0
                        ? 'bg-violet-950 text-violet-300 border border-violet-800'
                        : 'bg-zinc-900 text-zinc-600'
                    }`}
                  >
                    {w.id === 'blowtorch' ? `${Math.round(ammo)}% ⛽` : ammo === -1 ? '∞' : `x${ammo}`}
                  </span>
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-100 flex items-center justify-between">
                    <span>{w.name}</span>
                    {w.craftable && (
                      <span className="text-[10px] bg-amber-950 text-amber-300 px-1 rounded">W.M.D</span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">{w.description}</div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                  <span className="flex items-center gap-1 text-red-400 font-semibold">
                    <Zap className="w-3 h-3" /> {w.damage} Deg
                  </span>
                  <span>{w.windAffected ? 'Vent 💨' : 'Sans vent'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
