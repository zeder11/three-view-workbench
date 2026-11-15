# v0.6.2 release notes

This release collects the local work since v0.6.1: parameter curve construction in AI modeling, compare / correct, and new local checks. The interface, existing models and the normal confirmation flow are unchanged; existing model JSON opens as-is.

## New and improved

- AI modeling adds parameter construction for circular arc caps, rounded U-slots and open half-rings. The AI supplies structural dimensions and the program computes the arc segments and tangent joins, reducing hand-calculated sagitta and tangency errors. Existing primitives and older models are unchanged.
- Compare / correct places the frozen source beside the model projections, and ordinary text revisions can show before and after. Browsing stays local and leaves the workbench untouched; only an explicit revision sends a request.
- Check linework · experimental compares relative line positions locally. Three views, or an upper-front / lower-top pair, are supported with unchecked views labelled. Limited standard thin long / short centrelines and external dimension patterns are handled; the original is unchanged and dimension values are not read.
- Refine locally · experimental: after explicitly choosing editable cuts and fields, the program estimates in the background and cross-checks the three views. It can be stopped or discarded, and retaining a proposal still requires normal application. No AI request is sent.
- The drawing aid gains pixel observations: a common relative envelope plus some longer line spans and endpoints from clear orthographic drawings, shared by built-in generation and external-AI instructions. Unreliable sources fall back to the existing flow.
- Local checks now detect material inside declared bores and gaps between declared contacts. Repair only the affected steps preserves the original claims and blocks collateral edits.

## Improvements and fixes

- After a revision, local checks keep the previous candidate when previously matched linework develops significant new discrepancies; the workbench is not overwritten automatically.
- External replies use an explicit revision import path that can reuse the source and the permissions recorded when it was copied. Ordinary new-task paste keeps the existing flow.
- Usable differences can guide difference review in the same window or be copied offline for an external AI. Region windows locate discrepancies and are not measured dimensions.
- Folding panels, switching language and preview round-trips no longer clear revision notes, replies or section coordinates.

## Notes

Offline use covers modeling, drawings and export. Online AI requires your own provider and API key. The local linework comparison, material checks and refinement only test claims against geometry; they do not establish recognition accuracy. Complex drawings still need manual review.

Read structure before building is off by default. When enabled, a new generation sends at most two requests and stops on failure while keeping the previous candidate. Total time and usage may increase, and improved accuracy is unproven.

## Downloads

- `three-view-workbench.html`: single-file offline app.
- `three-view-workbench-v0.6.2.zip`: complete package with app, documentation, licence and public examples.
- `SHA256SUMS.txt`: SHA-256 values for those assets.
