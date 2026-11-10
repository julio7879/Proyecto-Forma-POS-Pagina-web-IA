#!/usr/bin/env node
/**
 * Genera docs/vault/05-Estado-Sprints/PROGRESO-ACTUAL.md desde backlog.yaml.
 *
 * Uso:
 *   node scripts/gen-progress.mjs           # regenera el tablero
 *   node scripts/gen-progress.mjs --check   # falla si el tablero no coincide
 *
 * Sin dependencias externas: parser mínimo para el YAML controlado del backlog.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BACKLOG = path.join(ROOT, 'docs', 'vault', '05-Estado-Sprints', 'backlog.yaml');
const OUTPUT = path.join(ROOT, 'docs', 'vault', '05-Estado-Sprints', 'PROGRESO-ACTUAL.md');

const SPRINTS = {
  0: 'Fundación, datos y utilidades',
  1: 'Identidad, sedes y catálogo',
  2: 'Kardex, compras y traslados',
  3: 'Caja, POS, descuentos y devoluciones',
  4: 'Tienda web, DANE y reservas',
  5: 'Reportes, dashboard y certificación',
};

const ESTADOS = {
  done: { label: '✅ Hecho', orden: 0 },
  in_progress: { label: '🟡 En curso', orden: 1 },
  declared: { label: '🟠 Declarado', orden: 2 },
  pending: { label: '⚪ Pendiente', orden: 3 },
};

function scalar(value) {
  const v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    return v.slice(1, -1);
  }
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function parseBacklog(text) {
  const meta = {};
  const tareas = [];
  let section = null;
  let current = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    if (line === 'meta:') {
      section = 'meta';
      current = null;
      continue;
    }
    if (line === 'tareas:') {
      section = 'tareas';
      current = null;
      continue;
    }

    if (section === 'meta') {
      const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
      if (m) meta[m[1]] = scalar(m[2]);
      continue;
    }

    if (section === 'tareas') {
      if (line.startsWith('- ')) {
        current = {};
        tareas.push(current);
        const m = line.slice(2).match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (m) current[m[1]] = scalar(m[2]);
      } else if (current) {
        const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
        if (m) current[m[1]] = scalar(m[2]);
      }
    }
  }

  return { meta, tareas };
}

function validate(tareas) {
  const requeridos = ['id', 'sprint', 'titulo', 'responsable', 'estado', 'evidencia'];
  const ids = new Set();

  for (const t of tareas) {
    for (const campo of requeridos) {
      if (t[campo] === undefined || t[campo] === '') {
        throw new Error(`Tarea ${t.id || '(sin id)'} sin campo obligatorio: ${campo}`);
      }
    }
    if (ids.has(t.id)) throw new Error(`ID duplicado en backlog: ${t.id}`);
    ids.add(t.id);
    if (!ESTADOS[t.estado]) throw new Error(`Estado inválido en ${t.id}: ${t.estado}`);
    if (!SPRINTS[t.sprint]) throw new Error(`Sprint inválido en ${t.id}: ${t.sprint}`);
  }
}

function pct(part, total) {
  if (!total) return '0.0';
  return ((part / total) * 100).toFixed(1);
}

function bar(part, total) {
  if (!total) return '░░░░░░░░░░';
  const llenas = Math.round((part / total) * 10);
  return '█'.repeat(llenas) + '░'.repeat(10 - llenas);
}

function esc(value) {
  return String(value ?? '—')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function build(meta, tareas) {
  const ordenadas = [...tareas].sort(
    (a, b) => a.sprint - b.sprint || String(a.id).localeCompare(String(b.id))
  );
  const total = ordenadas.length;
  const cuenta = (estado) => ordenadas.filter((t) => t.estado === estado).length;
  const hechas = cuenta('done');
  const enCurso = cuenta('in_progress');
  const declaradas = cuenta('declared');
  const pendientes = cuenta('pending');

  const lineas = [];
  lineas.push('---');
  lineas.push('id: PROGRESO-ACTUAL');
  lineas.push('tags: [estado, sprints, generado, backlog]');
  lineas.push('generado_por: scripts/gen-progress.mjs');
  lineas.push('fuente: docs/vault/05-Estado-Sprints/backlog.yaml');
  lineas.push(`fecha_corte: ${meta.corte}`);
  lineas.push(`commit: ${meta.commit}`);
  lineas.push('---');
  lineas.push('');
  lineas.push('# Tablero Vivo de Progreso y Estado de Sprints');
  lineas.push('');
  lineas.push('> **Generado automáticamente. No editar a mano.**');
  lineas.push('> Fuente única: `docs/vault/05-Estado-Sprints/backlog.yaml`.');
  lineas.push(`> Corte: **${meta.corte}** · Commit: \`${meta.commit}\` · Rama: \`${meta.rama}\`.`);
  lineas.push(`> Operación: **${meta.operacion}** · Flujo: \`${meta.flujo}\`.`);
  lineas.push('');
  lineas.push('## 1. Resumen global');
  lineas.push('');
  lineas.push('| Métrica | Valor |');
  lineas.push('| :--- | ---: |');
  lineas.push(`| Tareas totales | **${total}** |`);
  lineas.push(`| Hechas con evidencia | **${hechas}** |`);
  lineas.push(`| En curso | **${enCurso}** |`);
  lineas.push(`| Declaradas sin evidencia | **${declaradas}** |`);
  lineas.push(`| Pendientes | **${pendientes}** |`);
  lineas.push(`| Avance verificado | **${pct(hechas, total)} %** ${bar(hechas, total)} |`);
  lineas.push(
    `| Avance con declaradas | **${pct(hechas + declaradas, total)} %** ${bar(
      hechas + declaradas,
      total
    )} |`
  );
  lineas.push('');
  lineas.push(
    '> `Declarado` significa que el tablero anterior lo daba por certificado, pero no hay PR, commit ni salida de test reproducible. **No cuenta como hecho.**'
  );
  lineas.push('');
  lineas.push('## 2. Resumen por sprint');
  lineas.push('');
  lineas.push('| Sprint | Tareas | Hechas | En curso | Declaradas | Pendientes | Avance verificado |');
  lineas.push('| :--- | ---: | ---: | ---: | ---: | ---: | :--- |');

  for (const sprint of Object.keys(SPRINTS).map(Number)) {
    const delSprint = ordenadas.filter((t) => t.sprint === sprint);
    if (!delSprint.length) continue;
    const h = delSprint.filter((t) => t.estado === 'done').length;
    const c = delSprint.filter((t) => t.estado === 'in_progress').length;
    const d = delSprint.filter((t) => t.estado === 'declared').length;
    const p = delSprint.filter((t) => t.estado === 'pending').length;
    lineas.push(
      `| **Sprint ${sprint}** — ${SPRINTS[sprint]} | ${delSprint.length} | ${h} | ${c} | ${d} | ${p} | **${pct(
        h,
        delSprint.length
      )} %** ${bar(h, delSprint.length)} |`
    );
  }

  lineas.push('');
  lineas.push('## 3. Detalle por sprint');
  lineas.push('');

  for (const sprint of Object.keys(SPRINTS).map(Number)) {
    const delSprint = ordenadas.filter((t) => t.sprint === sprint);
    if (!delSprint.length) continue;
    lineas.push(`### Sprint ${sprint} — ${SPRINTS[sprint]}`);
    lineas.push('');
    lineas.push('| ID | Tarea | Responsable | Estado | Evidencia |');
    lineas.push('| :--- | :--- | :--- | :---: | :--- |');
    for (const t of delSprint) {
      lineas.push(
        `| **${esc(t.id)}** | ${esc(t.titulo)} | ${esc(t.responsable)} | ${
          ESTADOS[t.estado].label
        } | ${esc(t.evidencia)} |`
      );
    }
    lineas.push('');
  }

  lineas.push('## 4. Cómo regenerar');
  lineas.push('');
  lineas.push('```bash');
  lineas.push('node scripts/gen-progress.mjs');
  lineas.push('node scripts/gen-progress.mjs --check');
  lineas.push('```');
  lineas.push('');
  lineas.push(
    'El segundo comando falla si este archivo no coincide con `backlog.yaml`; sirve para CI.'
  );
  lineas.push('');
  lineas.push(
    `_Total: ${total} tareas · ${hechas} hechas · ${enCurso} en curso · ${declaradas} declaradas · ${pendientes} pendientes._`
  );
  lineas.push('');

  return lineas.join('\n');
}

function main() {
  if (!existsSync(BACKLOG)) {
    console.error(`No existe el backlog: ${BACKLOG}`);
    process.exit(1);
  }

  const { meta, tareas } = parseBacklog(readFileSync(BACKLOG, 'utf8'));
  validate(tareas);
  const output = build(meta, tareas);
  const check = process.argv.includes('--check');

  if (check) {
    const actual = existsSync(OUTPUT)
      ? readFileSync(OUTPUT, 'utf8').replace(/\r\n/g, '\n')
      : '';
    if (actual !== output) {
      console.error('PROGRESO-ACTUAL.md está desactualizado. Ejecuta: node scripts/gen-progress.mjs');
      process.exit(1);
    }
    console.log('PROGRESO-ACTUAL.md está al día.');
    return;
  }

  writeFileSync(OUTPUT, output, 'utf8');
  console.log(`Generado ${OUTPUT} con ${tareas.length} tareas.`);
}

main();
