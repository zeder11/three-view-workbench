#!/usr/bin/env node
/**
 * Repeatable acceptance test for three-view-workbench skill v0.1 MVP.
 * Exercises the 3 public cases against pinned v0.8.0 offline HTML:
 *   1. Blind hole wrongly built as through-hole -> fixed round 2
 *   2. Near-tangent fillet kink -> fixed via rounded_poly round 2
 *   3. Two-view ambiguous hole depth -> stays honestly in undecided
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(SKILL_ROOT, '..', '..');
const DEFAULT_HTML = path.join(REPO_ROOT, '发布包', 'v0.8.0', 'app', 'three-view-workbench.html');
const TVW = path.join(__dirname, 'tvw.mjs');
const EX = path.join(SKILL_ROOT, 'examples');
const OUT = path.join(SKILL_ROOT, '.selftest-out');

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// Pre-check: Version hash lock must reject modified HTML BEFORE launching browser
{
  const tamperedHtml = path.join(OUT, 'tampered-v080.html');
  fs.writeFileSync(tamperedHtml, fs.readFileSync(DEFAULT_HTML, 'utf8') + '\n', 'utf8');
  const r = spawnSync(process.execPath, [TVW, 'check', path.join(EX, '01-blind-hole-fixed.json'), '--html', tamperedHtml], {
    encoding: 'utf8',
    timeout: 15000
  });
  assert.notEqual(r.status, 0, 'Modified HTML with trailing newline must be rejected by SHA-256 lock');
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.status, 'failed');
  assert.equal(parsed.compatibility.matchesPinnedV080, false);
  console.log('PASS Lock: modified v0.8.0 HTML rejected before browser launch');
}

// Pre-check 2: Reject empty probe coordinate ("22,,4") and whitespace-only --section-world (" ")
let emptyProbeRejected = false;
try {
  execFileSync(process.execPath, [TVW, 'check', path.join(EX, '04-stepped-counterbore-block.json'), '--probe', '22,,4'], {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 15000
  });
} catch (err) {
  emptyProbeRejected = err.status === 2;
}
assert.equal(emptyProbeRejected, true, 'Empty probe coordinate like "22,,4" must be rejected with exit code 2');

let blankSectionWorldRejected = false;
try {
  execFileSync(process.execPath, [TVW, 'check', path.join(EX, '04-stepped-counterbore-block.json'), '--section', 'W', '--section-world', '   '], {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 15000
  });
} catch (err) {
  blankSectionWorldRejected = err.status === 2;
}
assert.equal(blankSectionWorldRejected, true, 'Whitespace-only --section-world "   " must be rejected with exit code 2');
console.log('PASS Input Guards: empty probe "22,,4" and blank --section-world rejected before browser launch');

function runRender(exampleFile, subDir, extraArgs = []) {
  const outDir = path.join(OUT, subDir);
  const stdout = execFileSync(process.execPath, [TVW, 'render', path.join(EX, exampleFile), '--out', outDir, ...extraArgs], {
    encoding: 'utf8',
    timeout: 120000
  });
  const res = JSON.parse(stdout);
  assert.equal(res.pipelineOk, true, `${exampleFile} pipeline should succeed`);
  assert.equal(res.compatibility.matchesPinnedV080, true, 'Must match pinned v0.8.0 SHA-256');
  assert.equal(res.networkRequests.length, 0, 'Must make 0 external network requests');
  assert.equal(res.pageErrors.length, 0, 'Must have 0 page errors');
  assert.equal(res.roundTrip.ok, true, 'Blank-workbench round-trip import must pass');
  assert.equal(res.roundTrip.geometryMatches, true, 'Re-imported physical geometry parameters must match');
  assert.equal(res.roundTrip.viewsMatch, true, 'Re-imported per-view (V/H/W) bounds must match candidate');
  assert.equal(res.roundTrip.forgedConfirmations, 0, 'Must never forge user confirmations');
  assert.ok(fs.existsSync(res.artifacts.sheetPng), 'sheet.png missing');
  assert.ok(fs.existsSync(res.artifacts.preview3dPng), 'preview-3d.png missing');
  assert.ok(fs.existsSync(res.artifacts.reportMd), 'report.md missing');
  assert.ok(fs.existsSync(res.artifacts.formalModel), 'formal workbench JSON missing');
  assert.ok(res.artifactHashes?.formalModel && res.artifactHashes?.sheetPng, 'artifactHashes must bind formalModel and sheetPng SHA-256');
  return res;
}

// Case 1: Blind hole mistakenly built as through-hole (round 1) vs fixed blind hole (round 2)
const c1r1 = runRender('01-blind-hole-as-through.json', 'case1-round1');
const c1r2 = runRender('01-blind-hole-fixed.json', 'case1-round2');
assert.equal(c1r1.status, 'needs_review', 'Case 1 round 1 has undecided items and must be needs_review');
assert.equal(c1r1.ok, false, 'needs_review candidate must NOT report top-level ok: true');
assert.ok(c1r1.candidate.threeState.undecided.some(x => x.text.includes('当前为通孔')), 'Case 1 round 1 must flag step 2 as through hole');
assert.ok(c1r2.candidate.threeState.undecided.some(x => x.text.includes('当前为盲孔')), 'Case 1 round 2 must show step 2 fixed to blind hole');
// Geometric assertion on V view hidden lines (bottom of block = V.bounds[3] in SVG y-down coords)
const v1 = c1r1.roundTrip.views.V, v2 = c1r2.roundTrip.views.V;
assert.ok(v1.hiddenBounds && Math.abs(v1.bounds[3] - v1.hiddenBounds[3]) < 1.0, 'Round 1 through-hole hidden walls must reach block bottom face');
assert.equal(v1.maxHorizontalHiddenSpan, 0, 'Round 1 through-hole must NOT have a horizontal hidden floor line');
const floorClearanceMm = (v2.bounds[3] - v2.hiddenBounds[3]) / c1r2.roundTrip.restoredScale;
const floorWidthMm = v2.maxHorizontalHiddenSpan / c1r2.roundTrip.restoredScale;
assert.ok(Math.abs(floorClearanceMm - 12) < 0.5, `Round 2 blind-hole solid floor clearance should be ~12 mm, got ${floorClearanceMm.toFixed(2)} mm`);
assert.ok(Math.abs(floorWidthMm - 12) < 0.5, `Round 2 blind-hole horizontal hidden floor width should be ~12 mm, got ${floorWidthMm.toFixed(2)} mm`);
assert.ok(Math.abs(c1r2.geoSummary.vHiddenBottomClearance - 12) < 0.5, 'geoSummary must report ~12 mm V-view blind floor clearance in original units');
assert.ok(c1r1.geoSummary.vHiddenBottomClearance < 0.5, 'Round 1 through-hole geoSummary must report ~0 mm bottom clearance');
console.log(`PASS Case 1: blind-hole-as-through -> fixed blind hole (V-view hidden floor width ${floorWidthMm.toFixed(2)} mm, bottom clearance ${floorClearanceMm.toFixed(2)} mm)`);

// Case 2: Near-tangent fillet kink (round 1) vs rounded_poly exact C1 fillet (round 2)
const c2r1 = runRender('02-near-tangent-fillet.json', 'case2-round1');
const c2r2 = runRender('02-near-tangent-fillet-fixed.json', 'case2-round2');
assert.equal(c2r1.status, 'failed', 'Case 2 round 1 near-tangent failure must report top-level status: failed');
assert.equal(c2r1.ok, false, 'Failed tangency candidate must NOT report ok: true');
assert.ok(c2r1.candidate.nearTangent.length > 0, 'Case 2 round 1 must catch near-tangent kink via DraftKit.joinInfo');
assert.equal(c2r1.roundTrip.oqa.tangency.state, 'failed', 'Case 2 round 1 OQA tangency must fail on near-tangent slip');
assert.equal(c2r2.candidate.nearTangent.length, 0, 'Case 2 round 2 rounded_poly must have 0 near-tangent slips');
assert.equal(c2r2.roundTrip.oqa.tangency.state, 'passed', 'Case 2 round 2 OQA tangency must pass');
assert.equal(c2r2.roundTrip.oqa.tangency.fakeSeams.length, 0, 'Case 2 round 2 must have 0 fake seams');
assert.equal(c2r2.roundTrip.editableArcSteps, 1, 'Case 2 round 2 must preserve editable arc step across blank re-import');
assert.equal(c2r2.status, 'needs_review', 'Case 2 round 2 still has unconfirmed local R10 reading -> needs_review');
console.log('PASS Case 2: near-tangent fillet failed -> rounded_poly fixed (0.00 deg, 0 fake seams, status=needs_review)');

// Case 3: Two-view ambiguous depth -> honestly stays in Undecided & needs_review
const c3 = runRender('03-two-view-ambiguous-depth.json', 'case3-ambiguous');
assert.equal(c3.status, 'needs_review', 'Case 3 ambiguous depth must report status: needs_review');
assert.equal(c3.ok, false, 'Ambiguous depth must NOT report top-level ok: true');
assert.ok(c3.candidate.questions.length >= 1, 'Case 3 must keep open question');
assert.ok(c3.candidate.threeState.undecided.some(x => x.text.includes('暂定孔深')), 'Case 3 estimated depth must stay in Undecided');
assert.ok(c3.candidate.threeState.undecided.some(x => x.meta && x.meta.includes('待回答问题')), 'Case 3 open question must appear in Undecided');
assert.equal(c3.roundTrip.oqa.rows.find(r => r.id === 'dimensions').state, 'warn', 'Case 3 unconfirmed estimate reading must NOT pass OQA dimensions');
const c3Report = fs.readFileSync(c3.artifacts.reportMd, 'utf8');
assert.ok(c3Report.includes('顶面直径 14 的圆孔是通孔还是盲孔'), 'Case 3 report.md must include the open question');
assert.ok(c3Report.includes('加料还是减料') && c3Report.includes('孔腔是否相通') && c3Report.includes('剖面哪里应有材料'), 'report.md must include the 3-point visual review checklist');
console.log('PASS Case 3: two-view ambiguous depth stayed honestly in needs_review & report includes open question');

// Case 4: Optional A-A full section (world-coord center vs off-center cut) + --centerlines + DXF + --probe + --compare
const previewRef = path.join(EX, 'previews', '04-counterbore-sheet.png');
const c4Center = runRender('04-stepped-counterbore-block.json', 'case4-section-center', [
  '--section', 'W',
  '--section-world', '30',
  '--centerlines',
  '--dxf',
  '--probe', '30,20,25; 30,20,10; 10,20,15; 30,20,5',
  '--compare', previewRef
]);
const c4Flank = runRender('04-stepped-counterbore-block.json', 'case4-section-flank', ['--section', 'W', '--section-world', '10']);
assert.equal(c4Center.section?.ok, true, 'Center W full section must succeed');
assert.equal(c4Center.section.view, 'W', 'Center section view must be W');
assert.equal(c4Center.section.axis, 'X', 'W section must cut along fixed X');
assert.equal(c4Center.section.position, 50, 'World X=30 on 0..60 block must map to workbench center 50');
assert.equal(c4Center.section.worldPosition, 30, 'section.worldPosition must record 30');
assert.equal(c4Center.roundTrip.oqa.rows.find(r => r.id === 'annotations').state, 'passed', '--centerlines must clear OQA annotations warning');
assert.ok(c4Center.section.hatchCount > 0, 'Center W section must hatch cut material');
assert.ok(fs.existsSync(c4Center.artifacts.sectionPng), 'Center section.png missing');
assert.equal(c4Center.dxf?.ok, true, 'DXF export must pass validation');
assert.equal(c4Center.dxf?.mainValid, true, 'Three-view DXF must be valid');
assert.equal(c4Center.dxf?.sectionValid, true, 'Section DXF must be valid');
assert.ok(fs.existsSync(c4Center.artifacts.dxf), 'Three-view DXF file missing');
assert.ok(fs.existsSync(c4Center.artifacts.sectionDxf), 'Section DXF file missing');
assert.ok(c4Center.artifactHashes?.dxf && c4Center.artifactHashes?.sectionDxf, 'DXF SHA-256 hashes must be recorded');
assert.ok(fs.existsSync(c4Center.artifacts.comparePng), 'compare.png missing');
assert.ok(c4Center.artifactHashes?.comparePng, 'comparePng SHA-256 hash must be recorded');
// Verify --probe truth on 60x40x30 block with upper Ø24 (z=20..30) + lower Ø12 through (z=0..30) at (30,20)
assert.equal(c4Center.probes?.length, 4, 'Must return 4 probe points');
assert.equal(c4Center.probes[0].state, 'void', '(30,20,25) inside Ø24 counterbore must be void');
assert.equal(c4Center.probes[1].state, 'void', '(30,20,10) inside Ø12 through-bore must be void');
assert.equal(c4Center.probes[2].state, 'solid', '(10,20,15) in solid flank must be solid');
assert.equal(c4Center.probes[3].state, 'void', '(30,20,5) inside lower Ø12 through-bore must be void');
assert.equal(c4Flank.section?.ok, true, 'Off-center W full section must succeed');
assert.equal(c4Flank.section.worldPosition, 10, 'Off-center section worldPosition must be 10');
assert.ok(Math.abs(c4Flank.section.position - 25.7) < 0.5, `World X=10 should map near workbench 25.7, got ${c4Flank.section.position}`);
assert.ok(c4Flank.section.hatchCount > 0, 'Off-center W section must hatch solid flank');
assert.ok(fs.existsSync(c4Flank.artifacts.sectionPng), 'Off-center section.png missing');
assert.ok(
  c4Center.section.cutCount !== c4Flank.section.cutCount || c4Center.section.hatchCount !== c4Flank.section.hatchCount,
  'Center counterbore cut (X=30) and solid flank cut (X=10) must produce different section geometry'
);
const c4Report = fs.readFileSync(c4Center.artifacts.reportMd, 'utf8');
assert.ok(
  c4Report.includes('A–A 全剖视图') && c4Report.includes('section.png') && c4Report.includes('产物哈希绑定') && c4Report.includes('DXF 导出') && c4Report.includes('几何点探针') && c4Report.includes('compare.png'),
  'Case 4 report.md must summarize section, DXF, probes, compare.png, and artifact SHA-256 bindings'
);
console.log(`PASS Case 4: A-A full section (--section-world 30 vs 10) + --centerlines + DXF + 4 probes + compare.png verified`);

// Case 5: Offline diff between Case 1 round 1 (through hole) and round 2 (fixed blind hole)
const diffOutDir = path.join(OUT, 'case5-diff');
const diffStdout = execFileSync(process.execPath, [TVW, 'diff', c1r1.artifacts.formalModel, c1r2.artifacts.formalModel, '--out', diffOutDir], { encoding: 'utf8', timeout: 15000 });
const diffRes = JSON.parse(diffStdout);
assert.equal(diffRes.ok, true, 'diff command must succeed');
assert.deepEqual(diffRes.summary.unchangedSteps, [1], 'Step 1 (base box) must remain unchanged');
assert.equal(diffRes.summary.modifiedSteps.length, 1, 'Exactly step 2 (bore) should be modified');
assert.equal(diffRes.summary.modifiedSteps[0].step, 2, 'Modified step must be step 2');
assert.equal(diffRes.summary.forgedConfirmations, 0, 'diff must confirm 0 forged confirmations');
assert.ok(fs.existsSync(diffRes.artifacts.diffReportMd), 'diff-report.md missing');
console.log('PASS Case 5: offline diff verified (step 1 unchanged, step 2 modified, 0 forged confirmations)');

// Clean up temporary output directory after verification
fs.rmSync(OUT, { recursive: true, force: true });
console.log('\nALL SKILL ACCEPTANCE CHECKS PASSED (hash lock + 5 cases + 7 round-trips + 2 full sections + DXF + diff, 0 network, 0 page errors)');
