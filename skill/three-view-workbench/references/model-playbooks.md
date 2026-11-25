# Cross-Model Guardrails & CLI Reference (Codex / Antigravity / DSH)

Read this file on demand when choosing CLI options or debugging tricky geometry across GPT (Codex), Gemini (Antigravity), and DeepSeek (DSH).

## 1. Five High-Frequency Failure Guardrails

1. **Arcs, fillets, and obrounds (prevents tangent kinks)**:
   - Never hand-calculate polygon sagitta when a deterministic recipe applies. Use `rounded_poly`, `obround`, `arc_cap`, `u_slot`, or `half_ring` (see [schema.md](schema.md)).
   - If `oqa.tangency` reports `failed` or `nearTangent` is non-empty, you must replace the hand-rounded edge with a recipe before handoff.
2. **Counterbores, blind cavities, and stepped holes (prevents inverted bosses & blocked bore ends)**:
   - Never rely on the front view alone. Run `--section <V|H|W> --section-world <coord>` cutting right through the bore/cavity axis, plus `--probe` points on **both sides** of expected floors, roofs, and partition walls (state expected `solid`/`void` before running).
   - Treat `geoSummary` (`vHiddenBottomClearance`, `wHiddenBottomClearance`) strictly as a **whole-view line-extent hint** (when a part has both blind and through holes, a through-hole hidden line reaches `0` even if the blind hole has a solid floor). Always confirm individual bore depth via an axial `--section-world` and two-sided `--probe`.
3. **Asymmetric exteriors & multi-step platforms (prevents missing corner solids & add/sub inversions)**:
   - Make Question #1 of your pre-draft checklist verify the outer silhouette and every corner of **all supplied views** (mark any missing view as having no source view for verification).
   - Explicitly verify add vs. subtract direction (protruding boss vs. cutout notch) on `compare.png`.
4. **Equal-diameter intersecting bores vs. conical bottoms**:
   - Two equal-diameter perpendicular cylinders project as two diagonal lines in side view just like a conical bottom. Check the front view for extra inner intersection arcs (a cone intersecting a vertical cylinder produces inner elliptical arcs; a straight cylinder does not).
5. **Image & token economy (Antigravity / Codex / DSH)**:
   - Read `report.md` (`geoSummary`, `probes`, `oqa.rows`, `reviewReasons`) first.
   - Visually inspect **`compare.png`** and **`section.png`** (only open `preview-3d.png` if a 3D ambiguity remains; confirm any apparent thin-wall gap in coarse 3D preview with projections + `--probe`).
   - If running on a text-only / non-vision model (e.g., some DSH setups), rely on `geoSummary`, `--probe`, `oqa.rows`, and `diff`, and **explicitly report** that visual PNG review is pending human confirmation.

## 2. Full CLI Reference (`<skill-dir>/scripts/tvw.mjs`)

- **Render + verify + compare + section + probe + DXF**:
  ```powershell
  node <skill-dir>/scripts/tvw.mjs render round-1/candidate.json --out round-1 --compare <source.png> --centerlines --section W --section-world 22 --probe "22,18,4; 22,18,18" --dxf
  ```
- **Fast check without PNG screenshots**:
  ```powershell
  node <skill-dir>/scripts/tvw.mjs check round-1/candidate.json --out round-1 --centerlines --probe "22,18,4; 22,18,18"
  ```
- **Step-by-step revision diff (zero browser launch)**:
  ```powershell
  node <skill-dir>/scripts/tvw.mjs diff round-1/candidate.workbench.json round-2/candidate.workbench.json --out round-2
  ```
- **Flags**:
  - `--section <V|H|W>`: `V` (fixed Y), `W` (fixed X), `H` (fixed Z).
  - `--section-world <coord>`: cut coordinate in candidate world units (preferred over normalized `--section-pos <0..100>`).
  - `--section-reverse`: flip section viewing direction.
  - `--probe "x1,y1,z1; x2,y2,z2"`: all 3 world coordinates required; returns `solid`/`void`/`surface` + CSG implicit `field` (not guaranteed Euclidean nearest distance at corners/booleans).
  - `--compare <source.png>`: composes side-by-side `compare.png`.
  - `--centerlines`: enables workbench centerlines before `sheet.png` and OQA.
  - `--dxf`: exports three-view `.dxf` (plus `-section.dxf` when `--section` is set).
  - `--html <path>` / `TVW_WORKBENCH_HTML` / `PLAYWRIGHT_PATH` / `TVW_BROWSER_CHANNEL=chromium` / `--allow-unpinned`.
