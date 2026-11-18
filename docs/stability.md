# v0.7.0 build and verification

Open [the workbench included here](../app/three-view-workbench.html). You can export your current model JSON as a backup before updating. The included examples remain importable.

Offline workflows include model import, three views, 2D and 3D previews, drawing export and undo. The generation workflow was tested with a mocked endpoint. Check online AI results against the original drawing. See the [drawing aid guide](source-observations.md) for usage.

In one paired test on a synthetic drawing, Argon produced identical correct geometry with cross-view cues enabled and disabled. Overall first-pass accuracy remains unmeasured.

See [BUILD-BASELINE.json](../BUILD-BASELINE.json) for the application size and hash and [SHA256SUMS.txt](../SHA256SUMS.txt) to verify the package files.
