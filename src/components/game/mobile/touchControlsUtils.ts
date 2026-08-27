import { Slug, HelicopterVehicle } from '../../../core/types';
import { WeaponDefinition } from '../../../core/weapons/types';
import { isWeaponChargeable } from '../../../core/weapons/registry';

export function cycleGirderAngle(currentAngle: number, delta: number): number {
  const angles = [0, 45, 90, 135];
  const curIdx = angles.indexOf(currentAngle);
  const nextIdx = (curIdx + (delta > 0 ? 1 : -1) + angles.length) % angles.length;
  return angles[nextIdx];
}

export function clampAimAngle(currentAngle: number, delta: number): number {
  return Math.max(-85, Math.min(85, currentAngle + delta));
}

export function getMobileFireButtonMode(weapon: WeaponDefinition | null): {
  icon: string;
  label: string;
  isDirect: boolean;
} {
  if (!weapon) {
    return { icon: '🔥', label: 'TIR', isDirect: false };
  }

  const isGirder = weapon.id === 'girder';
  const isHomingMissile = weapon.id === 'homing_missile';
  const isChargeable = isWeaponChargeable(weapon);
  const isInstantTarget = !!weapon.requiresTarget && !isChargeable;

  if (isGirder) {
    return { icon: '🪜', label: 'POSER', isDirect: true };
  }
  if (isHomingMissile) {
    return { icon: '🎯', label: 'TIRER', isDirect: false };
  }
  if (isInstantTarget) {
    return { icon: '🎯', label: 'CIBLER', isDirect: true };
  }
  return { icon: '🔥', label: 'TIR', isDirect: false };
}

export function findNearbyHelicopter(
  activeSlug: Slug | undefined,
  helicopters: HelicopterVehicle[] | undefined,
  maxDistance: number = 65
): HelicopterVehicle | null {
  if (!activeSlug || !helicopters || helicopters.length === 0) return null;
  return (
    helicopters.find(
      (h) => !h.pilotSlugId && Math.hypot(h.x - activeSlug.x, h.y - activeSlug.y) < maxDistance
    ) || null
  );
}

export function getWeaponAmmoLabel(ammo: number): string {
  return ammo === -1 ? '∞' : `x${ammo}`;
}

export function triggerHaptic(duration = 15): void {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(duration);
    } catch {
      // Ignored if haptic unsupported
    }
  }
}
