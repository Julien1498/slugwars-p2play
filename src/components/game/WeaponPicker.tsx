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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950/95 border border-violet-500/40 rounded-2xl sm:rounded-3xl max-w-3xl w-full p-2.5 sm:p-4 space-y-2 flex flex-col h-[88vh] sm:h-[540px] max-h-[92vh] shadow-[0_0_50px_rgba(124,58,237,0.25)]">
        {/* Header - Slim and compact */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-violet-200 tracking-tight">
                Arsenal Tactique
              </h2>
              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 bg-violet-950 border border-violet-500/60 rounded-full text-violet-300">
                W.M.D
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories Tabs - Scrollable horizontal pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 border-b border-zinc-800/80 pb-2 shrink-0">
          {CATEGORIES.map((cat) => {
            const count = allWeapons.filter((w) => w.category === cat.id).length;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {cat.icon}
                <span className="whitespace-nowrap">{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
                    isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Weapons Grid - 2 cols on mobile, 3 cols on desktop, fixed height horizontal cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto p-0.5 flex-1 min-h-0 content-start">
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
                className={`p-2 sm:p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-violet-950 to-purple-950/90 border-violet-400 ring-2 ring-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.35)]'
                    : isDisabled
                    ? 'bg-zinc-950/40 border-zinc-800/60 text-zinc-600 opacity-40 cursor-not-allowed'
                    : 'bg-zinc-900/80 border-zinc-800/80 hover:border-violet-500/50 hover:bg-zinc-800/90 text-zinc-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1 p-0.5 bg-violet-600 text-white rounded-full shadow">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}

                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-zinc-950/90 border border-zinc-800 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {w.icon}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs sm:text-sm text-zinc-100 truncate">
                      {w.name}
                    </span>
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                        w.id === 'blowtorch'
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
                          : ammo === -1
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                          : ammo > 0
                          ? 'bg-violet-950/90 text-violet-300 border border-violet-500/60'
                          : 'bg-zinc-900 text-zinc-600'
                      }`}
                    >
                      {w.id === 'blowtorch' ? `${Math.round(ammo)}%` : ammo === -1 ? '∞' : `x${ammo}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 mt-0.5 text-[10px] text-zinc-400">
                    <span className="text-red-400 font-bold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-red-400" /> {w.damage} Dgt
                    </span>
                    <span className="text-zinc-500 text-[9px] truncate">
                      {w.windAffected ? '💨 Vent' : 'Direct'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
