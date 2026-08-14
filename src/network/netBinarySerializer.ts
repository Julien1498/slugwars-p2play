import { CompactStateDelta, CompactSlugDelta, CompactRopeDelta } from './netSerializer';
import { GameState, GamePhase } from '../core/types';
import { WeaponId } from '../core/weapons/types';

// Enums Table for Fast 1-Byte Packing
export const WEAPON_INDEX_MAP: Record<string, number> = {
  bazooka: 1,
  grenade: 2,
  cluster_bomb: 3,
  shotgun: 4,
  uzi: 5,
  baseball_bat: 6,
  punch: 7,
  air_strike: 8,
  dynamite: 9,
  landmine: 10,
  super_sheep: 11,
  teleport: 12,
  skip_turn: 13,
  holy_grenade: 14,
  banana_bomb: 15,
  concrete_donkey: 16,
  ninja_rope: 17,
  girder: 18,
  airdrop: 19,
};

export const INDEX_TO_WEAPON_MAP: string[] = [
  'bazooka',
  'bazooka',
  'grenade',
  'cluster_bomb',
  'shotgun',
  'uzi',
  'baseball_bat',
  'punch',
  'air_strike',
  'dynamite',
  'landmine',
  'super_sheep',
  'teleport',
  'skip_turn',
  'holy_grenade',
  'banana_bomb',
  'concrete_donkey',
  'ninja_rope',
  'girder',
  'airdrop',
];

export const PHASE_INDEX_MAP: Record<GamePhase, number> = {
  LOBBY: 0,
  PLACEMENT: 1,
  TURN_START: 2,
  TURN_TIME: 3,
  AIMING: 4,
  ATTACK: 5,
  FIRING: 6,
  PROJECTILE_ACTIVE: 7,
  RETREAT: 8,
  RESOLVE: 9,
  RESOLVING: 10,
  CASUALTIES: 11,
  INTERTURN: 12,
  GAME_OVER: 13,
};

export const INDEX_TO_PHASE_MAP: GamePhase[] = [
  'LOBBY',
  'PLACEMENT',
  'TURN_START',
  'TURN_TIME',
  'AIMING',
  'ATTACK',
  'FIRING',
  'PROJECTILE_ACTIVE',
  'RETREAT',
  'RESOLVE',
  'RESOLVING',
  'CASUALTIES',
  'INTERTURN',
  'GAME_OVER',
];

const MAGIC_BYTE = 0x53; // 'S' for SlugWars

// Preallocated reusable buffer (2048 bytes) to eliminate Garbage Collection churn
const SHARED_BUFFER = new ArrayBuffer(2048);
const SHARED_VIEW = new DataView(SHARED_BUFFER);
const SHARED_U8 = new Uint8Array(SHARED_BUFFER);

/**
 * Encodes a CompactStateDelta into a minimal binary ArrayBuffer (15-35 bytes)
 */
export function encodeBinaryDelta(delta: CompactStateDelta, state: GameState): ArrayBuffer {
  let offset = 0;

  // 1. Header (3 Bytes)
  SHARED_VIEW.setUint8(offset++, MAGIC_BYTE);

  let headerFlags = 0;
  if (delta.phase !== undefined) headerFlags |= 1 << 0;
  if (delta.activeTeamId !== undefined) headerFlags |= 1 << 1;
  if (delta.activeSlugId !== undefined) headerFlags |= 1 << 2;
  if (delta.turnTimer !== undefined) headerFlags |= 1 << 3;
  if (delta.retreatTimer !== undefined) headerFlags |= 1 << 4;
  if (delta.wind !== undefined) headerFlags |= 1 << 5;

  SHARED_VIEW.setUint8(offset++, headerFlags);

  const slugCount = delta.slugs ? Math.min(15, delta.slugs.length) : 0;
  const projCount = delta.projectiles ? Math.min(15, delta.projectiles.length) : 0;
  SHARED_VIEW.setUint8(offset++, (slugCount << 4) | (projCount & 0x0f));

  // 2. Dynamic Header Fields
  if (delta.phase !== undefined) {
    const pIdx = PHASE_INDEX_MAP[delta.phase as GamePhase] ?? 0;
    SHARED_VIEW.setUint8(offset++, pIdx);
  }

  if (delta.activeTeamId !== undefined) {
    const tIdx = state.teams.findIndex((t) => t.id === delta.activeTeamId);
    SHARED_VIEW.setUint8(offset++, tIdx >= 0 ? tIdx : 0xff);
  }

  if (delta.activeSlugId !== undefined) {
    const sIdx = state.slugs.findIndex((s) => s.id === delta.activeSlugId);
    SHARED_VIEW.setUint8(offset++, sIdx >= 0 ? sIdx : 0xff);
  }

  if (delta.turnTimer !== undefined) {
    SHARED_VIEW.setUint16(offset, Math.max(0, Math.round(delta.turnTimer * 10)), true);
    offset += 2;
  }

  if (delta.retreatTimer !== undefined) {
    if (delta.retreatTimer === null) {
      SHARED_VIEW.setUint16(offset, 0xffff, true);
    } else {
      SHARED_VIEW.setUint16(offset, Math.max(0, Math.round(delta.retreatTimer * 10)), true);
    }
    offset += 2;
  }

  if (delta.wind !== undefined) {
    SHARED_VIEW.setInt8(offset++, Math.round(delta.wind * 10));
  }

  // 3. Slugs List
  if (delta.slugs) {
    for (let i = 0; i < slugCount; i++) {
      const s = delta.slugs[i];
      const slugIndex = state.slugs.findIndex((slug) => slug.id === s.i);
      SHARED_VIEW.setUint8(offset++, slugIndex >= 0 ? slugIndex : 0);

      let mask = 0;
      if (s.x !== undefined) mask |= 1 << 0;
      if (s.y !== undefined) mask |= 1 << 1;
      if (s.vx !== undefined) mask |= 1 << 2;
      if (s.vy !== undefined) mask |= 1 << 3;
      if (s.hp !== undefined) mask |= 1 << 4;
      if (s.f !== undefined || s.al !== undefined || s.pl !== undefined || s.c !== undefined) mask |= 1 << 5;
      if (s.a !== undefined) mask |= 1 << 6;
      if (s.p !== undefined) mask |= 1 << 7;
      if (s.w !== undefined) mask |= 1 << 8;
      if (s.rs !== undefined) mask |= 1 << 9;
      if (s.tp !== undefined) mask |= 1 << 10;

      SHARED_VIEW.setUint16(offset, mask, true);
      offset += 2;

      if (s.x !== undefined) {
        SHARED_VIEW.setUint16(offset, Math.max(0, Math.round(s.x * 10)), true);
        offset += 2;
      }
      if (s.y !== undefined) {
        SHARED_VIEW.setUint16(offset, Math.max(0, Math.round(s.y * 10)), true);
        offset += 2;
      }
      if (s.vx !== undefined) {
        SHARED_VIEW.setInt16(offset, Math.round(s.vx * 100), true);
        offset += 2;
      }
      if (s.vy !== undefined) {
        SHARED_VIEW.setInt16(offset, Math.round(s.vy * 100), true);
        offset += 2;
      }
      if (s.hp !== undefined) {
        SHARED_VIEW.setUint16(offset, Math.max(0, s.hp), true);
        offset += 2;
      }
      if (mask & (1 << 5)) {
        let flags = 0;
        if (s.al !== undefined) { flags |= 1 << 0; if (s.al) flags |= 1 << 1; }
        if (s.pl !== undefined) { flags |= 1 << 2; if (s.pl) flags |= 1 << 3; }
        if (s.c !== undefined) { flags |= 1 << 4; if (s.c) flags |= 1 << 5; }
        if (s.f !== undefined) { flags |= 1 << 6; if (s.f === 'right') flags |= 1 << 7; }
        SHARED_VIEW.setUint8(offset++, flags);
      }
      if (s.a !== undefined) {
        SHARED_VIEW.setUint8(offset++, Math.max(0, Math.min(180, Math.round(s.a))));
      }
      if (s.p !== undefined) {
        SHARED_VIEW.setUint8(offset++, Math.max(0, Math.min(100, Math.round(s.p))));
      }
      if (s.w !== undefined) {
        SHARED_VIEW.setUint8(offset++, WEAPON_INDEX_MAP[s.w] ?? 1);
      }
      if (s.rs !== undefined) {
        if (s.rs === null) {
          SHARED_VIEW.setUint8(offset++, 0);
        } else {
          SHARED_VIEW.setUint8(offset++, 1);
          SHARED_VIEW.setUint16(offset, Math.round(s.rs.hx * 10), true);
          offset += 2;
          SHARED_VIEW.setUint16(offset, Math.round(s.rs.hy * 10), true);
          offset += 2;
          SHARED_VIEW.setUint16(offset, Math.round(s.rs.l * 10), true);
          offset += 2;
          SHARED_VIEW.setInt16(offset, Math.round(s.rs.a * 1000), true);
          offset += 2;
          SHARED_VIEW.setInt16(offset, Math.round(s.rs.w * 1000), true);
          offset += 2;
        }
      }
      if (s.tp !== undefined) {
        SHARED_VIEW.setUint16(offset, Math.round(s.tp.x * 10), true);
        offset += 2;
        SHARED_VIEW.setUint16(offset, Math.round(s.tp.y * 10), true);
        offset += 2;
      }
    }
  }

  // 4. Projectiles List
  if (delta.projectiles) {
    for (let i = 0; i < projCount; i++) {
      const p = delta.projectiles[i];
      SHARED_VIEW.setUint8(offset++, WEAPON_INDEX_MAP[p.weaponId || 'bazooka'] ?? 1);
      SHARED_VIEW.setUint16(offset, Math.round((p.x || 0) * 10), true);
      offset += 2;
      SHARED_VIEW.setUint16(offset, Math.round((p.y || 0) * 10), true);
      offset += 2;
      SHARED_VIEW.setInt16(offset, Math.round((p.vx || 0) * 100), true);
      offset += 2;
      SHARED_VIEW.setInt16(offset, Math.round((p.vy || 0) * 100), true);
      offset += 2;
      SHARED_VIEW.setUint16(offset, Math.round(p.fuseTimerMs || 0), true);
      offset += 2;
    }
  }

  // 5. Special Events & Heavy Structures (Fallback JSON Block if present: Explosions, Crates, Girders)
  const hasExtra = (delta.explosions && delta.explosions.length > 0) ||
    (delta.floatingDamages && delta.floatingDamages.length > 0) ||
    (delta.girders && delta.girders.length > 0) ||
    (delta.supplyCrates && delta.supplyCrates.length > 0) ||
    (delta.mines && delta.mines.length > 0);

  if (hasExtra) {
    const extraObj: any = {};
    if (delta.explosions) extraObj.ex = delta.explosions;
    if (delta.floatingDamages) extraObj.fd = delta.floatingDamages;
    if (delta.girders) extraObj.g = delta.girders;
    if (delta.supplyCrates) extraObj.sc = delta.supplyCrates;
    if (delta.mines) extraObj.m = delta.mines;

    const extraStr = JSON.stringify(extraObj);
    const extraBytes = new TextEncoder().encode(extraStr);
    SHARED_VIEW.setUint16(offset, extraBytes.length, true);
    offset += 2;
    SHARED_U8.set(extraBytes, offset);
    offset += extraBytes.length;
  } else {
    SHARED_VIEW.setUint16(offset, 0, true);
    offset += 2;
  }

  return SHARED_BUFFER.slice(0, offset);
}

/**
 * Decodes a binary ArrayBuffer / Uint8Array back into a CompactStateDelta
 */
export function decodeBinaryDelta(buffer: ArrayBuffer | ArrayBufferView, localState: GameState): CompactStateDelta {
  const u8 = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer);
  const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);

  let offset = 0;
  const magic = view.getUint8(offset++);
  if (magic !== MAGIC_BYTE) {
    throw new Error(`Invalid binary packet magic byte: 0x${magic.toString(16)}`);
  }

  const delta: CompactStateDelta = {};
  const headerFlags = view.getUint8(offset++);
  const counts = view.getUint8(offset++);
  const slugCount = (counts >> 4) & 0x0f;
  const projCount = counts & 0x0f;

  if (headerFlags & (1 << 0)) {
    const pIdx = view.getUint8(offset++);
    delta.phase = INDEX_TO_PHASE_MAP[pIdx] || 'AIMING';
  }

  if (headerFlags & (1 << 1)) {
    const tIdx = view.getUint8(offset++);
    delta.activeTeamId = tIdx < localState.teams.length ? localState.teams[tIdx].id : undefined;
  }

  if (headerFlags & (1 << 2)) {
    const sIdx = view.getUint8(offset++);
    delta.activeSlugId = sIdx < localState.slugs.length ? localState.slugs[sIdx].id : undefined;
  }

  if (headerFlags & (1 << 3)) {
    delta.turnTimer = view.getUint16(offset, true) / 10;
    offset += 2;
  }

  if (headerFlags & (1 << 4)) {
    const rVal = view.getUint16(offset, true);
    delta.retreatTimer = rVal === 0xffff ? null : rVal / 10;
    offset += 2;
  }

  if (headerFlags & (1 << 5)) {
    delta.wind = view.getInt8(offset++) / 10;
  }

  // Slugs
  if (slugCount > 0) {
    delta.slugs = [];
    for (let i = 0; i < slugCount; i++) {
      const slugIndex = view.getUint8(offset++);
      const slug = localState.slugs[slugIndex];
      const sId = slug ? slug.id : `slug_${slugIndex}`;
      const sDelta: CompactSlugDelta = { i: sId };

      const mask = view.getUint16(offset, true);
      offset += 2;

      if (mask & (1 << 0)) {
        sDelta.x = view.getUint16(offset, true) / 10;
        offset += 2;
      }
      if (mask & (1 << 1)) {
        sDelta.y = view.getUint16(offset, true) / 10;
        offset += 2;
      }
      if (mask & (1 << 2)) {
        sDelta.vx = view.getInt16(offset, true) / 100;
        offset += 2;
      }
      if (mask & (1 << 3)) {
        sDelta.vy = view.getInt16(offset, true) / 100;
        offset += 2;
      }
      if (mask & (1 << 4)) {
        sDelta.hp = view.getUint16(offset, true);
        offset += 2;
      }
      if (mask & (1 << 5)) {
        const flags = view.getUint8(offset++);
        if (flags & (1 << 0)) sDelta.al = (flags & (1 << 1)) !== 0;
        if (flags & (1 << 2)) sDelta.pl = (flags & (1 << 3)) !== 0;
        if (flags & (1 << 4)) sDelta.c = (flags & (1 << 5)) !== 0;
        if (flags & (1 << 6)) sDelta.f = (flags & (1 << 7)) !== 0 ? 'right' : 'left';
      }
      if (mask & (1 << 6)) {
        sDelta.a = view.getUint8(offset++);
      }
      if (mask & (1 << 7)) {
        sDelta.p = view.getUint8(offset++);
      }
      if (mask & (1 << 8)) {
        const wIdx = view.getUint8(offset++);
        sDelta.w = INDEX_TO_WEAPON_MAP[wIdx] || 'bazooka';
      }
      if (mask & (1 << 9)) {
        const hasRope = view.getUint8(offset++);
        if (hasRope === 0) {
          sDelta.rs = null;
        } else {
          const hx = view.getUint16(offset, true) / 10;
          offset += 2;
          const hy = view.getUint16(offset, true) / 10;
          offset += 2;
          const l = view.getUint16(offset, true) / 10;
          offset += 2;
          const a = view.getInt16(offset, true) / 1000;
          offset += 2;
          const w = view.getInt16(offset, true) / 1000;
          offset += 2;
          sDelta.rs = { hx, hy, l, a, w };
        }
      }
      if (mask & (1 << 10)) {
        const tpx = view.getUint16(offset, true) / 10;
        offset += 2;
        const tpy = view.getUint16(offset, true) / 10;
        offset += 2;
        sDelta.tp = { x: tpx, y: tpy };
      }

      delta.slugs.push(sDelta);
    }
  }

  // Projectiles
  if (projCount > 0) {
    delta.projectiles = [];
    for (let i = 0; i < projCount; i++) {
      const wIdx = view.getUint8(offset++);
      const px = view.getUint16(offset, true) / 10;
      offset += 2;
      const py = view.getUint16(offset, true) / 10;
      offset += 2;
      const pvx = view.getInt16(offset, true) / 100;
      offset += 2;
      const pvy = view.getInt16(offset, true) / 100;
      offset += 2;
      const fuse = view.getUint16(offset, true);
      offset += 2;

      delta.projectiles.push({
        id: `p_bin_${i}`,
        weaponId: (INDEX_TO_WEAPON_MAP[wIdx] || 'bazooka') as WeaponId,
        x: px,
        y: py,
        vx: pvx,
        vy: pvy,
        radius: 5,
        fuseTimerMs: fuse,
        bounces: false,
        windAffected: true,
      });
    }
  }

  // Special Events JSON Block
  if (offset + 2 <= view.byteLength) {
    const extraLen = view.getUint16(offset, true);
    offset += 2;
    if (extraLen > 0 && offset + extraLen <= view.byteLength) {
      const extraBytes = u8.subarray(offset, offset + extraLen);
      const extraStr = new TextDecoder().decode(extraBytes);
      try {
        const extraObj = JSON.parse(extraStr);
        if (extraObj.ex) delta.explosions = extraObj.ex;
        if (extraObj.fd) delta.floatingDamages = extraObj.fd;
        if (extraObj.g) delta.girders = extraObj.g;
        if (extraObj.sc) delta.supplyCrates = extraObj.sc;
        if (extraObj.m) delta.mines = extraObj.m;
      } catch (err) {
        console.warn('Failed to parse extra binary json block', err);
      }
    }
  }

  return delta;
}
