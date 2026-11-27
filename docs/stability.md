# v0.8.2 build and verification

[Open this build](../app/three-view-workbench.html). You can export a model JSON before updating to back up your current work.

Offline Edge checks covered `K.mesh` 3D AABB parity across 19 synthetic models (38 comparisons vs v0.8.1, byte-identical vertices and normals), `84³` speedup benchmarks, persistent Worker reuse, background-encoded Binary STL export with thin-feature and through-hole ray clearance checks, the `l_bracket` recipe, export cancellation sync guards, Skill CLI `--stl` + atomic transactional commits, English UI text, and desktop (`1440×900`) and mobile (`390×844`) layouts.

The AI checks used local examples and simulated responses. They measured workbench behavior; recognition accuracy across AI providers remains unmeasured.

See [BUILD-BASELINE.json](../BUILD-BASELINE.json) for the application size and hash. Verify the rest of this package with [SHA256SUMS.txt](../SHA256SUMS.txt).
