import { GameState, SolidProp, JournalEntry } from '../../types';
import { DestructibleTerrain } from '../../terrain';
import { applyExplosionToSlugs } from '../../physics';
import { sfx } from '../../audio';

export function detonateOilDrum(
  state: GameState,
  terrain: DestructibleTerrain,
  drum: SolidProp,
  carveCrater: (x: number, y: number, radius: number) => void,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): void {
  const now = Date.now();
  const blastRadius = 65;
  const blastDamage = 50;
  const drumY = drum.y - 12;

  state.explosions.push({
    id: `ex_drum_${now}_${Math.random()}`,
    x: drum.x,
    y: drumY,
    radius: blastRadius,
    damage: blastDamage,
    createdAt: now,
  });

  sfx.play('explosion');
  addLog(`💥 UN BARIL DE PÉTROLE A EXPLOSÉ !`, 'combat');

  const expRes = applyExplosionToSlugs(
    drum.x,
    drumY,
    blastRadius,
    blastDamage,
    state.slugs,
    terrain,
    state.teams,
    drum.detonatedBySlugId,
    state.helicopters
  );

  for (const dm of expRes.damageEvents) {
    state.floatingDamages.push({
      id: `fd_${now}_${Math.random()}`,
      x: dm.x,
      y: dm.y,
      damage: dm.damage,
      createdAt: now,
    });
  }

  for (let p = 0; p < 14; p++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4.5;
    state.particles.push({
      x: drum.x,
      y: drumY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      color: Math.random() > 0.35 ? '#ef4444' : '#facc15',
      size: Math.random() * 3 + 2,
      life: 1.0,
    });
  }

  carveCrater(drum.x, drumY, blastRadius);
}
