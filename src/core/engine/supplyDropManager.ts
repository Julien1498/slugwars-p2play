import { GameState, Landmine, SupplyCrate, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import { applyExplosionToSlugs } from '../physics';
import { PhaseManager } from './phaseManager';
import { sfx } from '../audio';
import { getWeapon } from '../weapons/registry';

export { pickRandomCrateContent, spawnTurnSupplyCrate } from './supplyDropSpawner';

export function updateMines(
  state: GameState,
  terrain: DestructibleTerrain,
  carveCrater: (x: number, y: number, radius: number) => void,
  addLog: (msg: string, type?: JournalEntry['type']) => void
) {
  if (!state.mines || state.mines.length === 0) return;

  const remainingMines: Landmine[] = [];
  for (const mine of state.mines) {
    let exploded = false;

    if (!mine.isTriggered) {
      for (const slug of state.slugs) {
        if (!slug.isAlive || slug.isPlaced === false) continue;
        if (Math.hypot(slug.x - mine.x, slug.y - 8 - mine.y) <= 25) {
          mine.isTriggered = true;
          mine.fuseTimerMs = 2500;
          sfx.play('tick');
          addLog('🚨 UNE MINE A ÉTÉ DÉCLENCHÉE !', 'combat');
          break;
        }
      }
    } else if (mine.fuseTimerMs !== undefined) {
      mine.fuseTimerMs -= 50;
      if (mine.fuseTimerMs <= 0) {
        exploded = true;
      }
    }

    for (const ex of state.explosions) {
      if (Math.hypot(mine.x - ex.x, mine.y - ex.y) <= ex.radius + 10) {
        exploded = true;
        break;
      }
    }

    if (exploded) {
      const now = Date.now();
      const radius = 65;
      const damage = 45;
      carveCrater(mine.x, mine.y, radius);
      state.explosions.push({
        id: `ex_mine_${now}_${Math.random()}`,
        x: mine.x,
        y: mine.y,
        radius,
        damage,
        createdAt: now,
      });
      sfx.play('explosion');
      const mineExpRes = applyExplosionToSlugs(mine.x, mine.y, radius, damage, state.slugs, terrain, state.teams);
      for (const dm of mineExpRes.damageEvents) {
        state.floatingDamages.push({
          id: `fd_${now}_${Math.random()}`,
          x: dm.x,
          y: dm.y,
          damage: dm.damage,
          createdAt: now,
        });
      }

      const activeSlugTookDamage = mineExpRes.damageEvents.some(
        (dm) => dm.slugId === state.activeSlugId
      );
      if (activeSlugTookDamage && state.phase === 'AIMING') {
        const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
        PhaseManager.startResolving(state, {
          settleTimer: 1.2,
          phaseTimeout: 30.0,
          reason: `💥 ${activeSlug?.name || 'La limace'} s'est fait sauter sur une mine ! Fin du tour !`,
          addLog,
        });
      }
    } else {
      remainingMines.push(mine);
    }
  }
  state.mines = remainingMines;
}

export function updateSupplyCrates(
  state: GameState,
  terrain: DestructibleTerrain,
  carveCraterOrAddLog?: ((x: number, y: number, radius: number) => void) | ((msg: string, type?: JournalEntry['type']) => void),
  optionalAddLog?: (msg: string, type?: JournalEntry['type']) => void
) {
  if (!state.supplyCrates || state.supplyCrates.length === 0) return;

  const carveCrater =
    typeof carveCraterOrAddLog === 'function' && carveCraterOrAddLog.length === 3
      ? (carveCraterOrAddLog as (x: number, y: number, radius: number) => void)
      : undefined;

  const addLog =
    typeof optionalAddLog === 'function'
      ? optionalAddLog
      : typeof carveCraterOrAddLog === 'function' && carveCraterOrAddLog.length !== 3
      ? (carveCraterOrAddLog as (msg: string, type?: JournalEntry['type']) => void)
      : undefined;

  const remainingCrates: SupplyCrate[] = [];
  for (const crate of state.supplyCrates) {
    let exploded = false;

    // Check if crate took damage from nearby explosions
    if (state.explosions && state.explosions.length > 0) {
      for (const ex of state.explosions) {
        if (Math.hypot(crate.x - ex.x, crate.y - ex.y) <= ex.radius + 10) {
          exploded = true;
          break;
        }
      }
    }

    if (exploded) {
      const now = Date.now();
      const radius = 35;
      const damage = 25;
      if (carveCrater) carveCrater(crate.x, crate.y, radius);
      state.explosions.push({
        id: `ex_crate_${now}_${Math.random()}`,
        x: crate.x,
        y: crate.y,
        radius,
        damage,
        createdAt: now,
      });
      sfx.play('explosion');
      const crateExpRes = applyExplosionToSlugs(crate.x, crate.y, radius, damage, state.slugs, terrain, state.teams);
      for (const dm of crateExpRes.damageEvents) {
        state.floatingDamages.push({
          id: `fd_${now}_${Math.random()}`,
          x: dm.x,
          y: dm.y,
          damage: dm.damage,
          createdAt: now,
        });
      }
      addLog?.(`💥 Une caisse de ravitaillement a explosé !`, 'combat');
      continue;
    }

    if (!crate.isLanded) {
      crate.x += state.wind * 0.15;
      crate.y += crate.vy;

      if (terrain.isSolid(crate.x, crate.y + 10) || crate.y >= terrain.data.waterLevel - 15) {
        crate.isLanded = true;
        crate.vy = 0;
      }
    }

    let collected = false;
    for (const s of state.slugs) {
      if (s.isAlive && Math.hypot(s.x - crate.x, s.y - 8 - crate.y) < 20) {
        const team = state.teams.find((t) => t.id === s.teamId);

        if (crate.crateType === 'health') {
          const oldHp = s.hp;
          const heal = crate.healAmount || 50;
          s.hp = Math.min(s.maxHp, s.hp + heal);
          const gained = s.hp - oldHp;

          state.floatingDamages.push({
            id: `heal_${Date.now()}_${Math.random()}`,
            x: s.x,
            y: s.y - 22,
            damage: -gained,
            text: `+${gained} HP ❤️`,
            color: '#22c55e',
            createdAt: Date.now(),
          });
          sfx.play('airdrop');
          addLog?.(`📦 ${s.name} a ramassé une Caisse de Soin (+${gained} HP) !`, 'combat');
        } else {
          const weaponId = crate.weaponId || 'holy_grenade';
          const weaponDef = getWeapon(weaponId);
          const count = crate.weaponCount || 1;

          if (team) {
            if (!team.inventory) team.inventory = {};
            if (team.inventory[weaponId] !== -1) {
              team.inventory[weaponId] = (team.inventory[weaponId] ?? 0) + count;
            }
          }

          state.floatingDamages.push({
            id: `weap_${Date.now()}_${Math.random()}`,
            x: s.x,
            y: s.y - 22,
            damage: -count,
            text: `+${count} ${weaponDef.icon} ${weaponDef.name}`,
            color: crate.crateType === 'utility' ? '#38bdf8' : '#e879f9',
            createdAt: Date.now(),
          });
          sfx.play('airdrop');
          const crateKind = crate.crateType === 'utility' ? "d'Utilitaires" : "d'Armes";
          addLog?.(`📦 ${s.name} a trouvé une Caisse ${crateKind} (+${count} ${weaponDef.name}) !`, 'combat');
        }

        collected = true;
        break;
      }
    }

    if (!collected && crate.y < terrain.data.waterLevel) {
      remainingCrates.push(crate);
    }
  }
  state.supplyCrates = remainingCrates;
}
