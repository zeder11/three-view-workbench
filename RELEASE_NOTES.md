# v0.7.0 release notes

This update expands the drawing evidence available to AI modelling and reorganizes the AI panel. The workbench still opens offline from a single HTML file.

## What changed

- **Cross-view cues for checking holes.** The workbench links isolated top-view circles to compatible boundary pairs in the front and left views of clear first-angle drawings. Built-in generation and copied instructions use the same cues.
- **Circle observations and slight-rotation correction.** The drawing aid estimates relative centres and radii and corrects slight rotation on a temporary copy when the direction is reliable. A polygon filter reduces false circular observations, with fallback for missing or ambiguous evidence.
- **AI panel layout.** Common actions are easier to reach. You can still preview a candidate and compare it with the drawing before applying.

Overall first-pass accuracy remains unmeasured. Verify marked dimensions, through/blind relationships and material against the drawing.

## Downloads

- **three-view-workbench.html** — standalone offline application.
- **three-view-workbench-v0.7.0.zip** — application, documentation, licence and public examples.
- **SHA256SUMS.txt** — SHA-256 checksums for the Release downloads.
