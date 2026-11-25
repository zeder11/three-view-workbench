#!/usr/bin/env node
/**
 * Cross-Agent Installer for Three-View Workbench Skill (v0.8.0)
 * - Requires explicit --target
 * - Rejects source==target overlap
 * - Refuses to overwrite existing installs without --upgrade
 * - On --upgrade: preserves existing config.local.json (unless overridden by CLI flags),
 *   stages completely before swap, and retains a recoverable backup directory.
 *
 * Usage:
 *   node scripts/install.mjs --target codex|antigravity|agents|dsh[,...] [--upgrade] [--html <v0.8.0-html>] [--channel <msedge|chromium>]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_SRC = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SKILL_SRC, '..', '..');
const SKILL_NAME = 'three-view-workbench';
const PINNED_V080_SHA256 = 'B7F002932BC9841BC61491AA2E757999B601C7E24F3B0F8D35CA28786AF6C569';

const COPY_ITEMS = [
  'SKILL.md',
  'README.md',
  'agents',
  'references',
  'scripts',
  'examples'
];

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').toUpperCase();
}

function normPath(p) {
  const abs = path.resolve(p);
  const real = fs.existsSync(abs) ? fs.realpathSync(abs) : abs;
  return process.platform === 'win32' ? real.toLowerCase() : real;
}

function isSameOrNested(a, b) {
  const na = normPath(a);
  const nb = normPath(b);
  if (na === nb) return true;
  const relAB = path.relative(na, nb);
  const relBA = path.relative(nb, na);
  return (!relAB.startsWith('..') && !path.isAbsolute(relAB))
    || (!relBA.startsWith('..') && !path.isAbsolute(relBA));
}

function resolveDefaultHtml() {
  const candidates = [
    process.env.TVW_WORKBENCH_HTML,
    path.join(REPO_ROOT, 'app', 'three-view-workbench.html'),
    path.join(REPO_ROOT, '发布包', 'v0.8.0', 'app', 'three-view-workbench.html'),
    path.join(process.cwd(), 'app', 'three-view-workbench.html'),
    path.join(process.cwd(), '发布包', 'v0.8.0', 'app', 'three-view-workbench.html')
  ].filter(Boolean).map(p => path.resolve(p));
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function usage() {
  console.error([
    'Usage:',
    '  node scripts/install.mjs --target <codex|antigravity|agents|dsh[,...]> [--upgrade] [--html <v0.8.0-html>] [--channel <msedge|chromium>] [--allow-unpinned]',
    '',
    'Notes:',
    '  - --target is required explicitly (no silent multi-directory default).',
    '  - Pass --upgrade when updating an existing installation (preserves config.local.json and keeps a recoverable backup).'
  ].join('\n'));
  process.exit(2);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const targets = [];
  let htmlPath = resolveDefaultHtml();
  let htmlExplicit = false;
  let browserChannel = process.env.TVW_BROWSER_CHANNEL || 'msedge';
  let channelExplicit = false;
  let upgrade = false;
  let allowUnpinned = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      targets.push(...args[++i].split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
    } else if (args[i] === '--html' && args[i + 1]) {
      htmlPath = path.resolve(args[++i]);
      htmlExplicit = true;
    } else if (args[i] === '--channel' && args[i + 1]) {
      browserChannel = args[++i];
      channelExplicit = true;
    } else if (args[i] === '--upgrade') {
      upgrade = true;
    } else if (args[i] === '--allow-unpinned') {
      allowUnpinned = true;
    } else {
      usage();
    }
  }
  if (!targets.length) usage();
  return { targets, htmlPath, htmlExplicit, browserChannel, channelExplicit, upgrade, allowUnpinned };
}

function detectPlaywrightPath() {
  const candidates = [
    process.env.PLAYWRIGHT_PATH,
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@playwright', 'mcp', 'node_modules', 'playwright')
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

function resolveTargetDirs(targets) {
  const home = os.homedir();
  const map = {
    codex: path.join(home, '.codex', 'skills', SKILL_NAME),
    antigravity: path.join(home, '.gemini', 'config', 'skills', SKILL_NAME),
    agents: path.join(home, '.agents', 'skills', SKILL_NAME),
    dsh: path.join(home, '.dsh', 'skills', SKILL_NAME)
  };
  const chosen = new Map();
  for (const t of targets) {
    if (map[t]) {
      chosen.set(t, map[t]);
    } else {
      console.error(`Error: unknown target "${t}". Expected explicit targets from: codex, antigravity, agents, dsh.`);
      process.exit(2);
    }
  }
  return chosen;
}

function readExistingConfig(destDir) {
  const cfgPath = path.join(destDir, 'config.local.json');
  if (!fs.existsSync(cfgPath)) return {};
  try {
    const obj = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
}

function resolveEffectiveConfig(destDir, baseConfig, opts) {
  if (!fs.existsSync(destDir)) return { ...baseConfig };
  const prev = readExistingConfig(destDir);
  return {
    ...prev,
    ...(opts.htmlExplicit || !prev.workbenchHtml ? { workbenchHtml: baseConfig.workbenchHtml } : {}),
    ...(opts.channelExplicit || !prev.browserChannel ? { browserChannel: baseConfig.browserChannel } : {}),
    ...(!prev.playwrightPath && baseConfig.playwrightPath ? { playwrightPath: baseConfig.playwrightPath } : {})
  };
}

function validateWorkbenchHtml(htmlPath, allowUnpinned, targetLabel) {
  if (!htmlPath || !fs.existsSync(htmlPath)) {
    throw new Error(`Workbench HTML not found for target "${targetLabel}" at ${htmlPath}. Pass --html <path-to-v0.8.0-html>.`);
  }
  const hash = sha256File(htmlPath);
  if (hash !== PINNED_V080_SHA256 && !allowUnpinned) {
    throw new Error(`HTML SHA-256 mismatch for target "${targetLabel}" (${htmlPath}: got ${hash}, expected pinned v0.8.0 ${PINNED_V080_SHA256}). Pass --html <path-to-v0.8.0-html> to update it, or --allow-unpinned to override.`);
  }
  return hash;
}

function stageAndSwapSkill(destDir, effectiveConfig, opts) {
  if (isSameOrNested(SKILL_SRC, destDir)) {
    throw new Error(`Refusing to install: source (${SKILL_SRC}) and target (${destDir}) are identical or nested.`);
  }
  const hadExisting = fs.existsSync(destDir);
  if (hadExisting && !opts.upgrade) {
    throw new Error(`Destination already exists: ${destDir}. Pass --upgrade to update while preserving config.local.json and keeping a backup.`);
  }

  const parentDir = path.dirname(destDir);
  fs.mkdirSync(parentDir, { recursive: true });
  const suffix = `${process.pid}-${Date.now()}`;
  const stagingDir = path.join(parentDir, `.${SKILL_NAME}.staging-${suffix}`);
  const backupDir = path.join(parentDir, `.${SKILL_NAME}.backup-${suffix}`);

  try {
    fs.mkdirSync(stagingDir, { recursive: true });
    for (const item of COPY_ITEMS) {
      const src = path.join(SKILL_SRC, item);
      if (!fs.existsSync(src)) continue;
      fs.cpSync(src, path.join(stagingDir, item), { recursive: true });
    }
    for (const stray of ['.selftest-out', '.preview-tmp']) {
      fs.rmSync(path.join(stagingDir, stray), { recursive: true, force: true });
    }
    fs.writeFileSync(path.join(stagingDir, 'config.local.json'), JSON.stringify(effectiveConfig, null, 2) + '\n', 'utf8');

    if (!fs.existsSync(path.join(stagingDir, 'SKILL.md')) || !fs.existsSync(path.join(stagingDir, 'scripts', 'tvw.mjs'))) {
      throw new Error('Staged skill bundle failed integrity check (missing SKILL.md or scripts/tvw.mjs).');
    }

    if (hadExisting) {
      fs.renameSync(destDir, backupDir);
    }
    try {
      fs.renameSync(stagingDir, destDir);
    } catch (swapErr) {
      if (hadExisting && fs.existsSync(backupDir) && !fs.existsSync(destDir)) {
        fs.renameSync(backupDir, destDir);
      }
      throw swapErr;
    }
    return {
      path: destDir,
      upgraded: hadExisting,
      backupPath: hadExisting ? backupDir : null,
      config: effectiveConfig
    };
  } catch (err) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
    throw err;
  }
}

function main() {
  const opts = parseArgs(process.argv);
  const baseConfig = {
    workbenchHtml: opts.htmlPath,
    ...(detectPlaywrightPath() ? { playwrightPath: detectPlaywrightPath() } : {}),
    browserChannel: opts.browserChannel
  };

  const targetDirs = resolveTargetDirs(opts.targets);
  const plan = [];

  // Pre-validate EVERY target (path safety, --upgrade requirement, and post-merge HTML SHA-256) before modifying anything
  for (const [name, dir] of targetDirs.entries()) {
    if (isSameOrNested(SKILL_SRC, dir)) {
      console.error(`Error: source (${SKILL_SRC}) and target (${dir}) are identical or nested. Aborting.`);
      process.exit(2);
    }
    if (fs.existsSync(dir) && !opts.upgrade) {
      console.error(`Error: destination already exists (${dir}). Re-run with --upgrade to preserve config.local.json and keep a backup.`);
      process.exit(2);
    }
    const effectiveConfig = resolveEffectiveConfig(dir, baseConfig, opts);
    let effectiveHash;
    try {
      effectiveHash = validateWorkbenchHtml(effectiveConfig.workbenchHtml, opts.allowUnpinned, name);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    }
    plan.push({ name, dir, effectiveConfig, effectiveHash });
  }

  const installed = [];
  for (const { name, dir, effectiveConfig, effectiveHash } of plan) {
    const info = stageAndSwapSkill(dir, effectiveConfig, opts);
    installed.push({ target: name, workbenchSha256: effectiveHash, ...info });
  }

  console.log(JSON.stringify({
    ok: true,
    skill: SKILL_NAME,
    installed
  }, null, 2));
}

main();
