# Procedural Terrain Generation Architecture

This document recaps the mathematical theory, pipeline stages, and collision data structures used for deterministic procedural terrain generation in **SlugWars**.

---

## 1. System Pipeline Overview

Terrain generation is deterministic and synchronous, executing identically on both Host and Guest machines from a single synchronized 32-bit integer (`mapSeed`):

```
                       [ mapSeed (32-bit Integer) ]
                                    │
                                    ▼
       [ 1. Seeded PRNG (Linear Congruential Generator) ]
                                    │
                                    ▼
       [ 2. 1D Multi-Harmonic Surface Wave (4 Frequency Bands + Terraces) ]
                                    │
                                    ▼
       [ 3. Biome Geometric Shaping (Island Falloff / Cavern Dual Roof / Fortress) ]
                                    │
                                    ▼
       [ 4. Volumetric Subtractions (14–24 Elliptical Cave Cavities) ]
                                    │
                                    ▼
       [ 5. Floating Sky Islands Insertion (4–6 Suspended Rock Platforms) ]
                                    │
                                    ▼
       [ 6. Raycast Scan Placement (Slugs Safe Spawn Points with Headroom Check) ]
                                    │
                                    ▼
       [ 7. Flat Uint8Array Collision Grid Generation (1400 × 800) ]
```

---

## 2. Deterministic Pseudo-Random Number Generator (PRNG)

To avoid sending megabytes of map data over WebRTC, the generator uses a deterministic **Linear Congruential Generator (LCG)** implemented in `SeededRandom`:

$$\text{seed}_{n+1} = (\text{seed}_n \times 9301 + 49297) \pmod{233280}$$
$$\text{nextFloat}() = \frac{\text{seed}_{n+1}}{233280} \in [0.0, 1.0)$$

$$\text{range}(\text{min}, \text{max}) = \text{min} + \text{nextFloat}() \times (\text{max} - \text{min})$$

This produces an identical pseudo-random sequence across all operating systems and browsers.

---

## 3. Multi-Harmonic 1D Noise (Surface Heightmap)

Rather than using single sine waves or simple Perlin noise, the surface heightmap $Y(x)$ combines **four harmonic frequency bands** with an **arithmetic step-terracing cliff modulator**:

$$Y_{\text{noise}}(x) = W_1(x) + W_2(x) + W_3(x) + W_4(x) + T(x)$$

### Frequency Waves Formulation:
- **Macro Mountains ($W_1$)**: $\quad 160 \cdot \sin(x \cdot f + p_1)$
- **Medium Hills ($W_2$)**: $\quad 80 \cdot \cos(x \cdot 2.2f + p_2)$
- **Micro-Relief ($W_3$)**: $\quad 38 \cdot \sin(x \cdot 4.8f + p_3)$
- **Surface Texture ($W_4$)**: $\quad 18 \cdot \cos(x \cdot 9.5f + 2p_1)$

*Where $f \in [0.002, 0.004]$ and phase offsets $p_1, p_2, p_3 \in [0, 2\pi)$.*

### Stepped Terrace Cliffs ($T(x)$):
$$T(x) = \begin{cases} 35 \cdot \cos(x \cdot 0.02 + p_1) & \text{if } \sin(x \cdot 0.008 + p_3) > 0.5 \\ 0 & \text{otherwise} \end{cases}$$

This modulation breaks sinusoidal regularity by generating sharp vertical plateaus and cliffs.

---

## 4. Biome & Theme Geometry Transformations

The continuous heightmap is transformed based on the selected `MapTheme`:

```
         [ ISLAND THEME ]                                 [ CAVERN THEME ]
    ╭────────────────────────╮                   ████████████████████████████████  <- Roof Ceiling
    │     (High Plateau)     │                   ██████ (Stalactites) ███████████
    │                        │                   
~~~~╯                        ╰~~~~               ════════════════════════════════  <- Floor Surface
<- Left Edge Drop   Right Edge Drop ->           ████████████████████████████████
```

### 1. `ISLAND`
Applies a symmetric parabolic edge-falloff curve, sinking both sides into the water:
$$\text{edgeDrop}(x) = \left( \frac{|x - 700|}{700} \right)^{2.8} \times 550$$
$$Y_{\text{ground}}(x) = (H \times 0.42) + Y_{\text{noise}}(x) + \text{edgeDrop}(x)$$

### 2. `CAVERN`
Generates a dual-layer closed cave with both a floor and an independent overhead ceiling:
$$Y_{\text{floor}}(x) = (H \times 0.60) + Y_{\text{noise}}(x) \times 0.9$$
$$Y_{\text{roof}}(x) = (H \times 0.20) + \text{harmonicNoise}(x, 1.2f, p_3, p_1, p_2) \times 0.8$$
*Solid rock is filled from $y = 0$ down to $Y_{\text{roof}}(x)$, creating hanging ceiling stalactites.*

### 3. `FORTRESS`
Injects an elevated central bastion structure flanked by moat depressions:
$$C(x) = \begin{cases} +260 & \text{if } |x - 700| < 120 \\ -50 & \text{if } 120 \le |x - 700| < 200 \\ 0 & \text{otherwise} \end{cases}$$
$$Y_{\text{ground}}(x) = (H \times 0.40) + Y_{\text{noise}}(x) \times 0.8 + C(x)$$

---

## 5. Volumetric Cave Carving & Floating Islands

After columns are filled between $Y_{\text{ground}}(x)$ and the water level ($H - 80$), 2D volumetric boolean operations are executed:

### Cave Cavity Carving:
- Carves **14 to 24 randomized ellipses** inside the subterranean ground mass.
- For a cave centered at $(c_x, c_y)$ with radii $(r_x \in [40, 110], r_y \in [30, 80])$:
$$\left( \frac{x - c_x}{r_x} \right)^2 + \left( \frac{y - c_y}{r_y} \right)^2 \le 1.0 \implies \text{grid}[y \cdot W + x] = 0$$

### Floating Sky Rock Islands:
- Injects **4 to 6 floating elliptical platforms** into the open air layer ($y \in [160, 320]$):
$$\left( \frac{x - f_x}{f_{rx}} \right)^2 + \left( \frac{y - f_y}{f_{ry}} \right)^2 \le 1.0 \implies \text{grid}[y \cdot W + x] = 1$$

---

## 6. Raycast Scan for Safe Spawn Points

To place slugs safely without embedding them inside rock or dropping them into the ocean:

```
      y - 30 [ 0 ] (Air)
             ...
      y - 1  [ 0 ] (Air)    <- Vertical Headroom Clearance check (>= 22px)
      ────── [ 1 ] (Ground)
      y      [ 1 ] (Rock)
```

1. The generator iterates along the X-axis across the playable map ($x \in [120, W - 120]$) in steps of $\approx 80\text{px}$.
2. It casts a vertical downward ray until detecting a surface boundary:
$$\text{grid}[y \cdot W + x] == 1 \quad \land \quad \text{grid}[(y - 1) \cdot W + x] == 0$$
3. It validates that the column directly above has at least **22 contiguous vertical pixels of clear air** ($[y - 1 \to y - 30]$).
4. If valid, $(x, y - 10)$ is stored in `spawnPoints`.

---

## 7. The Collision Grid & Real-Time Destruction

The entire terrain is stored in a flat 1D binary buffer (`Uint8Array` of size $1400 \times 800 = 1\,120\,000\text{ bytes} \approx 1.1\text{ MB}$):

- `0`: Air / Void (traversable)
- `1`: Solid Terrain Rock / Dirt (blocking)

### Instant Point Collision ($O(1)$):
```ts
isSolid(x, y): boolean {
  if (x < 0 || x >= 1400 || y < 0 || y >= 800) return false;
  return grid[Math.floor(y) * 1400 + Math.floor(x)] > 0;
}
```

### Crater Explosion Carving:
When an explosive weapon detonates at $(c_x, c_y)$ with blast radius $R$:

```ts
const rSq = R * R;
for (let y = cy - R; y <= cy + R; y++) {
  const dySq = (y - cy) * (y - cy);
  for (let x = cx - R; x <= cx + R; x++) {
    if ((x - cx) * (x - cx) + dySq <= rSq) {
      grid[y * width + x] = 0; // Vaporize terrain pixel
    }
  }
}
```

This updates the collision mask instantly for physics calculations while triggering an offscreen dirty-box redraw in $\approx 0.08\text{ ms}$, ensuring locked 60 FPS performance during massive cratering events.
