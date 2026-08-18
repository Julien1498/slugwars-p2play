import { useState, useEffect } from 'react';

/**
 * Hook detecting if the current device is primarily a touch device (smartphone/tablet).
 * Uses pointer: coarse media query and touch points detection to avoid false positives
 * on desktop PCs with touchscreen laptops when a mouse is active.
 */
export function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const hasTouchPoints = navigator.maxTouchPoints > 0;
    const isCoarse = window.matchMedia?.('(pointer: coarse)').matches;
    return hasTouchPoints && isCoarse;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia?.('(pointer: coarse)');
    const updateTouch = () => {
      const hasTouchPoints = navigator.maxTouchPoints > 0;
      const isCoarse = mediaQuery ? mediaQuery.matches : false;
      setIsTouch(hasTouchPoints && isCoarse);
    };

    updateTouch();

    if (mediaQuery) {
      mediaQuery.addEventListener('change', updateTouch);
      return () => mediaQuery.removeEventListener('change', updateTouch);
    }
  }, []);

  return isTouch;
}
