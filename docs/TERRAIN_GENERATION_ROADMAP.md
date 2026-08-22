# 🗺️ Roadmap & Conception : Génération Procédurale Avancée du Terrain

Ce document rassemble l'ensemble des concepts, algorithmes et idées de conception pour enrichir et sublimer le moteur de génération procédurale de terrain de **SlugWars**.

---

## 📑 Sommaire
1. [Nouveaux Archétypes de Cartes & Topologies](#1-nouveaux-archétypes-de-cartes--topologies)
2. [Algorithmes Géométriques & Relief 2D (Domain Warping)](#2-algorithmes-géométriques--relief-2d-domain-warping)
3. [Éléments Interactifs & Décors Tactiques Destructibles](#3-éléments-interactifs--décors-tactiques-destructibles)
4. [Distribution Intelligente des Spawns & Équilibrage Compétitif](#4-distribution-intelligente-des-spawns--équilibrage-compétitif)
5. [Rendu Visuel : Strates Géologiques & Profondeur de Caverne](#5-rendu-visuel--strates-géologiques--profondeur-de-caverne)
6. [Architecture Technique & Déterminisme P2P](#6-architecture-technique--déterminisme-p2p)

---

## 1. Nouveaux Archétypes de Cartes & Topologies

Actuellement, le terrain repose sur une courbe de hauteur 1D ($y = f(x)$) avec quelques cavités elliptiques isolées. Les nouveaux archétypes introduisent de vraies structures variées et rejouables à l'infini :

### 🏝️ A. L'Archipel Multi-Îles (*Archipelago*)
* **Concept** : Générer 2 ou 3 îles rocheuses distinctes séparées par des bras de mer ou des détroits profonds.
* **Mathématiques / Algorithme** :
  * Fonction de masque multi-gaussien ou multi-vallées :
    $$M(x) = \sin^2\left(\frac{k \cdot \pi \cdot x}{W}\right)$$
  * Les creux de la fonction tombent sous le niveau de l'eau ($y > \text{waterLevel}$), coupant naturellement le continent en îles indépendantes.
* **Impact Gameplay** :
  * Force les joueurs à adapter leurs trajectoires de bazooka avec le vent pour toucher d'une île à l'autre.
  * Valorise les armes de mobilité (Grappin Ninja, Téléporteur) et les frappes à distance (Frappe Aérienne, Pigeon Voyageur).

### 🌉 B. Les Ponts et Arches Naturelles (*Natural Arches & Land Bridges*)
* **Concept** : Des arches de roche colossales reliant deux collines avec un grand vide en dessous.
* **Mathématiques / Algorithme** :
  * Génération d'une courbe supérieure et d'une courbe inférieure d'évidement :
    $$\text{Arch}(x, y) = y > Y_{\text{top}}(x) \quad \text{ET} \quad y < Y_{\text{bottom}}(x)$$
* **Impact Gameplay** :
  * Choix stratégique fort : grimper sur l'arche pour dominer le terrain en hauteur, ou s'abriter sous l'arche pour être protégé des bombardements aériens et des missiles plongeants.

### 🏔️ C. Aiguilles & Pitons Rocheux (*Vertical Spires & Needles*)
* **Concept** : Des piliers rocheux très fins et verticaux qui s'élèvent haut dans le ciel.
* **Impact Gameplay** :
  * Positions idéales pour les tireurs d'élite, mais très vulnérables aux explosions qui peuvent détruire la base du pilier pour faire chuter l'ennemi dans l'eau.

### 🕳️ D. Réseau de Galeries et Tunnels Continus (*Perlin Tactical Artillery*)
* **Concept** : Remplacer les simples trous ovales par de véritables boyaux souterrains sinueux qui serpentent à travers la montagne et débouchent sur plusieurs sorties.
* **Mathématiques / Algorithme** :
  * Agent autonome (Perlin Digger) qui avance pas à pas en modifiant son angle via un bruit 1D et qui creuse un cercle de rayon $R \in [25, 45]\text{px}$.

---

## 2. Algorithmes Géométriques & Relief 2D (Domain Warping)

### 🌊 A. Le Domain Warping (Surplombs & Falaises Concaves)
* **Problème résolu** : Une fonction 1D $y = f(x)$ ne peut jamais avoir deux hauteurs pour un même $x$ (impossible d'avoir une falaise qui avance au-dessus du vide).
* **Solution** : Distorsion des coordonnées d'échantillonnage par un bruit secondaire :
  $$x' = x + \text{noise}(x \cdot f_1, y \cdot f_1) \times A_x$$
  $$y' = y + \text{noise}(x \cdot f_2, y \cdot f_2) \times A_y$$
* **Résultat** : Création naturelle de vagues de roche, de falaises en surplomb et de niches creusées sous le niveau du sol.

### ⛰️ B. Stalactites et Stalagmites Procédurales (Thème Caverne)
* **Concept** : Pointes rocheuses acérées générées au plafond et au sol.
* **Impact Gameplay** :
  * Peuvent être brisées au bazooka pour faire tomber des blocs sur les ennemis en dessous.

---

## 3. Éléments Interactifs & Décors Tactiques Destructibles

### 🪵 A. Ponts de Corde & Passerelles en Bois Générées
* **Concept** : Passerelles horizontales en bois ou en corde reliant deux falaises au-dessus d'un précipice.
* **Physique** : Matériau fin et destructible en un coup, permettant de couper la route ou de faire tomber un ennemi engagé sur le pont.

### 🛢️ B. Filons Explosifs & Barils d'Essence Enfouis
* **Concept** : Des poches de gaz ou des barils d'huile instables cachés sous la surface de la terre.
* **Impact Gameplay** : Creuser au bazooka ou au chalumeau peut révéler ou déclencher une énorme réaction en chaîne souterraine.

### 🛡️ C. Bunkers Naturels & Niches Défensives
* **Concept** : Petites cavités protégées parfaites pour s'abriter à la fin du tour (*Retreat phase*).

---

## 4. Distribution Intelligente des Spawns & Équilibrage Compétitif

### ⚖️ A. Algorithme de Spawn Équitable (*Fair Spawn Distribution*)
* **Critères de validation d'un point de spawn** :
  1. **Dégagement vertical (*Headroom*)** : Au moins $30\text{px}$ d'air au-dessus de la tête.
  2. **Stabilité du sol** : Pente du sol inférieure à $35^\circ$ pour éviter de glisser immédiatement.
  3. **Distance de sécurité avec l'eau** : Minimum $60\text{px}$ au-dessus de l'eau.
  4. **Dispersion spatiale** : Les membres d'une même équipe sont équitablement répartis sans être tous regroupés au même endroit (évite qu'une grenade tue toute une équipe au tour 1).

### 📦 B. Plateaux d'Atterrissage pour Caisses de Ravitaillement
* Détection automatique des zones plates et larges pour garantir que les largages de caisses de vie/munitions puissent se poser sans glisser immédiatement dans l'océan.

### 👑 C. Point Haut Central (*King of the Hill*)
* Intégration optionnelle d'un sommet central dominant qui sert d'objectif naturel pour le contrôle de la carte.

---

## 5. Rendu Visuel : Strates Géologiques & Profondeur de Caverne

```
  [ Surface : Herbe & Végétation luxuriante ]
  ════════════════════════════════════════════  <- Topsoil (Terre meuble marron clair)
  ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒  <- Strates de grès / calcaire sédimentaire
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  <- Roche dense & filons minéraux
  ████████████████████████████████████████████  <- Bedrock sombre / magma en profondeur
```

### 🎨 A. Texturation Multi-Couches (Strates Géologiques)
* La couleur du terrain change selon la profondeur par rapport à la surface :
  * $0\text{ à }12\text{px}$ : Herbe / Sable / Mousse de surface.
  * $12\text{ à }60\text{px}$ : Terre meuble avec micro-cailloux.
  * $60\text{ à }180\text{px}$ : Roche sédimentaire avec bandes horizontales naturelles.
  * $+180\text{px}$ : Roche profonde sombre et dense.

### 🌌 B. Arrière-Plan de Caverne en Parallaxe (*Cave Backwall*)
* Lorsqu'un trou est percé dans une grotte ou sous une arche, affichage d'un fond de roche sombre en retrait plutôt que du ciel ouvert, créant un effet de profondeur 3D spectaculaire.

---

## 6. Architecture Technique & Déterminisme P2P

* **100% Déterministe** : Tout est généré à partir du seul `mapSeed` (entier 32 bits) via le `SeededRandom` (LCG).
* **Zéro Bande Passante Réseau** : Le Host et le Guest génèrent exactement le même terrain au pixel près sans échanger le moindre octet de grille.
* **Performance** : Génération instantanée en moins de $15\text{ms}$ sur un `Uint8Array` à plat de $1400 \times 800$ pixels.
