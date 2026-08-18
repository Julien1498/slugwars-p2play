import React, { useState, useEffect } from 'react';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { X, Smartphone } from 'lucide-react';

export const OrientationLockPrompt: React.FC = () => {
  const isTouch = useIsTouchDevice();
  const [dismissed, setDismissed] = useState(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      if (!portrait) {
        setDismissed(false); // Reset when rotated to landscape
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (isPortrait && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), 6000);
      return () => clearTimeout(timer);
    }
  }, [isPortrait, dismissed]);

  if (!isTouch || !isPortrait || dismissed) return null;

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-amber-500/50 shadow-xl shadow-amber-500/10 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto max-w-[90vw]">
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0">
        <Smartphone className="w-4 h-4 rotate-90 animate-pulse" />
      </div>

      <div className="flex flex-col text-left pr-1">
        <span className="text-[11px] font-black text-amber-300 uppercase tracking-tight">
          Mode Paysage Conseillé
        </span>
        <span className="text-[10px] text-slate-300">
          Faites pivoter votre téléphone pour une vue optimale
        </span>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0 ml-1"
        title="Masquer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
