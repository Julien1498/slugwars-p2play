# 🐌 Slug Wars (P2Play)

Jeu d'artillerie et de stratégie tactique au tour par tour, conçu avec **React**, **TypeScript**, **HTML5 Canvas 2D** et **WebRTC (PeerJS)**.  
Fonctionne aussi bien en **mode Standalone** qu'intégré dans la plateforme **P2Play Hub**.

---

## 🌟 Points Forts & Fonctionnalités

### 💥 Terrain Procédural & Destructible Pixel-par-Pixel
* **Génération Procédurale** : Terrains infinis via Seed aléatoire avec 4 thèmes graphiques immersifs (*Île Flottante, Caverne Souterraine, Forteresse, Chaos Céleste*).
* **Destruction 2D Temps Réel** : Cratères d'explosion calculés au pixel près, érosion du sol, effondrement des props destructibles (*hérissons, poussins, champignons, fleurs, arbres*).
* **Éclairage Dynamique & Cycle Jour/Nuit** : Masque d'occlusion souterraine, faisceau lumineux de recherche pour l'hélicoptère, ciel crépusculaire étoilé ou azur ensoleillé.

### 🎒 Arsenal Complet & Tactique (18+ Armes & Équipements)
* **Projectiles & Balistique** : Bazooka (sensible au vent), Grenade à retardement, Grenade à fragmentation, Bombe Banane (dispersion de 5 bananettes), Sainte Grenade, Missile téléguidé.
* **Super Armes & Dévastation** : **Super Mouton** pilotable en vol avec détonation à distance, **Âne de Béton** qui perfore verticalement toute la carte jusqu'à l'eau.
* **Mobilité & Soutien** : **Corde Ninja** avec physique pendulaire, **Chalumeau** pour creuser des tunnels, **Poutre d'Acier** orientable pour construire des ponts/abris, **Téléporteur**, **Batte de Baseball**.
* **Véhicules de Combat** : **Hélicoptère Militaire** pilotable en temps réel avec hélice animée, physique d'inertie et faisceau de projecteur.
* **Dangers du Terrain & Bonus** : Mines de proximité avec réaction en chaîne, Caisses de ravitaillement parachutées (+50 HP).

### 🌐 Réseau P2P & Performance Haute Fidélité
* **Zero-Server Backend** : Connexions directes WebRTC peer-to-peer maillées sans serveur de jeu intermédiaire.
* **Sérialisation Binaire Compacte (`netBinarySerializer`)** : Compression binaire tag-value sur mesure, 20 Hz de synchronisation delta ultra-légère et **0 octet consommé au repos**.
* **Anti-Désynchronisation & Web Worker Timer (`workerTimer.ts`)** : Boucle physique hôte isolée dans un thread Worker, non bridée par la mise en veille des onglets du navigateur.
* **Réconciliation Instantanée (`REQUEST_FULL_STATE`)** : Resynchronisation automatique de l'ensemble des cratères et de l'état du terrain dès le retour sur l'onglet (`visibilitychange`).
* **Persistance du Profil** : Mémorisation automatique du pseudo et de l'avatar dans le stockage local via `p2play-core/session`.

---

## 🎮 Commandes de Jeu & Raccourcis

| Action | Clavier / Souris |
| :--- | :--- |
| **Se déplacer** | <kbd>◄</kbd> / <kbd>►</kbd> ou <kbd>Q</kbd> / <kbd>D</kbd> |
| **Sauter** | <kbd>Espace</kbd> |
| **Ajuster l'angle de tir** | <kbd>▲</kbd> / <kbd>▼</kbd> |
| **Tirer / Charger la puissance** | Maintenir puis relâcher <kbd>Entrée</kbd> ou <kbd>Clic Gauche</kbd> |
| **Sélectionner une arme** | <kbd>Clic Droit</kbd> ou Bouton **Armes** (<kbd>🎒</kbd>) |
| **Piloter le Super Mouton** | <kbd>◄</kbd> / <kbd>►</kbd> (Virer) & <kbd>Entrée</kbd> (Exploser) |
| **Piloter l'Hélicoptère** | <kbd>Z</kbd><kbd>Q</kbd><kbd>S</kbd><kbd>D</kbd> ou Flèches Directionnelles |
| **Sortir du Véhicule** | <kbd>E</kbd> |
| **Panoramique Caméra** | Maintenir <kbd>Clic Droit</kbd> et glisser la souris |
| **Zoom Caméra** | <kbd>Molette Souris</kbd> ou touches <kbd>+</kbd> / <kbd>-</kbd> |
| **Recentrer la Caméra** | Touche <kbd>C</kbd> |
| **Afficher les Hitboxes** | Bouton Hitbox (<kbd>🎯</kbd>) |
| **Journal & Chat** | Bouton Journal & Chat (<kbd>💬</kbd>) |

---

## 📂 Architecture du Projet

```
src/
├── core/                        # Moteur physique & logique autonome
│   ├── gameEngine.ts            # Machine d'état du jeu & boucle physique
│   ├── terrain.ts               # Grille 2D du terrain destructible
│   ├── terrainGenerator.ts      # Génération procédurale (Perlin/Bruit)
│   ├── workerTimer.ts           # Web Worker Timer haute précision en arrière-plan
│   ├── weapons/                 # Registre et comportements des armes
│   ├── audio.ts                 # Synthèse sonore procédurale Web Audio
│   └── perfTracker.ts           # Métriques FPS, Frame Time & React profiler
├── network/                     # Couche réseau P2P
│   ├── protocol.ts              # Types de messages & actions réseau
│   ├── netSerializer.ts         # Construction des deltas différentiels
│   └── netBinarySerializer.ts   # Encodeur/Décodeur binaire haute vitesse
├── components/                  # Interface utilisateur React & Canvas
│   ├── game/
│   │   ├── SlugWarsCanvas.tsx   # Moteur de rendu graphique 2D (60 FPS)
│   │   ├── SlugWarsBoard.tsx    # HUD in-game, contrôles & tiroirs
│   │   ├── SlugWarsLobby.tsx    # Salon d'avant-match & configuration
│   │   ├── TurnHeader.tsx       # Barre supérieure de tour & état
│   │   └── SlugWarsConnectionScreen.tsx # Écran d'accueil & création de salon
├── hooks/                       # Hooks React
│   ├── useGame.ts               # Orchestration Jeu <-> Réseau
│   └── usePeer.ts               # Abstraction WebRTC PeerJS
└── App.tsx                      # Point d'entrée principal (Standalone & Lib)
```

---

## 🚀 Installation & Développement

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement local
npm run dev

# Compiler le bundle de production pour le web
npm run build

# Compiler le module de bibliothèque (export pour le Hub P2Play)
npm run build:lib
```

---

## 📜 Licence

Projet développé dans le cadre de l'écosystème **P2Play**. Tous droits réservés.
