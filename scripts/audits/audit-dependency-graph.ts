import fs from 'fs';
import path from 'path';

export interface DependencyGraphResult {
  totalNodes: number;
  totalEdges: number;
  cycles: string[][];
  boundaryViolations: { source: string; target: string; rule: string }[];
  orphanFiles: string[];
}

export function runDependencyGraphAudit(srcRoot: string = 'src'): DependencyGraphResult {
  console.log('\n🕸️ [AUDIT 4/4] ANALYSE DE GRAPHE, FRONTIÈRES DE COUCHES & CYCLES\n' + '='.repeat(65));

  function walk(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        results = results.concat(walk(full));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(path.normalize(full).replace(/\\/g, '/'));
      }
    }
    return results;
  }

  const allFiles = walk(srcRoot);
  const fileSet = new Set(allFiles);

  function resolveImport(sourceFile: string, importPath: string): string | null {
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      return null; // External package dependency (e.g., 'react', 'peerjs')
    }

    let resolvedBase: string;
    if (importPath.startsWith('@/')) {
      resolvedBase = path.join(srcRoot, importPath.slice(2));
    } else {
      resolvedBase = path.join(path.dirname(sourceFile), importPath);
    }
    resolvedBase = path.normalize(resolvedBase).replace(/\\/g, '/');

    // Try direct match or extension match (.ts, .tsx, /index.ts, /index.tsx)
    const extensions = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
    for (const ext of extensions) {
      const candidate = resolvedBase + ext;
      if (fileSet.has(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  const graph = new Map<string, Set<string>>();
  allFiles.forEach(f => graph.set(f, new Set()));

  let totalEdges = 0;
  const boundaryViolations: { source: string; target: string; rule: string }[] = [];

  // 1. Build Adjacency Matrix & Verify Layer Boundaries
  const IMPORT_REGEX = /(?:import|export)\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;

    while ((match = IMPORT_REGEX.exec(content)) !== null) {
      const rawTarget = match[1];

      // Layer Boundary Rules
      if (file.includes('src/core/')) {
        if (rawTarget.includes('components') || rawTarget.includes('hooks') || rawTarget.includes('rendering') || rawTarget === 'react') {
          boundaryViolations.push({
            source: file,
            target: rawTarget,
            rule: 'src/core/ (Domaine) ne doit JAMAIS importer React, des composants ou du rendu',
          });
        }
      }

      if (file.includes('src/rendering/')) {
        if (rawTarget.includes('components') || rawTarget.includes('hooks')) {
          boundaryViolations.push({
            source: file,
            target: rawTarget,
            rule: 'src/rendering/ ne doit JAMAIS importer des composants ou des hooks UI',
          });
        }
      }

      if (file.includes('src/network/')) {
        if (rawTarget.includes('components') || rawTarget.includes('hooks') || rawTarget.includes('rendering')) {
          boundaryViolations.push({
            source: file,
            target: rawTarget,
            rule: 'src/network/ ne doit JAMAIS importer de UI ou de composants de rendu',
          });
        }
      }

      const resolved = resolveImport(file, rawTarget);
      if (resolved && resolved !== file) {
        if (!graph.get(file)!.has(resolved)) {
          graph.get(file)!.add(resolved);
          totalEdges++;
        }
      }
    }
  }

  // 2. Cycle Detection (Tarjan / DFS Recursion Stack)
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack: string[] = [];

  function dfsDetectCycles(node: string) {
    visited.add(node);
    recursionStack.push(node);

    const neighbors = graph.get(node) || new Set();
    for (const neighbor of neighbors) {
      const idx = recursionStack.indexOf(neighbor);
      if (idx !== -1) {
        // Cycle found
        const cyclePath = recursionStack.slice(idx).concat(neighbor);
        cycles.push(cyclePath);
      } else if (!visited.has(neighbor)) {
        dfsDetectCycles(neighbor);
      }
    }

    recursionStack.pop();
  }

  for (const file of allFiles) {
    if (!visited.has(file)) {
      dfsDetectCycles(file);
    }
  }

  // 3. Orphan Files Detection (Reachability Analysis)
  const entrypoints = allFiles.filter(
    f => f.includes('main.tsx') || f.includes('index.ts') || f.includes('App.tsx') || f.includes('__tests__')
  );

  const reachable = new Set<string>();
  const queue = [...entrypoints];
  entrypoints.forEach(e => reachable.add(e));

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const deps = graph.get(curr) || new Set();
    for (const dep of deps) {
      if (!reachable.has(dep)) {
        reachable.add(dep);
        queue.push(dep);
      }
    }
  }

  const orphanFiles = allFiles.filter(
    f => !reachable.has(f) && !f.includes('vite-env.d.ts') && !f.includes('scripts/')
  );

  // Print Results
  console.log(`📁 Fichiers indexés dans le graphe : ${allFiles.length} modules`);
  console.log(`🔗 Dépendances directes (Arêtes)  : ${totalEdges} liaisons inter-modules`);

  if (cycles.length === 0) {
    console.log(`✅ Dépendances Circulaires         : 100% PUR (0 cycle détecté, Arbre DAG parfait)`);
  } else {
    console.log(`❌ Dépendances Circulaires         : ${cycles.length} cycle(s) détecté(s) !`);
    cycles.forEach((c, i) => console.log(`   Cycle #${i + 1}: ${c.map(p => path.basename(p)).join(' -> ')}`));
  }

  if (boundaryViolations.length === 0) {
    console.log(`✅ Frontières de Couches (Clean)   : 100% CONFORME (0 fuite Domaine / UI)`);
  } else {
    console.log(`❌ Violations de Frontières         : ${boundaryViolations.length} violation(s)`);
    boundaryViolations.forEach(v => console.log(`   - ${path.basename(v.source)} -> ${v.target} (${v.rule})`));
  }

  if (orphanFiles.length === 0) {
    console.log(`✅ Détection de Code Mort          : 100% CONFORME (0 fichier orphelin)`);
  } else {
    console.log(`⚠️ Fichiers Orphelins (Code Mort)  : ${orphanFiles.length} fichier(s)`);
    orphanFiles.forEach(o => console.log(`   - ${o}`));
  }

  return {
    totalNodes: allFiles.length,
    totalEdges,
    cycles,
    boundaryViolations,
    orphanFiles,
  };
}
