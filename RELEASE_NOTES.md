# v0.8.2 release notes

This release adds offline Binary STL export with voxel resolution and through-hole audits, speeds up 3D meshing via additive AABB clipping and persistent Worker pools, adds the L-bracket mechanical recipe, declutters the 3D sidebar, and hardens Skill CLI delivery commits.

## Highlights

- **Offline Binary STL export & accuracy audit**: Exports binary STL meshes (`STLExportKit`, `导出 STL (3D)` button with **background Worker encoding**, `window.__workbench.agent.exportStl`, and Skill CLI `--stl`) with outward CCW winding correction. Audits sub-voxel dimensions (diameter, axial height, extrusion thickness) and fires STL ray checks along CSG-verified through-holes (including flush ends) so closed small holes never pass silently.
- **3D meshing speedup & Worker reuse**: `K.mesh` clips sampling to the additive 3D AABB (`84³` median runtime improved 23.5%–31.5% on benchmarked samples with byte-identical vertices and normals across 19 synthetic models / 38 comparisons), while `projectionRun` and `startMesh` reuse Worker instances across edits. Concurrent low-res builds can no longer downgrade a higher-res cached mesh.
- **L-bracket mechanical recipe (`l_bracket`)**: Generates base plate, rear wall, optional twin triangular gusset ribs (`W`-view extrusion), and mounting holes with live geometric clearance validation across the 3-tab recipe UI, `#preset` menu, and bilingual labels.
- **Cleaner UI & export sync guards**: Secondary 3D controls (`#view3dfold`) and sketch help folds start collapsed; mobile toolbar disclosure markers and footer spacing are cleaned up; UI export buttons gate on `currentProjection()` and re-check active snapshot/revision after async builds so cancelled updates cannot export the wrong solid.
- **Transactional Skill CLI commits**: `tvw.mjs` verifies active and stale target file ownership/SHA-256 hashes under an exclusive directory lock, refuses to overwrite directories or user-modified/unowned files, removes unmodified stale optional files across relocated folders, and preserves rollback backups if restoration fails.

## Upgrade & Usage Notes

- **Upgrading an older delivery directory**: If `tvw.mjs` refuses to overwrite an existing `report.md` whose hash cannot be verified in a prior bundle, export to a new output directory (the existing files stay intact).
- **`check-report.json` is machine-generated**: Every export regenerates `check-report.json`. Save persistent personal notes in a separate file rather than editing `check-report.json`.

Review AI candidates and voxel STL audits against the source drawing before precision fabrication or machining.

## Downloads

- **three-view-workbench.html** — open directly in a browser for offline use.
- **three-view-workbench-v0.8.2.zip** — application, documentation, licence and public examples.
- **SHA256SUMS.txt** — checksums for the package files.
