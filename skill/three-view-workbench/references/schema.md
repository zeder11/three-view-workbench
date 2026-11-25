# Three-View Workbench v0.8.0 AI JSON Schema & Curve Recipes

Pinned baseline: `发布包/v0.8.0/app/three-view-workbench.html` (SHA-256 `b7f002932bc9841bc61491aa2e757999b601c7e24f3b0f8d35ca28786af6c569`).

## Common Pitfalls (Lessons from Blind Tests)

- **`features[].steps` is 1-based (`[1]..[N]`), NEVER 0-based.** Using `[0]` or off-by-one indices maps `through_hole` onto the wrong shape and triggers false `bore-material` conflicts.
- **Name a local hole depth explicitly in both structured readings and prose.** Use `"label": "阶梯孔深", "axis": "Z", "scope": "feature"` for a vertical stepped bore. In `understanding` and `assumptions`, write “阶梯盲孔从顶面向下深 18 mm”. The v0.8.0 checker also extracts overall sizes from free text, where a bare phrase like “下段 Ø12 总深 18” can be read as overall Y depth even if the structured reading is correct.
- **Omit `axis` on diameter readings.** Use `axis` (`"X"|"Y"|"Z"`) for a directional extent, depth or offset. Record the bore direction separately in `features[].spatial.axis` or the shape's `axis` field. `"D"`, `"XY"` and `"YZ"` trigger validation warnings.

## Coordinate System & Projection

- World axes: `+X` right, `+Y` back (away from front viewer), `+Z` up.
- First-angle projection:
  - **V (Front, top-left)**: `X` right, `Z` up, depth `Y`.
  - **H (Top, bottom-left)**: `X` right, `Y` up (front faces bottom of H), depth `Z`.
  - **W (Left, top-right)**: `Y` left (front faces right of W), `Z` up, depth `X`.
- Keep the original units and a consistent origin. If the drawing supplies proportions only, leave `unit` unspecified and list estimated dimensions. The workbench fits the additive envelope into `0–100` for display.

## Top-Level Candidate JSON

```json
{
  "understanding": "Short summary of the part",
  "unit": "mm",
  "drawing": { "type": "orthographic", "orientation": "X length, Y depth, Z height" },
  "readings": [
    { "label": "总长", "value": 60, "unit": "mm", "axis": "X", "scope": "overall", "source": "drawing", "from": "主视图标注" }
  ],
  "features": [
    {
      "id": "f1",
      "name": "中央盲孔",
      "kind": "blind_hole",
      "steps": [2],
      "spatial": { "axis": "Z", "range": [12, 30], "material": "void", "relation": "从顶面下挖18mm", "source": "drawing" },
      "evidence": [{ "view": "V", "text": "主视图虚线止于距底面12mm处" }],
      "alternatives": [],
      "uncertain": false
    }
  ],
  "shapes": [],
  "assumptions": [],
  "unsupported": [],
  "questions": [],
  "confidence": "medium"
}
```

- `readings[].source`: `"drawing" | "user" | "estimate" | "previous" | "unknown"` (never label estimates as `"drawing"`).
- `readings[].scope`: `"overall" | "feature" | "offset" | "unknown"`.
- `features[].kind`: `"base" | "round_body" | "cavity" | "slot" | "through_slot" | "boss" | "through_hole" | "blind_hole" | "counterbore" | "unknown"`.

## Primitive Shapes (`shapes[]`)

- `box`: `op`, `cx,cy,cz`, `sx,sy,sz`, optional `rot,rx,ry`.
- `cylinder` / `cone`: `op`, `axis` (`"x"|"y"|"z"`, default `"z"`), `cx,cy,cz`, `r`, `h`, optional `rx,ry`.
- `frustum`: same as `cylinder` plus `r2` (`>= 0`).
- `prism` / `pyramid`: `op`, `axis`, `cx,cy,cz`, `n` (`3..12`), `r`, `h`, optional `rot,rx,ry`.
- `sphere`: `op`, `cx,cy,cz`, `r`.
- `plane` (`op: "sub"` only): half-space cut removing local `+Z` side at point `(cx,cy,cz)` with `rx,ry`.

## Deterministic Sketch Recipes (`type: "sketch"`)

All sketches use `op` (`"add"|"sub"|"keep"`), `view` (`"V"|"H"|"W"`), `lo`, `hi` (`lo < hi`), in world coordinates (V=`[X,Z]`, H=`[X,Y]`, W=`[Y,Z]`). Do not mix `cx/cy/cz/axis/rot` into sketches.

1. **`obround` (closed slot / stadium boss or hole)** — `add | sub | keep`:
   ```json
   { "type": "sketch", "op": "sub", "view": "H", "profile": "obround", "centers": [[-15, 0], [15, 0]], "radius": 6, "lo": -2, "hi": 22 }
   ```
2. **`rounded_poly` (convex corner fillets by radius `R`)** — `add | sub | keep`:
   ```json
   { "type": "sketch", "op": "add", "view": "H", "profile": "rounded_poly", "points": [[-30, -20], [30, -20], [30, 20], [-30, 20]], "fillets": { "1": 10, "2": 10 }, "lo": 0, "hi": 20 }
   ```
   - `fillets` maps 0-based convex vertex index to positive radius `R`; trim lengths on any edge must sum to strictly less than that edge's length.
3. **`arc_cap` (arch top)** — `add | sub | keep`:
   `base: [u, v]`, `width`, `rise` (`0 < rise <= width/2`), optional `wallHeight`.
4. **`u_slot` (open U-bottom slot)** — `sub` only:
   `center: [u, v]`, `radius`, `top` (`top > v`).
5. **`half_ring` (semicircular arch ring)** — `add | sub | keep`:
   `center: [u, v]`, `outerRadius`, `innerRadius`.
6. **`polygon` (general fallback)** — `3..24` points + optional `arcs: { "edgeIdx": signedSagitta }` (`|sag| < chord/2`; split 180° semicircles into two 90° arcs with `|sag| = R * (1 - sqrt(2)/2)`).

## Visual & Engineering Review Checklist

- **Bore depth**: Do hidden lines in V and W stop at the declared floor, or pierce all the way through?
- **Solid vs hidden lines**: Are occluded edges dashed and front edges solid?
- **Smooth tangency**: Does `oqa.tangency` report `passed` with `0` fake seams and `0.00°` kink, or did a hand-rounded sagitta create a near-tangent slip?
- **Abstention**: If views leave depth/radius/feature type undetermined, is it listed in `questions` and kept in `undecided`?
- For joined surfaces, intersecting holes or selection of an off-centre section, see the [geometry review playbook](validation.md#geometry-review-playbook).
