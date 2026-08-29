import React, { useState } from 'react';
import { WeaponCategory } from '../../core/weapons/types';
import { getAllWeapons } from '../../core/weapons/registry';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import { X, Sparkles } from 'lucide-react';
import { WeaponCategoryTabs } from './weaponPicker/WeaponCategoryTabs';
import { WeaponGridCard } from './weaponPicker/WeaponGridCard';

interface WeaponPickerProps {
  inventory: Record<string, number>;
  selectedWeaponId: string;
  onSelectWeapon: (weaponId: string) => void;
  onClose: () => void;
}

export const WeaponPicker: React.FC<WeaponPickerProps> = ({
  inventory,
  selectedWeaponId,
  onSelectWeapon,
  onClose,
}) => {
  const isTouch = useIsTouchDevice();
  const [activeCategory, setActiveCategory] = useState<WeaponCategory>('EXPLOSIVE');
  const allWeapons = getAllWeapons();
  const filtered = allWeapons.filter((w) => w.category === activeCategory);

  // Keyboard navigation for desktop: F1-F5 / 1-5 / &é"'( to switch categories, Esc/I/Tab to close
  React.useEffect(() => {
    if (isTouch) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const key = e.key.toLowerCase();

      if (e.key === 'Escape' || e.key === 'Tab' || key === 'i') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'F1' || key === '1' || key === '&') {
        e.preventDefault();
        setActiveCategory('EXPLOSIVE');
      } else if (e.key === 'F2' || key === '2' || key === 'é') {
        e.preventDefault();
        setActiveCategory('MELEE');
      } else if (e.key === 'F3' || key === '3' || key === '"') {
        e.preventDefault();
        setActiveCategory('AIR_SUPPORT');
      } else if (e.key === 'F4' || key === '4' || key === "'") {
        e.preventDefault();
        setActiveCategory('SPECIAL');
      } else if (e.key === 'F5' || key === '5' || key === '(') {
        e.preventDefault();
        setActiveCategory('UTILITY');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTouch, onClose]);

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

        {/* Categories Tabs */}
        <WeaponCategoryTabs
          isTouch={isTouch}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          allWeapons={allWeapons}
        />

        {/* Weapons Grid */}
        <div
          className={
            isTouch
              ? 'grid grid-cols-2 landscape:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto p-0.5 flex-1 min-h-0 content-start'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto p-1 flex-1 min-h-0 content-start'
          }
        >
          {filtered.map((w) => {
            const ammo = inventory[w.id] ?? w.defaultAmmo;
            return (
              <WeaponGridCard
                key={w.id}
                weapon={w}
                ammo={ammo}
                isSelected={selectedWeaponId === w.id}
                isTouch={isTouch}
                onSelect={() => {
                  onSelectWeapon(w.id);
                  onClose();
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
