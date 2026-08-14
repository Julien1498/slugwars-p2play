# Algorithme Complet & Autonome de Génération de Terrain

Ce document contient l'intégralité du code source TypeScript/JavaScript nécessaire pour générer **exactement le même terrain procédural** que dans le jeu (sans props, sans spawn points, sans décor). 

Vous pouvez copier-coller ce fichier directement dans n'importe quel projet Node.js, TypeScript ou navigateur web pour obtenir un résultat strictement identique au pixel près.

---

## 1. Code Source Complet (Copy-Paste Ready)

```typescript
export type MapTheme = 'ISLAND' | 'CAVERN' | 'FORTRESS' | 'HILLS' | 'DEFAULT';

export interface PureTerrainData {
  width: number;
  height: number;
  seed: number;
  theme: MapTheme;
  waterLevel: number;
  /** Grille binaire plate : 0 = Air/Vide, 1 = Roche/Terre solide */
  grid: Uint8Array;
}

/**
 * Générateur Pseudo-Aléatoire Déterministe (LCG)
 * Garantit que la même graine produit exactement le même terrain partout.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  public next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Bruit multi-harmonique 1D pour le relief organique avec falaises en terrasses
   */
  public harmonicNoise(x: number, baseFreq: number, p1: number, p2: number, p3: number): number {
    const wave1 = Math.sin(x * baseFreq + p1) * 160;
    const wave2 = Math.cos(x * baseFreq * 2.2 + p2) * 80;
    const wave3 = Math.sin(x * baseFreq * 4.8 + p3) * 38;
    const wave4 = Math.cos(x * baseFreq * 9.5 + p1 * 2) * 18;

    // Modulation de falaises en terrasses abruptes
    const terrace = Math.sin(x * 0.008 + p3) > 0.5 ? Math.cos(x * 0.02 + p1) * 35 : 0;
    return wave1 + wave2 + wave3 + wave4 + terrace;
  }
}

/**
 * Fonction principale de génération procédurale du terrain pur.
 *
 * @param seed Numéro de graine aléatoire (ex: 4829104)
 * @param theme Biome à générer ('ISLAND' | 'CAVERN' | 'FORTRESS' | 'DEFAULT')
 * @param width Largeur de la carte (défaut : 1400 px)
 * @param height Hauteur de la carte (défaut : 800 px)
 */
export function generatePureTerrain(
  seed: number,
  theme: MapTheme = 'ISLAND',
  width: number = 1400,
  height: number = 800
): PureTerrainData {
  const prng = new SeededRandom(seed);
  const grid = new Uint8Array(width * height);
  const waterLevel = height - 80; // y = 720

  const baseFreq = prng.range(0.002, 0.004);
  const p1 = prng.range(0, Math.PI * 2);
  const p2 = prng.range(0, Math.PI * 2);
  const p3 = prng.range(0, Math.PI * 2);

  // -------------------------------------------------------------
  // ÉTAPE 1 : Courbe de surface principale (Heightmap 1D)
  // -------------------------------------------------------------
  for (let x = 0; x < width; x++) {
    let groundY = height * 0.52;

    if (theme === 'ISLAND') {
      // Affaissement parabolique sur les bords gauche/droite qui plonge sous l'océan
      const distFromCenter = Math.abs(x - width / 2) / (width / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.8) * 550;
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.42 + noise + edgeDrop;
    } else if (theme === 'FORTRESS') {
      // Bastion central surélevé (+260px) et douves latérales (-50px)
      const centerDist = Math.abs(x - width / 2);
      let castleHeight = 0;
      if (centerDist < 120) {
        castleHeight = 260;
      } else if (centerDist > 120 && centerDist < 200) {
        castleHeight = -50;
      }
      const noise = prng.harmonicNoise(x, baseFreq * 0.8, p1, p2, p3) * 0.8;
      groundY = height * 0.4 + noise + castleHeight;
    } else if (theme === 'CAVERN') {
      // Sol inférieur de la grotte
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.6 + noise * 0.9;

      // Plafond rocheux supérieur de la grotte
      const roofNoise = prng.harmonicNoise(x, baseFreq * 1.2, p3, p1, p2) * 0.8;
      const roofY = height * 0.2 + roofNoise;

      // Remplissage du plafond rocheux du haut (0) jusqu'à roofY
      const maxRoofY = Math.min(height, Math.max(0, Math.floor(roofY)));
      for (let y = 0; y < maxRoofY; y++) {
        grid[y * width + x] = 1;
      }
    } else {
      // Collines et vallées classiques
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 200;
      groundY = height * 0.48 + noise + channel;
    }

    // Remplissage vertical de la roche : de groundY jusqu'au niveau de l'eau
    const startY = Math.max(0, Math.min(height - 1, Math.floor(groundY)));
    for (let y = startY; y < waterLevel; y++) {
      grid[y * width + x] = 1;
    }
  }

  // -------------------------------------------------------------
  // ÉTAPE 2 : Creusement des grottes et tunnels souterrains
  // -------------------------------------------------------------
  const caveCount = theme === 'CAVERN' ? 24 : 14;
  for (let i = 0; i < caveCount; i++) {
    const cx = Math.floor(prng.range(140, width - 140));
    const cy = Math.floor(prng.range(180, waterLevel - 90));
    const rx = Math.floor(prng.range(40, 110));
    const ry = Math.floor(prng.range(30, 80));

    const minY = Math.max(0, cy - ry);
    const maxY = Math.min(height - 1, cy + ry);
    const minX = Math.max(0, cx - rx);
    const maxX = Math.min(width - 1, cx + rx);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) {
          grid[y * width + x] = 0; // Érosion / trou
        }
      }
    }
  }

  // -------------------------------------------------------------
  // ÉTAPE 3 : Insertion des îles rocheuses flottantes dans les airs
  // -------------------------------------------------------------
  const floatingIslandCount = theme === 'CAVERN' ? 6 : 4;
  for (let i = 0; i < floatingIslandCount; i++) {
    const fx = Math.floor(prng.range(200, width - 200));
    const fy = Math.floor(prng.range(160, 320));
    const fRadiusX = Math.floor(prng.range(40, 90));
    const fRadiusY = Math.floor(prng.range(15, 30));

    const minY = Math.max(0, fy - fRadiusY);
    const maxY = Math.min(waterLevel - 100, fy + fRadiusY);
    const minX = Math.max(0, fx - fRadiusX);
    const maxX = Math.min(width - 1, fx + fRadiusX);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = (x - fx) / fRadiusX;
        const dy = (y - fy) / fRadiusY;
        if (dx * dx + dy * dy <= 1.0) {
          grid[y * width + x] = 1; // Ajout de roche flottante
        }
      }
    }
  }

  return {
    width,
    height,
    theme,
    seed,
    waterLevel,
    grid,
  };
}
```

---

## 2. Fonctions de Collision & Découpe de Cratère

Pour manipuler ce terrain dans votre moteur de jeu :

```typescript
/**
 * Vérifie si un pixel (x, y) est solide (roche / terre)
 * Complexité : O(1) instantané
 */
export function isSolid(terrain: PureTerrainData, x: number, y: number): boolean {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  if (ix < 0 || ix >= terrain.width) return false;
  if (iy < 0 || iy >= terrain.height) return false;
  return terrain.grid[iy * terrain.width + ix] === 1;
}

/**
 * Creuse un cratère d'explosion circulaire dans la grille de collision
 *
 * @param cx Coordonnée X du centre de l'explosion
 * @param cy Coordonnée Y du centre de l'explosion
 * @param radius Rayon du souffle en pixels
 * @returns Nombre de pixels détruits
 */
export function carveExplosion(
  terrain: PureTerrainData,
  cx: number,
  cy: number,
  radius: number
): number {
  let destroyedCount = 0;
  const icx = Math.floor(cx);
  const icy = Math.floor(cy);
  const rSq = radius * radius;

  const minX = Math.max(0, Math.floor(icx - radius));
  const maxX = Math.min(terrain.width - 1, Math.ceil(icx + radius));
  const minY = Math.max(0, Math.floor(icy - radius));
  const maxY = Math.min(terrain.height - 1, Math.ceil(icy + radius));

  for (let y = minY; y <= maxY; y++) {
    const dySq = (y - icy) * (y - icy);
    const rowOffset = y * terrain.width;

    for (let x = minX; x <= maxX; x++) {
      const dx = x - icx;
      if (dx * dx + dySq <= rSq) {
        const idx = rowOffset + x;
        if (terrain.grid[idx] > 0) {
          terrain.grid[idx] = 0; // Vaporisé
          destroyedCount++;
        }
      }
    }
  }

  return destroyedCount;
}
```

---

## 3. Exemple de Rendu Canvas 2D (Test Rapide)

Voici comment afficher visuellement ce terrain sur un `<canvas>` HTML :

```typescript
export function renderTerrainToCanvas(terrain: PureTerrainData, canvas: HTMLCanvasElement) {
  canvas.width = terrain.width;
  canvas.height = terrain.height;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(terrain.width, terrain.height);
  const buffer32 = new Uint32Array(imgData.data.buffer);

  for (let y = 0; y < terrain.height; y++) {
    const row = y * terrain.width;
    for (let x = 0; x < terrain.width; x++) {
      const idx = row + x;
      if (terrain.grid[idx] === 1) {
        // Pixel de roche marron opaque (format ABGR : 0xFF_BB_GG_RR)
        buffer32[idx] = 0xff1e3a5f;
      } else {
        // Transparent (ciel)
        buffer32[idx] = 0x00000000;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Dessiner l'eau bleue au bas
  ctx.fillStyle = 'rgba(2, 132, 199, 0.6)';
  ctx.fillRect(0, terrain.waterLevel, terrain.width, terrain.height - terrain.waterLevel);
}
```
