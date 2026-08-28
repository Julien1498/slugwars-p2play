# Spécification Complète de l'Arsenal & Comparatif Standard : SlugWars P2Play

> **Projet** : `slugwars-p2play`  
> **Date** : Août 2026  
> **Catégorie** : Game Design, Arsenal & Balistique 2D  
> **État des lieux** : 19 armes, gadgets et véhicules déjà implémentés dans `slugwars-p2play`

---

## 📊 1. Synthèse Rapide

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ARSENAL SLUGWARS P2PLAY : 19 ARMES                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ✅ Balistique & Explosifs : Bazooka, Grenade, Dynamite, Shotgun, Homing   │
│     Missile, Homing Pigeon, Banana Bomb, Mines, Barils de Pétrole           │
│  ✅ Super-Armes Mythiques  : Sainte Grenade, Âne en Béton, Super Mouton     │
│  ✅ Support Céleste        : Frappe Aérienne (Air Strike), Caisses de Soin  │
│  ✅ Corps-à-Corps & Outils : Batte de Baseball, Piquouze, Grappin Ninja,    │
│     Poutre Métallique, Chalumeau, Téléporteur, Passe-Tour                   │
│  ✅ Véhicules              : Hélicoptère (Rocket Copter) pilotable          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 2. Tableau Détaillé par Catégorie

### A. Armes Balistiques & Explosifs Standards

| Arme | Dans le Standard du Genre | Dans `slugwars-p2play` | Détails & Spécificités |
| :--- | :---: | :---: | :--- |
| **Bazooka** | ✅ | ✅ | **Présent** (Tir balistique soumis au vent, 45 dégâts, cratère moyen) |
| **Grenade Classique** | ✅ | ✅ | **Présent** (Mèche 1-5s réglable, rebonds élastiques, 45 dégâts) |
| **Banana Bomb** | ✅ | ✅ | **Présent** (Grenade géante qui explose en 5 sous-bananes véloces) |
| **Dynamite** | ✅ | ✅ | **Présent** (Pose au sol sans cloche, décompte 4s de fuite, 75 dégâts) |
| **Fusil à Pompe (Shotgun)** | ✅ | ✅ | **Présent** (Tir rectiligne direct à dégâts concentrés) |
| **Missile Téléguidé (Homing Missile)** | ✅ | ✅ | **Présent** (Verrouillage de cible au clic et guidage en vol) |
| **Pigeon Voyageur (Homing Pigeon)** | ✅ | ✅ | **Présent** (Vol autonome en arc avant de piquer sur la cible) |
| **Mine Terrestre** | ✅ | ✅ | **Présent** (Déclencheur de proximité, bip d'alerte, 50 dégâts) |
| **Baril de Pétrole (Oil Drum)** | ✅ | ✅ | **Présent** (Prop physique explosif, 50 dégâts, cratère 65px) |
| **Grenade à Fragmentation (Cluster Bomb)** | ✅ | ❌ | *Non présent (À ajouter : division en 5 éclats à l'impact)* |
| **Pistolet (Handgun)** | ✅ | ❌ | *Non présent (Rafale rapide de 6 balles légères)* |
| **Uzi / Pistolet-Mitrailleur** | ✅ | ❌ | *Non présent (Tir automatique avec arrosage et recul)* |

---

### B. Super-Armes Mythiques & Dévastatrices

| Super-Arme | Dans le Standard du Genre | Dans `slugwars-p2play` | Détails & Spécificités |
| :--- | :---: | :---: | :--- |
| **Sainte Grenade (Holy Hand Grenade)** | ✅ | ✅ | **Présent** (Cri *"Alléluia"*, rayon d'explosion massif, 100 dégâts) |
| **L'Âne en Béton (Concrete Donkey)** | ✅ | ✅ | **Présent** (Tombe du ciel et pilonne le sol verticalement jusqu'à l'eau) |
| **Super Mouton (Super Sheep)** | ✅ | ✅ | **Présent** (Mouton volant pilotable en continu au clavier/touch) |
| **Mouton Simple au sol (Sheep)** | ✅ | ❌ | *Non présent (Mouton qui sautille au sol avant d'exploser)* |
| **Vieille Dame (Old Lady)** | ✅ | ❌ | *Non présent (Marche lentement en lâchant du gaz toxique)* |
| **Armageddon** | ✅ | ❌ | *Non présent (Pluie de météores sur toute la carte)* |

---

### C. Frappes Aériennes & Support Céleste

| Frappe Aérienne | Dans le Standard du Genre | Dans `slugwars-p2play` | Détails & Spécificités |
| :--- | :---: | :---: | :--- |
| **Frappe Aérienne (Air Strike)** | ✅ | ✅ | **Présent** (5 missiles tombant du ciel sur les coordonnées ciblées) |
| **Bunker Buster** | ✅ | ❌ | *Non présent (Bombe perforante creusant le sol avant d'exploser)* |
| **Frappe de Mines (Mine Strike)** | ✅ | ❌ | *Non présent (Parachutage de 5 mines actives sur une zone)* |
| **Kamikaze** | ✅ | ❌ | *Non présent (Propulsion de l'opératif en ligne droite perforant le terrain)* |

---

### D. Mobilité, Corps-à-Corps & Outils Utilitaires

| Outil / Arme | Dans le Standard du Genre | Dans `slugwars-p2play` | Détails & Spécificités |
| :--- | :---: | :---: | :--- |
| **Batte de Baseball** | ✅ | ✅ | **Présent** (Coup de batte au corps-à-corps avec impulsion physique) |
| **Piquouze (Prod)** | ✅ | ✅ | **Présent** (Pousse légère silencieuse pour éjecter dans l'eau) |
| **Grappin Ninja (Ninja Rope)** | ✅ | ✅ | **Présent** (Balancier physique, raccourcissement/allongement de corde) |
| **Poutre Métallique (Girder)** | ✅ | ✅ | **Présent** (Dessin de matière solide dans la grille du terrain à angle libre) |
| **Chalumeau (Blowtorch)** | ✅ | ✅ | **Présent** (Creusement continu d'un tunnel dans la roche) |
| **Téléporteur (Teleport)** | ✅ | ✅ | **Présent** (Téléportation sécurisée sans collision vers un point libre) |
| **Caisse de Largage (Supply Crate)** | ✅ | ✅ | **Présent** (Parachutage d'une caisse de soin rendant +50 HP) |
| **Passe-Tour (Skip Turn)** | ✅ | ✅ | **Présent** (Fin de tour volontaire) |
| **Jetpack (Vol dorsal)** | ✅ | ❌ | *Non présent (Vol libre pendant 4 secondes avec jauge de carburant)* |
| **Marteau-Piqueur (Pneumatic Drill)** | ✅ | ❌ | *Non présent (Creusement vertical d'un puits sous ses pieds)* |
| **Parachute** | ✅ | ❌ | *Non présent (Freinage de chute avec dérive au vent)* |
| **Aimant (Magnet)** | ✅ | ❌ | *Non présent (Attraction ou répulsion magnétique des projectiles)* |

---

### E. Véhicules & Tourelles Montées

| Véhicule / Tourelle | Dans le Standard du Genre | Dans `slugwars-p2play` | Détails & Spécificités |
| :--- | :---: | :---: | :--- |
| **Hélicoptère (Rocket Copter)** | ✅ | ✅ | **Présent** (Véhicule pilotable par les limaces avec physique et tir) |
| **Tank d'Assaut (Slug Tank)** | ✅ | ❌ | *Non présent (Blindé écrasant le décor et tirant 6 obus consécutifs)* |
| **Mecha / Robot Marcheur** | ✅ | ❌ | *Non présent (Robot géant avec saut haut et pilonnage au sol)* |
| **Tourelles Fixes de Terrain** | ✅ | ❌ | *Non présent (Mitrailleuse, Lance-flammes, Sniper, Mortier)* |

---

### F. Armes Spéciales & Crossovers

| Arme Spéciale | Origine | Dans `slugwars-p2play` | Détails & Spécificités |
| :--- | :---: | :---: | :--- |
| 🌀 **Portal Gun** | **Portal (Valve)** | ❌ *(Roadmap)* | Tire le Portail Bleu (Entrée) et Orange (Sortie) pour téléporter tirs et limaces |
| ⚡ **Frappe OMG (OMG Laser)** | **Original** | ❌ *(Roadmap)* | Rayon laser orbital continu découpant verticalement le terrain jusqu'à l'eau |
| 🎶 **Dubstep Gun** | **Saints Row** | ❌ | Fait danser les ennemis au rythme de la musique avant de les projeter |
| 🪓 **Frappe Broforce** | **Broforce** | ❌ | Bombardement cinématique dévastateur |
| 🔫 **Tourelle Sentry TF2** | **Team Fortress 2** | ❌ | Tourelle automatique de défense de zone |

---

## 🎯 3. Top 5 des Armes Manquantes les plus Pertinentes à Ajouter

| Rang | Arme à Implémenter | Intérêt de Gameplay | Difficulté Technique |
| :---: | :--- | :--- | :---: |
| 🥇 **1** | 🎒 **Le Jetpack (4 secondes)** | Mobilité aérienne tactique pour atteindre les hauteurs ou fuir l'eau. | 🟢 Faible (~1h) |
| 🥈 **2** | 🌀 **Le Portal Gun (Portail A/B)** | Tirs créatifs avec téléportation des projectiles et des limaces. | 🟡 Moyenne (~2h) |
| 🥉 **3** | 💣 **La Grenade à Fragmentation** | Éclatement en 5 sous-munitions pour saturer une crevasse. | 🟢 Faible (~30 min) |
| 4️⃣ **4** | 🕳️ **Le Bunker Buster** | Creuse verticalement dans la roche avant d'exploser en profondeur. | 🟢 Faible (~45 min) |
| 5️⃣ **5** | 🧲 **L'Aimant Répulseur/Attracteur** | Dévie la trajectoire des tirs balistiques à proximité. | 🟡 Moyenne (~1h) |
