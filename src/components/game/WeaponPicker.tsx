import React, { useState } from 'react';
import { WeaponCategory, WeaponDefinition } from '../../core/weapons/types';
import { getAllWeapons } from '../../core/weapons/registry';
import { X, Sparkles, Zap, ShieldAlert, Bomb, Swords, Plane, Flame, Wrench, Check } from 'lucide-react';

interface WeaponPickerProps {
  inventory: Record<string, number>;
  selectedWeaponId: string;
  onSelectWeapon: (weaponId: string) => void;
  onClose: () => void;
}

const CATEGORIES: { id: WeaponCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'EXPLOSIVE', label: 'Explosifs', icon: <Bomb className="w-3.5 h-3.5" /> },
  { id: 'MELEE', label: 'Mêlée', icon: <Swords className="w-3.5 h-3.5" /> },
  { id: 'AIR_SUPPORT', label: 'Aérien', icon: <Plane className="w-3.5 h-3.5" /> },
  { id: 'SPECIAL', label: 'W.M.D', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'UTILITY', label: 'Utilitaires', icon: <Wrench className="w-3.5 h-3.5" /> },
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950/95 border border-violet-500/40 rounded-3xl max-w-4xl w-full p-5 space-y-4 shadow-[0_0_50px_rgba(124,58,237,0.25)] flex flex-col h-[560px] max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-violet-200 tracking-tight flex items-center gap-2">
                <span>Arsenal Tactique</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-violet-950 border border-violet-500/60 rounded-full text-violet-300">
                  W.M.D
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Choisissez votre arme pour le tour en cours</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tabs - Grid 5 columns, fixed height tabs, zero resizing */}
        <div className="grid grid-cols-5 gap-2 border-b border-zinc-800/80 pb-3 shrink-0">
          {CATEGORIES.map((cat) => {
            const count = allWeapons.filter((w) => w.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {cat.icon}
                <span className="truncate">{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Weapons Grid - Fixed container with content-start so layout never shifts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto p-1 flex-1 min-h-0 content-start">
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
                    {w.icon}
                  </div>
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                      w.id === 'blowtorch'
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
                        : ammo === -1
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                        : ammo > 0
                        ? 'bg-violet-950/90 text-violet-300 border border-violet-500/60'
                        : 'bg-zinc-900 text-zinc-600'
                    }`}
                  >
                    {w.id === 'blowtorch' ? `${Math.round(ammo)}% ⛽` : ammo === -1 ? '∞' : `x${ammo}`}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                    <span>{w.name}</span>
                    {w.craftable && (
                      <span className="text-[9px] font-black uppercase bg-amber-950/90 text-amber-300 border border-amber-500/50 px-1.5 py-0.2 rounded">
                        W.M.D
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                    {w.description}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-2 border-t border-zinc-800/80">
                  <span className="flex items-center gap-1 text-red-400 font-bold">
                    <Zap className="w-3 h-3 text-red-400" /> {w.damage} Dgt
                  </span>
                  <span className="font-semibold text-zinc-400">
                    {w.windAffected ? 'Vent 💨' : 'Sans vent'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
