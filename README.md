# Three-View Workbench · v0.5.1

[中文说明](README.zh-CN.md) · [Open this build](https://zeder11.github.io/three-view-workbench/app/three-view-workbench.html)

An offline engineering-drawing study tool. In v0.5.1 the front, top and left drawings and their standard 3D camera views share the same edge and visibility calculations. This fixes extra solid lines and missing hidden lines found while checking against the original drawings. A solid line takes precedence where the two styles overlap. The sampling setting still controls fill and overall dimensions. Existing model JSON files open without conversion.

## v0.5.0 features

v0.5.0 adds visual source links and candidate-construction 3D previews to **Explain this line**, plus individual AI-question replies, an independent preview before applying, and editable AI sketches. It builds on the modeling, arcs, local retention, tangent constraints, replay and file features of v0.4.0.

## Compact section controls

Return, direction and position stay together at the top while scrolling. Locator views are smaller, the legend remains visible and longer notes are collapsed. Idle locator views reuse their DOM; stale normal-model section results are discarded and recalculated after model changes. No extra confirmation steps were added.

## Compare A/B at the same section plane

Choose A/B in the candidate comparison, then select **Section A/B at the same position**. Each panel sections the original model with its respective construction applied, sharing direction, coordinate and scale. Locator views use A as the reference. This neither adopts a construction nor edits your work; return to change B. Model changes invalidate the comparison. Equal sampled sections at one plane do not imply identical solids, and thin walls remain sampling-limited.

## Locate the cutting plane

Three locator views inside the section dialog follow its slider. The selected direction is marked as the section face; orange lines locate the plane in the other two views. Temporary sheet overlays disappear on close and never enter the model or exports. Examples and step replay use coordinate guides rather than borrowing an unrelated workpiece or intermediate silhouette.

## Inspect a section

Select **Inspect a section** beside the 3D preview title. Choose a front, side or top section and move its coordinate slider or number field. Final boolean material is hatched; voids remain white. Blind/through-hole examples affect only this preview; **My model** returns to your work. Closing changes no model, history or saved file. The 360-row material scan may miss very thin features. This is an internal section preview, without full engineering section annotations, projected geometry behind the cut, or export.

## Compare candidate constructions directly

Combined candidates now describe each actual tool's side, axis and coordinate interval. Even equal-depth constructions can show different sides of a traced contour. A is the current candidate; select another as B and inspect the suggested view or choose a standard view. Candidate projections fade to grey for context, A-only lines are teal, B-only lines orange, and visibility differences purple. Solid and dashed lines retain their own types.

Tool intervals use model coordinates, not measured source dimensions or proof that a feature is blind/through. If the tolerance and sampled views reveal no visible difference, the panel explicitly asks for other evidence. Comparison reads cached projections without editing the model, annotations or exports, and sends no AI request. Existing follow-up tracing and undoable adoption remain available; details are collapsed by default.

## Code review fixes

This batch fixes stale references and traces when opening another project, late file/image loads overwriting newer choices, false success after a rejected edit, and AI provenance persistence. Provenance is restored only when it matches the model geometry and is cleared after manual geometry changes. Seventeen targeted browser cases were added alongside core modeling, projection, file and sketch regressions, without additional confirmation steps.

Model JSON may contain a cropped reference image; exported drawings do not. Geometry, projection and mesh algorithms are unchanged in this batch. Tests use local fixtures and mocked AI responses; actual homework accuracy, real provider recognition and physical-device use still need checking.

## Satisfy multiple trace conditions together

Comparison can now combine local cuts for distinct conditions such as a vertical hidden line and an L-shaped hidden line. It prefers keeping an already-matching model, uses one cut when sufficient, and searches combinations otherwise. Results list each condition and show 2/2 or 1/2 satisfied; an average score cannot bypass an unmet condition. Adoption and undo group the combined cuts into one edit.

Use **Another trace** for separate lines. Interior connecting strokes that follow the existing outer boundary are recorded explicitly and the actual cut conditions are checked separately, retaining the original points. Search is bounded to three conditions and 96 coarse projections, then rechecks the leading results. Limits are reported; unsearched combinations are not ruled out. Matching the traces within tolerance does not verify the complete three-view answer.

## Open-trace trials and mesh seam repair

Open polylines now offer cuts on both sides of the traced boundary, preserving bends and extending endpoint tangents to the work-domain boundary. Default trials use the lower half, upper half and middle of the model depth; explicit start/end depths replace those trials. Side, extension and depth are assumptions. Split disconnected lines into separate traces and add another view to distinguish alternatives; multiple features may require separate operations.

Bounding-box trials remain inspectable but cannot be adopted. Open-path trials that clearly miss trace positions or visibility also disable adoption with an explanation, without an extra confirmation layer.

Display meshes now intersect mesh edges with final material boundaries instead of linearly interpolating decomposed CSG fields. This fixes seam dents in block-based sketches, including material-change previews, while material, ray and projection routines remain unchanged. Sampling is not increased and genuine holes are preserved; very thin features still require sufficient sampling. The screenshot-based fixture reproduces the defect but is not the original project or a verified answer.

## More precise tracing and contour cuts

Tracing snaps to reference ink when an image is present, otherwise to model edges. It never falls back to model edges when reference ink is missing, and retains your selected line type. Snapping uses a CSS-pixel distance limit, a switch, and an Alt bypass. A 4× magnifier and collapsible coordinate editor help placement. Releasing a dragged point does not jump to another target; cancellation restores its position. Straight-line drawing and matching use the same fitted path.

Choose **Polyline / closed boundary** and enable **Closed cut boundary** for a native cut following 3–24 vertices, including concave corners. Crossings and excessive vertices are explicitly unsupported; verify depth against another view. Open polylines use the side/depth trials described above; their bounding-box approximation is comparison-only. Noncircular traces do not offer usable circular-hole or sphere substitutes. Scores balance traces within each view and then views, so a long outline cannot drown out a short decisive line. Split mixed open curves or add another view; a projection alone does not uniquely determine arbitrary geometry, and match scores are not correctness probabilities.

Closed-boundary flags persist with annotations; magnifier and snap caches are not exported. Preview remains read-only and adoption is undoable.

## A compact review panel

Generation scrolls directly to the independent preview. The default view keeps the interpretation, three collapsed sections (structure, replies and details), a correction field and an action bar. Dimensions, steps, assumptions and diagnostics stay in Details. Revise from instructions sits next to the field; image comparison is in Details. The action bar remains visible while browsing long details and provides cancellation during requests.

For ordinary uncertain results, **Accept N assumptions and apply** or **Apply current assumptions** explicitly accepts this version in one action. These remain assumption records, not verified facts; exports record reviewAction:current-assumptions. Unincorporated replies, pending structure changes, geometry conflicts, incomplete output and unacknowledged fallback results retain their gates. Individual detailed review remains available. Applying is undoable.

## Round bodies and through-hole extent

The prompt now cross-checks rectangular side projections against concentric circles and their axes, rejects block silhouettes absent from the source, and checks that hole cutters span related continuous material rather than only a thin plate. **Cylinder / tube body** is available as round_body. U-shaped lines must be related to connecting material in the other views rather than automatically cut as slots. Questions prioritize structural ambiguity over repeated confirmation of estimated numbers.

A local notice checks explicitly declared, axis-aligned cylindrical through-hole cutters for uncut material touching their end planes. It does not extend a cutter, create an extra mandatory confirmation, or treat separated objects, blind holes, unspecified holes or rotated holes as errors. This is a bounded construction check, not proof of correct image recognition.

## Review structure types, then rebuild

The prompt requests key structure types, brief view evidence and alternatives before geometry in the same response. In **Review the interpreted structures**, change a mistaken counterbore to a boss, a through hole to a blind hole, or a through slot to a local/bottomed slot, then select **Rebuild from structure choices**. Choosing a type records your intent without changing old geometry; applying is blocked until rebuilding. Only clicking rebuild sends another request. Review the returned construction.

**View previous candidate** switches between the two latest previews locally, retaining their replies and choices without changing the workbench. A new problem, pasted JSON or discard clears the pair. Unapplied candidates live in page memory and do not survive a refresh.

The dimension table distinguishes drawing annotations, claimed user input, estimates, previous-model references and unverified sources. Mixed “user / previous version” attribution is treated conservatively as previous-model data. Estimates and accepted AI assumptions do not become user-provided dimensions. The labels organize AI claims; they do not independently verify the source image.

Explicit X/Y/Z fields or direction statements guide dimension checks. A width stated as X=700 with depth Y=500 no longer produces the spurious Y=700 versus500 conflict. Without direction evidence, length X, width/depth Y and height Z remain the fallback; actual conflicts are still reported.

Optional JSON metadata: features, up to12 items, with id/name/kind/steps/evidence/alternatives/uncertain. Kinds: base, round_body, cavity, slot, through_slot, boss, through_hole, blind_hole, counterbore, unknown. Steps are 1-based original modeling steps; evidence has up to3 {view,text} items. Readings may specify axis and source (drawing/user/estimate/previous/unknown). Old responses remain compatible and show missing structure evidence explicitly. Applied exports retain these records without temporary previews or keys.

No “standard answer” for any exercise is hardcoded. Structure labels and AI evidence are not proof of matching geometry; check results against the original drawing.

## Waiting for long AI requests

Each thinking-enabled request or two-image visual review has a 10-minute client deadline; ordinary non-thinking requests have 5 minutes. The waiting indicator shows elapsed time, the attempt limit and retry number. The existing single retry for truncated output or compatibility has a fresh deadline instead of sharing the old 180 seconds.

The deadline covers receiving the entire response body, not just HTTP headers. Timeouts, cancellation and interrupted response bodies do not trigger an automatic resend. Failed revisions retain the preceding candidate, replies and workbench. Cancel stops this page’s wait immediately; stopping computation at the provider depends on its API. Thinking and output budgets are not silently reduced.

Longer waits do not guarantee a response or a correct construction. Complex problem interpretation can still miss; check against the original drawing.

## Compare the generated result with the source

After image-based generation and the independent three views are ready, optionally enter a correction note and click **Compare with source and revise**. This explicitly sends another request to the selected provider: the frozen problem image, the candidate’s actual computed projections, its original-unit model and confirmation records. The prompt asks for view-by-view comparison of outlines, openings, pocket depths, bosses/counterbores and visible/hidden lines. Previously accepted AI assumptions remain assumptions, not source facts.

Previewing alone sends no request. This button adds API usage and time; the returned revision still requires review before applying. Failure or cancellation retains the previous result. Retries preserve the same image pair; subsequent ordinary revisions omit the outdated projection. Mock results, missing source images and pending previews disable this action.

The generated raster is clearly marked as an unverified candidate, uses a common scale for V/W/H, and includes solid/hidden lines without centerlines. Exports retain only a visual-review-requested flag, never the sent images or key. The flag does not certify a match. Recognition results are advisory; check them against the original drawing.

## AI import precision: adjacent bores stay connected

AI primitives now retain floating-point precision through uniform scaling, model validation, saving and reopening, as sketches already do. Rounded UI summaries no longer round the underlying geometry. Independently rounding centers and heights could leave a very thin false membrane between adjacent bore segments, incorrectly hiding the smaller circle.

A six-step stepped-bore example joins both bores at original z=170. The former import produced a gap of about0.0005 working units; full-precision import restores the visible inner rim without changing the projection kernel, line styles or connection tolerances. Real thin layers remain intact.

Reparse original AI input or regenerate to use the fix. Previously saved rounded geometry is not silently inferred or repaired. Existing formats and uniform scale rules remain compatible. This precision repair does not resolve mistaken slot/cavity/boss interpretation or establish a verified match to the drawing.
## Consistency checks and truncated thinking output

Generated and pasted results now include a local consistency check. Explicit overall length/width/height claims are compared with sampled final material projections. Coaxial cylindrical cuts are checked for complete coverage by an earlier bore with no intervening addition. If a counterbore was claimed, coincident bore depths are flagged as a construction conflict; ordinary redundant cuts are notices.

Wait for declared-size checks before applying. Accepting AI assumptions or the general review checkbox cannot bypass a detected conflict. Recheck these findings resends the original problem/image, current model, confirmation records and concrete findings. Alternatively, explicitly acknowledge the conflicts in that section if you still want to study the result. This does not repair it; the exported model retains the findings and acknowledgement. New results require new acknowledgement.

A clean check is not proof of agreement with the source image. Unsupported semantics and sampled thin features still need review; unavailable material bounds are reported as unchecked. Only explicit overall numeric claims and supported coaxial-bore coverage are examined.

Truncated output is retried once with the thinking setting preserved and a larger budget, up to this page limit of32768 (for example8000 →16384). At the cap, diagnostics report that the budget did not increase. Larger budgets may use more time and tokens. See the [DeepSeek API specification](https://api-docs.deepseek.com/api/create-chat-completion/), checked on2026-11-02; this page cap is not the provider maximum.

Disabling thinking is an explicit new attempt, not a silent automatic fallback. Such results, and compatibility retries omitting a rejected thinking parameter, require a separate acknowledgement. Diagnostics distinguish a complete API response from a correct construction. Requests, cancellations, original context and per-result review remain independent of the workbench model.
## A shorter candidate list and a continuous follow-up

After tracing, use Compare possible constructions. Up to three computed candidates are shown first; every other construction remains in the selector. Individual trials, parameter refinement and detailed scoring are expandable. Low scores do not rule out a construction family, and match percentages are not answer probabilities.

When candidates are close, two distinct predictions highlight a suggested view and region. Trace this view creates an empty trace, collapses the panel and locates the amber region. Trace only evidence present in the original problem, not a candidate prediction.

The region stays visible while drawing. Back to compare opens the panel; set the line type and Compare with the new trace. Cached candidate projections are rescored against all actual evidence only while the base model, parameter-driving trace and configuration remain unchanged. Conflicting evidence can lower old scores. Changing those inputs invalidates reuse. Finish guide leaves your hand-drawn evidence intact. An untraced region is not treated as proof that no line exists.

## DeepSeek modeling and revision

The prompt now emphasizes dimension chains, view correspondence, blind-hole entrance/depth, explicit uncertainty and changes limited to relevant steps. It corrects the old instruction that forced cutting planes to corners: the position must lie on the actual cutting plane.

Revision results show changed, added and removed input steps, changed fields and unit changes. Comparison uses original units and step order; reordering also appears as a change. This is not semantic feature matching, dimension locking or proof of correctness.

The suspected-empty check now reads the real projection object. If fast sampling finds no solid in all three standard directions, the result asks for review; thin features may still be missed.

For the official DeepSeek endpoint, the known text-only deepseek-v4-pro configuration is stopped before an image request, with an explanation; model preferences are never silently replaced. See the [vision guide](https://api-docs.deepseek.com/guides/vision/) and [model-capability documentation](https://api-docs.deepseek.com/guides/anthropic_api/), checked on 2026-11-02.

The change fixes workflow and known issues; it does not raise recognition accuracy on real problems. Check results against the original drawing.

## Trace a line and inspect a possible construction

Start with a rough base solid. Under Explain this line → Trace to find a cut, trace a problem line and compare candidates. Select See this construction in 3D to rotate an independent preview.

- Switch Before / After / Material change without changing the camera. Grey is unchanged material, orange removed material, teal added material. The difference excludes cutter extents outside the solid and pre-existing holes.
- Hide unchanged material to inspect the changed volume alone. Use front/top/left camera presets or reset.
- The three views retain your traces and mark added, removed and visibility-changed lines. Each candidate explains how a cutting face, pocket wall or hole wall could produce the traced line.
- In After, locate nearby candidate model lines. Amber dashes show position through material, not drawing visibility or proof that this step created the line. Matches may be ambiguous; absent matches are reported rather than guessed.
- Switch among already computed candidates in the window. Back to candidates or Esc returns without changing your work. Adopting a candidate remains an explicit, undoable action.

Import the [trace-to-hole exercise](examples/trace-cut-hole.json). It contains a base box and three front/top traces, with no hole already modeled. Compare candidates, select Hole along this view, and inspect it in 3D before adopting. This is a synthetic teaching fixture, not recognition evidence.

The fast 42³ mesh may miss thin features; cross-check the three views. A high match on one view does not establish depth or uniqueness, and match is not the probability of a correct answer. Candidate families, scoring and fitting algorithms are unchanged in this batch.

## Editable AI sketches (2026-11-02)

AI output now supports closed straight/arc profiles and circular sections, extruded from the front, top or left view with add, subtract and local-retention operations. Review and preview the result, then apply it. **Edit profile** remains available afterward; undo, model download and reopening preserve editable geometry.

Use the local mock provider and the arc-section or local-reduction example buttons to try the workflow. These are fixed demonstrations, not image recognition. Importable workbench models: [arc plate](examples/ai-arc-plate.json), [local cylinder reduction with an existing hole](examples/ai-retain-cylinder.json), [concave section](examples/ai-concave-section.json). Their raw [arc](docs/ai-input/arc-plate.json), [retention](docs/ai-input/retain-cylinder.json) and [concave](docs/ai-input/concave-section.json) AI answers belong in the AI result box, not the main model importer.

Retention removes existing material outside the profile only within the specified depth slab. It preserves existing holes and material outside the slab. Concave profiles may compile into several internal blocks, grouped as one editable step. The eight existing primitive types remain available; compiled sketches use existing native model formats.

### Input contract

Use `type:"sketch"`, explicit `op:"add"|"sub"|"keep"`, `view:"V"|"H"|"W"`, and `profile:"polygon"|"circle"` (polygon by default). All coordinates, signed sagittas and depths use original input units and share the model's uniform scale and translation.

| View | Point coordinates | lo/hi depth axis |
|---|---|---|
| V | [X,Z] | Y |
| H | [X,Y] | Z |
| W | [Y,Z] | X |

These are increasing world axes, not screen pixels. Polygon profiles have 3–24 points, implicitly closed without repeating the first point. The `arcs` object maps zero-based segment indices to signed sagittas; positive bulges left of the directed segment. Absolute sagitta must be less than half the chord length. Split semicircles/major arcs into minor arcs, or use a circle with two points: center and a point on the circle. Require `lo < hi`; coordinate, sagitta and depth magnitudes and depth span must not exceed 100000. Numbers cannot contain units or formulas.

Subtract/keep require prior additive material. Both input steps and compiled internal shapes are limited to 128. Invalid, self-intersecting, out-of-domain or collapsed profiles are rejected rather than distorted. Only subtract/keep depth slabs may be clipped to the working domain, with a notice. Arbitrary rotated sketch planes, taper, constraints and internal half-space fields are unsupported. Unsupported structures should be reported by the AI.

Manual edits clear AI provenance metadata under existing behavior while retaining geometry and editable drafts. Tests cover schema, geometry and browser workflows using mocks/intercepted requests; real-provider recognition accuracy and new physical-device behavior have not been evaluated. Dimension locks and semantic hole-depth checks are not implemented.

## Review AI results

Generated and pasted results have independent three-view thumbnails. **Expand preview** shows first-angle projections and an interactive solid. The views use 320 samples; the solid uses a fast 42³ mesh that may miss small features. Envelope dimensions are sampled approximations converted back to the input units, not recognized dimension callouts.

Questions are in Reply / conditions. Review them individually or explicitly accept this version’s assumptions in one action from the application bar. Typed replies still require **Update model from replies** before applying; the combined acceptance and general checkbox cannot bypass unincorporated replies. Accepting an assumption does not establish a verified fact.

Reply updates and ordinary revisions resend the original problem, image and confirmation records to the selected AI provider. Records accompany later revisions and are saved in applied AI metadata. They are contextual data, not dimension locks or automatic geometry verification. Editable sketch support is described above.

The preview runs locally and leaves the workbench, undo history and exported drawing unchanged. Failed or cancelled revisions retain the preceding result and replies. Preview failures can be retried; the three views remain available without WebGL. **Apply to workbench** remains an undoable edit.

## Try it

1. Open the workbench and import the [cylinder example](examples/source-links-cylinder.json), or add a cylinder.
2. Choose **Explain this line → Pick an existing line**, then click a solid or dashed line on the main drawing sheet.
3. Select a source to highlight its location in the three views and in 3D. Use **Locate in 3D** and **Back to line sources** to move between them.
4. **Locate step** highlights a related modeling step without editing or starting replay. **Clear highlight**, closing the panel, or changing the model clears the location overlay.

The [box example](examples/source-links-box.json) demonstrates coincident projections and edges projecting to points. The [through-hole example](examples/box-with-hole.json) demonstrates hidden lines.

Teal indicates corresponding projections. Violet indicates reference locations on a curved surface: a tangent silhouette changes with viewing direction, so its points do not necessarily form a silhouette in another view. Amber dashes in 3D are visible through material and indicate location, not drawing visibility.

Sources may be ambiguous. Up to four nearby sources are shown, with an explicit notice when others exist. Related steps express geometric association, not unique modeling causation. Coincidence detection is sampled and may miss overlaps; the original drawing determines line precedence. Small features, shallow intersections and near-tangent cases retain sampling limitations. Unmatched queries are reported rather than guessed.

The original tracing and candidate-comparison workflow remains available under **Trace to find a cut**. Picking a line preserves existing traces and reference images. Transient source data and colored overlays are excluded from model JSON and SVG/PNG exports. Saved model JSON can still contain your own traces and reference images.

Ordinary modeling and source queries run locally and never need a network. Local records stay in this browser only. A model JSON may contain annotations and problem images you saved yourself, so check before sharing a file. AI requests are sent to your chosen provider only when you actively use that feature. An API key must be configured: ticking “Remember key” stores it in plain text in this browser; leaving it unticked keeps it in page memory only, and exporting a model never writes the key.

Author: [zeder11](https://github.com/zeder11). See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This feature adds no third-party runtime libraries.
