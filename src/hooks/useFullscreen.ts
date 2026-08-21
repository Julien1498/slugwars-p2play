import { useState, useEffect, useCallback } from 'react';

export function toggleFullscreen(): Promise<void> {
  const doc = document as any;
  const elem = document.documentElement as any;

  if (
    !doc.fullscreenElement &&
    !doc.mozFullScreenElement &&
    !doc.webkitFullscreenElement &&
    !doc.msFullscreenElement
  ) {
    if (elem.requestFullscreen) {
      return elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      return elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      return elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      return elem.msRequestFullscreen();
    }
  } else {
    if (doc.exitFullscreen) {
      return doc.exitFullscreen();
    } else if (doc.webkitExitFullscreen) {
      return doc.webkitExitFullscreen();
    } else if (doc.mozCancelFullScreen) {
      return doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      return doc.msExitFullscreen();
    }
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

export function useFullscreen() {
  const [isSupported] = useState(() => isFullscreenSupported());
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
  });

  useEffect(() => {
    if (!isSupported) return;

    const handleFsChange = () => {
      const doc = document as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, [isSupported]);

  const toggle = useCallback(() => {
    toggleFullscreen().catch(() => {});
  }, []);

  return { isFullscreen, isSupported, toggleFullscreen: toggle };
}
