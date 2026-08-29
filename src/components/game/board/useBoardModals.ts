import { useState, useCallback, useEffect } from 'react';
import { GamePhase } from '../../../core/types';

export function useBoardModals(phase: GamePhase) {
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showWeaponPicker, setShowWeaponPicker] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [showConfirmLobby, setShowConfirmLobby] = useState(false);

  useEffect(() => {
    if (phase !== 'AIMING') {
      setShowWeaponPicker(false);
    }
  }, [phase]);

  const handleOpenWeaponPicker = useCallback(() => {
    if (phase !== 'AIMING') return;
    setShowWeaponPicker(true);
  }, [phase]);

  const handleCloseWeaponPicker = useCallback(() => setShowWeaponPicker(false), []);
  const handleOpenRules = useCallback(() => setShowRules(true), []);
  const handleCloseRules = useCallback(() => setShowRules(false), []);
  const handleOpenMetrics = useCallback(() => setShowMetrics(true), []);
  const handleCloseMetrics = useCallback(() => setShowMetrics(false), []);
  const handleToggleHitboxes = useCallback(() => setShowHitboxes((prev) => !prev), []);
  const handleToggleDrawer = useCallback(() => setShowDrawer((prev) => !prev), []);
  const handleCloseDrawer = useCallback(() => setShowDrawer(false), []);

  return {
    showHitboxes,
    showDrawer,
    showWeaponPicker,
    showRules,
    showMetrics,
    showConfirmLobby,
    setShowConfirmLobby,
    setShowWeaponPicker,
    handleOpenWeaponPicker,
    handleCloseWeaponPicker,
    handleOpenRules,
    handleCloseRules,
    handleOpenMetrics,
    handleCloseMetrics,
    handleToggleHitboxes,
    handleToggleDrawer,
    handleCloseDrawer,
  };
}
