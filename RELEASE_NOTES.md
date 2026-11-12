# v0.6.1 release notes

This release collects local improvements since v0.5.2 for engineering-drawing study, modeling, orthographic checking and section inspection.

## Added and improved

- Exportable A–A full sections with three principal planes, position, reversed viewing direction, centre lines and linked read-only 3D.
- Centre/symmetry lines for supported bores, axes, obrounds and full sections, included in PNG/SVG exports.
- Existing-line explanations linked to solid locations and modeling steps; clearer candidate differences, snapping and joint evidence checks.
- A clearer AI panel for direct generation and external-AI JSON, drawing types, structure/dimension provenance, independent previews and errors.
- Explicit source-review edit ranges and append permission; out-of-range candidates stay separate until accepted. This guards input parameters, not isolation of final boolean material.
- Fast/fine preview quality and stable pointer-held interaction, with updates after release.

## Fixed

- Missing tangent silhouettes, incorrect hidden rims and some arc-related missing edges or false seams, shared by drawings, 3D outlines and export.
- Ambiguous arc-index keys are rejected rather than silently turning arcs into straight edges, including legacy sketch paths.
- HTML injection in API diagnostics, unsafe remote endpoints/redirects and extra credential fields in imported metadata.
- Reference-image/crop persistence, quota-failure reporting, failed named-record writes and paired model/annotation undo.
- Valid geometry with damaged annotations can be recovered explicitly; cancellation retains the current work. Normal files need no extra confirmation.
- Asynchronous preview cancellation, saving with unavailable WebGL and narrow English layouts.

## Notes

Ordinary use is offline. Online AI needs your own provider/key and still requires checking: recognized structure and dimensions are not guaranteed.

Existing models remain importable. Export JSON backups regularly. Special section-drawing conventions and very small features still need manual checks.

## Assets

- `three-view-workbench.html`: standalone offline app.
- `three-view-workbench-v0.6.1.zip`: complete app, documentation, license and public examples.
- `SHA256SUMS.txt`: SHA-256 values for those assets.
