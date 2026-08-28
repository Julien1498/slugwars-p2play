# Audit Critique : Qualité du Typage, Architecture & Bonnes Pratiques TS/JS

> **Projet** : `slugwars-p2play`  
> **Date** : Août 2026  
> **Validation** : 34 suites de tests unitaires / 373 tests passants (100% de succès)  
> **Périmètre audité** : Typage TypeScript, Clean Architecture, Principes SOLID, Robustesse des Erreurs et Performance V8

---

## 🎯 1. Note Globale & Diagnostic

### **Note Globale : 8.5 / 10**

> **Diagnostic en 3 lignes :**
> 1. **Architecture & Modularité exemplaires** : Séparation stricte entre le Domaine pur (`core/`), le Réseau (`network/`), le Rendu graphique (`rendering/`) et l'UI (`components/`), avec 100% des fichiers sous la barre des 300 lignes.
> 2. **Bonnes pratiques asynchrones & robustesse null-safe** : Utilisation intensive du Nullish Coalescing (`??`), de l'Optional Chaining (`?.`) et synchronisation résiliente hôte/invité (Web Workers + WebRTC).
> 3. **Points de dette technique identifiés** : `noImplicitAny: false` actif dans `tsconfig.app.json`, ~45 occurrences de `any` résiduelles (notamment dans les payloads d'actions), et mutations statiques ad-hoc à corriger.

---

## 🌟 2. Points Forts (Ce qui est propre)

### A. Qualité du Typage & Modélisation
* **Distinction sémantique `interface` vs `type`** :
  * Les entités extensibles et états du jeu (`GameState`, `Slug`, `TerrainData`, `SolidProp`, `NetworkStats`) sont typés sous forme d'**interfaces**.
  * Les états finis, identifiants et unions discrètes (`GamePhase`, `WeaponId`, `MapTheme`, `MapSize`, `SoundEffectType`) sont typés sous forme de **types**.
* **Utilisation judicieuse des Types Utilitaires** :
  * `Partial<GameConfig>`, `Partial<HelicopterVehicle>`, `Record<WeaponId, WeaponDefinition>`, `Record<string, number>`.

### B. Architecture & Séparation des Responsabilités (Clean Architecture)
* **Indépendance totale du Core Engine** : Les 55 fichiers sous `src/core/` n'importent **aucun composant React ni élément JSX**. Ils sont 100% agnostiques du framework et testables unitairement en isolation pure.
* **Respect du principe de Responsabilité Unique (SRP)** :
  * Découpage exemplaire des modules : `engine/phase/` (transitions, ticks, progression), `engine/weapons/` (sélection, tir, armes spéciales, barils), `network/metrics/` (stats WebRTC, capture de trafic), `components/game/desktop/combatLog/`.
* **Principe Ouvert/Fermé (Open/Closed Principle)** :
  * Le registre d'armes `src/core/weapons/registry.ts` permet d'ajouter n'importe quelle nouvelle arme sans modifier le cœur de la boucle de jeu.

### C. Bonnes Pratiques TS / JS & Mutabilité Contrôlée
* **Mutabilité haute performance maîtrisée** :
  * Dans la boucle physique 20Hz, l'état `GameState` est muté sur place pour éviter des milliers d'allocations d'objets par seconde.
  * Dans React, les composants s'appuient sur des `useRef` pour éliminer tout re-rendu inutile à 60 FPS.
* **Gestion Asynchrone Propre (Promises & Worker Timers)** :
  * Pas de blocages d'I/O. Utilisation de `async/await` pour les sondages WebRTC `getStats()` et reprise automatique de l'AudioContext.

### D. Robustesse & Sécurité Null/Undefined
* **Opérateurs modernes généralisés** :
  * `inventory[weaponId] ?? -1`, `proj.behaviorData?.homingDelayMs ?? 0`, `state.girders?.length || 0`.
  * Zéro risque de crash silencieux sur les propriétés optionnelles.

---

## ⚠️ 3. Faiblesses & Anti-Patterns Identifiés

---

### 🔴 1. Configuration TypeScript laxiste (`noImplicitAny: false`) & `any` résiduels

* **Fichier** : `tsconfig.app.json` (L17)
* **Problème** : `noImplicitAny: false` est explicitement configuré, autorisant des variables non typées à compiler sans avertissement. De plus, ~45 `any` résiduels subsistent (notamment dans `useActionDispatcher.ts`, `networkMetrics.ts`, `useCanvasRenderLoop.ts`).

```json
// ❌ ACTUEL (tsconfig.app.json)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

* **Correction proposée** : Activer le mode strict complet :

```json
// ✅ CONFIGURATION STRICTE RECOMMANDÉE (tsconfig.app.json)
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

### 🔴 2. Manque de Discriminated Unions sur les Actions et Projectiles

* **Fichiers** :
  * `src/hooks/game/useActionDispatcher.ts` (L34)
  * `src/core/types.ts` (L208)
* **Problème** : Les actions réseau et comportements d'armes utilisent des dictionnaires non typés : `sendAction: (actionName: string, payload?: any)` et `behaviorData?: Record<string, any>`.

```typescript
// ❌ CODE ACTUEL (useActionDispatcher.ts)
const sendAction = useCallback((actionName: string, payload?: any) => {
  const msg: SlugWarsNetworkMessage = {
    type: 'ACTION',
    actionName: actionName as any,
    payload,
  };
  peerManager.broadcast(msg);
}, [peerManager]);
```

* **Correction proposée** : Déclarer un type d'action discriminant unifié :

```typescript
// ✅ CODE CORRIGÉ : Discriminated Union
export type GameAction =
  | { type: 'AIM'; payload: { aimAngle: number; aimPower: number; facing: 'left' | 'right'; targetPoint?: Vector2D } }
  | { type: 'FIRE'; payload?: { targetPoint?: Vector2D } }
  | { type: 'START_MOVE'; payload: { dir: 'left' | 'right' } }
  | { type: 'STOP_MOVE' }
  | { type: 'JUMP' }
  | { type: 'SELECT_WEAPON'; payload: { weaponId: string } }
  | { type: 'SET_FUSE_TIMER'; payload: { seconds: number } }
  | { type: 'VEHICLE_STEER'; payload: { dir: 'left' | 'right' | 'up' | 'down' } };

export function sendGameAction(peerManager: PeerManagerLike, action: GameAction): void {
  peerManager.broadcast({ type: 'ACTION', ...action });
}
```

---

### 🔴 3. Typage et gestion des erreurs dans les blocs `catch`

* **Fichiers** :
  * `src/hooks/useFullscreen.ts` (L18)
  * `src/hooks/game/useGuestStateReceiver.ts` (L37)
* **Problème** : Présence de `.catch((err: any) => ...)` sans *Type Narrowing*.

```typescript
// ❌ CODE ACTUEL (useFullscreen.ts)
return elem.requestFullscreen().catch((err: any) => {
  console.warn('requestFullscreen failed:', err);
});
```

* **Correction proposée** : Utiliser un garde de type sûr :

```typescript
// ✅ CODE CORRIGÉ : Safe Error Narrowing
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

return elem.requestFullscreen().catch((err: unknown) => {
  console.warn('requestFullscreen failed:', getErrorMessage(err));
});
```

---

### 🔴 4. Prop Drilling massif de 25 callbacks dans `SlugWarsBoard`

* **Fichier** : `src/components/game/SlugWarsBoard.tsx` (L24-51)
* **Problème** : Couplage fort entre le Board et 25 callbacks passés individuellement (`onFire`, `onPlaceSlug`, `onUpdateAim`, `onSelectWeapon`, `onSetFuseTimer`, `onStartMove`, `onStopMove`, `onJump`, etc.).
* **Correction proposée** : Passer un dispatcher d'actions unifié `dispatchAction: (action: GameAction) => void`.

---

## 🏆 4. Top 3 des Refactorisations Prioritaires

| Rang | Refactorisation Prioritaire | Bénéfice & Impact | Effort Estimé |
| :---: | :--- | :--- | :---: |
| 🥇 **1** | **Passage à `noImplicitAny: true` & Élimination des `any` résiduels** | Verrouille le typage strict du compilateur et sécurise tous les flux de données réseau/UI. | **Moyen** (~45 min) |
| 🥈 **2** | **Création du type discriminant `GameAction` & Unification du Dispatcher** | Supprime le prop drilling de 25 callbacks dans `SlugWarsBoard` et centralise la gestion des inputs. | **Moyen** (~45 min) |
| 🥉 **3** | **Suppression du monkey-patching `SlugWarsCanvas._updateExternalState`** | Restaure les standards React déclaratifs et fiabilise le cycle de vie du Canvas. | **Faible** (~30 min) |
