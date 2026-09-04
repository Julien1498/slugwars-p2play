import { GameState, JournalEntry } from '../../types';
import { DestructibleTerrain } from '../../terrain';
import { startAiming } from './phaseTransitions';
import { processTurnSupplyDrops } from '../supplyDropSpawner';
import { getGunGameWeaponForTurn } from '../../gameModes/types';
import { getWeapon } from '../../weapons/registry';

export function advanceToNextTurn(
  state: GameState,
  terrain: DestructibleTerrain,
  callbacks: {
    addLog: (msg: string, type?: JournalEntry['type']) => void;
    randomizeWind: (state: GameState) => void;
    getNextSlugForTeam: (teamId: string) => string;
    checkWinner: () => void;
  }
): void {
  // 1. Reset all slug input flags, power and residual fall momentum
  for (const slug of state.slugs) {
    slug.isChargingPower = false;
    slug.aimPower = 5;
    slug.movingDir = null;
    slug.steeringDir = null;
    slug.vx = 0;
    slug.vy = 0;
    slug.fallStartY = undefined;
    if (slug.hp <= 0) {
      slug.hp = 0;
      slug.isAlive = false;
    }
  }

  // 2. Check if a winner already emerged
  callbacks.checkWinner();
  if (state.phase === 'GAME_OVER') return;

  // 3. Find alive teams & determine round cycle completion
  const initialAliveTeams = state.teams.filter((t) =>
    state.slugs.some((s) => s.teamId === t.id && s.isAlive && s.hp > 0)
  );
  if (initialAliveTeams.length <= 1) {
    callbacks.checkWinner();
    return;
  }

  const currentIdx = initialAliveTeams.findIndex((t) => t.id === state.activeTeamId);
  const nextIdx = (currentIdx + 1) % initialAliveTeams.length;
  const isRoundCycleCompleted = nextIdx === 0;

  // 4. Handle Water Rising Mechanic BEFORE selecting active slug so submerged slugs are not picked
  const isRisingWaterMode = state.config?.gameMode === 'RISING_WATER';
  const waterSpeed = state.config?.waterRiseSpeed;
  const waterFreq = state.config?.waterRiseFreq || 'EVERY_TURN';
  const shouldRise = isRisingWaterMode || (waterSpeed && waterSpeed !== 'OFF' && (waterFreq === 'EVERY_TURN' || isRoundCycleCompleted));

  if (shouldRise) {
    let risePx = isRisingWaterMode ? 30 : 0;
    if (!isRisingWaterMode) {
      if (waterFreq === 'EVERY_TURN') {
        const perTurnMap: Record<string, number> = { SLOW: 5, NORMAL: 12, FAST: 24 };
        risePx = perTurnMap[waterSpeed || 'NORMAL'] || 12;
      } else {
        const perRoundMap: Record<string, number> = { SLOW: 16, NORMAL: 36, FAST: 68 };
        risePx = perRoundMap[waterSpeed || 'NORMAL'] || 36;
      }
    }

    const minWaterY = Math.max(120, Math.floor(terrain.data.height * 0.18));
    const currentWaterY = state.waterLevel ?? terrain.data.waterLevel;
    const newWaterY = Math.max(minWaterY, currentWaterY - risePx);

    if (newWaterY !== currentWaterY) {
      state.waterLevel = newWaterY;
      terrain.data.waterLevel = newWaterY;
      const roundPrefix = isRisingWaterMode ? '🌋 Marée Infernale : ' : waterFreq === 'ROUND_CYCLE' ? '⏱️ Fin de cycle : ' : '';
      callbacks.addLog(`🌊 ${roundPrefix}Le niveau de l'eau monte (+${risePx} px) ! Attention à la submersion !`, 'combat');

      for (const s of state.slugs) {
        if (s.isAlive && s.y >= newWaterY) {
          s.hp = 0;
          s.isAlive = false;
          const victimTeam = state.teams.find((t) => t.id === s.teamId);
          if (victimTeam) {
            if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
            victimTeam.stats.deaths++;
          }
          callbacks.addLog(`🌊 ${s.name} a été englouti par les flots montants !`, 'death');
        }
      }
    }
  }

  // 5. Re-check winner and select next team and slug from surviving teams
  callbacks.checkWinner();
  if ((state.phase as string) === 'GAME_OVER') return;

  const aliveTeams = state.teams.filter((t) =>
    state.slugs.some((s) => s.teamId === t.id && s.isAlive && s.hp > 0)
  );
  if (aliveTeams.length <= 1) {
    callbacks.checkWinner();
    return;
  }

  const desiredTeamId = initialAliveTeams[nextIdx]?.id;
  const actualNextIdx = aliveTeams.some((t) => t.id === desiredTeamId)
    ? aliveTeams.findIndex((t) => t.id === desiredTeamId)
    : nextIdx % aliveTeams.length;
  const nextTeam = aliveTeams[actualNextIdx];
  state.activeTeamId = nextTeam.id;

  const nextSlugId = callbacks.getNextSlugForTeam(nextTeam.id);
  if (!nextSlugId) {
    const fallbackSlug = state.slugs.find((s) => s.isAlive && s.hp > 0 && s.isPlaced);
    if (fallbackSlug) {
      state.activeTeamId = fallbackSlug.teamId;
      state.activeSlugId = fallbackSlug.id;
    } else {
      callbacks.checkWinner();
      return;
    }
  } else {
    state.activeSlugId = nextSlugId;
  }

  const chosenSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (chosenSlug) {
    chosenSlug.fallStartY = undefined;
    chosenSlug.vy = 0;
  }

  // 6. Increment turn count & Randomize wind
  state.turnCount = (state.turnCount || 0) + 1;
  callbacks.randomizeWind(state);

  // 6b. Gun Game Imposed Weapon Rotation
  if (state.config?.gameMode === 'GUN_GAME') {
    const imposedWeapon = getGunGameWeaponForTurn(state.turnCount);
    const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
    if (activeSlug) {
      activeSlug.selectedWeaponId = imposedWeapon;
      const w = getWeapon(imposedWeapon);
      callbacks.addLog(`🎰 Tour ${state.turnCount} : Arme imposée → ${w ? w.name : imposedWeapon} !`, 'weapon');
    }
  }

  // 7. Decrement electromagnetic magnets remaining turns
  if (state.magnets && state.magnets.length > 0) {
    state.magnets.forEach((m) => {
      m.turnsRemaining--;
    });
    state.magnets = state.magnets.filter((m) => m.turnsRemaining > 0);
  }

  // 8. Independent category rolls for turn supply crate drops
  processTurnSupplyDrops(state, terrain, callbacks.addLog);

  startAiming(state);
}
