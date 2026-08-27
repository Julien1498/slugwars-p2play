import { describe, it, expect, vi } from 'vitest';
import { Slug, HelicopterVehicle } from '../core/types';
import { getWeapon, isWeaponChargeable } from '../core/weapons/registry';
import {
  cycleGirderAngle,
  clampAimAngle,
  getMobileFireButtonMode,
  findNearbyHelicopter,
  getWeaponAmmoLabel,
  triggerHaptic,
} from '../components/game/mobile/touchControlsUtils';

describe('MobileTouchOverlay: Touch Controls Logic & Tactical Actions', () => {
  describe('Aim angle nudges & Girder rotation cycling', () => {
    it('cycles girder angles through [0, 45, 90, 135] degrees forward and backward', () => {
      expect(cycleGirderAngle(0, 1)).toBe(45);
      expect(cycleGirderAngle(45, 1)).toBe(90);
      expect(cycleGirderAngle(90, 1)).toBe(135);
      expect(cycleGirderAngle(135, 1)).toBe(0);

      expect(cycleGirderAngle(0, -1)).toBe(135);
      expect(cycleGirderAngle(135, -1)).toBe(90);
      expect(cycleGirderAngle(90, -1)).toBe(45);
      expect(cycleGirderAngle(45, -1)).toBe(0);
    });

    it('clamps standard weapon aim angle strictly between -85 and +85 degrees', () => {
      expect(clampAimAngle(40, 3)).toBe(43);
      expect(clampAimAngle(84, 3)).toBe(85);
      expect(clampAimAngle(85, 3)).toBe(85);

      expect(clampAimAngle(-80, -10)).toBe(-85);
      expect(clampAimAngle(-85, -3)).toBe(-85);
    });
  });

  describe('Fire button mode & icon/label resolution', () => {
    it('correctly resolves direct placement mode for Girder', () => {
      const girder = getWeapon('girder');
      const mode = getMobileFireButtonMode(girder);

      expect(mode.icon).toBe('🪜');
      expect(mode.label).toBe('POSER');
      expect(mode.isDirect).toBe(true);
    });

    it('resolves targeting mode for Air Strike (instant target)', () => {
      const airStrike = getWeapon('air_strike');
      const mode = getMobileFireButtonMode(airStrike);

      expect(mode.icon).toBe('🎯');
      expect(mode.label).toBe('CIBLER');
      expect(mode.isDirect).toBe(true);
    });

    it('resolves ballistic charge mode for Bazooka and Grenade', () => {
      const bazooka = getWeapon('bazooka');
      const mode = getMobileFireButtonMode(bazooka);

      expect(mode.icon).toBe('🔥');
      expect(mode.label).toBe('TIR');
      expect(mode.isDirect).toBe(false);
    });

    it('resolves Homing Missile with target aim icon but non-direct launch', () => {
      const homing = getWeapon('homing_missile');
      const mode = getMobileFireButtonMode(homing);

      expect(mode.icon).toBe('🎯');
      expect(mode.label).toBe('TIRER');
      expect(mode.isDirect).toBe(false);
    });

    it('resolves Blowtorch as non-chargeable continuous fire weapon', () => {
      const blowtorch = getWeapon('blowtorch');
      expect(isWeaponChargeable(blowtorch)).toBe(false);
    });
  });

  describe('Vehicle interaction proximity detector', () => {
    const slug: Slug = {
      id: 'slug_1',
      teamId: 'team_red',
      name: 'Pilot Slug',
      x: 300,
      y: 400,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      isAlive: true,
      aimAngle: 0,
      aimPower: 50,
      selectedWeaponId: 'bazooka',
      facing: 'right',
    };

    it('finds unoccupied helicopter within 65px radius', () => {
      const helicopters: HelicopterVehicle[] = [
        {
          id: 'heli_1',
          x: 340, // Distance = 40px (< 65px)
          y: 400,
          vx: 0,
          vy: 0,
          hp: 150,
          maxHp: 150,
          facing: 'right',
          rotorAngle: 0,
          pilotSlugId: null,
        },
      ];

      const found = findNearbyHelicopter(slug, helicopters, 65);
      expect(found).not.toBeNull();
      expect(found?.id).toBe('heli_1');
    });

    it('ignores occupied helicopter or helicopters beyond 65px radius', () => {
      const helicopters: HelicopterVehicle[] = [
        {
          id: 'heli_far',
          x: 450, // Distance = 150px (> 65px)
          y: 400,
          vx: 0,
          vy: 0,
          hp: 150,
          maxHp: 150,
          facing: 'right',
          rotorAngle: 0,
          pilotSlugId: null,
        },
        {
          id: 'heli_busy',
          x: 310, // Distance = 10px (< 65px), but already has a pilot
          y: 400,
          vx: 0,
          vy: 0,
          hp: 150,
          maxHp: 150,
          facing: 'right',
          rotorAngle: 0,
          pilotSlugId: 'slug_other',
        },
      ];

      expect(findNearbyHelicopter(slug, helicopters, 65)).toBeNull();
    });
  });

  describe('Ammo count badge formatting & Haptic feedback', () => {
    it('formats infinite ammo as infinity symbol and limited ammo as xN', () => {
      expect(getWeaponAmmoLabel(-1)).toBe('∞');
      expect(getWeaponAmmoLabel(5)).toBe('x5');
      expect(getWeaponAmmoLabel(1)).toBe('x1');
      expect(getWeaponAmmoLabel(0)).toBe('x0');
    });

    it('safely triggers navigator.vibrate when available without throwing errors', () => {
      const mockVibrate = vi.fn();
      const originalVibrate = navigator.vibrate;
      (navigator as any).vibrate = mockVibrate;

      triggerHaptic(20);
      expect(mockVibrate).toHaveBeenCalledWith(20);

      (navigator as any).vibrate = originalVibrate;
    });
  });
});
