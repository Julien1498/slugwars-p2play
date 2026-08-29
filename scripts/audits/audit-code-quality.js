import fs from 'fs';
import path from 'path';

export function runCodeQualityAudit() {
  console.log('\n🔍 [AUDIT 1/3] SCAN AUTOMATISÉ : QUALITÉ DE CODE & ARCHITECTURE\n' + '='.repeat(65));

  function walk(dir) {
    let results = [];
    for (const file of fs.readdirSync(dir)) {
      const full = path.join(dir, file);
      if (fs.statSync(full).isDirectory()) {
        results = results.concat(walk(full));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(full);
      }
    }
    return results;
  }

  const allFiles = walk('src');
  const prodFiles = allFiles.filter(f => !f.includes('__tests__'));
  const testFiles = allFiles.filter(f => f.includes('__tests__'));

  let totalProdLines = 0;
  let filesOver300 = [];
  let filesWithAnyInProd = [];
  let totalFunctions = 0;
  let totalComments = 0;
  let hardcodedWeaponsChecks = [];

  for (const f of prodFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    totalProdLines += lines.length;

    if (lines.length >= 300) {
      filesOver300.push({ file: f, lines: lines.length });
    }

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        totalComments++;
      }
      if (trimmed.match(/\b(function\s+\w+|const\s+\w+\s*=\s*\(|class\s+\w+)/)) {
        totalFunctions++;
      }

      // Check for loose 'any' in production
      if (trimmed.match(/(:\s*any\b|\bas\s+any\b|<any>)/) && !trimmed.startsWith('//')) {
        // Exclude legitimate protocol/audio fallback or test utilities
        if (!f.includes('perfReporter') && !f.includes('perfTypes')) {
          filesWithAnyInProd.push({ file: f, line: idx + 1, code: trimmed });
        }
      }

      // Check for hardcoded weapon id ladders in physics
      if (f.includes('physics') && trimmed.includes('proj.weaponId ===')) {
        hardcodedWeaponsChecks.push({ file: f, line: idx + 1, code: trimmed });
      }
    });
  }

  console.log(`📁 Fichiers sources analysés   : ${prodFiles.length} fichiers de production`);
  console.log(`🧪 Fichiers de tests analysés   : ${testFiles.length} suites de tests Vitest`);
  console.log(`📜 Lignes de code (Production)  : ${totalProdLines.toLocaleString()} lignes`);
  console.log(`💬 Lignes de documentation/comm : ${totalComments.toLocaleString()} lignes`);
  console.log(`🧩 Fonctions / Modules identifiés: ${totalFunctions} entités`);

  console.log('\n--- RÈGLES D\'INGÉNIERIE & RÉSULTATS ---');
  
  // 1. Rule < 300 lines
  if (filesOver300.length === 0) {
    console.log(`✅ Règle des < 300 lignes : 100% CONFORME (0 fichier > 300 lignes sur ${prodFiles.length})`);
  } else {
    console.log(`❌ Règle des < 300 lignes : ${filesOver300.length} fichier(s) dépassent 300 lignes !`);
    filesOver300.forEach(e => console.log(`   - ${e.file}: ${e.lines} lignes`));
  }

  // 2. Hardcoded Weapon Checks in Physics
  if (hardcodedWeaponsChecks.length === 0) {
    console.log(`✅ Moteur Balistique Data-Driven : 100% CONFORME (0 check hardcodé 'proj.weaponId ===')`);
  } else {
    console.log(`❌ Checks balistiques hardcodés détectés : ${hardcodedWeaponsChecks.length}`);
  }

  // 3. Strict Typing in Production
  console.log(`ℹ️ Occurrences de 'any' en production : ${filesWithAnyInProd.length} occurrence(s)`);

  return {
    prodFilesCount: prodFiles.length,
    testFilesCount: testFiles.length,
    totalProdLines,
    filesOver300Count: filesOver300.length,
    hardcodedWeaponsChecksCount: hardcodedWeaponsChecks.length,
    filesWithAnyInProdCount: filesWithAnyInProd.length,
  };
}

if (process.argv[1]?.endsWith('audit-code-quality.js')) {
  runCodeQualityAudit();
}
