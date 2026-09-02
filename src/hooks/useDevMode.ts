import { useState, useEffect, useCallback } from 'react';
import { detectDevModeFromEnvironment, persistDevModeSession } from '../network/devSession';

export type DevCursorTool =
  | 'teleport_slug'
  | 'spawn_crate_weapon'
  | 'spawn_crate_health'
  | 'spawn_crate_utility'
  | 'spawn_mine'
  | 'spawn_drum'
  | 'spawn_heli'
  | 'dig_terrain'
  | 'build_terrain';

export type DevTab = 'time' | 'weapons' | 'slugs' | 'spawns' | 'env' | 'overlays';

export function useDevMode(isHost: boolean = false) {
  const [isDevEnabled, setIsDevEnabled] = useState<boolean>(false);
  const [isDevOpen, setIsDevOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<DevTab>('time');
  const [activeCursorTool, setActiveCursorTool] = useState<DevCursorTool | null>(null);
  const [brushRadius, setBrushRadius] = useState<number>(30);

  useEffect(() => {
    if (!isHost) {
      setIsDevEnabled(false);
      setIsDevOpen(false);
      return;
    }
    const isDev = detectDevModeFromEnvironment();
    setIsDevEnabled(isDev);
  }, [isHost]);

  // Global hotkey to toggle dev drawer: '²' (top-left AZERTY), 'F2', or 'Ctrl+Shift+D'
  useEffect(() => {
    if (!isDevEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === '²' || e.key === 'F2' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        setIsDevOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDevEnabled]);

  const selectCursorTool = useCallback((tool: DevCursorTool | null) => {
    setActiveCursorTool((prev) => (prev === tool ? null : tool));
  }, []);

  const clearCursorTool = useCallback(() => {
    setActiveCursorTool(null);
  }, []);

  return {
    isDevEnabled,
    isDevOpen,
    setIsDevOpen,
    activeTab,
    setActiveTab,
    activeCursorTool,
    selectCursorTool,
    clearCursorTool,
    brushRadius,
    setBrushRadius,
  };
}
