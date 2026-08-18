import React, { useState, useEffect } from 'react';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';

export const OrientationLockPrompt: React.FC = () => {
  const isTouch = useIsTouchDevice();
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isTouch || !isPortrait) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center text-white animate-fade-in pointer-events-auto">
      <div className="w-20 h-20 mb-6 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-bounce">
        <span className="text-4xl">📱🔄</span>
      </div>

      <h2 className="text-2xl font-black tracking-wide text-amber-400 mb-2 uppercase">
        Mode Paysage Conseillé
      </h2>

      <p className="text-slate-300 text-sm max-w-xs leading-relaxed mb-6">
        Pour profiter pleinement de la vue panoramique et des commandes tactiles de <strong>Slug Wars</strong>, veuillez faire pivoter votre téléphone à l'horizontale.
      </p>

      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
        <span>✨ Astuce : Activez la rotation automatique</span>
      </div>
    </div>
  );
};
