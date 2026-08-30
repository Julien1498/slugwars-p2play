import { describe, it, expect } from 'vitest';
import {
  resolveInputContext,
  resolveKeyToAction,
  getFuseSecondsFromAction,
  getCategoryIndexFromAction,
  getCategoryShortcutBadge,
  isActionKey,
  DEFAULT_KEYMAP,
} from '../core/input';
import { GameState, Slug, ActiveProjectile } from '../core/types';

function createMockGameState(): GameState {
  return {
    phase: 'AIMING',
    config: {
      weaponSetId: 'CLASSIC',
      slugHp: 100,
      slugsPerTeam: 2,
      turnDuration: 45,
      windEnabled: true,
      vehiclesEnabled: true,
      mapTheme: 'ISLAND',
      mapSeed: 12345,
    },
    teams: [],
    slugs: [],
    mines: [],
    helicopters: [],
    activeTeamId: 't1',
    activeSlugId: 's1',
    turnTimer: 45,
    wind: 0,
    projectiles: [],
    explosions: [],
    particles: [],
    floatingDamages: [],
    journal: [],
    turnCount: 1,
  };
}

describe('Data-Driven Input Engine', () => {
  describe('1. Context Resolution', () => {
    it('resolves SLUG_GROUND by default', () => {
      const state = createMockGameState();
      const slug: Partial<Slug> = { id: 's1' };
      expect(resolveInputContext(state, slug as Slug)).toBe('SLUG_GROUND');
    });

    it('resolves VEHICLE_PILOT when slug is in a vehicle', () => {
      const state = createMockGameState();
      const slug: Partial<Slug> = { id: 's1', inVehicleId: 'heli_1' };
      expect(resolveInputContext(state, slug as Slug)).toBe('VEHICLE_PILOT');
    });

    it('resolves ROPE_SWING when slug has an active ropeState', () => {
      const state = createMockGameState();
      const slug: Partial<Slug> = {
        id: 's1',
        ropeState: { hookX: 100, hookY: 50, length: 150, angleRad: 0, angularVelocity: 0 },
      };
      expect(resolveInputContext(state, slug as Slug)).toBe('ROPE_SWING');
    });

    it('resolves STEERABLE_PROJECTILE when an active sheep is present', () => {
      const state = createMockGameState();
      const sheep: Partial<ActiveProjectile> = { id: 'sheep_1', weaponId: 'super_sheep' };
      expect(resolveInputContext(state, undefined, sheep as ActiveProjectile)).toBe('STEERABLE_PROJECTILE');
    });

    it('resolves WEAPON_PICKER when the picker is open', () => {
      const state = createMockGameState();
      expect(resolveInputContext(state, undefined, undefined, true)).toBe('WEAPON_PICKER');
    });
  });

  describe('2. Action Resolution & AZERTY / QWERTY / Arrow Parity', () => {
    it('maps left movement across AZERTY (Q), QWERTY (A), and ArrowLeft', () => {
      expect(resolveKeyToAction('q', 'SLUG_GROUND')).toBe('MOVE_LEFT');
      expect(resolveKeyToAction('a', 'SLUG_GROUND')).toBe('MOVE_LEFT');
      expect(resolveKeyToAction('ArrowLeft', 'SLUG_GROUND')).toBe('MOVE_LEFT');
      expect(resolveKeyToAction('arrowleft', 'SLUG_GROUND')).toBe('MOVE_LEFT');
    });

    it('maps right movement across D and ArrowRight', () => {
      expect(resolveKeyToAction('d', 'SLUG_GROUND')).toBe('MOVE_RIGHT');
      expect(resolveKeyToAction('ArrowRight', 'SLUG_GROUND')).toBe('MOVE_RIGHT');
    });

    it('maps jump to Space on ground and on rope', () => {
      expect(resolveKeyToAction(' ', 'SLUG_GROUND')).toBe('JUMP');
      expect(resolveKeyToAction('Spacebar', 'SLUG_GROUND')).toBe('JUMP');
      expect(resolveKeyToAction(' ', 'ROPE_SWING')).toBe('JUMP');
    });

    it('maps vertical controls contextually (Aim on ground, Winch on rope, Pilot in vehicle)', () => {
      // Ground
      expect(resolveKeyToAction('z', 'SLUG_GROUND')).toBe('AIM_UP');
      expect(resolveKeyToAction('w', 'SLUG_GROUND')).toBe('AIM_UP');
      expect(resolveKeyToAction('ArrowUp', 'SLUG_GROUND')).toBe('AIM_UP');
      expect(resolveKeyToAction('s', 'SLUG_GROUND')).toBe('AIM_DOWN');
      expect(resolveKeyToAction('ArrowDown', 'SLUG_GROUND')).toBe('AIM_DOWN');

      // Rope
      expect(resolveKeyToAction('z', 'ROPE_SWING')).toBe('WINCH_UP');
      expect(resolveKeyToAction('w', 'ROPE_SWING')).toBe('WINCH_UP');
      expect(resolveKeyToAction('ArrowUp', 'ROPE_SWING')).toBe('WINCH_UP');
      expect(resolveKeyToAction('s', 'ROPE_SWING')).toBe('WINCH_DOWN');
      expect(resolveKeyToAction('ArrowDown', 'ROPE_SWING')).toBe('WINCH_DOWN');

      // Vehicle
      expect(resolveKeyToAction('z', 'VEHICLE_PILOT')).toBe('VEHICLE_UP');
      expect(resolveKeyToAction('w', 'VEHICLE_PILOT')).toBe('VEHICLE_UP');
      expect(resolveKeyToAction('ArrowUp', 'VEHICLE_PILOT')).toBe('VEHICLE_UP');
      expect(resolveKeyToAction('s', 'VEHICLE_PILOT')).toBe('VEHICLE_DOWN');
      expect(resolveKeyToAction('ArrowDown', 'VEHICLE_PILOT')).toBe('VEHICLE_DOWN');
    });

    it('maps vehicle interaction and girder rotation', () => {
      expect(resolveKeyToAction('e', 'SLUG_GROUND')).toBe('ENTER_VEHICLE');
      expect(resolveKeyToAction('e', 'VEHICLE_PILOT')).toBe('EXIT_VEHICLE');
      expect(resolveKeyToAction('r', 'SLUG_GROUND')).toBe('ROTATE_GIRDER');
    });

    it('maps detonation to Space and Enter in STEERABLE_PROJECTILE context', () => {
      expect(resolveKeyToAction(' ', 'STEERABLE_PROJECTILE')).toBe('DETONATE');
      expect(resolveKeyToAction('Spacebar', 'STEERABLE_PROJECTILE')).toBe('DETONATE');
      expect(resolveKeyToAction('enter', 'STEERABLE_PROJECTILE')).toBe('DETONATE');
    });

    it('maps fuse timer settings from 1 to 5 across numerical and French AZERTY keys', () => {
      expect(resolveKeyToAction('1', 'SLUG_GROUND')).toBe('SET_FUSE_1');
      expect(resolveKeyToAction('&', 'SLUG_GROUND')).toBe('SET_FUSE_1');
      expect(getFuseSecondsFromAction('SET_FUSE_1')).toBe(1);

      expect(resolveKeyToAction('2', 'SLUG_GROUND')).toBe('SET_FUSE_2');
      expect(resolveKeyToAction('é', 'SLUG_GROUND')).toBe('SET_FUSE_2');
      expect(getFuseSecondsFromAction('SET_FUSE_2')).toBe(2);

      expect(resolveKeyToAction('3', 'SLUG_GROUND')).toBe('SET_FUSE_3');
      expect(resolveKeyToAction('"', 'SLUG_GROUND')).toBe('SET_FUSE_3');
      expect(getFuseSecondsFromAction('SET_FUSE_3')).toBe(3);

      expect(resolveKeyToAction('4', 'SLUG_GROUND')).toBe('SET_FUSE_4');
      expect(resolveKeyToAction("'", 'SLUG_GROUND')).toBe('SET_FUSE_4');
      expect(getFuseSecondsFromAction('SET_FUSE_4')).toBe(4);

      expect(resolveKeyToAction('5', 'SLUG_GROUND')).toBe('SET_FUSE_5');
      expect(resolveKeyToAction('(', 'SLUG_GROUND')).toBe('SET_FUSE_5');
      expect(getFuseSecondsFromAction('SET_FUSE_5')).toBe(5);
    });

    it('maps weapon picker category shortcuts and modal closing', () => {
      expect(resolveKeyToAction('F1', 'WEAPON_PICKER')).toBe('SELECT_CAT_1');
      expect(resolveKeyToAction('1', 'WEAPON_PICKER')).toBe('SELECT_CAT_1');
      expect(resolveKeyToAction('&', 'WEAPON_PICKER')).toBe('SELECT_CAT_1');
      expect(getCategoryIndexFromAction('SELECT_CAT_1')).toBe(0);

      expect(resolveKeyToAction('F5', 'WEAPON_PICKER')).toBe('SELECT_CAT_5');
      expect(resolveKeyToAction('5', 'WEAPON_PICKER')).toBe('SELECT_CAT_5');
      expect(resolveKeyToAction('(', 'WEAPON_PICKER')).toBe('SELECT_CAT_5');
      expect(getCategoryIndexFromAction('SELECT_CAT_5')).toBe(4);

      expect(resolveKeyToAction('Escape', 'WEAPON_PICKER')).toBe('CLOSE_MODAL');
      expect(resolveKeyToAction('Tab', 'WEAPON_PICKER')).toBe('CLOSE_MODAL');
      expect(resolveKeyToAction('i', 'WEAPON_PICKER')).toBe('CLOSE_MODAL');
    });

    it('provides clean category UI badge formatters', () => {
      expect(getCategoryShortcutBadge(0)).toBe('& / 1');
      expect(getCategoryShortcutBadge(1)).toBe('é / 2');
      expect(getCategoryShortcutBadge(4)).toBe('( / 5');
    });

    it('resolves global hotkeys for chat and fullscreen', () => {
      expect(isActionKey('t', 'TOGGLE_CHAT')).toBe(true);
      expect(isActionKey('T', 'TOGGLE_CHAT')).toBe(true);
      expect(isActionKey('f', 'TOGGLE_FULLSCREEN')).toBe(true);
      expect(isActionKey('F', 'TOGGLE_FULLSCREEN')).toBe(true);
    });
  });

  describe('3. Custom Keymap Overrides', () => {
    it('allows overriding bindings with a custom keymap', () => {
      const customKeymap = {
        ...DEFAULT_KEYMAP,
        MOVE_LEFT: ['j'],
        MOVE_RIGHT: ['l'],
        JUMP: ['k'],
      };

      expect(resolveKeyToAction('j', 'SLUG_GROUND', customKeymap)).toBe('MOVE_LEFT');
      expect(resolveKeyToAction('l', 'SLUG_GROUND', customKeymap)).toBe('MOVE_RIGHT');
      expect(resolveKeyToAction('k', 'SLUG_GROUND', customKeymap)).toBe('JUMP');
      expect(resolveKeyToAction('q', 'SLUG_GROUND', customKeymap)).toBeNull();
    });
  });
});
