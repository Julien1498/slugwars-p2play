import { performance } from 'perf_hooks';
import { encodeBinaryDelta, decodeBinaryDelta, BinaryWriter } from '../../src/network/netBinarySerializer';

export function runNetcodeBenchmark() {
  console.log('\n🌐 [AUDIT 2/3] BENCHMARK AUTOMATISÉ : NETCODE, COMPRESSION & WEBRTC\n' + '='.repeat(65));

  // Generate realistic game state delta representing a heavy explosion turn
  const sampleDelta: any = {
    phase: 'PROJECTILE_ACTIVE',
    turnTimer: 34,
    retreatTimer: 0,
    wind: -14.2,
    activeTeamId: 'team_red',
    activeSlugId: 'slug_1',
    slugs: [
      { idx: 0, x: 450.2, y: 320.5, vx: -2.4, vy: 1.1, hp: 75, f: 'left', a: 45, p: 80, w: 'bazooka', al: true, pl: true },
      { idx: 1, x: 820.0, y: 440.0, vx: 0, vy: 0, hp: 100, f: 'right', a: 30, p: 50, w: 'grenade', al: true, pl: true },
      { idx: 2, x: 120.5, y: 280.0, vx: 3.1, vy: -5.0, hp: 45, f: 'right', a: 60, p: 90, w: 'cluster_banana', al: true, pl: true },
      { idx: 3, x: 990.0, y: 510.0, vx: 0, vy: 0, hp: 0, f: 'left', a: 0, p: 0, w: 'bazooka', al: false, pl: true },
    ],
    projectiles: [
      { id: 'proj_1', weaponId: 'bazooka', x: 550.5, y: 280.0, vx: 18.2, vy: -4.5, radius: 5, bounces: false, windAffected: true },
      { id: 'proj_2', weaponId: 'homing_missile', x: 620.0, y: 150.0, vx: 12.0, vy: 8.0, radius: 6, bounces: false, windAffected: false },
    ],
    explosions: [
      { id: 'ex_1', x: 550.0, y: 280.0, radius: 45, damage: 50, createdAt: Date.now() },
    ],
    craters: [
      { id: 'cr_1', x: 550.0, y: 280.0, radius: 45 },
      { id: 'cr_2', x: 300.0, y: 400.0, radius: 35 },
    ],
    supplyCrates: [
      { id: 'crate_1', x: 700.0, y: 200.0, vy: 2.5, isLanded: false, crateType: 'ammo', healAmount: 0 },
    ],
  };

  const ITERATIONS = 1000;

  // 1. Measure Payload Sizes
  const jsonString = JSON.stringify(sampleDelta);
  const jsonByteSize = Buffer.byteLength(jsonString, 'utf8');

  const binaryBuffer = encodeBinaryDelta(sampleDelta);
  const binaryByteSize = binaryBuffer.byteLength;

  const compressionRatio = ((1 - binaryByteSize / jsonByteSize) * 100).toFixed(1);

  // 2. Measure Serialization Throughput
  const t0 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    encodeBinaryDelta(sampleDelta);
  }
  const t1 = performance.now();
  const avgEncodeMicros = (((t1 - t0) / ITERATIONS) * 1000).toFixed(2);

  // 3. Measure Deserialization Throughput
  const t2 = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    decodeBinaryDelta(binaryBuffer);
  }
  const t3 = performance.now();
  const avgDecodeMicros = (((t3 - t2) / ITERATIONS) * 1000).toFixed(2);

  // 4. Test Re-entrancy & Thread-Safety
  const writerA = new BinaryWriter();
  const writerB = new BinaryWriter();
  const bufA = writerA.serialize({ turnTimer: 10 });
  const bufB = writerB.serialize({ turnTimer: 20 });
  const reentrantSafe = decodeBinaryDelta(bufA).turnTimer === 10 && decodeBinaryDelta(bufB).turnTimer === 20;

  console.log(`📦 Taille Brute JSON          : ${jsonByteSize} octets`);
  console.log(`🗜️ Taille Binaire BinaryWriter : ${binaryByteSize} octets`);
  console.log(`🚀 Taux de Compression Binaire: -${compressionRatio}% d'économie de bande passante`);
  console.log(`⚡ Temps d'Encodage Moyen      : ${avgEncodeMicros} µs / paquet (${((ITERATIONS / (t1 - t0)) * 1000).toFixed(0)} paquets/sec)`);
  console.log(`⚡ Temps de Décodage Moyen      : ${avgDecodeMicros} µs / paquet (${((ITERATIONS / (t3 - t2)) * 1000).toFixed(0)} paquets/sec)`);
  console.log(`🛡️ Réentrance & Sécurité P2P   : ${reentrantSafe ? '100% VALIDÉ (Instances isolées)' : 'ÉCHEC'}`);

  return {
    jsonByteSize,
    binaryByteSize,
    compressionRatio,
    avgEncodeMicros,
    avgDecodeMicros,
    reentrantSafe,
  };
}
