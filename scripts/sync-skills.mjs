#!/usr/bin/env node
/**
 * Sincroniza .claude/skills desde .agent/skills.
 *
 * .agent/skills es la ÚNICA fuente editable.
 * .claude/skills es una copia generada para compatibilidad con Claude Code.
 *
 * Uso:
 *   node scripts/sync-skills.mjs           # sincroniza las skills que ya existen en .claude
 *   node scripts/sync-skills.mjs --all     # copia las 33 skills de .agent a .claude
 *   node scripts/sync-skills.mjs --check   # falla si alguna copia diverge del origen
 *
 * Sin dependencias.
 */
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AGENT = path.join(ROOT, '.agent', 'skills');
const CLAUDE = path.join(ROOT, '.claude', 'skills');
const check = process.argv.includes('--check');
const all = process.argv.includes('--all');

function dirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function files(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...files(full, base));
    else if (entry.name !== '.DS_Store') out.push(path.relative(base, full));
  }
  return out.sort();
}

function hashDir(dir) {
  const hash = createHash('sha256');
  for (const rel of files(dir)) {
    hash.update(rel.replace(/\\/g, '/'));
    hash.update(readFileSync(path.join(dir, rel)));
  }
  return hash.digest('hex');
}

const agentSkills = dirs(AGENT);
const claudeSkills = dirs(CLAUDE);
const targets = all
  ? agentSkills
  : claudeSkills.filter((name) => agentSkills.includes(name));

if (!targets.length) {
  console.error('No hay skills para sincronizar.');
  process.exit(1);
}

if (check) {
  const divergent = [];
  for (const name of targets) {
    const source = path.join(AGENT, name);
    const target = path.join(CLAUDE, name);
    if (!existsSync(target)) {
      divergent.push(`${name} (falta en .claude)`);
      continue;
    }
    if (hashDir(source) !== hashDir(target)) divergent.push(name);
  }

  if (divergent.length) {
    console.error(`Skills divergentes (${divergent.length}): ${divergent.join(', ')}`);
    console.error('Ejecuta: node scripts/sync-skills.mjs');
    process.exit(1);
  }

  console.log(`OK: ${targets.length} skills de .claude coinciden con .agent.`);
  process.exit(0);
}

for (const name of targets) {
  const source = path.join(AGENT, name);
  const target = path.join(CLAUDE, name);
  if (!statSync(source).isDirectory()) continue;
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

console.log(`Sincronizadas ${targets.length} skills desde .agent/skills a .claude/skills.`);
console.log('Recuerda: .claude/skills es una copia generada; no editar allí.');
