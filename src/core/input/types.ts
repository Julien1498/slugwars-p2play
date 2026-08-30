export type InputContext =
  | 'SLUG_GROUND'
  | 'ROPE_SWING'
  | 'VEHICLE_PILOT'
  | 'STEERABLE_PROJECTILE'
  | 'WEAPON_PICKER'
  | 'GLOBAL';

export type InputAction =
  // Movement & Jump
  | 'MOVE_LEFT'
  | 'MOVE_RIGHT'
  | 'JUMP'
  // Aim & Winch
  | 'AIM_UP'
  | 'AIM_DOWN'
  | 'WINCH_UP'
  | 'WINCH_DOWN'
  // Steering (Sheep / Rope)
  | 'STEER_LEFT'
  | 'STEER_RIGHT'
  // Vehicles
  | 'VEHICLE_UP'
  | 'VEHICLE_DOWN'
  | 'VEHICLE_LEFT'
  | 'VEHICLE_RIGHT'
  | 'ENTER_VEHICLE'
  | 'EXIT_VEHICLE'
  // Combat & Detonation
  | 'FIRE_OR_CHARGE'
  | 'DETONATE'
  // Utilities & Settings
  | 'TOGGLE_WEAPON_PICKER'
  | 'ROTATE_GIRDER'
  | 'SET_FUSE_1'
  | 'SET_FUSE_2'
  | 'SET_FUSE_3'
  | 'SET_FUSE_4'
  | 'SET_FUSE_5'
  // Weapon Picker Navigation
  | 'SELECT_CAT_1'
  | 'SELECT_CAT_2'
  | 'SELECT_CAT_3'
  | 'SELECT_CAT_4'
  | 'SELECT_CAT_5'
  | 'CLOSE_MODAL'
  // Global Shortcuts
  | 'TOGGLE_CHAT'
  | 'TOGGLE_FULLSCREEN';

export type KeyBindingMap = Record<InputAction, string[]>;
