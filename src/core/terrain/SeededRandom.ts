/**
 * Ultra-fast 32-bit PRNG (Mulberry32) with a period of 2^32 (4.29 billion states).
 * Uses native bitwise arithmetic and Math.imul for maximum V8/JIT throughput,
 * guaranteeing byte-for-byte mathematical determinism across all platforms & WebRTC peers.
 */
export class SeededRandom {
  private s: number;

  constructor(seed: number) {
    // Coerce into a non-zero 32-bit unsigned integer
    this.s = (seed >>> 0) || 1;
  }

  public next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  // Multi-harmonic 1D noise for organic terrain relief with steep hills and cliffs
  public harmonicNoise(x: number, baseFreq: number, p1: number, p2: number, p3: number): number {
    const wave1 = Math.sin(x * baseFreq + p1) * 160;
    const wave2 = Math.cos(x * baseFreq * 2.2 + p2) * 80;
    const wave3 = Math.sin(x * baseFreq * 4.8 + p3) * 38;
    const wave4 = Math.cos(x * baseFreq * 9.5 + p1 * 2) * 18;

    // Stepped terrace cliffs modulation for dramatic non-flat relief
    const terrace = Math.sin(x * 0.008 + p3) > 0.5 ? Math.cos(x * 0.02 + p1) * 35 : 0;
    return wave1 + wave2 + wave3 + wave4 + terrace;
  }
}
