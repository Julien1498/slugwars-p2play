import React, { useState } from 'react';
import { WeaponCategory } from '../../../core/weapons/types';
import { getAllWeapons } from '../../../core/weapons/registry';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { X, Sparkles } from 'lucide-react';
import { WeaponCategoryTabs } from './weaponPicker/WeaponCategoryTabs';
import { WeaponGridCard } from './weaponPicker/WeaponGridCard';

interface WeaponPickerProps {
  inventory: Record<string, number>;
  selectedWeaponId: string;
  turnCount?: number;
  teamsCount?: number;
  onSelectWeapon: (weaponId: string) => void;
  onClose: () => void;
}

export const WeaponPicker: React.FC<WeaponPickerProps> = ({
  inventory,
  selectedWeaponId,
  turnCount = 1,
  teamsCount = 2,
  onSelectWeapon,
  onClose,
}) => {
  const isTouch = useIsTouchDevice();
  const [activeCategory, setActiveCategory] = useState<WeaponCategory>('EXPLOSIVE');
  const allWeapons = getAllWeapons();
  const filtered = allWeapons.filter((w) => w.category === activeCategory);

  const totalTeams = Math.max(1, teamsCount);
  const completedRounds = Math.floor(Math.max(0, turnCount - 1) / totalTeams);

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto pointer-events-auto select-none animate-in fade-in duration-150">
      <div
        className={`bg-zinc-950/95 border border-violet-500/40 rounded-2xl sm:rounded-3xl w-full flex flex-col shadow-[0_0_50px_rgba(124,58,237,0.25)] pointer-events-auto ${
          isTouch
            ? 'w-[95vw] max-w-4xl landscape:max-w-5xl p-2.5 sm:p-4 space-y-2 sm:space-y-2.5 h-[92vh] sm:h-[540px] max-h-[96vh]'
            : 'max-w-5xl p-5 space-y-3.5 h-[540px] max-h-[90vh]'
        }`}
      >
        {/* Header Title Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-600/20 text-violet-400 rounded-lg border border-violet-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-purple-200 to-indigo-200 uppercase tracking-wider">
                Arsenal Tactique
              </h2>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                {isTouch
                  ? 'Touchez une arme pour équiper votre limace'
                  : 'Sélectionnez votre armement • Raccourcis [1-5] pour naviguer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <WeaponCategoryTabs
          isTouch={isTouch}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          allWeapons={allWeapons}
        />

        {/* Weapons Grid: 2 cols on mobile portrait, 3-4 cols on mobile landscape, 4 cols on desktop */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto pr-1 no-scrollbar content-start ${
            isTouch
              ? 'grid grid-cols-2 landscape:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2'
              : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5'
          }`}
        >
          {filtered.map((w) => {
            const count = inventory[w.id] ?? 0;
            const isSelected = selectedWeaponId === w.id;
            const turnDelay = w.turnDelay ?? 0;
            const hasCrateAmmo = count > 0 && turnDelay > 0;
            const isLocked = turnDelay > 0 && completedRounds < turnDelay && !hasCrateAmmo;
            const roundsRemaining = Math.max(0, turnDelay - completedRounds);

            return (
              <WeaponGridCard
                key={w.id}
                weapon={w}
                ammo={count}
                isSelected={isSelected}
                isTouch={isTouch}
                isLocked={isLocked}
                turnDelay={turnDelay}
                roundsRemaining={roundsRemaining}
                onSelect={() => {
                  if (!isLocked && count !== 0) {
                    onSelectWeapon(w.id);
                    onClose();
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
