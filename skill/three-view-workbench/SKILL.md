---
name: three-view-workbench
description: Build, locally verify, section, probe, diff, and export 3D CSG + first-angle three-view models for Three-View Workbench v0.8.0, v0.8.1, and v0.8.2. Use when turning a mechanical drawing, sketch, or part description into an importable workbench JSON with offline projection checks, A-A full sections, point-in-solid probes, tangency audits, and DXF / binary STL export. Do not use for 2D-only architectural/PCB drafting or tasks explicitly requiring FreeCAD, OpenSCAD, or STEP output.
compatibility: Requires Node.js >= 18, Playwright, Edge/Chromium, and a verified Three-View Workbench v0.8.0, v0.8.1, or v0.8.2 HTML.
---

# Three-View Workbench Skill (v0.8.0 / v0.8.1 / v0.8.2)

Build 3D CSG models and verify them 100% offline against a verified **v0.8.0, v0.8.1, or v0.8.2 workbench** before handing deliverables to the user. Always resolve `scripts/tvw.mjs` relative to this `SKILL.md`'s directory (`<skill-dir>/scripts/tvw.mjs`).

## Core Rules

1. **Separate local validity from drawing agreement.** Respect machine `status`: `passed` (all local checks clear), `needs_review` (undecided items/questions remain — normal for unconfirmed readings), `failed` (tangency/consistency/import error — must fix).
2. **Never forge user confirmations.** Keep `confirmedReadings: {}` and `consistency.accepted: false`. Never invent missing dimensions; leave ambiguities in `questions` and `undecided`.
3. **Cap automatic self-revision at 2 rounds.** Keep `round-1/` untouched when revising into `round-2/`, and run `tvw.mjs diff` to confirm untouched steps stayed intact.
4. **Deliver a hash-bound bundle.** Always hand the user `<name>.workbench.json` paired with `report.md` (which binds SHA-256 hashes of the model, PNGs, DXF, and STL), `sheet.png` / `compare.png`, and `section.png` (if generated). Keep personal notes in separate files (`check-report.json` is regenerated on every export), and export to a fresh directory if upgrading over an older bundle lacking a verified `reportMd` hash.
5. **Prefer deterministic curve recipes.** Read [references/schema.md](references/schema.md) first (note Common Pitfalls: 1-based `features[].steps`, avoid bare `总深` for local hole depth, omit invalid `axis` on diameters).
6. **Offline boundary & privacy.** `tvw.mjs` enforces the SHA-256 allowlist for supported builds and runs 100% offline with zero network requests. Sending a user's source drawing to a cloud VLM is a separate user-initiated action; never include private textbook materials or private drawings in public examples or deliverables.

## Workflow

1. **Read source & write 3–5 Yes/No verification questions**:
   - Separate explicit dimensions (`source: "drawing"` / `"user"`), estimates (`"estimate"`), and open `questions`.
   - **Q1 must check the outer silhouette and every corner of all supplied views** (mark any missing view as having no source view for verification) before checking internal features.
2. **Draft `round-1/candidate.json`** following [references/schema.md](references/schema.md).
3. **Run local `render`** (add `--compare <source.png>`, `--centerlines` for holes/cylinders, `--section <V|H|W> --section-world <coord>` for internal cavities/counterbores, `--probe "x,y,z;..."` on both sides of thin walls/floors with expected `solid`/`void` stated beforehand, and `--dxf` if CAD export is requested):
   ```powershell
   node <skill-dir>/scripts/tvw.mjs render round-1/candidate.json --out round-1 --compare <source.png> --centerlines
   ```
4. **Inspect `report.md` (especially `geoSummary`, `probes`, `oqa.rows`) + `compare.png` + `section.png`**:
   - Answer every dynamic verification question from Step 1 and check **加料还是减料 / 孔腔是否相通 / 剖面哪里应有材料**.
   - Prefer `compare.png` + `section.png` first (open `preview-3d.png` only when needed). On text-only/non-vision runtimes, rely on `geoSummary` + `--probe` + `diff` and explicitly state visual PNG review is pending human confirmation.
5. **Revise at most once (`round-2/`) & run `diff`**:
   - Fix only the implicated steps, re-run `render` into `round-2/`, and run `node <skill-dir>/scripts/tvw.mjs diff round-1/candidate.workbench.json round-2/candidate.workbench.json --out round-2`. Inspect `modifiedSteps`/`addedSteps`/`removedSteps`, `unitChanged`, and `scaleChanged` against permitted edits (`diff` compares by step position; verify you only changed the intended steps).

## References (Read On Demand)

- [references/schema.md](references/schema.md): Coordinate system, JSON schema, deterministic curve recipes, and blind-test pitfalls.
- [references/model-playbooks.md](references/model-playbooks.md): Full CLI flags and targeted guardrails for Codex (GPT), Antigravity (Gemini), and DSH (DeepSeek).
- [references/validation.md](references/validation.md): Verified offline scope, geometry review playbook, and lessons learned.
