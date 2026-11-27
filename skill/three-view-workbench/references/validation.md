# Validation Scope & Lessons Learned

## Verified Offline Scope (v0.8.0, v0.8.1, and v0.8.2)

| Area | Verified Evidence | Boundary / Not Claimed |
| --- | --- | --- |
| **Version Lock** | `tvw.mjs` verifies the supported HTML hashes (v0.8.0, v0.8.1, and v0.8.2) before launching Playwright; modified HTML (even a trailing newline) exits non-zero unless `--allow-unpinned` is passed. | Use `--allow-unpinned` only for a trusted local test build. The CLI checks the Agent API version and required methods at runtime. |
| **Round-Trip Import** | Every candidate is exported as a formal `orthographic-workbench` JSON (with `confirmedReadings: {}` and `consistency.accepted: false`) and re-imported through `#file` into a fresh blank workbench, checking physical geometry parameters, per-view (`V/H/W`) bounds, unit, scale, and editable arc steps. | Does not guarantee agreement with the user's source drawing; visual review against the source remains mandatory. |
| **Tangency & Curves** | The tests catch a near-tangent sagitta error (`status: "failed"`) and verify the corrected `rounded_poly` joins with `0.00°` deviation and no fake seams. | Tangency OQA applies only to evaluated joins; non-tangent general polygons still need visual comparison. |
| **A–A Full Section** | `--section <V|H|W> [--section-pos <0..100>] [--section-reverse]` exports `section.png` (and optional section DXF) on the re-imported formal model; tested for both central (`pos=50`) and off-center (`pos=20`, `pos=30`, `pos=34`) cut planes. | Uses material-based hatching; special drawing conventions for ribs/webs are not applied automatically. |
| **DXF & Diff** | `--dxf` exports three-view DXF (and section DXF when combined with `--section`) via v0.8.0 `DXFExportKit` and validates `SECTION`/`ENTITIES`/`EOF`; `diff` compares formal `.workbench.json` files step-by-step without launching a browser. | DXF validation checks the file structure. `diff` reports shape changes by array index and compares unit and scale. Review the permitted steps and confirmation metadata explicitly. |
| **Offline & Privacy** | All Playwright contexts abort non-`file:`/`data:`/`blob:`/`about:` requests (`networkRequests: []`, `pageErrors: []`). Public examples and tests use synthetic geometry only. | Sending a user's source drawing to a cloud VLM is a separate user-initiated action outside `tvw.mjs`. |

## Geometry Review Playbook

- **Check what each line represents.** Register V/H/W using the part's extrema and shared axes. Compare the feature location and extent, including changes from solid to hidden across views. A projection with the correct outline can still hide an extra cavity, missing platform or wrong hole depth. Treat centre/symmetry lines as annotations, and check orientation before editing geometry to fix a mirrored or rotated view.
- **Find the parent material and actual connection.** For a raised feature on a slope, locate where its surfaces meet the parent and use that intersection to choose the extrusion endpoint. Stopping at the side-wall coordinate can leave an upright end where the plan should show a roof intersection. Where several stepped sections share one sloped face, compute their endpoints from the same plane or line. Independently rounded endpoints can create visible slivers or short edges.
- **Resolve bore type and connectivity using multiple views.** Trace each opening, floor and shoulder. A cutter that lies wholly inside material already removed makes no new step. Two equal-radius perpendicular bores can project to sloping diagonals in a side view. Compare the axial view and the material cutout before choosing a conical bottom. If two constructions still fit the supplied views, use `questions` to identify the missing view or dimension.
- **Choose the section from the feature location.** Use the given cut line and viewing direction when present. For an off-centre bore, use the view whose cut axis gives its offset, then map the position into fitted workbench coordinates. `--section-pos` uses the `0..100` workspace scale. A central plane can miss the feature. Inspect the material at the bore floor, the far wall, and the thinnest bridge. Use a second plane if one cut cannot expose all the relevant features. If the shaded mesh looks open at a thin wall, compare the section and linework before adding material.
- **Use tangency checks only for an intended smooth join.** A real shoulder should remain visible. Two separate bodies can touch tangentially without a smooth transition on a single outer surface. Use an applicable native curve recipe and check the affected views for spurious seams; a tangency pass describes the joins evaluated in that model.
- **Verify a correction against the recorded evidence.** Before revising, name the exact feature, expected projection or section change, and steps to preserve. Compare the original and revised model from the same views. If the fit scale changes, account for it before calling a saved-coordinate change a real dimension change. `diff` compares by step position; if steps were inserted or reordered, identify features explicitly. Re-read any confirmation tied to a changed measurement or geometry. Deliver unresolved cases with the paired report.

## Lessons Turned into Code & Rules

1. **Toast overlay on viewport-clipped screenshots**: Playwright's `locator('#sheet svg').screenshot()` captures fixed overlays above the SVG bounds. `tvw.mjs` now explicitly hides `#toast` before capturing `sheet.png`.
2. **Wait for real post-import state change**: Checking only `shapes.length` after `#file` import can match the default demo model before rebuild completes. `tvw.mjs` snapshots pre-import shapes and waits for an actual state transition + `drawData`.
3. **1-based `features[].steps` and local depth labels**: Blind tests showed VLMs frequently write 0-based `steps` (mis-mapping `through_hole` onto a blind bore) or label local hole depth as `"总深"` (which v0.8.0's overall-size checker can compare against overall Y width). Both are documented in [schema.md](schema.md).
4. **Equal-diameter cross-bores vs. conical bottoms**: Two equal-diameter perpendicular cylinders project as two diagonal lines in side view just like a conical bottom; checking the front view for extra inner intersection arcs distinguishes the two constructions.
5. **Hash-bound deliverables**: Any model revision invalidates prior screenshots. `check-report.json` and `report.md` record SHA-256 digests for the formal model, PNGs, and DXF files.

Run the full offline acceptance suite locally with:

```powershell
node skill/three-view-workbench/scripts/self-test.mjs
```
