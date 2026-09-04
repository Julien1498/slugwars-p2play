import { SlugWarsActionType } from '../protocol';
import { NetworkActionDefinition } from './actionRegistryTypes';

export const GAMEPLAY_ACTION_REGISTRY: Partial<Record<SlugWarsActionType, NetworkActionDefinition<any>>> = {
  START_MOVE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING', 'TURN_TIME', 'RETREAT'],
    applyOptimistic: (_state, activeSlug, payload) => {
      if (payload?.dir) {
        activeSlug.movingDir = payload.dir;
        activeSlug.facing = payload.dir;
        const speed = activeSlug.isParachuting ? 1.4 : 2.4;
        activeSlug.vx = payload.dir === 'left' ? -speed : speed;
      }
    },
    executeHost: ({ engine }, payload) => {
      if (payload?.dir) engine.startMove(payload.dir);
    },
  },

  STOP_MOVE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING', 'TURN_TIME', 'RETREAT'],
    applyOptimistic: (_state, activeSlug) => {
      activeSlug.movingDir = null;
      activeSlug.vx = 0;
    },
    executeHost: ({ engine }) => {
      engine.stopMove();
    },
  },

  JUMP: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING', 'TURN_TIME', 'RETREAT'],
    applyOptimistic: (_state, activeSlug) => {
      if (activeSlug.jetpackState) activeSlug.jetpackState.isThrusting = true;
    },
    executeHost: ({ engine }) => {
      engine.jumpSlug();
    },
  },

  STOP_JUMP: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING', 'TURN_TIME', 'RETREAT'],
    applyOptimistic: (_state, activeSlug) => {
      if (activeSlug.jetpackState) activeSlug.jetpackState.isThrusting = false;
    },
    executeHost: ({ engine }) => {
      engine.stopJump();
    },
  },

  AIM: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING'],
    applyOptimistic: (_state, activeSlug, payload) => {
      if (payload?.aimAngle !== undefined) activeSlug.aimAngle = payload.aimAngle;
      if (payload?.aimPower !== undefined && !activeSlug.isChargingPower) {
        activeSlug.aimPower = payload.aimPower;
      }
      if (payload?.facing !== undefined) activeSlug.facing = payload.facing;
      if (payload?.targetPoint !== undefined) activeSlug.currentTargetPoint = payload.targetPoint;
    },
    executeHost: ({ engine }, payload) => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
      if (activeSlug) {
        if (payload?.aimAngle !== undefined) activeSlug.aimAngle = payload.aimAngle;
        if (payload?.aimPower !== undefined && !activeSlug.isChargingPower) {
          activeSlug.aimPower = payload.aimPower;
        }
        if (payload?.facing) activeSlug.facing = payload.facing;
        if (payload?.targetPoint) activeSlug.currentTargetPoint = payload.targetPoint;
      }
    },
  },

  SELECT_WEAPON: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING'],
    applyOptimistic: (_state, activeSlug, payload) => {
      if (payload?.weaponId) activeSlug.selectedWeaponId = payload.weaponId;
    },
    executeHost: ({ engine }, payload) => {
      if (payload?.weaponId) engine.selectWeapon(payload.weaponId);
    },
  },

  SET_FUSE_TIMER: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING'],
    applyOptimistic: (_state, activeSlug, payload) => {
      if (payload?.seconds !== undefined) activeSlug.fuseTimerSec = payload.seconds;
    },
    executeHost: ({ engine }, payload) => {
      if (payload?.seconds !== undefined) {
        const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
        if (activeSlug) engine.setFuseTimer(activeSlug.id, payload.seconds);
      }
    },
  },

  START_CHARGE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING'],
    applyOptimistic: (_state, activeSlug, payload) => {
      activeSlug.isChargingPower = true;
      activeSlug.aimPower = 5;
      if (payload?.targetPoint) activeSlug.currentTargetPoint = payload.targetPoint;
    },
    executeHost: ({ engine }, payload) => {
      engine.startCharge(payload?.targetPoint);
    },
  },

  RELEASE_CHARGE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING'],
    applyOptimistic: (_state, activeSlug) => {
      activeSlug.isChargingPower = false;
      if (activeSlug.isBlowtorching) activeSlug.isBlowtorching = false;
    },
    executeHost: ({ engine }, payload) => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
      if (activeSlug) {
        if (payload?.aimAngle !== undefined) activeSlug.aimAngle = payload.aimAngle;
        if (payload?.aimPower !== undefined) activeSlug.aimPower = payload.aimPower;
        if (payload?.facing) activeSlug.facing = payload.facing;
      }
      engine.releaseCharge(payload?.targetPoint);
    },
  },

  FIRE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING'],
    applyOptimistic: (_state, activeSlug) => {
      activeSlug.isChargingPower = false;
      if (activeSlug.selectedWeaponId === 'blowtorch') {
        activeSlug.isBlowtorching = true;
        activeSlug.blowtorchTimerMs = 5000;
      }
    },
    executeHost: ({ engine }, payload) => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
      if (activeSlug) {
        if (payload?.aimAngle !== undefined) activeSlug.aimAngle = payload.aimAngle;
        if (payload?.aimPower !== undefined) activeSlug.aimPower = payload.aimPower;
        if (payload?.facing) activeSlug.facing = payload.facing;
      }
      engine.fireWeapon(payload?.targetPoint);
    },
  },

  DETONATE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['TURN_TIME', 'RESOLVING', 'AIMING', 'PROJECTILE_ACTIVE'],
    executeHost: ({ engine }) => {
      engine.detonateSheep();
    },
  },

  PLACE_SLUG: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['PLACEMENT'],
    executeHost: ({ engine, syncState, broadcastState }, payload) => {
      if (payload?.point) {
        engine.placeSlug(payload.point);
        syncState();
        broadcastState(engine.state);
      }
    },
  },

  START_STEER: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['TURN_TIME', 'RESOLVING', 'PROJECTILE_ACTIVE'],
    applyOptimistic: (_state, activeSlug, payload) => {
      if (payload?.dir) activeSlug.steeringDir = payload.dir;
    },
    executeHost: ({ engine }, payload) => {
      if (payload?.dir) engine.startSteer(payload.dir);
    },
  },

  STOP_STEER: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['TURN_TIME', 'RESOLVING', 'PROJECTILE_ACTIVE'],
    applyOptimistic: (_state, activeSlug) => {
      activeSlug.steeringDir = null;
    },
    executeHost: ({ engine }) => {
      engine.stopSteer();
    },
  },

  ENTER_VEHICLE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING', 'TURN_TIME'],
    executeHost: ({ engine }) => {
      engine.enterVehicle();
    },
  },

  EXIT_VEHICLE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING', 'TURN_TIME'],
    executeHost: ({ engine }) => {
      engine.exitVehicle();
    },
  },

  STEER_VEHICLE: {
    permission: 'ACTIVE_TURN_ONLY',
    allowedPhases: ['AIMING', 'TURN_TIME'],
    executeHost: ({ engine }, payload) => {
      if (payload?.dir) engine.steerVehicle(payload.dir);
    },
  },
};
