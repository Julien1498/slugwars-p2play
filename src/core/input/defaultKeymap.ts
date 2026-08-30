import { InputAction, KeyBindingMap } from './types';

export const DEFAULT_KEYMAP: KeyBindingMap = {
  // Movement & Jump
  MOVE_LEFT: ['arrowleft', 'q', 'a'],
  MOVE_RIGHT: ['arrowright', 'd'],
  JUMP: [' ', 'spacebar'],

  // Aim & Winch
  AIM_UP: ['arrowup', 'z', 'w'],
  AIM_DOWN: ['arrowdown', 's'],
  WINCH_UP: ['arrowup', 'z', 'w'],
  WINCH_DOWN: ['arrowdown', 's'],

  // Steering
  STEER_LEFT: ['arrowleft', 'q', 'a'],
  STEER_RIGHT: ['arrowright', 'd'],

  // Vehicles
  VEHICLE_UP: ['arrowup', 'z', 'w'],
  VEHICLE_DOWN: ['arrowdown', 's'],
  VEHICLE_LEFT: ['arrowleft', 'q', 'a'],
  VEHICLE_RIGHT: ['arrowright', 'd'],
  ENTER_VEHICLE: ['e'],
  EXIT_VEHICLE: ['e'],

  // Combat & Detonation
  FIRE_OR_CHARGE: ['enter'],
  DETONATE: [' ', 'enter'],

  // Utilities & Settings
  TOGGLE_WEAPON_PICKER: ['tab', 'i'],
  ROTATE_GIRDER: ['r'],
  SET_FUSE_1: ['1', '&'],
  SET_FUSE_2: ['2', 'é'],
  SET_FUSE_3: ['3', '"'],
  SET_FUSE_4: ['4', "'"],
  SET_FUSE_5: ['5', '('],

  // Weapon Picker Navigation
  SELECT_CAT_1: ['f1', '1', '&'],
  SELECT_CAT_2: ['f2', '2', 'é'],
  SELECT_CAT_3: ['f3', '3', '"'],
  SELECT_CAT_4: ['f4', '4', "'"],
  SELECT_CAT_5: ['f5', '5', '('],
  CLOSE_MODAL: ['escape', 'tab', 'i'],

  // Global Shortcuts
  TOGGLE_CHAT: ['t'],
  TOGGLE_FULLSCREEN: ['f'],
};

export const CATEGORY_SHORTCUT_BADGES: string[] = ['& / 1', 'é / 2', '" / 3', "' / 4", '( / 5'];

export function getCategoryShortcutBadge(categoryIndex: number): string {
  return CATEGORY_SHORTCUT_BADGES[categoryIndex] ?? `${categoryIndex + 1}`;
}

export function isActionKey(
  key: string,
  action: InputAction,
  keymap: KeyBindingMap = DEFAULT_KEYMAP
): boolean {
  const normalized = key.toLowerCase();
  const bindings = keymap[action];
  return bindings ? bindings.includes(normalized) : false;
}
