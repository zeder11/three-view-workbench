# Three-View Workbench · v0.6.1 complete guide

[中文说明](../README.zh-CN.md) · [Open this build](../app/three-view-workbench.html)

v0.6.1 restores silhouettes where a cylindrical cut is exactly tangent to a planar face, and prevents the corresponding outside rim from appearing only as hidden edges. The drawing, standard 3D outlines and SVG export share the fix. Existing models open without changing their dimensions.

v0.6.0 adds an exportable A–A full section to **Inspect a section**, with three principal planes and reversible viewing direction. The existing cut face and A/B comparison remain available.

This release also restores missing straight edges that end at tangent sketch arcs and removes false seams caused by using a neighbouring arc's support circle. This applies to drawings, 3D outlines, and SVG export. Existing model JSON files need no conversion.

Enable **Centre / symmetry lines** in the drawing options to add centre crosses, bore axes and whole-view symmetry lines. The option is off by default. When enabled, PNG and SVG exports include the marks. Only axes supported by the current projection are drawn; ordinary corner rounds and oblique bores are excluded. Try the [bracket with multiple bores](../examples/centerlines-bracket.json).

v0.5.2 fixes missing hidden bore lines where a hole crosses a coplanar joint. The top drawing, SVG export and 3D hidden-line view now show the two bore lines. Existing models open without conversion.

The 3D preview also suppresses stray crease fragments at an exact, smooth cylinder-to-sphere join. Genuine shoulders and shallow intersections remain visible.

[17 importable outline exercises](../examples/complex-outlines/README.md) cover oblique and intersecting bores, thin webs, partially hidden rims, and smooth and stepped joins.

An offline engineering-drawing study tool. In v0.5.1 the front, top and left drawings and their standard 3D camera views share the same edge and visibility calculations. This fixes extra solid lines and missing hidden lines found while checking against the original drawings. A solid line takes precedence where the two styles overlap. The sampling setting still controls fill and overall dimensions. Existing model JSON files open without conversion.

## AI panel: input first, review next

Choose **Generate · image / text** or **Use GPT or another AI** at the top. The external-AI route groups copying instructions, pasting JSON and reading its preview. Full instructions remain expandable. Switching routes retains text, images and pasted JSON and sends no request.

After a successful generation or paste, inputs collapse and the current preview comes first. Click a thumbnail, or use Enter/Space, to open the expanded preview. **Revise from instructions** and **Compare with source** sit together below the correction field; optional section controls are nearby rather than inside dimension tables and API diagnostics.

Examples, image-sending details, interpretation and technical checks expand on demand. Empty structure/reply groups are hidden, while actual questions, conflicts and existing apply checks remain available. Folding, changing language and reopening retain correction text, replies and section coordinates. Apply and cancellation remain available without new confirmations.

The panel organization retains the generation and paste flow. This version also adds the source-review edit-range guard below. Material and projection calculations are unchanged; recognition still needs human review.

## Review edit range

A compact **Review edit range** control sits beside **Compare with source**. It defaults to **Check only · all steps locked**: the AI can report issues but must keep the original geometry. To change a bore depth, select that bore step. Unselected steps retain their original-unit input parameters. New features require the separate **Allow appending steps at the end** option; selecting all existing steps does not enable appending.

The app compares the actual returned parameters locally. The AI's claimed preserved steps do not grant permission. Changed units, edits to locked steps, original-step removal or shifting, and unapproved appends are blocked. An in-range result remains a candidate and is never applied automatically.

When blocked, the original candidate stays active and the extra edits are listed. **View blocked candidate** lets you compare its geometry, but normal confirmation or accepting assumptions cannot apply it. Return to the original, or explicitly **Accept the listed extra edits**, then review the existing checks before applying. Changing the selection does not retroactively clear a block. Retries retain the range frozen when the request started; a new source review uses the new selection.

This range governs **that source review and its retries**. A separate instruction-based revision, reply update or structure rebuild is a new generation. The guard checks step parameters and positions, not equivalent geometry or the final material affected by dependent booleans. Compare the final shape: passing this check does not verify the answer. Existing JSON remains compatible. Reloading or a fresh generation starts with all steps locked. Applied range checks and explicit extra-edit acceptance are saved as historical metadata, not permission for a future request.

## Source review and before/after comparison

Use **Compare with source** beside the AI result's correction action to explicitly send the source and current model projections. The review requests concrete views, locations, differences and affected prior steps before a complete revised model. A short assessment is shown; **Differences and edits** is collapsed by default. These are AI claims, not software-verified matches. Legacy responses without a report show an explicit fallback and retain graphical comparison.

**Before / after review** offers front, left and top views. Matching units are aligned in original world coordinates at the same scale; changed units are explicitly marked as not directly comparable. Switch back using **Previous candidate** and apply only when satisfied. Reviewing never automatically chooses a candidate or overwrites your work.

If the problem requires a full section and its plane is known, open **Attach a full section (optional)** and specify direction, original-unit coordinate and viewing direction. The initial coordinate is the candidate centre; adjust it to the problem. A–A is not inferred. The model section occupies the unused lower-right part of the same projection image, so the request still contains only the source and one model image. Hatching follows actual material; special rib conventions are not automatic. The result also supports local **Same-plane full section** comparison and a network-free retry if that calculation fails.

Section preparation can be cancelled and stops when the panel closes. Invalid coordinates or preparation failures send no review request and preserve the candidate and work. Review remains an explicit action, not an automatic extra round, and does not guarantee a correct reconstruction. The range check verifies editing permission, not recognition accuracy.

## AI spatial records

AI modelling now identifies the drawing type and dimensions, records a few key features' axes, actual extents in source units, material or void, component relationships and view evidence, then generates geometry. In-app requests and instructions copied to another AI share this contract. Missing views are not invented; unknown extents remain unknown.

A read-only **Spatial records** panel is collapsed by default inside **Details**. These are AI explanations, not image matching, geometric verification or dimension locks. No extra confirmation or automatic request is added; existing structure choices and apply controls remain available.

Key `features` may optionally include `spatial`: `axis` is `X/Y/Z/unknown`, `range` is a source-unit world-coordinate `[start,end]` or `null`, `material` is `solid/void/mixed/unknown`, `relation` is a short component relationship, and `source` is `drawing/user/estimate/previous/unknown`. Extents describe the actual feature, not an oversized tool. Invalid ranges are shown as unknown, without reordering endpoints or changing material. Records survive save, reimport and subsequent revisions. Legacy JSON needs no new fields. The workflow was verified locally; improved real-provider recognition has not been measured.

## Dimension scope and intersecting connections

AI readings now distinguish **Whole part, Feature, Offset and Unscoped**. Only explicitly scoped whole-part dimensions, or clearly named legacy overall dimensions, are compared with the final material envelope. X/Y/Z indicates direction only. Local readings are no longer flagged merely for differing from the whole envelope; genuine overall conflicts remain detectable. This does not verify local or offset values.

Generation, revisions, source-image review and instructions copied to another AI now distinguish planar contact from penetrating intersections. Connection limits and expected surface intersections must follow dimensions and surfaces, without breaking through the far side. Correct existing bodies and unrelated dimensions should be retained. The app never automatically extends an extrusion.

Readings may include `scope: overall / feature / offset / unknown`; local or offset readings may reference logical `steps`. These fields are optional. Existing model files and material calculations remain compatible, with no additional forms or confirmation steps. The rules and workflow were verified offline; actual recognition still needs review, and existing models are not automatically corrected.

## Reliable saving and AI requests

After a WebGL context loss, naming a saved model, reading its camera state and exporting the file remain usable. The affected solid preview explicitly asks for a reload or reopening; drawings remain available. Reference fitting ignores callbacks from an older image, model or layout. A failed record rename leaves both memory and storage at the original name.

Independent AI-generated and pasted models reject removal or retention before the first material addition. The error identifies the step; boolean operations are never silently reordered. Existing model files keep their original sequential semantics.

Ordinary parameter errors, oversized requests, context overflow, rate limits and server errors are not automatically repeated. At most one automatic retry is allowed for an incomplete successful response, an explicitly unsupported JSON/thinking parameter actually sent, or a confirmed smaller output-token limit. Diagnostics report actual budget changes, and the final error describes the last attempt. Transport failures and timeouts are not automatically repeated either.

For incomplete pasted JSON, **Complete the pasted model** carries the original JSON and parsed draft, even without a description; subsequent retries retain that source. This is an explicit API request requiring your configuration. Missing construction still needs review; the app cannot recover information absent from the supplied material. Failure or cancellation retains the draft without adding confirmation steps.

## Fine detail in the AI solid preview

In **AI modelling → Expand preview → 3D quality**, Auto first shows a fast 42³ mesh, then refines to 84³ while you are not dragging. Fast and Fine can also be selected explicitly. Refinement sends no new AI request and changes no workbench model, views, undo history or saved file.

The current mesh stays in place while any pointer remains held. Updating resumes after the last pointer is released; closing the preview or AI panel cancels computation. Both levels are cached for the current result and reused on reopening; replacing the result clears the cache. A failed fine update retains the available fast mesh and offers retry, without claiming fine detail is ready.

An 84³ mesh improves small holes, thin ribs and curves, but can still miss very small features. Check the orthographic views.

The expanded orthographic views support shared 100%–600% zoom with +/−, the wheel or a two-finger pinch. Drag an enlarged view or use the arrow keys to pan it independently; Reset restores the complete views. All three views share the zoom and keep their own pan. A new result resets the framing. Zoom changes no thumbnail, model, drawing or image sent for AI review.

The three-point plane cut and candidate construction previews also offer Auto, Fast and Fine. Auto starts at 42³ and refines to 84³. Holding a pointer pauses updates until the last pointer is released; closing cancels computation. A failed update retains the available mesh and offers retry. Before, After and Material change use the same selected quality. Up to three recent fast bundles and one fine bundle are cached; display-mode switches reuse them. These quality choices change no orthographic projection, formal export, candidate generation or scoring algorithm.

## Clearer controls and more room for the drawing

The light drafting interface now uses more consistent control sizes, text and spacing, with quieter card borders. **Model tools** starts expanded on desktop and folded on mobile. Expand it to sketch, add primitives and edit steps; **Edit size** opens the relevant parameters automatically.

Opening AI temporarily folds Model tools to leave more room for the drawing. Closing AI restores its earlier state and retains the inner disclosures. Full-section controls share the typography and spacing updates. Folding panels changes no geometry, auxiliary lines or drawing exports.

## Capsule centre lines and 3D full-section location

**Centre / symmetry lines** now recognises cardinal capsules made from native straight and circular-arc segments, including subdivided collinear sides. It marks the long axis and both end-arc centres when supported by the final projection. Filled slots leave no marks; ordinary corner rounds, diagonal capsules and tilted extrusions are not automatically marked. Sheet PNG/SVG exports include these lines.

The full-section window has an independent centre-line switch, initially following the main sheet setting. Reference views, section drawings and A–A PNG/SVG exports share the marks. Supported longitudinal bore axes remain after bisecting their circular ends, and reverse viewing mirrors the positions.

**3D location** shows a rotatable remaining solid or the original model. Amber dashes locate the cut plane and viewing direction. Dragging the position slider moves the locator first; the solid rebuilds after release. Collapsing or closing cancels computation. The panel starts open on desktop and folded on narrow screens. Previewing changes no model, undo history or saved file; 3D is excluded from drawing exports. Fine features remain limited by mesh resolution.

AI reading instructions now explicitly separate hidden dashes from centre dash-dot lines and require contour, dimension or cross-view evidence for holes and slots. A centre line alone must not create geometry. These prompt constraints cannot guarantee a provider's recognition accuracy.

## Security and annotation storage fixes

Server-provided API diagnostic fields are rendered as text. API endpoints require HTTPS; HTTP is limited to localhost, 127.x.x.x or [::1] loopback addresses, excluding ordinary LAN HTTP. Redirects are blocked; enter the final directly accessible endpoint.

Cropping a reference now saves immediately. Autosave, named local records and JSON export keep the same accepted raster instead of silently omitting it at different size thresholds. Oversized crops are compressed to JPEG with a fine-line check notice. If browser storage is full, an explicit error retains the previous successful record; export JSON to back up the complete current work. Only record thumbnails may be omitted to save space; older models and references are retained.

Model files and named records validate geometry independently. Invalid geometry is rejected. If geometry is valid but annotations or references are damaged, explicitly choose to load only the model, or cancel to retain the current work. Recovery skips that document’s annotations and references without rewriting the source file or named record. Undo/redo restores the paired model, traces and reference images. Valid documents require no additional confirmation. Style tag closures are also repaired.

Arc indices must be canonical decimal strings such as `0`, `1`, `2`. Ambiguous keys such as `01`, `1.0` or space-padded indices are rejected instead of silently becoming straight edges, including legacy arc expansion and validation. Imported AI confirmation records retain only the question, answer and kind; additional credential fields are filtered. Review your own text before sharing a model file.

## v0.5.0 features

v0.5.0 adds visual source links and candidate-construction 3D previews to **Explain this line**, plus individual AI-question replies, an independent preview before applying, and editable AI sketches. It builds on the modeling, arcs, local retention, tangent constraints, replay and file features of v0.4.0.

## Compact section controls

Return, direction and position stay together at the top while scrolling. Locator views are smaller, the legend remains visible and longer notes are collapsed. Idle locator views reuse their DOM; stale normal-model section results are discarded and recalculated after model changes. No extra confirmation steps were added.

## Compare A/B at the same section plane

Choose A/B in the candidate comparison, then select **Section A/B at the same position**. Each panel sections the original model with its respective construction applied, sharing direction, coordinate and scale. Locator views use A as the reference. This neither adopts a construction nor edits your work; return to change B. Model changes invalidate the comparison. Equal sampled sections at one plane do not imply identical solids, and thin walls remain sampling-limited.

## Locate the cutting plane

In cut-face mode, three locator views follow the slider. The selected direction is marked as the section face, and orange lines locate it in the other two views. Temporary sheet overlays disappear on close and are excluded from the model and ordinary three-view export. A–A has its own export.

## Inspect a section

Select **Inspect a section** beside the 3D preview. Choose a front, side or top plane and set its position. **Cut face only** hatches cut material; **Full section** adds visible edges behind the plane and a source view with A–A arrows. Reverse the viewing direction or export the annotated pair as SVG or PNG. Try **Cut face vs full section** to see when the step behind the recess becomes visible. **My model** returns to your work. Neither mode changes the model or its history. This version supports one cutting plane at a time. Hatching follows actual material; special drawing rules for ribs are not applied automatically. Check assignment requirements. The full-section interface and PNG/SVG exports retain this note.

## Compare candidate constructions directly

Combined candidates now describe each actual tool's side, axis and coordinate interval. Even equal-depth constructions can show different sides of a traced contour. A is the current candidate; select another as B and inspect the suggested view or choose a standard view. Candidate projections fade to grey for context, A-only lines are teal, B-only lines orange, and visibility differences purple. Solid and dashed lines retain their own types.

Tool intervals use model coordinates, not measured source dimensions or proof that a feature is blind/through. If the tolerance and sampled views reveal no visible difference, the panel explicitly asks for other evidence. Comparison reads cached projections without editing the model, annotations or exports, and sends no AI request. Existing follow-up tracing and undoable adoption remain available; details are collapsed by default.

## Code review fixes

This batch fixes stale references and traces when opening another project, late file/image loads overwriting newer choices, false success after a rejected edit, and AI provenance persistence. Provenance is restored only when it matches the model geometry and is cleared after manual geometry changes. Seventeen targeted browser cases were added alongside core modeling, projection, file and sketch regressions, without additional confirmation steps.

Model JSON may contain a cropped reference image; exported drawings do not. This release adds A–A full-section views plus centre and symmetry lines, and fixes outlines that were missing near arcs. Projections are still computed by sampling; AI recognition is not guaranteed, so check results against your own problems.

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

Successful generation collapses the inputs and scrolls to the independent preview. Revision and source comparison sit below it. Structure and reply folds appear when relevant; dimensions, steps, assumptions and diagnostics remain in Details. The action bar stays available while browsing and provides cancellation during requests.

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

Import the [trace-to-hole exercise](../examples/trace-cut-hole.json). It contains a base box and three front/top traces, with no hole already modeled. Compare candidates, select Hole along this view, and inspect it in 3D before adopting. This is a synthetic teaching fixture, not recognition evidence.

The candidate solid preview starts at 42³ and automatically refines to 84³; Fast and Fine can also be selected manually. Very thin features can still be missed; cross-check the three views. A high match on one view does not establish depth or uniqueness, and match is not the probability of a correct answer. Candidate families, scoring and fitting algorithms are unchanged in this batch.

## Editable AI sketches (2026-11-02)

AI output now supports closed straight/arc profiles and circular sections, extruded from the front, top or left view with add, subtract and local-retention operations. Review and preview the result, then apply it. **Edit profile** remains available afterward; undo, model download and reopening preserve editable geometry.

Use the local mock provider and the arc-section or local-reduction example buttons to try the workflow. These are fixed demonstrations, not image recognition. Importable workbench models: [arc plate](../examples/ai-arc-plate.json), [local cylinder reduction with an existing hole](../examples/ai-retain-cylinder.json), [concave section](../examples/ai-concave-section.json). Their raw [arc](ai-input/arc-plate.json), [retention](ai-input/retain-cylinder.json) and [concave](ai-input/concave-section.json) AI answers belong in the AI result box, not the main model importer.

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

Generated and pasted results have independent three-view thumbnails. **Expand preview** shows first-angle projections and an interactive solid. The views use 320 samples; the solid defaults to fast 42³ followed by fine 84³, with explicit Fast/Fine selection. Small features may still be missed. Envelope dimensions are sampled approximations converted back to the input units, not recognized dimension callouts.

Questions are in Reply / conditions. Review them individually or explicitly accept this version’s assumptions in one action from the application bar. Typed replies still require **Update model from replies** before applying; the combined acceptance and general checkbox cannot bypass unincorporated replies. Accepting an assumption does not establish a verified fact.

Reply updates and ordinary revisions resend the original problem, image and confirmation records to the selected AI provider. Records accompany later revisions and are saved in applied AI metadata. They are contextual data, not dimension locks or automatic geometry verification. Editable sketch support is described above.

The preview runs locally and leaves the workbench, undo history and exported drawing unchanged. Failed or cancelled revisions retain the preceding result and replies. Preview failures can be retried; the three views remain available without WebGL. **Apply to workbench** remains an undoable edit.

## Try it

1. Open the workbench and import the [cylinder example](../examples/source-links-cylinder.json), or add a cylinder.
2. Choose **Explain this line → Pick an existing line**, then click a solid or dashed line on the main drawing sheet.
3. Select a source to highlight its location in the three views and in 3D. Use **Locate in 3D** and **Back to line sources** to move between them.
4. **Locate step** highlights a related modeling step without editing or starting replay. **Clear highlight**, closing the panel, or changing the model clears the location overlay.

The [box example](../examples/source-links-box.json) demonstrates coincident projections and edges projecting to points. The [through-hole example](../examples/box-with-hole.json) demonstrates hidden lines.

Teal indicates corresponding projections. Violet indicates reference locations on a curved surface: a tangent silhouette changes with viewing direction, so its points do not necessarily form a silhouette in another view. Amber dashes in 3D are visible through material and indicate location, not drawing visibility.

Sources may be ambiguous. Up to four nearby sources are shown, with an explicit notice when others exist. Related steps express geometric association, not unique modeling causation. Coincidence detection is sampled and may miss overlaps; the original drawing determines line precedence. Small features, shallow intersections and near-tangent cases retain sampling limitations. Unmatched queries are reported rather than guessed.

The original tracing and candidate-comparison workflow remains available under **Trace to find a cut**. Picking a line preserves existing traces and reference images. Transient source data and colored overlays are excluded from model JSON and SVG/PNG exports. Saved model JSON can still contain your own traces and reference images.

Ordinary modeling and source queries run locally and never need a network. Local records stay in this browser only. A model JSON may contain annotations and problem images you saved yourself, so check before sharing a file. AI requests are sent to your chosen provider only when you actively use that feature. An API key must be configured: ticking “Remember key” stores it in plain text in this browser; leaving it unticked keeps it in page memory only, and exporting a model never writes the key.

Author: [zeder11](https://github.com/zeder11). See [LICENSE](../LICENSE) and [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md). This feature adds no third-party runtime libraries.

## AI drawing type

Auto detect is the default. Choose orthographic views, a dimensioned 3D drawing, or section / mixed views for type-specific directions and dimension interpretation. The preview separates the requested type from the AI-reported type and orientation. Changing the selection sends no request; revisions and retries keep their previous type unless you explicitly regenerate with the new selection. Revisions also include the preceding AI orientation report as unverified context. Instructions copied for another AI follow the current type. Applied metadata preserves the selection and report; legacy JSON without this optional information remains compatible. These reports do not establish recognition or geometric correctness.