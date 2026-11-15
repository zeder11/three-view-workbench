# Local material checks and scoped repair

Use the existing **Details → Local consistency check** in an AI result. No new required fields or per-part confirmations are added.

- **Material inside a declared bore:** for `through_hole` features linked to cylindrical removals whose final axis aligns with X/Y/Z, trace the centre and four interior radial paths. A single-step feature with a matching `spatial.range` uses that physical range in original units; otherwise only the tool span is checked. A short tool or later addition plugging the bore can be detected. A declared/actual axis mismatch is also reported.
- **Declared contact with a gap:** optional `checks` records identify two additive steps expected to touch directly. Separated conservative envelopes report XYZ gaps. Ordinary/native-arc sketches and common primitives have envelopes. Overlap does not prove a joint, and later removals are not certified by this contact check.

```json
{"checks":[{"kind":"contact","steps":[1,3],"source":"user","note":"The base and rib touch directly"}]}
```

Steps are one-based. Up to 16 declarations may reference two different additive steps. Sources are `drawing/user/estimate/unknown`; AI-reported sources still need review. Invalid entries are skipped with warnings, do not change geometry, and are not treated as checked. Existing JSON requires no new fields.

**Repair only the affected steps** explicitly requests an AI revision with permissions limited to located steps. Units, step order and other inputs stay locked; appends are not allowed. An overall-size issue without located steps grants no whole-model editing permission. Insufficient permissions should be reported; existing revision/source-review controls remain available to choose another scope.

Depth repairs only change depth and axial position, preserving bore radius, transverse position and rotation. An axis conflict only changes the axis selection. Declared contact operands remain additive. Use the existing revision controls for a different shape or hole location.

The repair retains the existing bounded retry, never loops automatically, does not invoke the extra structure-reading stage, and never auto-applies. Original declarations (features, bore ranges, contacts, readings and assumptions) are retained for rechecking, so removing text cannot clear an unfixed conflict. The previous candidate remains available; out-of-range edits are intercepted and service failures do not replace it.

Valid contact records round-trip with AI provenance. Older versions can read geometry but do not run these checks.

These checks compare **claims with local geometry**, not claims with the source image. Traced bore paths do not prove the full cross-section is clear. Oblique bores, arbitrary surfaces and actual post-cut joints are not fully verified. Review the preview even when no conflict is found.

## Whole-part and component sizes

Whole-part sizes remain checked, while directly attached component descriptions such as “overall length60 of the boss” are not compared with the whole model. A later mention of a hole or boss does not suppress a genuine whole-part claim. Chinese component descriptions before or immediately after the number are handled in the same way.

This is a limited text rule, not general language understanding. When supplying optional readings, use scope:overall or scope:feature according to the actual dimension. No detected conflict does not prove the drawing or its dimensions were interpreted correctly.
