import { GameState, Slug, ActiveProjectile } from '../types';
import { InputAction, InputContext, KeyBindingMap } from './types';
import { DEFAULT_KEYMAP, isActionKey } from './defaultKeymap';

export function resolveInputContext(
  gameState: GameState,
  activeSlug?: Slug,
  activeSheep?: ActiveProjectile,
  isWeaponPickerOpen: boolean = false
): InputContext {
  if (isWeaponPickerOpen) return 'WEAPON_PICKER';
  if (activeSheep) return 'STEERABLE_PROJECTILE';
  if (activeSlug?.inVehicleId) return 'VEHICLE_PILOT';
  if (activeSlug?.ropeState) return 'ROPE_SWING';
  return 'SLUG_GROUND';
}

export function resolveKeyToAction(
  key: string,
  context: InputContext,
  keymap: KeyBindingMap = DEFAULT_KEYMAP
): InputAction | null {
  const normKey = key.toLowerCase();

  // 1. Weapon Picker Context
  if (context === 'WEAPON_PICKER') {
    if (isActionKey(normKey, 'CLOSE_MODAL', keymap)) return 'CLOSE_MODAL';
    if (isActionKey(normKey, 'SELECT_CAT_1', keymap)) return 'SELECT_CAT_1';
    if (isActionKey(normKey, 'SELECT_CAT_2', keymap)) return 'SELECT_CAT_2';
    if (isActionKey(normKey, 'SELECT_CAT_3', keymap)) return 'SELECT_CAT_3';
    if (isActionKey(normKey, 'SELECT_CAT_4', keymap)) return 'SELECT_CAT_4';
    if (isActionKey(normKey, 'SELECT_CAT_5', keymap)) return 'SELECT_CAT_5';
    return null;
  }

  // 2. Steerable Projectile (Super Sheep) Context
  if (context === 'STEERABLE_PROJECTILE') {
    if (isActionKey(normKey, 'STEER_LEFT', keymap)) return 'STEER_LEFT';
    if (isActionKey(normKey, 'STEER_RIGHT', keymap)) return 'STEER_RIGHT';
    if (isActionKey(normKey, 'DETONATE', keymap)) return 'DETONATE';
    return null;
  }

  // 3. Vehicle Pilot Context (Helicopter)
  if (context === 'VEHICLE_PILOT') {
    if (isActionKey(normKey, 'EXIT_VEHICLE', keymap)) return 'EXIT_VEHICLE';
    if (isActionKey(normKey, 'VEHICLE_LEFT', keymap)) return 'VEHICLE_LEFT';
    if (isActionKey(normKey, 'VEHICLE_RIGHT', keymap)) return 'VEHICLE_RIGHT';
    if (isActionKey(normKey, 'VEHICLE_UP', keymap)) return 'VEHICLE_UP';
    if (isActionKey(normKey, 'VEHICLE_DOWN', keymap)) return 'VEHICLE_DOWN';
    return null;
  }

  // 4. Rope Swing Context (Ninja Rope)
  if (context === 'ROPE_SWING') {
    if (isActionKey(normKey, 'MOVE_LEFT', keymap)) return 'MOVE_LEFT';
    if (isActionKey(normKey, 'MOVE_RIGHT', keymap)) return 'MOVE_RIGHT';
    if (isActionKey(normKey, 'WINCH_UP', keymap)) return 'WINCH_UP';
    if (isActionKey(normKey, 'WINCH_DOWN', keymap)) return 'WINCH_DOWN';
    if (isActionKey(normKey, 'JUMP', keymap)) return 'JUMP';
    return null;
  }

  // 5. Standard Slug Ground Context
  if (isActionKey(normKey, 'TOGGLE_WEAPON_PICKER', keymap)) return 'TOGGLE_WEAPON_PICKER';
  if (isActionKey(normKey, 'ENTER_VEHICLE', keymap)) return 'ENTER_VEHICLE';
  if (isActionKey(normKey, 'ROTATE_GIRDER', keymap)) return 'ROTATE_GIRDER';

  // Fuse Timers
  if (isActionKey(normKey, 'SET_FUSE_1', keymap)) return 'SET_FUSE_1';
  if (isActionKey(normKey, 'SET_FUSE_2', keymap)) return 'SET_FUSE_2';
  if (isActionKey(normKey, 'SET_FUSE_3', keymap)) return 'SET_FUSE_3';
  if (isActionKey(normKey, 'SET_FUSE_4', keymap)) return 'SET_FUSE_4';
  if (isActionKey(normKey, 'SET_FUSE_5', keymap)) return 'SET_FUSE_5';

  // Movement & Aim
  if (isActionKey(normKey, 'MOVE_LEFT', keymap)) return 'MOVE_LEFT';
  if (isActionKey(normKey, 'MOVE_RIGHT', keymap)) return 'MOVE_RIGHT';
  if (isActionKey(normKey, 'JUMP', keymap)) return 'JUMP';
  if (isActionKey(normKey, 'AIM_UP', keymap)) return 'AIM_UP';
  if (isActionKey(normKey, 'AIM_DOWN', keymap)) return 'AIM_DOWN';
  if (isActionKey(normKey, 'FIRE_OR_CHARGE', keymap)) return 'FIRE_OR_CHARGE';

  return null;
}

export function getFuseSecondsFromAction(action: InputAction): number | null {
  switch (action) {
    case 'SET_FUSE_1':
      return 1;
    case 'SET_FUSE_2':
      return 2;
    case 'SET_FUSE_3':
      return 3;
    case 'SET_FUSE_4':
      return 4;
    case 'SET_FUSE_5':
      return 5;
    default:
      return null;
  }
}

export function getCategoryIndexFromAction(action: InputAction): number | null {
  switch (action) {
    case 'SELECT_CAT_1':
      return 0;
    case 'SELECT_CAT_2':
      return 1;
    case 'SELECT_CAT_3':
      return 2;
    case 'SELECT_CAT_4':
      return 3;
    case 'SELECT_CAT_5':
      return 4;
    default:
      return null;
  }
}
