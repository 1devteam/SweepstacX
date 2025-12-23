import { readJSON, ensureDir, writeText } from '../utils/fs.js';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CACHE_FILE = '.sweepstacx/scan.json';

async function getPatchableIssues() {
  const scan = await readJSON(CACHE_FILE);
  if (!scan) throw new Error('No scan cache found. Run `sweepstacx scan` first.');

  // group issues by file, only handle unused_import
  const byFile = new Map();
  for (const issue of scan.issues) {
    if (issue.type !== 'unused_import') continue;
    // FIX: Use 'symbol' property as defined in scan.js, not 'token'
    if (!byFile.has(issue.file)) byFile.set(issue.file, []);
    byFile.get(issue.file).push(issue.symbol);
  }
  return { byFile, root: scan.root };
}

async function processFilePatch(relPath, tokens, root, apply, dryRun, counter) {
  const absPath = join(root, relPath);
  let original;
  try {
    original = await readFile(absPath, 'utf8');
  } catch {
    return null; // skip missing files
  }

  const { modified, edits } = removeUnusedImports(original, tokens);
  if (edits.length === 0 || modified === original) return null;

  const diffName = `patches/patch-${String(counter).padStart(3, '0')}.diff`;
  await writeText(diffName, makePseudoDiff(relPath, original, modified, edits));

  if (apply && !dryRun) {
    await writeFile(absPath, modified, 'utf8');
  }

  return { file: relPath, edits, diff: diffName };
}

export default async function patchCmd({ apply = false, dryRun = false }) {
  const { byFile, root } = await getPatchableIssues();
  await ensureDir('patches');

  const changes = [];
  let counter = 1;

  for (const [relPath, tokens] of byFile.entries()) {
    const change = await processFilePatch(relPath, tokens, root, apply, dryRun, counter);
    if (change) {
      changes.push(change);
      counter++;
    }
  }

  if (!changes.length) {
    console.log('No patchable issues detected in this pass (v0.1).');
    return;
  }

  console.log(`Generated ${changes.length} patch file(s) in ./patches`);
  if (apply) {
    if (dryRun) {
      console.log('[dry-run] Would modify:', changes.map(c => c.file).join(', '));
    } else {
      console.log('Applied edits directly to files (revert with git checkout or git reset --hard).');
    }
  }
}

// --- helpers ---

function processImportLine(line, tokensToRemove) {
  const importRe = /^(\s*)import\s+(.+?)\s+from\s+(['"][^'"]+['"]);?\s*$/;
  const m = line.match(importRe);
  if (!m) return { modifiedLine: line, removedTokens: [], isRemoved: false };

  const indent = m[1] || '';
  const spec = m[2].trim();
  const fromPart = m[3];

  const result = parseImportSpec(spec);
  if (!result) return { modifiedLine: line, removedTokens: [], isRemoved: false };

  const removedTokens = [];

  for (const t of tokensToRemove) {
    if (result.default === t) { result.default = null; removedTokens.push(t); }
    if (result.namespace === t) { result.namespace = null; removedTokens.push(t); }
    const beforeLen = result.named.length;
    result.named = result.named.filter(n => n.local !== t);
    if (result.named.length !== beforeLen) removedTokens.push(t);
  }

  if (!removedTokens.length) return { modifiedLine: line, removedTokens: [], isRemoved: false };

  const rebuilt = buildImportLine(indent, result, fromPart);

  if (rebuilt === null) {
    return { modifiedLine: null, removedTokens, isRemoved: true };
  }

  return { modifiedLine: rebuilt, removedTokens, isRemoved: false };
}

function removeUnusedImports(source, tokensToRemove) {
  const lines = source.split('\n');
  const edits = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const { modifiedLine, removedTokens, isRemoved } = processImportLine(line, tokensToRemove);

    if (removedTokens.length === 0) continue;

    if (isRemoved) {
      lines.splice(i, 1);
      i--; // Adjust index since a line was removed
      edits.push({ line: i + 2, action: 'remove-line', tokens: removedTokens });
      continue;
    }

    lines[i] = modifiedLine;
    edits.push({ line: i + 1, action: 'edit-line', tokens: removedTokens });
  }

  return { modified: lines.join('\n'), edits };
}

function parseImportSpec(spec) {
  let rest = spec;
  let def = null;
  let ns = null;
  const named = [];

  if (!rest.startsWith('{') && !rest.startsWith('*')) {
    const parts = rest.split(',');
    def = parts.shift()?.trim() || null;
    rest = parts.join(',').trim();
  }

  {
    const m = rest.match(/\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
    if (m) ns = m[1];
  }

  {
    const m = rest.match(/\{([\s\S]*?)\}/);
    if (m) {
      const inner = m[1].split(',').map(s => s.trim()).filter(Boolean);
      for (const seg of inner) {
        const m2 =
          seg.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)$/) ||
          seg.match(/^([A-Za-z_$][A-Za-z0-9_$]*)$/);
        if (!m2) continue;
        const imported = m2[2] ? m2[1] : m2[1];
        const local = m2[2] ? m2[2] : m2[1];
        named.push({ imported, local });
      }
    }
  }

  if (!def && !ns && named.length === 0) return null;
  return { default: def, namespace: ns, named };
}

function buildImportLine(indent, parts, fromPart) {
  const segments = [];
  if (parts.default) segments.push(parts.default);
  if (parts.namespace) segments.push(`* as ${parts.namespace}`);
  if (parts.named.length) {
    const inner = parts.named
      .map(n => (n.imported === n.local ? n.local : `${n.imported} as ${n.local}`))
      .join(', ');
    segments.push(`{ ${inner} }`);
  }
  if (!segments.length) return null;
  return `${indent}import ${segments.join(', ')} from ${fromPart};`;
}

function makePseudoDiff(relPath, before, after, edits) {
  const header = [
    `diff -- (preview) ${relPath}`,
    `--- a/${relPath}`,
    `+++ b/${relPath}`,
    `# Edits: ${edits.map(e => `${e.action}@${e.line}[${e.tokens.join('|')}]`).join(', ')}`
  ].join('\n');
  return [header, '@@ ORIGINAL @@', before, '@@ MODIFIED @@', after, ''].join('\n');
}
