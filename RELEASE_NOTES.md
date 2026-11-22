# v0.8.0 release notes

This release adds mechanical recipes, drawing checks and DXF export. It also improves scoped AI revisions and the construction of tangent arcs.

## Highlights

- Build boss flanges with evenly spaced bolt holes or stepped shafts with an optional keyway from dimensional parameters.
- Limit AI revisions to selected steps and retain confirmations for unchanged evidence. A reading returns to review when its value or linked geometry changes. Supported holes can be previewed locally as through or blind holes.
- Give AI sketches obround centres and radii, or identify corners to round. The workbench calculates the tangent points and arcs. Eligible nearly tangent joins can be adjusted in a local preview for review.
- Review outlines and hidden lines, dimensions and annotations, sections, and smooth transitions. Checks without sufficient evidence remain unverified. Export the three views or an A–A full section as a layered 2D DXF.

DXF files contain 2D linework and text-based dimensions. Review AI candidates against the source drawing, especially where dimensions, hole depths or tangent transitions are unspecified.

## Downloads

- **three-view-workbench.html** — open directly in a browser for offline use.
- **three-view-workbench-v0.8.0.zip** — application, documentation, licence and public examples.
- **SHA256SUMS.txt** — checksums for the two downloads.
