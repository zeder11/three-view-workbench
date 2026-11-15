# v0.6.2 stabilization baseline

2026-11-15. The current feature scope is fixed for everyday use and reproducible defect fixes. This does not certify AI recognition of complex drawings.

Open [the workbench in this package](../app/three-view-workbench.html). Export your current model JSON before updating. Older files are retained and existing models remain importable.

- Modeling, three views, solid preview, centrelines, full sections and export keep their existing workflows. Preview and local checks make no AI requests.
- Review an AI result before applying it; applying is undoable. Drawing observations help with proportions and some line segments. Bore type, through/blind relationships and complex layers still need comparison with the source.
- Linework comparison, local refinement and structure-first generation retain their experimental labels. No new entry points are added during stabilization, and experimental output is not a correctness certificate.
- At a configured budget of 32768, truncated or empty output does not automatically repeat the same request. Truncated text remains an unaccepted draft; an explicit retry may incur charges. One bounded retry is retained when the budget can increase or a specific parameter can be corrected.

Local checks cover parameter/provenance protection, persistence, input safety, preview cancellation and workers, projection/solid outlines, centrelines, full sections and compatibility of independently constructed generic models. Offline and fake-provider tests do not measure real AI recognition accuracy.

No extra physical-device acceptance is required for this pass. Narrow-screen and touch checks are browser emulation; concrete issues can be reproduced during use. BUILD-BASELINE.json and SHA256SUMS.txt record this package baseline.
