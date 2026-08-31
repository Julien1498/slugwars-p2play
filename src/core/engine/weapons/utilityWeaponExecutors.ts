import { GameState, Vector2D, Slug, JournalEntry } from '../../types';
import { sfx } from '../../audio';
import { PhaseManager } from '../phaseManager';

export function executeJetpack(
  _state: GameState,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  if (activeSlug.jetpackState) {
    // Toggle thrusting / vol
    activeSlug.jetpackState.isThrusting = !activeSlug.jetpackState.isThrusting;
  } else {
    activeSlug.jetpackState = { fuelMs: 5000, isThrusting: true };
    activeSlug.fallStartY = undefined;
    sfx.play('jetpack');
    addLog(`${activeSlug.name} active son Jetpack ! 🎒 (5s de carburant - touches Saut et Déplacement)`, 'weapon');
  }
  return true;
}

export function executePneumaticDrill(
  _state: GameState,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  if (activeSlug.isDrilling) {
    activeSlug.isDrilling = false;
    activeSlug.drillDepth = 0;
    addLog(`${activeSlug.name} arrête le Marteau-Piqueur.`, 'info');
  } else {
    activeSlug.isDrilling = true;
    activeSlug.drillDepth = 0;
    activeSlug.fallStartY = undefined;
    sfx.play('drill');
    addLog(`${activeSlug.name} démarre le Marteau-Piqueur ! 🔨`, 'weapon');
  }
  return true;
}

export function executeParachute(
  _state: GameState,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  if (activeSlug.isParachuting) {
    activeSlug.isParachuting = false;
    activeSlug.hasUsedParachute = true;
    addLog(`${activeSlug.name} replie son Parachute.`, 'info');
    return true;
  }
  if (activeSlug.hasUsedParachute) {
    addLog(`Impossible de redéployer le Parachute pendant le même saut !`, 'info');
    return false;
  }
  activeSlug.isParachuting = true;
  activeSlug.hasUsedParachute = true;
  activeSlug.fallStartY = undefined;
  sfx.play('parachute');
  addLog(`${activeSlug.name} déploie son Parachute ! 🪂`, 'weapon');
  return true;
}

