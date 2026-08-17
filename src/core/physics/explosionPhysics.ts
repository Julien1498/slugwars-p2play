import { Slug, Team } from '../types';
import { DestructibleTerrain } from '../terrain';

export function applyExplosionToSlugs(
  exX: number,
  exY: number,
  radius: number,
  maxDamage: number,
  slugs: Slug[],
  _terrain: DestructibleTerrain,
  teams: Team[] = [],
  attackerSlugId?: string
): { hitCount: number; killedCount: number; damageEvents: Array<{ x: number; y: number; damage: number; slugId?: string }> } {
  let hitCount = 0;
  let killedCount = 0;
  const damageEvents: Array<{ x: number; y: number; damage: number; slugId?: string }> = [];

  for (const slug of slugs) {
    if (!slug.isAlive || slug.isPlaced === false) continue;

    const dx = slug.x - exX;
    const dy = slug.y - (exY - 8);
    const dist = Math.hypot(dx, dy);

    if (dist <= radius + 15) {
      hitCount++;
      if (slug.ropeState) {
        slug.ropeState = null;
      }
      const falloff = 1 - Math.min(1, dist / (radius + 15));
      const damage = Math.round(maxDamage * falloff);

      if (damage > 0) {
        const victimHpBefore = slug.hp;
        const actualDamage = Math.min(victimHpBefore, damage);
        slug.hp = Math.max(0, slug.hp - damage);

        const victimTeam = teams.find((t) => t.id === slug.teamId);
        if (victimTeam) {
          if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
          victimTeam.stats.damageTaken += actualDamage;
        }

        if (attackerSlugId) {
          const attackerSlug = slugs.find((s) => s.id === attackerSlugId);
          if (attackerSlug && attackerSlug.teamId !== slug.teamId) {
            const attackerTeam = teams.find((t) => t.id === attackerSlug.teamId);
            if (attackerTeam) {
              if (!attackerTeam.stats) attackerTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
              attackerTeam.stats.damageDealt += actualDamage;
            }
          }
        }

        if (slug.hp === 0 && victimHpBefore > 0) {
          slug.isAlive = false;
          killedCount++;
          if (victimTeam) {
            if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
            victimTeam.stats.deaths++;
          }
          if (attackerSlugId) {
            const attackerSlug = slugs.find((s) => s.id === attackerSlugId);
            if (attackerSlug && attackerSlug.teamId !== slug.teamId) {
              const attackerTeam = teams.find((t) => t.id === attackerSlug.teamId);
              if (attackerTeam) {
                if (!attackerTeam.stats) attackerTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
                attackerTeam.stats.kills++;
              }
            }
          }
        }

        damageEvents.push({ x: slug.x, y: slug.y - 20, damage: actualDamage, slugId: slug.id });
      }

      const angle = Math.atan2(dy, dx);
      const force = (radius / (dist + 5)) * 14;
      slug.vx += Math.cos(angle) * force;
      slug.vy += Math.sin(angle) * force - 3;
    }
  }

  return { hitCount, killedCount, damageEvents };
}
