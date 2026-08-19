import { GameState, Landmine, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import { applyExplosionToSlugs } from '../physics';
import { sfx } from '../audio';

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
        if (Math.hypot(slug.x - mine.x, (slug.y - 8) - mine.y) <= 25) {
          mine.isTriggered = true;
          mine.fuseTimerMs = 2000;
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
        addLog(`💥 ${activeSlug?.name || 'La limace'} s'est fait sauter sur une mine ! Fin du tour !`, 'combat');
        state.phase = 'RESOLVING';
        state.phaseTimer = 5.0;
        state.settleTimer = 1.2;
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
  addLog: (msg: string, type?: JournalEntry['type']) => void
) {
  if (!state.supplyCrates || state.supplyCrates.length === 0) return;

  const remainingCrates: typeof state.supplyCrates = [];
  for (const crate of state.supplyCrates) {
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
      if (s.isAlive && Math.hypot(s.x - crate.x, (s.y - 8) - crate.y) < 20) {
        const oldHp = s.hp;
        s.hp = Math.min(s.maxHp, s.hp + crate.healAmount);
        const gained = s.hp - oldHp;

        state.floatingDamages.push({
          id: `heal_${Date.now()}_${Math.random()}`,
          x: s.x,
          y: s.y - 22,
          damage: -gained,
          createdAt: Date.now(),
        });

        sfx.play('airdrop');
        addLog(`📦 ${s.name} a ramassé une Caisse de Ravitaillement (+${gained} HP) !`, 'combat');
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
