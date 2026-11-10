#!/usr/bin/env node
/**
 * Verifica que todo RN-* citado en los RF esté definido en 01-Reglas-Dominio.
 *
 * Uso:
 *   node scripts/check-ids.mjs           # reporte
 *   node scripts/check-ids.mjs --check   # falla si hay faltantes o duplicados
 *
 * Sin dependencias. Los IDs se consideran definidos cuando aparecen al inicio
 * de una viñeta con negrita o de un encabezado (los formatos del vault).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES = path.join(ROOT, 'docs', 'vault', '01-Reglas-Dominio');
const MODULES = path.join(ROOT, 'docs', 'vault', '02-Modulos-RF');
const ID_RE = /RN-[A-Z]+-\d+/g;
const DEF_PATTERNS = [
  // - **RN-XXX-01 ...**  |  **RN-XXX-01 ...**  |  ### RN-XXX-01 ...
  /^\s*(?:[-*]\s*)?(?:\*\*|#{2,4}\s*)(RN-[A-Z]+-\d+)\b/,
  // ## 1. Título (`RN-XXX-01`)  |  ## 2. Título (`RN-XXX-01`, `CA-01`)
  /^#{2,4}\s+.*\(`?(RN-[A-Z]+-\d+)`?(?:\s*,\s*`?(?:CA|QA|RNF)-[A-Z0-9-]+`?)*\)\s*$/,
  // - **Etiqueta con `RN-XXX-01` y más texto:**
  /^\s*-\s+\*\*[^*]*`(RN-[A-Z]+-\d+)`[^*]*\*\*/,
];

function definitionId(line) {
  if (/relacionado/i.test(line)) return null;
  // Un encabezado de rango ("RN-CAJ-01 a RN-CAJ-14") no define el ID: solo delimita la sección.
  if (/RN-[A-Z]+-\d+`?\s*(?:a|hasta)\s*`?(?:RN-)?[A-Z]+-\d+/.test(line)) return null;
  for (const pattern of DEF_PATTERNS) {
    const match = line.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function mdFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...mdFiles(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

const defined = new Map();
const duplicates = [];

for (const file of mdFiles(RULES)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const id = definitionId(line);
    if (!id) return;
    const where = `${path.relative(ROOT, file)}:${index + 1}`;
    if (defined.has(id)) duplicates.push({ id, first: defined.get(id), second: where });
    else defined.set(id, where);
  });
}

const citations = new Map();
for (const file of mdFiles(MODULES)) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const match of line.matchAll(ID_RE)) {
      const id = match[0];
      if (!citations.has(id)) citations.set(id, []);
      citations.get(id).push(`${path.relative(ROOT, file)}:${index + 1}`);
    }
  });
}

const missing = [...citations.keys()].filter((id) => !defined.has(id)).sort();
const unused = [...defined.keys()].filter((id) => !citations.has(id)).sort();
const check = process.argv.includes('--check');

console.log(`RN definidos: ${defined.size}`);
console.log(`RN citados en RF: ${citations.size}`);
console.log(`Citados sin definición: ${missing.length}`);
console.log(`Definidos sin cita en RF: ${unused.length}`);
console.log(`Definiciones duplicadas: ${duplicates.length}`);

if (missing.length) {
  console.log('\nFaltantes:');
  for (const id of missing) {
    console.log(`  ${id}  <- ${citations.get(id).slice(0, 3).join(', ')}`);
  }
}

if (duplicates.length) {
  console.log('\nDuplicados:');
  for (const d of duplicates) {
    console.log(`  ${d.id}  ${d.first}  /  ${d.second}`);
  }
}

if (check && (missing.length || duplicates.length)) {
  console.error('\nFallo: hay IDs citados sin definición o definiciones duplicadas.');
  process.exit(1);
}

if (!check) {
  console.log('\nReporte solamente. Usa --check para bloquear en CI cuando esté en cero.');
}
