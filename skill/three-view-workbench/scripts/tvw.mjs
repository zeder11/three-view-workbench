#!/usr/bin/env node
/**
 * Three-View Workbench Skill CLI (v0.1 MVP, pinned to workbench v0.8.0)
 * Commands:
 *   node tvw.mjs check  <candidate.json> [--out <dir>] [--html <path>]
 *   node tvw.mjs render <candidate.json> --out <dir> [--html <path>]
 *
 * Offline-only: blocks external network requests, never forges user confirmations,
 * exports a formal orthographic-workbench JSON and verifies round-trip import in a
 * fresh blank workbench context.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const PINNED_V080_SHA256 = 'B7F002932BC9841BC61491AA2E757999B601C7E24F3B0F8D35CA28786AF6C569';

function loadLocalConfig() {
  const cfgPath = path.join(SKILL_ROOT, 'config.local.json');
  if (!fs.existsSync(cfgPath)) return {};
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  } catch (err) {
    console.error(`Error: invalid JSON in ${cfgPath}: ${err.message}`);
    process.exit(2);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error(`Error: ${cfgPath} must contain a JSON object.`);
    process.exit(2);
  }
  for (const key of ['workbenchHtml', 'playwrightPath', 'browserChannel']) {
    if (parsed[key] !== undefined && (typeof parsed[key] !== 'string' || !parsed[key].trim())) {
      console.error(`Error: invalid "${key}" in ${cfgPath}: expected a non-empty string.`);
      process.exit(2);
    }
  }
  return parsed;
}

const LOCAL_CONFIG = loadLocalConfig();

function resolveDefaultHtml() {
  const candidates = [
    process.env.TVW_WORKBENCH_HTML,
    LOCAL_CONFIG.workbenchHtml,
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

const DEFAULT_HTML = resolveDefaultHtml();

function usage() {
  console.error([
    'Usage:',
    '  node tvw.mjs check  <candidate.json> [--out <dir>] [--section <V|H|W> [--section-pos <0..100> | --section-world <coord>] [--section-reverse]] [--probe "x,y,z;..."] [--centerlines] [--html <path>] [--allow-unpinned]',
    '  node tvw.mjs render <candidate.json> --out <dir>   [--section <V|H|W> [--section-pos <0..100> | --section-world <coord>] [--section-reverse]] [--probe "x,y,z;..."] [--compare <source.png>] [--centerlines] [--dxf] [--html <path>] [--allow-unpinned]',
    '  node tvw.mjs diff   <before.workbench.json> <after.workbench.json> [--out <dir>]',
    '',
    'Verification & export options (optional):',
    '  --section <V|H|W>        Generate A-A full section (V: fixed Y, W: fixed X, H: fixed Z)',
    '  --section-pos <0..100>   Cut plane position in workbench coordinates 0..100 (default: 50, center)',
    '  --section-world <coord>  Cut plane position in candidate world coordinates (auto-converted to 0..100)',
    '  --section-reverse        Reverse viewing direction along the cut axis',
    '  --probe "x,y,z;..."      Query point-in-solid (solid/void/surface + CSG implicit field) in candidate world coordinates',
    '  --compare <source.png>   Compose side-by-side compare.png (source drawing vs rendered sheet.png) during render',
    '  --centerlines            Enable workbench centerlines before capturing sheet.png and OQA inspection',
    '  --dxf                    Export three-view DXF (and section DXF when --section is set) during render',
    '',
    'Environment:',
    '  TVW_WORKBENCH_HTML   Default path to three-view-workbench.html (v0.8.0)',
    '  PLAYWRIGHT_PATH      Optional path to Playwright package',
    '  TVW_BROWSER_CHANNEL  Browser channel (default: msedge; use "chromium" for bundled Chromium)'
  ].join('\n'));
  process.exit(2);
}

function parseProbes(spec) {
  const pts = [];
  for (const raw of String(spec).split(';').map(s => s.trim()).filter(Boolean)) {
    const rawParts = raw.split(',').map(s => s.trim());
    if (rawParts.length !== 3 || rawParts.some(s => s === '')) {
      console.error(`Error: invalid --probe point "${raw}". All three coordinates "x,y,z" must be explicitly provided.`);
      process.exit(2);
    }
    const parts = rawParts.map(Number);
    if (parts.some(n => !Number.isFinite(n))) {
      console.error(`Error: invalid --probe point "${raw}". Expected finite numbers "x,y,z".`);
      process.exit(2);
    }
    pts.push(parts);
  }
  if (!pts.length) {
    console.error('Error: --probe requires at least one "x,y,z" point.');
    process.exit(2);
  }
  return pts;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0];
  if (!['check', 'render', 'diff'].includes(cmd)) usage();

  if (cmd === 'diff') {
    const beforePath = args[1];
    const afterPath = args[2];
    if (!beforePath || !afterPath || beforePath.startsWith('--') || afterPath.startsWith('--')) usage();
    let outDir = null;
    for (let i = 3; i < args.length; i++) {
      if (args[i] === '--out' && args[i + 1]) outDir = path.resolve(args[++i]);
      else usage();
    }
    return { cmd, beforePath: path.resolve(beforePath), afterPath: path.resolve(afterPath), outDir };
  }

  const input = args[1];
  if (!input || input.startsWith('--')) usage();
  let outDir = null;
  let htmlPath = process.env.TVW_WORKBENCH_HTML ? path.resolve(process.env.TVW_WORKBENCH_HTML) : DEFAULT_HTML;
  let allowUnpinned = false;
  let sectionView = null;
  let sectionPos = 50;
  let sectionPosSet = false;
  let sectionWorld = null;
  let sectionReverse = false;
  let exportDxf = false;
  let centerlines = false;
  let probes = [];
  let comparePath = null;
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) outDir = path.resolve(args[++i]);
    else if (args[i] === '--html' && args[i + 1]) htmlPath = path.resolve(args[++i]);
    else if (args[i] === '--allow-unpinned') allowUnpinned = true;
    else if (args[i] === '--dxf') exportDxf = true;
    else if (args[i] === '--centerlines') centerlines = true;
    else if (args[i] === '--probe' && args[i + 1]) probes.push(...parseProbes(args[++i]));
    else if (args[i] === '--compare' && args[i + 1]) comparePath = path.resolve(args[++i]);
    else if (args[i] === '--section' && args[i + 1]) {
      const v = String(args[++i]).toUpperCase();
      if (!['V', 'H', 'W'].includes(v)) {
        console.error(`Error: --section must be V, H, or W (got "${v}")`);
        process.exit(2);
      }
      sectionView = v;
    } else if (args[i] === '--section-pos' && args[i + 1]) {
      const raw = String(args[++i]).trim();
      const p = raw === '' ? NaN : Number(raw);
      if (!Number.isFinite(p) || p < 0 || p > 100) {
        console.error(`Error: --section-pos must be a non-empty number in 0..100 (got "${args[i]}")`);
        process.exit(2);
      }
      sectionPos = Number(p.toFixed(1));
      sectionPosSet = true;
    } else if (args[i] === '--section-world' && args[i + 1]) {
      const raw = String(args[++i]).trim();
      const w = raw === '' ? NaN : Number(raw);
      if (!Number.isFinite(w)) {
        console.error(`Error: --section-world must be a non-empty finite number (got "${args[i]}")`);
        process.exit(2);
      }
      sectionWorld = w;
    } else if (args[i] === '--section-reverse') {
      sectionReverse = true;
    } else usage();
  }
  if (cmd === 'render' && !outDir) {
    console.error('Error: render requires --out <dir>');
    process.exit(2);
  }
  if (exportDxf && cmd !== 'render') {
    console.error('Error: --dxf is only supported with render');
    process.exit(2);
  }
  if (comparePath && cmd !== 'render') {
    console.error('Error: --compare is only supported with render');
    process.exit(2);
  }
  if (sectionPosSet && sectionWorld !== null) {
    console.error('Error: --section-pos and --section-world are mutually exclusive');
    process.exit(2);
  }
  if ((sectionPosSet || sectionWorld !== null || sectionReverse) && !sectionView) {
    console.error('Error: --section-pos, --section-world, and --section-reverse require --section <V|H|W>');
    process.exit(2);
  }
  return { cmd, input: path.resolve(input), outDir, htmlPath, allowUnpinned, sectionView, sectionPos, sectionWorld, sectionReverse, exportDxf, centerlines, probes, comparePath };
}

function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_PATH,
    LOCAL_CONFIG.playwrightPath,
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@playwright', 'mcp', 'node_modules', 'playwright'),
    'playwright'
  ].filter(Boolean);
  for (const p of candidates) {
    try { return require(p); } catch {}
  }
  throw new Error('Could not locate Playwright. Set PLAYWRIGHT_PATH or install playwright.');
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}

async function createOfflineContext(browser, viewport = { width: 1536, height: 900 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const externalRequests = [];
  await ctx.route('**/*', route => {
    const url = route.request().url();
    if (/^(file:|data:|blob:|about:)/i.test(url)) return route.continue();
    externalRequests.push(url);
    return route.abort('blockedbyclient');
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('dialog', d => d.accept());
  return { ctx, page, externalRequests, pageErrors };
}

function buildMarkdownReport(res) {
  const lines = [];
  lines.push(`# Three-View Workbench 离线核对报告`);
  lines.push('');
  lines.push(`- **综合状态**：\`${res.status}\`${res.needsReview ? '（需人工核对或修正，不可直接当终稿）' : '（本机核验全过，仍请对照原图确认）'}`);
  if (res.reviewReasons?.length) {
    lines.push(`- **待核对／拦截原因**：${res.reviewReasons.join('；')}`);
  }
  lines.push(`- **输入候选**：\`${path.basename(res.input)}\``);
  lines.push(`- **工作台基线**：v${res.compatibility.version || 'unknown'}（SHA-256 \`${res.compatibility.htmlSha256.slice(0, 12)}…\`${res.compatibility.matchesPinnedV080 ? '，匹配 v0.8.0 锁定基线' : '，--allow-unpinned 非锁定基线'}）`);
  lines.push(`- **离线与错误**：外部网络请求 \`${res.networkRequests.length}\`，页面异常 \`${res.pageErrors.length}\``);
  lines.push('');

  lines.push('## 1. 本机几何与图面检查（不代表已对上题图）');
  lines.push('');
  const unitLabel = res.candidate.unit || '原单位';
  const act = res.candidate.health?.actual;
  const envStr = act && Number.isFinite(act.X) && Number.isFinite(act.Y) && Number.isFinite(act.Z)
    ? `${act.X.toFixed(2)} × ${act.Y.toFixed(2)} × ${act.Z.toFixed(2)} ${unitLabel}`
    : '未测得';
  lines.push(`- **候选编译与实测外包**：${res.candidate.ok ? '通过' : '失败'}（${res.candidate.shapeCount} 个工作台形体，实测外包 \`${envStr}\`，缩放 \`×${res.candidate.scale}\`）`);
  if (res.geoSummary) {
    const gs = res.geoSummary;
    const vClr = gs.vHiddenBottomClearance != null ? `主视最低虚线距底面 \`${gs.vHiddenBottomClearance} ${unitLabel}\`（水平虚线最大跨度 \`${gs.vMaxHorizontalHiddenSpan} ${unitLabel}\`）` : '主视无内部虚线';
    const wClr = gs.wHiddenBottomClearance != null ? `左视最低虚线距底面 \`${gs.wHiddenBottomClearance} ${unitLabel}\`` : '左视无内部虚线';
    lines.push(`- **全视图线条提示（原单位，仅供定位；若同时含通孔与盲孔，通孔触底会使最低虚线为 0，单孔深度须以过孔轴全剖与孔底两侧探针为准）**：${vClr}；${wClr}；通／盲孔提示 \`${gs.boreStates.length}\` 处${gs.boreStates.length ? `（${gs.boreStates.join('；')}）` : ''}`);
  }
  if (res.candidate.warnings.length) {
    lines.push(`- **格式提醒（${res.candidate.warnings.length}）**：${res.candidate.warnings.join('；')}`);
  }
  const findings = res.candidate.health?.findings || [];
  if (findings.length) {
    lines.push(`- **本机一致性检查发现（${findings.length}）**：`);
    for (const f of findings) lines.push(`  - [${f.severity}] \`${f.code}\`: ${f.text || JSON.stringify(f)}`);
  } else {
    lines.push('- **本机一致性检查**：未发现支持范围内的尺寸／孔段覆盖冲突（不代表与原图一致）。');
  }
  if (res.candidate.nearTangent?.length) {
    lines.push(`- **近相切提醒（${res.candidate.nearTangent.length}）**：`);
    for (const nt of res.candidate.nearTangent) {
      lines.push(`  - 第 ${nt.step} 步接点 ${nt.vertex}：偏角 ${nt.angleDeg.toFixed(3)}°（半径 ${nt.radius.toFixed(3)}）`);
    }
  }
  lines.push('');
  if (res.roundTrip.oqa?.rows?.length) {
    lines.push('| 检查域 | 级别 | 状态 | 依据 |');
    lines.push('| --- | --- | --- | --- |');
    for (const row of res.roundTrip.oqa.rows) {
      lines.push(`| ${row.nameZh} | ${row.level} | \`${row.state}\` | ${row.evidenceZh} |`);
    }
    lines.push('');
  }

  lines.push('## 2. 空白工作台重导验收（正式模型文件）');
  lines.push('');
  lines.push(`- **重导结果**：${res.roundTrip.ok ? '通过' : '失败'}（格式 \`orthographic-workbench\` v${res.roundTrip.formatVersion}，几何参数一致=${res.roundTrip.geometryMatches}，三视图逐视一致=${res.roundTrip.viewsMatch}）`);
  lines.push(`- **形体数 / 可编辑圆弧步骤**：${res.roundTrip.shapeCount} / ${res.roundTrip.editableArcSteps}`);
  lines.push(`- **单位与缩放保留**：单位 \`${res.roundTrip.restoredUnit || '未声明'}\`（一致=${res.roundTrip.unitMatches}），缩放 \`×${res.roundTrip.restoredScale}\`（一致=${res.roundTrip.scaleMatches}）`);
  lines.push(`- **未伪造确认态**：\`confirmedReadings\`=${res.roundTrip.forgedConfirmations === 0 ? '空（未代用户勾选）' : '异常'}，三视图路径数 \`${res.roundTrip.sheetPathCount}\``);
  if (res.roundTrip.views) {
    for (const v of ['V', 'H', 'W']) {
      const vd = res.roundTrip.views[v];
      if (!vd) continue;
      lines.push(`  - 视图 ${v}：外包 \`[${vd.bounds ? vd.bounds.map(n => n.toFixed(2)).join(', ') : 'none'}]\`，实线 ${vd.solidCount} 段，虚线 ${vd.hiddenCount} 段${vd.hiddenBounds ? `（虚线范围 \`[${vd.hiddenBounds.map(n => n.toFixed(2)).join(', ')}]\`）` : ''}`);
    }
  }
  if (res.section) {
    const worldPart = res.section.worldPosition != null ? ` / 世界坐标 ${res.section.axis} = ${res.section.worldPosition}` : '';
    lines.push(`- **A–A 全剖视图**：方向 \`${res.section.view}\`（固定 \`${res.section.axis} = ${res.section.position}\`${worldPart}${res.section.reverse ? '，反向观察' : ''}），剖面线 \`${res.section.hatchCount}\` 条，截断轮廓 \`${res.section.cutCount}\` 段，后方可见轮廓 \`${res.section.rearCount}\` 段${res.artifacts?.sectionPng ? '（已导出 `section.png`）' : ''}`);
  }
  if (res.probes?.length) {
    lines.push('- **几何点探针（`--probe`，原单位世界坐标；`solid`/`void`/`surface` 用于核对材料，隐式场值在棱角或布尔交界处不一定等于到最近表面的精确距离）**：');
    lines.push('  | 世界坐标 (X, Y, Z) | 工作台坐标 | 状态 | 隐式场值 (field) |');
    lines.push('  | --- | --- | --- | --- |');
    for (const p of res.probes) {
      lines.push(`  | \`(${p.world.join(', ')})\` | \`(${p.workbench.join(', ')})\` | \`${p.state}\` | \`${p.field ?? p.sdf}\` |`);
    }
  }
  if (res.dxf) {
    lines.push(`- **DXF 导出**：三视图 DXF \`${res.dxf.mainBytes} B\`（有效=${res.dxf.mainValid}）${res.dxf.sectionBytes ? ` · 全剖 DXF \`${res.dxf.sectionBytes} B\`（有效=${res.dxf.sectionValid}）` : ''}`);
  }
  if (res.artifacts?.comparePng) {
    lines.push('- **原图并排对照**：已合成 `compare.png`（左：原题图 · 右：工作台生成三视图）');
  }
  if (res.artifactHashes && Object.keys(res.artifactHashes).length) {
    lines.push('- **产物哈希绑定（SHA-256，防止旧图配新模型）**：');
    for (const [k, h] of Object.entries(res.artifactHashes)) {
      lines.push(`  - \`${k}\`: \`${h}\``);
    }
  }
  lines.push('');

  lines.push('## 3. 仍需对照原图核对（视觉与工程依据）');
  lines.push('');
  const ts = res.candidate.threeState || { confirmed: [], undecided: [], excluded: [] };
  lines.push(`- **三态依据统计**：已核验 \`${ts.confirmed.length}\` · 待确认 \`${ts.undecided.length}\` · 本步忽略 \`${ts.excluded.length}\``);
  if (res.candidate.questions?.length) {
    lines.push('- **开放问题（须用户确认）**：');
    for (const q of res.candidate.questions) lines.push(`  - [${q.id}] ${q.text}`);
  }
  if (ts.undecided.length) {
    lines.push('- **待确认项**：');
    for (const item of ts.undecided) {
      lines.push(`  - ${item.text}${item.meta ? `（${item.meta}）` : ''}`);
    }
  }
  if (ts.excluded.length) {
    lines.push('- **本步忽略项**：');
    for (const item of ts.excluded) lines.push(`  - ${item.text}`);
  }
  lines.push('- **人工／Agent 必查三项（对照原图）**：');
  lines.push('  1. **加料还是减料**：凸台、肋板与切口、凹槽方向是否与原图一致（防止把凸部误读为切口或把沉孔建成凸筒）。');
  lines.push('  2. **孔腔是否相通**：通孔、盲孔、阶梯孔及横向孔与竖孔交接是否连通、孔底止点是否准确（两等径垂直圆孔相贯在侧视也会呈斜线，须结合主视孔内有无多余弧线区分锥底与柱—柱相贯）。');
  lines.push('  3. **剖面哪里应有材料**：含沉孔、盲腔或内部台阶时，核对全剖图（`--section <V|H|W> [--section-pos <0..100>]`）中斜线材料区与留白孔腔是否与原图材料关系一致。');
  lines.push('- **交付约定**：本模型文件必须与本核对报告（`report.md` / `check-report.json`）成套交付；请结合三视图（`sheet.png`）、立体预览（`preview-3d.png`）及全剖图（如有 `section.png`）核对上述三项与未标明尺寸。');
  lines.push('');
  return lines.join('\n');
}

function normShapeForDiff(s) {
  const out = {};
  for (const k of Object.keys(s || {}).sort()) {
    if (k === 'id' || k === 'refKey') continue;
    const v = s[k];
    out[k] = typeof v === 'number' ? Number(v.toFixed(5)) : v;
  }
  return out;
}

function runDiff(opts) {
  if (!fs.existsSync(opts.beforePath)) throw new Error(`Before model not found: ${opts.beforePath}`);
  if (!fs.existsSync(opts.afterPath)) throw new Error(`After model not found: ${opts.afterPath}`);
  const before = JSON.parse(fs.readFileSync(opts.beforePath, 'utf8'));
  const after = JSON.parse(fs.readFileSync(opts.afterPath, 'utf8'));
  if (before.format !== 'orthographic-workbench' || after.format !== 'orthographic-workbench') {
    throw new Error('diff expects formal orthographic-workbench JSON files (e.g. *.workbench.json)');
  }
  const bShapes = before.shapes || [];
  const aShapes = after.shapes || [];
  const maxLen = Math.max(bShapes.length, aShapes.length);
  const unchangedSteps = [];
  const modifiedSteps = [];
  const addedSteps = [];
  const removedSteps = [];

  for (let i = 0; i < maxLen; i++) {
    const step = i + 1;
    if (i >= bShapes.length) {
      addedSteps.push({ step, type: aShapes[i].type, op: aShapes[i].op });
    } else if (i >= aShapes.length) {
      removedSteps.push({ step, type: bShapes[i].type, op: bShapes[i].op });
    } else {
      const nb = normShapeForDiff(bShapes[i]);
      const na = normShapeForDiff(aShapes[i]);
      if (JSON.stringify(nb) === JSON.stringify(na)) {
        unchangedSteps.push(step);
      } else {
        const keys = [...new Set([...Object.keys(nb), ...Object.keys(na)])].sort();
        const changedFields = {};
        for (const k of keys) {
          if (JSON.stringify(nb[k]) !== JSON.stringify(na[k])) {
            changedFields[k] = { before: nb[k], after: na[k] };
          }
        }
        modifiedSteps.push({ step, typeBefore: nb.type, typeAfter: na.type, opBefore: nb.op, opAfter: na.op, changedFields });
      }
    }
  }

  const afterConfirmed = Object.keys(after.meta?.confirmedReadings || {}).length + (after.meta?.consistency?.accepted ? 1 : 0);
  const diffRes = {
    ok: true,
    command: 'diff',
    before: {
      path: opts.beforePath,
      sha256: sha256File(opts.beforePath),
      formatVersion: before.version,
      shapeCount: bShapes.length,
      unit: before.meta?.unit || '',
      scale: before.meta?.scale ?? null
    },
    after: {
      path: opts.afterPath,
      sha256: sha256File(opts.afterPath),
      formatVersion: after.version,
      shapeCount: aShapes.length,
      unit: after.meta?.unit || '',
      scale: after.meta?.scale ?? null
    },
    summary: {
      unchangedSteps,
      modifiedSteps,
      addedSteps,
      removedSteps,
      unitChanged: (before.meta?.unit || '') !== (after.meta?.unit || ''),
      scaleChanged: Math.abs((before.meta?.scale ?? 0) - (after.meta?.scale ?? 0)) > 1e-4,
      forgedConfirmations: afterConfirmed
    }
  };

  if (opts.outDir) {
    fs.mkdirSync(opts.outDir, { recursive: true });
    const jsonPath = path.join(opts.outDir, 'diff-report.json');
    const mdPath = path.join(opts.outDir, 'diff-report.md');
    fs.writeFileSync(jsonPath, JSON.stringify(diffRes, null, 2), 'utf8');
    const md = [
      '# Three-View Workbench 修订前后对比（Diff）',
      '',
      `- **修订前**：\`${path.basename(opts.beforePath)}\`（SHA-256 \`${diffRes.before.sha256.slice(0, 12)}…\`，${diffRes.before.shapeCount} 步）`,
      `- **修订后**：\`${path.basename(opts.afterPath)}\`（SHA-256 \`${diffRes.after.sha256.slice(0, 12)}…\`，${diffRes.after.shapeCount} 步）`,
      `- **未改动步骤**：${unchangedSteps.length ? unchangedSteps.map(s => `第 ${s} 步`).join('、') : '无'}`,
      `- **修改步骤（${modifiedSteps.length}）**：${modifiedSteps.length ? modifiedSteps.map(m => `第 ${m.step} 步（${Object.keys(m.changedFields).join(', ')}）`).join('；') : '无'}`,
      `- **新增步骤（${addedSteps.length}）**：${addedSteps.length ? addedSteps.map(a => `第 ${a.step} 步 ${a.type}/${a.op}`).join('；') : '无'}`,
      `- **删除步骤（${removedSteps.length}）**：${removedSteps.length ? removedSteps.map(r => `第 ${r.step} 步 ${r.type}/${r.op}`).join('；') : '无'}`,
      `- **未伪造确认态**：\`forgedConfirmations=${afterConfirmed}\``,
      ''
    ].join('\n');
    fs.writeFileSync(mdPath, md, 'utf8');
    diffRes.artifacts = { diffReportJson: jsonPath, diffReportMd: mdPath };
  }
  console.log(JSON.stringify(diffRes, null, 2));
}

async function run() {
  const opts = parseArgs(process.argv);
  if (opts.cmd === 'diff') {
    runDiff(opts);
    return;
  }
  if (!fs.existsSync(opts.input)) throw new Error(`Input file not found: ${opts.input}`);
  if (!fs.existsSync(opts.htmlPath)) throw new Error(`Workbench HTML not found: ${opts.htmlPath}`);

  // Enforce v0.8.0 SHA-256 version lock BEFORE launching any browser
  const htmlSha256 = sha256File(opts.htmlPath);
  const matchesPinnedV080 = htmlSha256 === PINNED_V080_SHA256;
  if (!matchesPinnedV080 && !opts.allowUnpinned) {
    const errReport = {
      ok: false,
      pipelineOk: false,
      status: 'failed',
      needsReview: true,
      reviewReasons: [`Workbench HTML SHA-256 mismatch: expected pinned v0.8.0 (${PINNED_V080_SHA256}), got ${htmlSha256}. Pass --allow-unpinned only for deliberate compatibility testing.`],
      command: opts.cmd,
      input: opts.input,
      compatibility: { ok: false, version: null, htmlSha256, pinnedSha256: PINNED_V080_SHA256, matchesPinnedV080: false }
    };
    console.log(JSON.stringify(errReport, null, 2));
    process.exit(1);
  }

  const rawText = fs.readFileSync(opts.input, 'utf8');
  // Fail fast on invalid JSON syntax before launching browser
  JSON.parse(rawText);

  const { chromium } = loadPlaywright();
  const channel = process.env.TVW_BROWSER_CHANNEL || LOCAL_CONFIG.browserChannel || 'msedge';
  const launchOpts = channel === 'chromium' ? { headless: true } : { channel, headless: true };
  const browser = await chromium.launch(launchOpts);

  const allExternalRequests = [];
  const allPageErrors = [];

  try {
    // ---------------- Phase 1: Candidate preview & local checks ----------------
    const p1 = await createOfflineContext(browser);
    await p1.page.goto(pathToFileURL(opts.htmlPath).href, { waitUntil: 'load' });
    await p1.page.waitForFunction(() => window.__workbench && window.__workbench.getState().ready, { timeout: 30000 });

    const compat = await p1.page.evaluate(() => {
      const w = window.__workbench;
      const missing = [];
      if (!w) missing.push('__workbench');
      if (!w?.v080) missing.push('__workbench.v080');
      if (!w?.v080?.oqaKit) missing.push('v080.oqaKit');
      if (!w?.v080?.threeStateClassify) missing.push('v080.threeStateClassify');
      if (!w?.v080?.auditTangency) missing.push('v080.auditTangency');
      if (typeof AIK === 'undefined') missing.push('AIK');
      if (!document.getElementById('aipastejson')) missing.push('#aipastejson');
      if (!document.getElementById('file')) missing.push('#file');
      return { ok: missing.length === 0, version: w?.v080?.version || null, missing };
    });
    if (!compat.ok) {
      throw new Error(`Workbench v0.8.0 compatibility check failed. Missing: ${compat.missing.join(', ')}`);
    }

    // Open AI drawer -> paste JSON -> run local candidate preview & health checks
    await p1.page.evaluate(() => {
      const tb = document.getElementById('tbtools'); if (tb) tb.open = true;
      const aiBtn = document.getElementById('aiopen'); if (aiBtn && document.getElementById('aidrawer')?.hidden) aiBtn.click();
      const ex = document.getElementById('aiexternal'); if (ex) ex.open = true;
      const dp = document.getElementById('aipaste'); if (dp) dp.open = true;
    });
    await p1.page.fill('#aipastejson', rawText);
    await p1.page.click('#aipastego');

    // Wait for either candidate result + health completion OR explicit #aierr
    await p1.page.waitForFunction(() => {
      const err = document.getElementById('aierr');
      if (err && !err.hidden && err.textContent.trim()) return true;
      const st = window.__workbench.ai.state();
      return st.hasResult && !st.busy && st.health && !st.health.pending;
    }, { timeout: 45000 });

    const candidateInfo = await p1.page.evaluate(() => {
      const errEl = document.getElementById('aierr');
      const errText = errEl && !errEl.hidden ? errEl.textContent.trim() : '';
      if (errText || !aiResult) {
        return { ok: false, error: errText || 'Candidate failed to load' };
      }
      const r = aiResult;
      const ts = window.__workbench.v080.threeStateClassify(r);
      // Detect near-tangent kinks on candidate sketches via DraftKit().joinInfo
      const nearTangent = [];
      if (typeof DraftKit === 'function') {
        const DK = DraftKit();
        const seen = new Set();
        r.model.forEach((sh, i) => {
          const d = sh.draft;
          if (!d || !d.arcs || !Object.keys(d.arcs).length) return;
          const gk = d.group || ('s:' + i);
          if (seen.has(gk)) return;
          seen.add(gk);
          try {
            for (const row of DK.joinInfo(d)) {
              const deg = row.angle * 180 / Math.PI;
              if (!row.tangent && deg < 5) {
                nearTangent.push({ step: i + 1, vertex: row.vertex, arc: row.arc, angleDeg: deg, radius: row.radius });
              }
            }
          } catch {}
        });
      }
      // Build formal importable workbench JSON WITHOUT forging user confirmations
      const modelShapes = JSON.parse(JSON.stringify(r.model));
      const formatVersion = modelShapes.some(s => s.type === 'retain') ? 6
        : modelShapes.some(s => s.draft?.constraints?.length) ? 5
        : modelShapes.some(s => s.type === 'extrude') ? 4 : 3;
      const formalMeta = {
        source: 'AI 候选（Skill 离线验证）',
        appliedAt: new Date().toISOString(),
        provider: 'skill-offline',
        model: '',
        round: r.round || 1,
        drawingType: AIK.drawingType(r.ctx?.drawingType),
        drawing: r.answer.drawing,
        unit: r.answer.unit || '',
        scale: Number(r.fit.scale.toFixed(6)),
        extent: Number(r.fit.extent.toFixed(3)),
        confirmedConditions: [],
        confirmedReadings: {},
        reviewAction: 'unreviewed-skill-candidate',
        readings: r.answer.readings,
        ...(r.answer.checks?.length ? { materialChecks: r.answer.checks } : {}),
        structures: r.answer.features || [],
        assumptions: r.answer.assumptions,
        unsupported: r.answer.unsupported,
        confidence: r.answer.confidence,
        notices: r.fit.notices,
        understanding: r.answer.understanding,
        originalShapes: r.answer.shapes,
        consistency: { report: r.health, accepted: false },
        note: '由 three-view-workbench skill 离线生成；未代替用户勾选任何确认项。'
      };
      const formalModel = {
        format: 'orthographic-workbench',
        version: formatVersion,
        shapes: modelShapes,
        meta: formalMeta
      };
      const editableArcSteps = modelShapes.filter(s => (s.type === 'extrude' && s.profile?.arcs && Object.keys(s.profile.arcs).length > 0) || (s.draft?.arcs && Object.keys(s.draft.arcs).length > 0)).length;
      const findingsWithText = (r.health?.findings || []).map(f => ({
        ...f,
        text: typeof aiHealthText === 'function' ? aiHealthText(f) : f.code
      }));
      // Extract candidate per-view projection summary from AI_PREVIEW.views for round-trip parity check
      const summarizeViews = (viewsObj) => {
        if (!viewsObj) return null;
        const out = {};
        for (const v of ['V', 'H', 'W']) {
          const d = viewsObj[v];
          if (!d) continue;
          let hBounds = null, hHorizMax = 0;
          for (const pl of d.hidden || []) {
            for (let i = 0; i < pl.length; i++) {
              const p = pl[i];
              if (!hBounds) hBounds = [p[0], p[1], p[0], p[1]];
              else {
                hBounds[0] = Math.min(hBounds[0], p[0]); hBounds[1] = Math.min(hBounds[1], p[1]);
                hBounds[2] = Math.max(hBounds[2], p[0]); hBounds[3] = Math.max(hBounds[3], p[1]);
              }
              if (i > 0) {
                const dx = Math.abs(p[0] - pl[i - 1][0]), dy = Math.abs(p[1] - pl[i - 1][1]);
                if (dy < 0.25 && dx > hHorizMax) hHorizMax = dx;
              }
            }
          }
          out[v] = {
            bounds: d.bounds ? d.bounds.slice() : null,
            solidCount: (d.solid || []).length,
            hiddenCount: (d.hidden || []).length,
            hiddenBounds: hBounds,
            maxHorizontalHiddenSpan: Number(hHorizMax.toFixed(3))
          };
        }
        return out;
      };
      const candidateViews = summarizeViews(typeof AI_PREVIEW !== 'undefined' ? AI_PREVIEW.views : null);
      return {
        ok: true,
        unit: r.answer.unit || '',
        scale: Number(r.fit.scale.toFixed(6)),
        sourceCenter: r.fit.source ? r.fit.source.map(n => Number(n.toFixed(6))) : [0, 0, 0],
        extent: Number(r.fit.extent.toFixed(3)),
        shapeCount: modelShapes.length,
        editableArcSteps,
        warnings: r.answer.warnings || [],
        questions: r.answer.questions || [],
        assumptions: r.answer.assumptions || [],
        unsupported: r.answer.unsupported || [],
        confidence: r.answer.confidence,
        health: { ...r.health, findings: findingsWithText },
        threeState: ts,
        nearTangent,
        candidateViews,
        formalModel
      };
    });

    allExternalRequests.push(...p1.externalRequests);
    allPageErrors.push(...p1.pageErrors);
    await p1.ctx.close();

    if (!candidateInfo.ok) {
      const failReport = {
        ok: false,
        pipelineOk: false,
        status: 'failed',
        needsReview: true,
        reviewReasons: [candidateInfo.error || 'Candidate failed validation'],
        input: opts.input,
        compatibility: { ...compat, htmlSha256, pinnedSha256: PINNED_V080_SHA256, matchesPinnedV080 },
        candidate: candidateInfo,
        roundTrip: { ok: false },
        networkRequests: allExternalRequests,
        pageErrors: allPageErrors
      };
      console.log(JSON.stringify(failReport, null, 2));
      process.exit(1);
    }

    // Write formal workbench JSON to temp or --out dir for blank-workbench re-import
    const baseName = path.basename(opts.input, path.extname(opts.input));
    const targetDir = opts.outDir || fs.mkdtempSync(path.join(osTmpDir(), 'tvw-'));
    fs.mkdirSync(targetDir, { recursive: true });
    const formalPath = path.join(targetDir, `${baseName}.workbench.json`);
    fs.writeFileSync(formalPath, JSON.stringify(candidateInfo.formalModel, null, 2), 'utf8');

    // ---------------- Phase 2: Fresh blank workbench round-trip import ----------------
    const p2 = await createOfflineContext(browser);
    await p2.page.goto(pathToFileURL(opts.htmlPath).href, { waitUntil: 'load' });
    await p2.page.waitForFunction(() => window.__workbench && window.__workbench.getState().ready, { timeout: 30000 });

    // Record pre-import model state (revision / snapshot) so we wait for a real post-import rebuild
    const beforeImport = await p2.page.evaluate(() => ({
      snap: JSON.stringify(window.__workbench.getShapes()),
      hasMeta: !!window.__workbench.ai.state().meta
    }));

    // Import formal model file through real #file input
    await p2.page.setInputFiles('#file', formalPath);
    await p2.page.waitForFunction(({ beforeSnap, wantCount }) => {
      const err = document.getElementById('errbar');
      if (err && !err.hidden) return true;
      const st = window.__workbench.getState();
      const curShapes = window.__workbench.getShapes();
      const curMeta = window.__workbench.ai.state().meta;
      const changed = JSON.stringify(curShapes) !== beforeSnap || !!curMeta;
      return changed && st.ready && !st.mesh?.busy && curShapes.length === wantCount && !!drawData;
    }, { beforeSnap: beforeImport.snap, wantCount: candidateInfo.shapeCount }, { timeout: 45000 });

    // Optional: enable centerlines before OQA & sheet screenshot when --centerlines is requested
    if (opts.centerlines) {
      await p2.page.evaluate(() => {
        const cl = document.getElementById('centerlines');
        if (cl && !cl.checked) cl.click();
      });
      await p2.page.waitForTimeout(250);
    }

    const roundTrip = await p2.page.evaluate((expected) => {
      const errBar = document.getElementById('errbar');
      const errVisible = !!(errBar && !errBar.hidden);
      const errText = errVisible ? (document.getElementById('errtext')?.textContent || '') : '';
      const loadedShapes = window.__workbench.getShapes();
      const meta = window.__workbench.ai.state().meta;
      const oqa = window.__workbench.v080.oqaKit().inspect();
      const editableArcSteps = loadedShapes.filter(s => (s.type === 'extrude' && s.profile?.arcs && Object.keys(s.profile.arcs).length > 0) || (s.draft?.arcs && Object.keys(s.draft.arcs).length > 0)).length;
      const sheetPathCount = document.querySelectorAll('#sheet svg path').length;
      const unitMatches = (meta?.unit || '') === expected.unit;
      const scaleMatches = !!(meta && Math.abs(meta.scale - expected.scale) <= 1e-4);
      const forgedConfirmations = Object.keys(meta?.confirmedReadings || {}).length + (meta?.consistency?.accepted ? 1 : 0);

      // Compare physical geometry parameters (ignoring volatile id/refKey)
      const normShape = (s) => {
        const out = {};
        for (const k of Object.keys(s).sort()) {
          if (k === 'id' || k === 'refKey') continue;
          const v = s[k];
          out[k] = typeof v === 'number' ? Number(v.toFixed(5)) : v;
        }
        return out;
      };
      const geometryMatches = loadedShapes.length === expected.shapes.length
        && loadedShapes.every((s, i) => JSON.stringify(normShape(s)) === JSON.stringify(normShape(expected.shapes[i])));

      // Per-view (V, H, W) bounds & hidden-line metrics
      const views = {};
      let viewsMatch = true;
      for (const v of ['V', 'H', 'W']) {
        const d = drawData?.[v];
        if (!d || !d.bounds || !(d.solid || []).length) { viewsMatch = false; continue; }
        let hBounds = null, hHorizMax = 0;
        for (const pl of d.hidden || []) {
          for (let i = 0; i < pl.length; i++) {
            const p = pl[i];
            if (!hBounds) hBounds = [p[0], p[1], p[0], p[1]];
            else {
              hBounds[0] = Math.min(hBounds[0], p[0]); hBounds[1] = Math.min(hBounds[1], p[1]);
              hBounds[2] = Math.max(hBounds[2], p[0]); hBounds[3] = Math.max(hBounds[3], p[1]);
            }
            if (i > 0) {
              const dx = Math.abs(p[0] - pl[i - 1][0]), dy = Math.abs(p[1] - pl[i - 1][1]);
              if (dy < 0.25 && dx > hHorizMax) hHorizMax = dx;
            }
          }
        }
        views[v] = {
          bounds: d.bounds.slice(),
          solidCount: (d.solid || []).length,
          hiddenCount: (d.hidden || []).length,
          hiddenBounds: hBounds,
          maxHorizontalHiddenSpan: Number(hHorizMax.toFixed(3))
        };
        const expV = expected.candidateViews?.[v];
        if (expV?.bounds) {
          const maxDelta = Math.max(...d.bounds.map((x, idx) => Math.abs(x - expV.bounds[idx])));
          if (maxDelta > 0.35) viewsMatch = false;
        }
      }

      const ok = !errVisible
        && loadedShapes.length === expected.shapeCount
        && geometryMatches
        && viewsMatch
        && !!meta
        && unitMatches
        && scaleMatches
        && editableArcSteps === expected.editableArcSteps
        && sheetPathCount >= 3
        && forgedConfirmations === 0;
      return {
        ok,
        errVisible,
        errText,
        formatVersion: expected.formatVersion,
        shapeCount: loadedShapes.length,
        editableArcSteps,
        geometryMatches,
        viewsMatch,
        views,
        restoredUnit: meta?.unit || '',
        restoredScale: meta?.scale ?? null,
        unitMatches,
        scaleMatches,
        forgedConfirmations,
        sheetPathCount,
        oqa
      };
    }, {
      shapeCount: candidateInfo.shapeCount,
      editableArcSteps: candidateInfo.editableArcSteps,
      unit: candidateInfo.unit,
      scale: candidateInfo.scale,
      formatVersion: candidateInfo.formalModel.version,
      shapes: candidateInfo.formalModel.shapes,
      candidateViews: candidateInfo.candidateViews
    });

    const artifacts = { formalModel: formalPath };
    if (opts.cmd === 'render') {
      const sheetPng = path.join(targetDir, 'sheet.png');
      const preview3dPng = path.join(targetDir, 'preview-3d.png');
      // Hide floating #toast so "模型已导入" never overlaps #sheet svg in viewport-clipped screenshot
      await p2.page.evaluate(() => { const t = document.getElementById('toast'); if (t) t.style.display = 'none'; });
      await p2.page.locator('#sheet svg').screenshot({ path: sheetPng });
      await p2.page.locator('#gl').screenshot({ path: preview3dPng });
      artifacts.sheetPng = sheetPng;
      artifacts.preview3dPng = preview3dPng;
    }

    // Optional Phase 2b: A-A full section on the re-imported formal model
    let sectionSummary = null;
    if (opts.sectionView && roundTrip.ok) {
      let resolvedPos = opts.sectionPos;
      if (opts.sectionWorld !== null) {
        const axisIdx = { W: 0, V: 1, H: 2 }[opts.sectionView];
        const rawPos = (opts.sectionWorld - candidateInfo.sourceCenter[axisIdx]) * candidateInfo.scale + 50;
        if (rawPos < 0 || rawPos > 100) {
          throw new Error(`--section-world ${opts.sectionWorld} maps to workbench ${rawPos.toFixed(2)}, outside 0..100`);
        }
        resolvedPos = Number(rawPos.toFixed(1));
      }
      await p2.page.evaluate(({ view, pos, reverse }) => {
        window.__workbench.section.open();
        const modeEl = document.getElementById('sectionmode');
        modeEl.value = 'full';
        modeEl.dispatchEvent(new Event('change', { bubbles: true }));
        const viewEl = document.getElementById('sectionview');
        viewEl.value = view;
        viewEl.dispatchEvent(new Event('change', { bubbles: true }));
        const numEl = document.getElementById('sectionnumber');
        numEl.value = String(pos);
        numEl.dispatchEvent(new Event('input', { bubbles: true }));
        if (reverse) {
          document.getElementById('sectionreverse')?.click();
        }
      }, { view: opts.sectionView, pos: resolvedPos, reverse: opts.sectionReverse });

      await p2.page.waitForFunction(({ view, pos, reverse }) => {
        const st = window.__workbench.section.state();
        const full = window.__v080SectionFull;
        return st.open && !st.busy && st.mode === 'full' && st.fullReady
          && st.view === view
          && Math.abs(st.position - pos) < 0.05
          && st.reverse === reverse
          && !!full && !!full.data
          && !!document.querySelector('#sectionfullfigure svg');
      }, { view: opts.sectionView, pos: resolvedPos, reverse: opts.sectionReverse }, { timeout: 45000 });

      sectionSummary = await p2.page.evaluate(({ worldPos }) => {
        const st = window.__workbench.section.state();
        const full = window.__v080SectionFull;
        const axis = { V: 'Y', W: 'X', H: 'Z' }[st.view];
        return {
          ok: true,
          view: st.view,
          axis,
          position: st.position,
          worldPosition: worldPos,
          reverse: st.reverse,
          refView: full.data.refView,
          hatchCount: (full.data.hatch || []).length,
          cutCount: (full.data.cut || []).length,
          rearCount: (full.data.rear || []).length,
          hasMaterial: (full.data.hatch || []).length > 0
        };
      }, { worldPos: opts.sectionWorld });

      if (opts.cmd === 'render') {
        const sectionPng = path.join(targetDir, 'section.png');
        await p2.page.locator('#sectionfullfigure svg').screenshot({ path: sectionPng });
        artifacts.sectionPng = sectionPng;
      }

      // Refresh OQA so the sections domain reflects the generated A-A full section
      roundTrip.oqa = await p2.page.evaluate(() => window.__workbench.v080.oqaKit().inspect());
    }

    // Optional Phase 2c: DXF export (three-view DXF + section DXF if --section was requested)
    let dxfSummary = null;
    if (opts.exportDxf && opts.cmd === 'render' && roundTrip.ok) {
      const dxfData = await p2.page.evaluate((hasSec) => {
        const kit = window.__workbench?.v080?.dxfKit?.();
        if (!kit) return { ok: false, error: 'dxfKit unavailable' };
        const mainText = kit.buildSheet();
        const sectionText = hasSec && window.__v080SectionFull
          ? kit.buildSheet({ ...window.__v080SectionFull, onlySection: true })
          : null;
        return { ok: true, mainText, sectionText };
      }, !!sectionSummary?.ok);
      if (!dxfData.ok) throw new Error(`DXF export failed: ${dxfData.error}`);
      const mainDxfPath = path.join(targetDir, `${baseName}.dxf`);
      fs.writeFileSync(mainDxfPath, dxfData.mainText, 'utf8');
      artifacts.dxf = mainDxfPath;
      const isValidDxf = (s) => typeof s === 'string' && s.includes('SECTION') && s.includes('ENTITIES') && s.includes('EOF');
      dxfSummary = {
        ok: isValidDxf(dxfData.mainText),
        mainValid: isValidDxf(dxfData.mainText),
        mainBytes: Buffer.byteLength(dxfData.mainText, 'utf8'),
        sectionValid: null,
        sectionBytes: 0
      };
      if (dxfData.sectionText) {
        const secDxfPath = path.join(targetDir, `${baseName}-section.dxf`);
        fs.writeFileSync(secDxfPath, dxfData.sectionText, 'utf8');
        artifacts.sectionDxf = secDxfPath;
        dxfSummary.sectionValid = isValidDxf(dxfData.sectionText);
        dxfSummary.sectionBytes = Buffer.byteLength(dxfData.sectionText, 'utf8');
        dxfSummary.ok = dxfSummary.ok && dxfSummary.sectionValid;
      }
    }

    if (opts.sectionView && roundTrip.ok) {
      await p2.page.evaluate(() => window.__workbench.section.close());
    }

    // Optional Phase 2d: Deterministic point-in-solid geometric probes (in candidate world coordinates)
    let probeResults = null;
    if (opts.probes?.length && roundTrip.ok) {
      probeResults = await p2.page.evaluate(({ probes, sourceCenter, scale }) => {
        const K = window.__workbench.kernel;
        const prep = K.prepare(window.__workbench.getShapes());
        return probes.map(([x, y, z]) => {
          const wb = [
            (x - sourceCenter[0]) * scale + 50,
            (y - sourceCenter[1]) * scale + 50,
            (z - sourceCenter[2]) * scale + 50
          ];
          const inside = K.modelInside(prep, wb);
          const fieldWb = K.modelField(prep, wb);
          const fieldWorld = fieldWb / scale;
          const state = Math.abs(fieldWorld) < 1e-3 ? 'surface' : (inside ? 'solid' : 'void');
          return {
            world: [x, y, z],
            workbench: wb.map(n => Number(n.toFixed(2))),
            state,
            inside,
            field: Number(fieldWorld.toFixed(4)),
            sdf: Number(fieldWorld.toFixed(4))
          };
        });
      }, { probes: opts.probes, sourceCenter: candidateInfo.sourceCenter, scale: candidateInfo.scale });
    }

    // Optional Phase 2e: Side-by-side visual comparison board (source drawing vs rendered sheet.png)
    if (opts.comparePath && opts.cmd === 'render' && artifacts.sheetPng) {
      if (!fs.existsSync(opts.comparePath)) {
        throw new Error(`--compare source image not found: ${opts.comparePath}`);
      }
      const mimeFor = (p) => {
        const ext = path.extname(p).toLowerCase();
        if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
        if (ext === '.webp') return 'image/webp';
        return 'image/png';
      };
      const srcDataUrl = `data:${mimeFor(opts.comparePath)};base64,${fs.readFileSync(opts.comparePath).toString('base64')}`;
      const dstDataUrl = `data:image/png;base64,${fs.readFileSync(artifacts.sheetPng).toString('base64')}`;
      const compareDataUrl = await p2.page.evaluate(async ({ srcUrl, dstUrl }) => {
        const load = (u) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; });
        const [a, b] = await Promise.all([load(srcUrl), load(dstUrl)]);
        const targetH = Math.max(720, Math.min(1100, Math.max(a.height, b.height)));
        const aw = Math.round(a.width * (targetH / a.height));
        const bw = Math.round(b.width * (targetH / b.height));
        const pad = 20, headerH = 42, gap = 20;
        const canvas = document.createElement('canvas');
        canvas.width = pad * 2 + aw + gap + bw;
        canvas.height = pad * 2 + headerH + targetH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#163047';
        ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
        ctx.fillText('原题图 (Source Drawing)', pad, pad + 26);
        ctx.fillText('工作台生成三视图 (Rendered Sheet)', pad + aw + gap, pad + 26);
        ctx.strokeStyle = '#c8d6df';
        ctx.lineWidth = 2;
        ctx.strokeRect(pad - 1, pad + headerH - 1, aw + 2, targetH + 2);
        ctx.strokeRect(pad + aw + gap - 1, pad + headerH - 1, bw + 2, targetH + 2);
        ctx.drawImage(a, pad, pad + headerH, aw, targetH);
        ctx.drawImage(b, pad + aw + gap, pad + headerH, bw, targetH);
        return canvas.toDataURL('image/png');
      }, { srcUrl: srcDataUrl, dstUrl: dstDataUrl });
      const comparePng = path.join(targetDir, 'compare.png');
      fs.writeFileSync(comparePng, Buffer.from(compareDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
      artifacts.comparePng = comparePng;
    }

    allExternalRequests.push(...p2.externalRequests);
    allPageErrors.push(...p2.pageErrors);
    await p2.ctx.close();

    // Compute SHA-256 digests for all written artifacts to bind visual evidence to the exact model
    const artifactHashes = {};
    for (const [k, p] of Object.entries(artifacts)) {
      if (p && fs.existsSync(p)) artifactHashes[k] = sha256File(p);
    }

    // Compute explicit machine-readable status: passed | needs_review | failed
    const pipelineOk = candidateInfo.ok
      && roundTrip.ok
      && (!opts.sectionView || !!sectionSummary?.ok)
      && (!opts.exportDxf || !!dxfSummary?.ok)
      && allExternalRequests.length === 0
      && allPageErrors.length === 0;
    const reviewReasons = [];
    let hardFail = !pipelineOk;

    const conflicts = (candidateInfo.health?.findings || []).filter(f => f.severity === 'conflict');
    if (conflicts.length) {
      hardFail = true;
      for (const c of conflicts) reviewReasons.push(`Consistency conflict (${c.code}): ${c.text}`);
    }
    for (const row of roundTrip.oqa?.rows || []) {
      if (row.state === 'failed') {
        hardFail = true;
        reviewReasons.push(`OQA ${row.id} failed: ${row.evidenceZh}`);
      } else if (row.state === 'warn' || row.state === 'unverified') {
        reviewReasons.push(`OQA ${row.id} ${row.state}: ${row.evidenceZh}`);
      }
    }
    if (candidateInfo.nearTangent?.length) {
      hardFail = true;
      reviewReasons.push(`${candidateInfo.nearTangent.length} near-tangent join(s) detected`);
    }
    if (candidateInfo.questions?.length) {
      reviewReasons.push(`${candidateInfo.questions.length} open question(s) await user answer`);
    }
    if (candidateInfo.threeState?.undecided?.length) {
      reviewReasons.push(`${candidateInfo.threeState.undecided.length} item(s) remain in Undecided ledger`);
    }

    const status = hardFail ? 'failed' : (reviewReasons.length ? 'needs_review' : 'passed');
    const needsReview = status !== 'passed';

    // Build original-unit text geometric summary (helps text-only/weak-vision agents catch floor/cavity/size errors fast)
    const sc = roundTrip.restoredScale || candidateInfo.scale || 1;
    const vView = roundTrip.views?.V;
    const wView = roundTrip.views?.W;
    const boreStates = (candidateInfo.threeState?.undecided || [])
      .filter(x => typeof x.toggleStep === 'number')
      .map(x => x.text);
    const geoSummary = {
      unit: candidateInfo.unit || '',
      actualEnvelope: candidateInfo.health?.actual
        ? {
            X: Number(candidateInfo.health.actual.X.toFixed(2)),
            Y: Number(candidateInfo.health.actual.Y.toFixed(2)),
            Z: Number(candidateInfo.health.actual.Z.toFixed(2))
          }
        : null,
      vHiddenBottomClearance: vView?.bounds && vView?.hiddenBounds
        ? Number(((vView.bounds[3] - vView.hiddenBounds[3]) / sc).toFixed(2))
        : null,
      vMaxHorizontalHiddenSpan: vView?.maxHorizontalHiddenSpan
        ? Number((vView.maxHorizontalHiddenSpan / sc).toFixed(2))
        : 0,
      wHiddenBottomClearance: wView?.bounds && wView?.hiddenBounds
        ? Number(((wView.bounds[3] - wView.hiddenBounds[3]) / sc).toFixed(2))
        : null,
      boreStates
    };

    const { formalModel: _omitFormal, ...candidateSummary } = candidateInfo;
    const result = {
      ok: status === 'passed',
      pipelineOk,
      status,
      needsReview,
      reviewReasons,
      command: opts.cmd,
      input: opts.input,
      compatibility: { ...compat, htmlSha256, pinnedSha256: PINNED_V080_SHA256, matchesPinnedV080 },
      candidate: candidateSummary,
      geoSummary,
      roundTrip,
      section: sectionSummary,
      probes: probeResults,
      dxf: dxfSummary,
      artifactHashes,
      artifacts: opts.outDir ? artifacts : null,
      networkRequests: allExternalRequests,
      pageErrors: allPageErrors
    };

    if (opts.outDir) {
      const jsonReportPath = path.join(targetDir, 'check-report.json');
      const mdReportPath = path.join(targetDir, 'report.md');
      fs.writeFileSync(jsonReportPath, JSON.stringify(result, null, 2), 'utf8');
      fs.writeFileSync(mdReportPath, buildMarkdownReport(result), 'utf8');
      result.artifacts.checkReportJson = jsonReportPath;
      result.artifacts.reportMd = mdReportPath;
    } else {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    console.log(JSON.stringify(result, null, 2));
    if (!pipelineOk) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

function osTmpDir() {
  return process.env.TEMP || process.env.TMP || path.join(REPO_ROOT, '.tmp');
}

run().catch(err => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
