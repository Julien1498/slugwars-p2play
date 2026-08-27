import { useRef, useEffect, useCallback } from 'react';
import { perfTracker } from '../../../core/perfTracker';

export interface FpsHudRefs {
  fpsBadgeRef: React.RefObject<HTMLDivElement | null>;
  fpsTextRef: React.RefObject<HTMLSpanElement | null>;
  fpsDetailsRef: React.RefObject<HTMLSpanElement | null>;
  fpsPassesRef: React.RefObject<HTMLDivElement | null>;
  fpsDotRef: React.RefObject<HTMLSpanElement | null>;
  updateFpsHud: () => void;
}

export function useFpsHud(): FpsHudRefs {
  const fpsBadgeRef = useRef<HTMLDivElement | null>(null);
  const fpsTextRef = useRef<HTMLSpanElement | null>(null);
  const fpsDetailsRef = useRef<HTMLSpanElement | null>(null);
  const fpsPassesRef = useRef<HTMLDivElement | null>(null);
  const fpsDotRef = useRef<HTMLSpanElement | null>(null);

  const fpsCounterFramesRef = useRef(0);
  const lastFpsHudUpdateRef = useRef(performance.now());

  // Subscribe to HUD visibility & advanced mode changes
  useEffect(() => {
    const unsub1 = perfTracker.onFpsHudToggle((enabled) => {
      if (fpsBadgeRef.current) {
        fpsBadgeRef.current.style.display = enabled ? 'flex' : 'none';
      }
    });

    const unsub2 = perfTracker.onFpsHudAdvancedToggle((advanced) => {
      if (fpsDetailsRef.current) {
        fpsDetailsRef.current.style.display = advanced ? 'inline' : 'none';
      }
      if (fpsPassesRef.current) {
        fpsPassesRef.current.style.display = advanced ? 'block' : 'none';
      }
      if (fpsBadgeRef.current) {
        if (advanced) {
          fpsBadgeRef.current.classList.remove('px-2.5', 'py-1', 'rounded-xl', 'flex-row', 'items-center');
          fpsBadgeRef.current.classList.add('px-3', 'py-1.5', 'rounded-2xl', 'flex-col', 'gap-0.5');
        } else {
          fpsBadgeRef.current.classList.remove('px-3', 'py-1.5', 'rounded-2xl', 'flex-col', 'gap-0.5');
          fpsBadgeRef.current.classList.add('px-2.5', 'py-1', 'rounded-xl', 'flex-row', 'items-center');
        }
      }
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const updateFpsHud = useCallback(() => {
    if (!fpsTextRef.current || !perfTracker.getFpsHudEnabled()) return;

    fpsCounterFramesRef.current++;
    const nowFps = performance.now();
    if (nowFps - lastFpsHudUpdateRef.current >= 200) {
      const instantFps = Math.round(
        (fpsCounterFramesRef.current * 1000) / (nowFps - lastFpsHudUpdateRef.current)
      );
      fpsCounterFramesRef.current = 0;
      lastFpsHudUpdateRef.current = nowFps;
      fpsTextRef.current.textContent = `${instantFps} FPS`;

      const isAdvanced = perfTracker.getFpsHudAdvancedEnabled();

      if (fpsDetailsRef.current) {
        if (isAdvanced) {
          fpsDetailsRef.current.style.display = 'inline';
          fpsDetailsRef.current.textContent = `(${perfTracker.currentFrameTimeMs}ms) · Dessin: ${perfTracker.currentRenderDurationMs}ms · Phys: ${perfTracker.currentPhysicsDurationMs}ms`;
        } else {
          fpsDetailsRef.current.style.display = 'none';
        }
      }

      if (fpsPassesRef.current) {
        if (isAdvanced) {
          fpsPassesRef.current.style.display = 'block';
          const top = perfTracker.liveTopPasses;
          if (top && top.length > 0) {
            fpsPassesRef.current.textContent = top.map((p) => `${p.label.split(' ')[0]} ${p.ms}ms`).join(' · ');
          }
        } else {
          fpsPassesRef.current.style.display = 'none';
        }
      }

      if (fpsDotRef.current) {
        fpsDotRef.current.className = `w-2 h-2 rounded-full shrink-0 ${
          instantFps >= 50 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : instantFps >= 30 ? 'bg-amber-400' : 'bg-red-400'
        }`;
      }

      if (fpsBadgeRef.current) {
        fpsBadgeRef.current.className = `absolute top-16 right-4 pointer-events-none ${
          isAdvanced ? 'px-3 py-1.5 rounded-2xl flex-col gap-0.5' : 'px-2.5 py-1 rounded-xl flex-row items-center gap-1.5'
        } bg-zinc-950/90 backdrop-blur-md border text-xs font-mono shadow-2xl flex select-none z-20 ${
          instantFps >= 50
            ? 'text-emerald-400 border-emerald-500/30'
            : instantFps >= 30
            ? 'text-amber-300 border-amber-500/30'
            : 'text-red-400 border-red-500/30'
        }`;
      }
    }
  }, []);

  return {
    fpsBadgeRef,
    fpsTextRef,
    fpsDetailsRef,
    fpsPassesRef,
    fpsDotRef,
    updateFpsHud,
  };
}
