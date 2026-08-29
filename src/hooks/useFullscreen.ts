import { useState, useEffect, useCallback } from 'react';

export function toggleFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const doc = document as any;
  const elem = document.documentElement as any;

  try {
    const isFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isFs) {
      if (elem.requestFullscreen) {
        return elem.requestFullscreen().catch((err: unknown) => {
          console.warn('requestFullscreen failed:', err instanceof Error ? err.message : String(err));
        });
      } else if (elem.webkitRequestFullscreen) {
        return Promise.resolve(elem.webkitRequestFullscreen());
      } else if (elem.mozRequestFullScreen) {
        return Promise.resolve(elem.mozRequestFullScreen());
      } else if (elem.msRequestFullscreen) {
        return Promise.resolve(elem.msRequestFullscreen());
      }
    } else {
      if (doc.exitFullscreen) {
        return doc.exitFullscreen().catch((err: unknown) => {
          console.warn('exitFullscreen failed:', err instanceof Error ? err.message : String(err));
        });
      } else if (doc.webkitExitFullscreen) {
        return Promise.resolve(doc.webkitExitFullscreen());
      } else if (doc.mozCancelFullScreen) {
        return Promise.resolve(doc.mozCancelFullScreen());
      } else if (doc.msExitFullscreen) {
        return Promise.resolve(doc.msExitFullscreen());
      }
    }
  } catch (err: unknown) {
    console.warn('toggleFullscreen error:', err instanceof Error ? err.message : String(err));
  }
  return Promise.resolve();
}

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  // iPhone / iPod Safari does not support element.requestFullscreen
  if (typeof navigator !== 'undefined' && /iPhone|iPod/.test(navigator.userAgent)) {
    return false;
  }
  const doc = document as any;
  const elem = document.documentElement as any;
  return !!(
    doc.fullscreenEnabled ||
    doc.webkitFullscreenEnabled ||
    doc.mozFullScreenEnabled ||
    doc.msFullscreenEnabled ||
    elem.requestFullscreen ||
    elem.webkitRequestFullscreen ||
    elem.mozRequestFullScreen ||
    elem.msRequestFullscreen
  );
}

function checkCurrentFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  const isApiFs = !!(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
  if (isApiFs) return true;
  if (typeof window !== 'undefined' && typeof window.screen !== 'undefined') {
    return window.innerWidth === window.screen.width && Math.abs(window.innerHeight - window.screen.height) <= 8;
  }
  return false;
}

export function useFullscreen() {
  const [isSupported] = useState(() => isFullscreenSupported());
  const [isFullscreen, setIsFullscreen] = useState(() => checkCurrentFullscreen());

  useEffect(() => {
    if (!isSupported) return;

    const handleFsChange = () => {
      setIsFullscreen(checkCurrentFullscreen());
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen().catch(() => {});
      }
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    window.addEventListener('resize', handleFsChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
      window.removeEventListener('resize', handleFsChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSupported]);

  const toggle = useCallback(() => {
    toggleFullscreen().catch(() => {});
  }, []);

  return { isFullscreen, isSupported, toggleFullscreen: toggle };
}

