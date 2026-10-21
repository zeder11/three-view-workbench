# Three-View Workbench — an engineering-drawing learning tool

A single-file, offline, zero-install web app for **descriptive geometry**. You build a part from
primitive solids and ordered boolean cuts, and the app renders the three orthographic views
(front / top / left, first-angle projection) plus an interactive 3D preview — so you can check
your reading of a drawing by reconstructing it instead of guessing.

> **The UI is currently in Chinese.** The tool was built for a Chinese engineering-drawing course.
> Every feature is usable without Chinese if you follow this README; an English UI is not available
> yet. Open an issue if you would find it useful.

![Workspace](docs/draft-section.png)

## Why another CAD-ish toy?

Full CAD is the wrong tool while you are still learning to read drawings: you need to answer
"what solid would produce these three views?", not "how do I constrain this sketch?".
This app is deliberately small and use-case driven:

- **Sketch a section and extrude it** (triangle, trapezoid, L, V-slot, any non-self-intersecting polygon).
- **Sketch a section and cut it** — through, or to a given depth; circles become real cylinders.
- **Draw a line in a view and cut one side** — for cuts that project as a line.
- **Define a cutting plane by three points** — located across two views, no trigonometry.
- **Step replay** — see the model after each boolean step without touching undo history.
- **Overlay a photo of the problem** and calibrate it with two known points, then trace over it.
- **Point correspondence guides** — click a point, see the same point in the other two views and in 3D.
- **Solid / visible-outline / hidden-as-dashed** rendering, FXAA and optional high-resolution mesh.

## Quick start

1. Download this repository (Code → Download ZIP) and unzip it.
2. Double-click `app/three-view-workbench.html`. That is the whole installation.
3. The sample model appears immediately. Drag on the 3D view to rotate; scroll to zoom.
4. Open **File → 打开模型** (open model) to load one of the `examples/*.json` files.

Everything runs locally. No server, no npm, no CDN, no telemetry, no network requests unless you
explicitly configure an AI provider and press the generate button.

Requirements: a recent Edge / Chrome / Firefox with WebGL. If you load the file over `file://` and a
provider rejects the origin, an optional tiny Node static server is included in the original
development tree (not required for the drafting features).

## How it works

- A ray-intersection kernel evaluates a CSG tree of convex primitives (`box`, `prism`, `pyramid`,
  `cylinder`, `cone`, `frustum`, `sphere`, and half-space `poly` cutters) analytically.
- The three views are extracted by sampling a 320² (configurable) grid of rays per view, then
  contour-tracing and sub-pixel refining the boundaries. Visible edges, hidden edges and silhouettes
  are separated by comparing neighbouring face ids.
- The 3D preview is a marching-tetrahedra surface mesh, independent of the drafting pipeline.
- Sketched sections are compiled into the same half-space `poly` primitives the kernel already
  understands, so drafting results stay consistent with hand-built models.

## Known limitations

These are real and documented on purpose:

- **Sampling-based, not exact CAD.** Features narrower than one sample cell can disappear; increase
  the drafting resolution if a slot or boss vanishes.
- Smooth junctions (e.g. cylinder meeting a hemisphere) may draw one extra edge.
- Silhouette outlines in 3D come from the sampled mesh: they can look faceted or double near sharp
  corners, and are not analytic edges.
- The 3D mesh is independent from, and coarser than, the drafting result. Use it for intuition only.
- Two given views do not determine a unique solid. The app helps you build and check a candidate; it
  does not claim to derive "the" answer.
- The optional AI panel only produces a JSON description of primitives. Reading accuracy on real
  problem photos has not been validated, so treat its output as a draft to correct.
- Model units are abstract 0–100 work-volume units, not millimetres.

## Repository layout

```
app/three-view-workbench.html   the application (single file)
examples/*.json                 small original models you can open
docs/*.png                      screenshots
THIRD_PARTY_NOTICES.md          embedded FXAA licence notices
LICENSE                         MIT
```

## Development notes

This began as a personal study aid during an engineering-drawing course. I set the requirements,
used it on real homework, and reported what broke; most of the code was written with AI assistance
and reviewed through a test suite (geometry assertions, 100-model projection fingerprint regression,
and headless-browser interaction tests). The test suite lives in the development tree and is not
part of this release.

Bug reports with a screenshot and the model JSON are the most useful thing you can send.

## Licence

MIT — see [LICENSE](LICENSE). The embedded FXAA shader keeps its upstream MIT/BSD notices in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
