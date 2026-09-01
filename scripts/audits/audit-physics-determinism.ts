import crypto from 'crypto';
import { performance } from 'perf_hooks';
import { DestructibleTerrain } from '../../src/core/terrain';
import { generateProceduralTerrain } from '../../src/core/terrainGenerator';
import { MapTheme } from '../../src/core/types';

export function runPhysicsDeterminismAudit() {
  console.log('\n💥 [AUDIT 3/3] BENCHMARK AUTOMATISÉ : PHYSIQUE, BALISTIQUE & DÉTERMINISME\n' + '='.repeat(65));

  const THEMES: MapTheme[] = [
    'ISLAND',
    'CAVERN',
    'FORTRESS',
    'OPAL_ISLAND',
    'ARCHIPELAGO',
    'NATURAL_ARCHES',
    'SPIRES',
    'ORGANIC_CAVES',
    'FLOATING_ARCHIPELAGO',
  ];

  const SEED = 424242;
  let determinismPassed = true;
  let totalRaycasts = 0;
  let totalNormals = 0;

  console.log('🌍 Test de Déterminisme & Hashing SHA-256 sur les 8 Biomes...');

  const tStart = performance.now();

  THEMES.forEach((theme) => {
    // Run 1
    const t1 = generateProceduralTerrain(SEED, theme, 1400, 800);
    const terrain1 = new DestructibleTerrain(t1);

    // Simulate 20 crater explosions
    for (let i = 0; i < 20; i++) {
      terrain1.carveExplosion(200 + i * 50, 400 + (i % 5) * 20, 25);
    }

    // Run 2 (Independent generation with same seed)
    const t2 = generateProceduralTerrain(SEED, theme, 1400, 800);
    const terrain2 = new DestructibleTerrain(t2);

    for (let i = 0; i < 20; i++) {
      terrain2.carveExplosion(200 + i * 50, 400 + (i % 5) * 20, 25);
    }

    // Hash the 1.12 MB grid buffers
    const hash1 = crypto.createHash('sha256').update(terrain1.data.grid).digest('hex');
    const hash2 = crypto.createHash('sha256').update(terrain2.data.grid).digest('hex');

    if (hash1 !== hash2) {
      determinismPassed = false;
      console.log(`❌ Divergence détectée sur le thème ${theme}!`);
    } else {
      console.log(`   ✓ Biome ${theme.padEnd(16)} : SHA-256 Identique (${hash1.slice(0, 12)}...)`);
    }

    // Benchmark zero-alloc raycasting on this terrain
    const outHit = { hit: false, x: 0, y: 0 };
    const outNorm = { nx: 0, ny: 0 };
    for (let r = 0; r < 500; r++) {
      const rx = 100 + (r % 400) * 3;
      terrain1.raycastSolidInto(rx, 0, rx, 790, outHit);
      totalRaycasts++;
      if (outHit.hit) {
        terrain1.getSurfaceNormalInto(outHit.x, outHit.y, 4, outNorm);
        totalNormals++;
      }
    }
  });

  const tEnd = performance.now();
  const durationMs = (tEnd - tStart).toFixed(1);

  console.log(`\n📐 Raycasts Zero-Alloc exécutés : ${totalRaycasts.toLocaleString()} tests`);
  console.log(`📐 Normales par convolution     : ${totalNormals.toLocaleString()} calculs`);
  console.log(`⏱️ Temps d'exécution total      : ${durationMs} ms pour 8 biomes complets`);
  console.log(`🎯 Déterminisme Mathématique     : ${determinismPassed ? '100% STRICTEMENT IDENTIQUE' : 'ÉCHEC'}`);

  return {
    themesCount: THEMES.length,
    totalRaycasts,
    totalNormals,
    durationMs,
    determinismPassed,
  };
}
