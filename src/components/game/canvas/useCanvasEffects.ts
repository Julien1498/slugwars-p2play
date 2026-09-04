import { useRef, useCallback } from 'react';
import { GameState, SolidProp, CraterRecord } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { sfx } from '../../../core/audio';
import { TerrainBuffers, redrawOffscreenTerrain, rebuildPropsOffscreenCanvas } from '../../../rendering/renderTerrain';
import { WaterBubble, WaterRipple, WaterSplash } from '../../../rendering/renderWater';
import { ClientParticle, ClientExplosion, ClientFloatingDamage } from '../../../rendering/renderEffects';

export interface UseCanvasEffectsProps {
  terrain: DestructibleTerrain;
  getBuffers: () => TerrainBuffers;
}

export function useCanvasEffects({ terrain, getBuffers }: UseCanvasEffectsProps) {
  const carvedExplosionsRef = useRef<Set<string>>(new Set());
  const knownCraterIdsCanvasRef = useRef<Set<string>>(new Set());
  const knownBuildIdsCanvasRef = useRef<Set<string>>(new Set());
  const knownDestroyedPropIdsRef = useRef<Set<string>>(new Set());
  const prevPropsCountRef = useRef<number>(-1);
  const slugDeathTimestampsRef = useRef<Map<string, number>>(new Map());

  const clientParticlesRef = useRef<ClientParticle[]>([]);
  const clientExplosionsRef = useRef<ClientExplosion[]>([]);
  const clientFloatingDamagesRef = useRef<ClientFloatingDamage[]>([]);
  const clientWaterSplashesRef = useRef<WaterSplash[]>([]);
  const clientWaterRipplesRef = useRef<WaterRipple[]>([]);
  const clientWaterBubblesRef = useRef<WaterBubble[]>([]);
  const knownFloatingDamageIdsRef = useRef<Set<string>>(new Set());
  const prevSlugHpsRef = useRef<Map<string, number>>(new Map());
  const prevSlugWaterStateRef = useRef<Map<string, { y: number; isAlive: boolean }>>(new Map());
  const splashCooldownsRef = useRef<Map<string, number>>(new Map());
  const currentRenderWaterYRef = useRef<number>(terrain.data.waterLevel);

  const carveOffscreenCrater = useCallback(
    (x: number, y: number, radius: number, craters?: CraterRecord[], solidProps?: SolidProp[]) => {
      const safeRadius = Math.max(0, radius || 0);
      if (safeRadius <= 0) return;

      const { destroyedProps } = terrain.carveExplosion(x, y, safeRadius);
      const buffers = getBuffers();
      const applyDestOut = (canvas: HTMLCanvasElement | undefined, scale: number) => {
        if (!canvas) return;
        const c = canvas.getContext('2d');
        if (!c || typeof c.save !== 'function') return;
        c.save(); c.globalCompositeOperation = 'destination-out';
        c.beginPath(); c.arc(x * scale, y * scale, safeRadius * scale, 0, Math.PI * 2);
        c.fill(); c.restore();
      };
      applyDestOut(buffers.offscreenCanvas, 1.0);
      applyDestOut(buffers.mipmapCanvas, 0.5);
      applyDestOut(buffers.propsOffscreenCanvas, 1.0);

      const activeProps = solidProps || terrain.data.solidProps;
      if (destroyedProps && destroyedProps.length > 0) {
        for (const dp of destroyedProps) knownDestroyedPropIdsRef.current.add(dp.id);
        rebuildPropsOffscreenCanvas(buffers, activeProps, craters);
      }
    },
    [terrain, getBuffers]
  );

  const buildOffscreenTerrain = useCallback(
    (x: number, y: number, radius: number) => {
      const safeRadius = Math.max(0, radius || 0);
      if (safeRadius <= 0) return;
      terrain.buildTerrain(x, y, safeRadius, 1);
      const buffers = getBuffers();
      const dirtyBox = {
        minX: Math.max(0, Math.floor(x - safeRadius - 8)), maxX: Math.min(terrain.data.width - 1, Math.ceil(x + safeRadius + 8)),
        minY: Math.max(0, Math.floor(y - safeRadius - 8)), maxY: Math.min(terrain.data.height - 1, Math.ceil(y + safeRadius + 8)),
      };
      redrawOffscreenTerrain(terrain, buffers, dirtyBox);
    },
    [terrain, getBuffers]
  );

  const triggerWaterSplash = useCallback((x: number, y: number, scale = 1.0) => {
    clientWaterRipplesRef.current.push(
      { x, radius: 4 * scale, life: 1.0, color: 'rgba(255, 255, 255, 0.95)' },
      { x, radius: 9 * scale, life: 0.90, color: 'rgba(56, 189, 248, 0.80)' }
    );
    const count = Math.round(22 * scale);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const speed = (Math.random() * 5.0 + 3.0) * scale;
      clientWaterSplashesRef.current.push({
        x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed * 0.75, vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 2.0, life: 1.0,
        color: Math.random() < 0.5 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(56, 189, 248, 0.9)',
      });
    }
    for (let i = 0; i < 8; i++) {
      clientWaterBubblesRef.current.push({
        x: x + (Math.random() - 0.5) * 16, y: y + Math.random() * 10 + 2,
        vx: (Math.random() - 0.5) * 1.4, vy: -Math.random() * 1.8 - 0.8,
        size: Math.random() * 2.5 + 1.5, life: 1.0,
      });
    }
    sfx.play('splash');
  }, []);

  const triggerClientExplosion = useCallback((x: number, y: number, radius: number) => {
    const safeRadius = Math.max(10, radius || 30);
    clientExplosionsRef.current.push({
      id: `cex_${Date.now()}_${Math.random()}`, x, y, radius: safeRadius, startTime: performance.now(), duration: 450,
    });
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.7 + 0.3) * (safeRadius / 7);
      clientParticlesRef.current.push({
        x: x + Math.cos(angle) * (safeRadius * 0.15), y: y + Math.sin(angle) * (safeRadius * 0.15),
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1.2,
        color: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f59e0b' : '#3f3f46',
        size: Math.random() * 4 + 2, life: 1.0,
      });
    }
  }, []);

  const processFrameEffects = useCallback((curState: GameState, waterY: number) => {
    const activeProps = curState.solidProps || terrain.data.solidProps;
    if (curState.solidProps && terrain.data.solidProps !== curState.solidProps) {
      terrain.data.solidProps = curState.solidProps;
    }
    const curPropsCount = activeProps ? activeProps.length : 0;
    let propRebuildNeeded = prevPropsCountRef.current !== -1 && prevPropsCountRef.current !== curPropsCount;
    prevPropsCountRef.current = curPropsCount;

    if (activeProps) {
      for (let i = 0; i < activeProps.length; i++) {
        const sp = activeProps[i];
        const isDest = !!sp.destroyed;
        const wasDest = knownDestroyedPropIdsRef.current.has(sp.id);
        if (isDest !== wasDest) {
          propRebuildNeeded = true;
          if (isDest) knownDestroyedPropIdsRef.current.add(sp.id);
          else knownDestroyedPropIdsRef.current.delete(sp.id);
        }
      }
    }

    if (propRebuildNeeded) {
      const buffers = getBuffers();
      rebuildPropsOffscreenCanvas(buffers, activeProps, curState.craters);
    }

    // 1. Craters
    if (curState.craters && curState.craters.length > 0) {
      for (const c of curState.craters) {
        if (!knownCraterIdsCanvasRef.current.has(c.id)) {
          knownCraterIdsCanvasRef.current.add(c.id);
          carveOffscreenCrater(c.x, c.y, c.radius, curState.craters, activeProps);
        }
      }
    } else if (knownCraterIdsCanvasRef.current.size > 0) {
      knownCraterIdsCanvasRef.current.clear();
      rebuildPropsOffscreenCanvas(getBuffers(), activeProps, curState.craters);
    }

    // 1b. Terrain Builds (Dev Mode ground placement)
    if (curState.terrainBuilds && curState.terrainBuilds.length > 0) {
      for (const b of curState.terrainBuilds) {
        if (!knownBuildIdsCanvasRef.current.has(b.id)) {
          knownBuildIdsCanvasRef.current.add(b.id);
          buildOffscreenTerrain(b.x, b.y, b.radius);
        }
      }
    } else if (knownBuildIdsCanvasRef.current.size > 0) {
      knownBuildIdsCanvasRef.current.clear();
    }

    // 2. Explosions
    if (curState.explosions && curState.explosions.length > 0) {
      for (const ex of curState.explosions) {
        if (!carvedExplosionsRef.current.has(ex.id)) {
          carvedExplosionsRef.current.add(ex.id);
          carveOffscreenCrater(ex.x, ex.y, ex.radius, curState.craters, activeProps);
          triggerClientExplosion(ex.x, ex.y, ex.radius);
        }
      }
    }

    // 3. Floating Damages & Crate Pickup Text
    if (curState.floatingDamages && curState.floatingDamages.length > 0) {
      for (const fd of curState.floatingDamages) {
        if (!knownFloatingDamageIdsRef.current.has(fd.id)) {
          knownFloatingDamageIdsRef.current.add(fd.id);
          clientFloatingDamagesRef.current.push({
            id: fd.id, x: fd.x, y: fd.y, damage: fd.damage, text: fd.text, color: fd.color,
            startTime: performance.now(), duration: fd.text ? 1600 : 900,
          });
        }
      }
    }

    if (curState.slugs) {
      for (const slug of curState.slugs) {
        const prevHp = prevSlugHpsRef.current.get(slug.id);
        if (prevHp !== undefined && prevHp !== slug.hp && slug.isAlive) {
          clientFloatingDamagesRef.current.push({
            id: `${slug.id}_${Date.now()}`, x: slug.x, y: slug.y - 20, damage: prevHp - slug.hp,
            startTime: performance.now(), duration: 800,
          });
          if (prevHp > slug.hp) sfx.play('ouch');
        }
        prevSlugHpsRef.current.set(slug.id, slug.hp);
      }
    }

    // 4. Water Splashes & Bubbles
    if (curState.slugs) {
      for (const slug of curState.slugs) {
        const prevState = prevSlugWaterStateRef.current.get(slug.id);
        const isNowUnderwater = slug.y >= waterY - 4;
        const wasAbove = !prevState || prevState.y < waterY - 4;
        const wasAlive = !prevState || prevState.isAlive;

        if (isNowUnderwater && (wasAbove || (wasAlive && !slug.isAlive))) {
          const nowMs = performance.now();
          const lastSplash = splashCooldownsRef.current.get(slug.id) || 0;
          if (nowMs - lastSplash > 400) {
            splashCooldownsRef.current.set(slug.id, nowMs);
            triggerWaterSplash(slug.x, waterY, 1.4);
          }
        }
        prevSlugWaterStateRef.current.set(slug.id, { y: slug.y, isAlive: slug.isAlive });

        if (!slug.isAlive) {
          if (!slugDeathTimestampsRef.current.has(slug.id)) slugDeathTimestampsRef.current.set(slug.id, performance.now());
          const deathTime = slugDeathTimestampsRef.current.get(slug.id) || performance.now();
          if (slug.y >= waterY && performance.now() - deathTime < 2500 && Math.random() < 0.3 && clientWaterBubblesRef.current.length < 25) {
            clientWaterBubblesRef.current.push({
              x: slug.x + (Math.random() - 0.5) * 12, y: slug.y - 4,
              vx: (Math.random() - 0.5) * 0.4, vy: -1.8 - Math.random() * 1.0,
              size: 2 + Math.random() * 2.2, life: 1.0,
            });
          }
        }
      }
    }

    if (curState.projectiles) {
      for (const p of curState.projectiles) {
        if (p.y >= waterY - 6 && p.y <= waterY + 30) {
          const pKey = `proj_${p.id}`;
          const nowMs = performance.now();
          const lastSplash = splashCooldownsRef.current.get(pKey) || 0;
          if (nowMs - lastSplash > 400) {
            splashCooldownsRef.current.set(pKey, nowMs);
            triggerWaterSplash(p.x, waterY, 1.1);
          }
        }
      }
    }
  }, [carveOffscreenCrater, triggerClientExplosion, triggerWaterSplash]);

  const resetEffectsCache = useCallback((initialCraterIds?: string[]) => {
    carvedExplosionsRef.current.clear();
    knownCraterIdsCanvasRef.current.clear();
    if (initialCraterIds) {
      for (const id of initialCraterIds) knownCraterIdsCanvasRef.current.add(id);
    }
    knownBuildIdsCanvasRef.current.clear();
    knownDestroyedPropIdsRef.current.clear();
    prevPropsCountRef.current = -1;
    slugDeathTimestampsRef.current.clear();
  }, []);

  return {
    clientParticlesRef,
    clientExplosionsRef,
    clientFloatingDamagesRef,
    currentRenderWaterYRef,
    clientWaterSplashesRef,
    clientWaterRipplesRef,
    clientWaterBubblesRef,
    slugDeathTimestampsRef,
    processFrameEffects,
    resetEffectsCache,
  };
}
