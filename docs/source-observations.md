# Drawing aid: pixel observations

For clear first-angle three-view drawings or an upper-front/lower-top pair, the workbench can measure a common relative envelope and some longer horizontal/vertical ink segments before a request. This is a reading aid, not an inference of the whole solid, materials, bore depth, or overall correctness.

v0.7.0 can also measure a bounded number of isolated, closed near-circles and report relative centres and radii. A top-view circle may be linked to compatible vertical boundary pairs in the front and left views. Missing views, conflicts and ambiguous occlusion fall back to other available observations. Check the original for holes, bosses, through/blind relationships and dimensions.

## Use

- Built-in generation: use **Generate model** as before. Available observations accompany the original image in the same request; no additional AI call is added.
- External AI: select the source in the workbench, then copy or download the AI instructions. They include your current description and any available observations. Attach the original image separately in the external chat. The instructions contain neither image bytes nor the API key.
- Pasted JSON: another uploaded image is never borrowed. Explicitly attach the source to this candidate to obtain the same observations. A large envelope-ratio discrepancy is advisory and never changes the model automatically.

The observations assume the workbench's first-angle layout and one common scale. Each axis uses the largest observed span in its corresponding views, then the largest whole-part extent is normalized to 100. Small permitted pixel differences are retained without clipping endpoints; inconsistent scales make the observations unavailable. V uses X/Z, W uses Y/Z, and H uses X/Y. These are relative coordinates, not millimetres or dimension readings. Explicit dimensions take priority. Continuous or regularly dashed ink does not establish a reliable visible/hidden/centreline classification.

Before treating a horizontal line as a bore bottom, check its endpoints and span against the two bore walls in the original drawing. A longer step boundary alone cannot prove a closed bottom. Unlisted arcs, short lines and absent views do not establish that features are absent.

## Scope and fallback

Only sufficiently clear orthographic linework with reliable region separation and a common scale is supported. If a slightly rotated drawing has a reliable common direction, the workbench uses a temporary deskewed copy for pixel analysis. The original stays intact. Isometric/section drawings, an explicit third-angle instruction, severe perspective distortion, dense annotations, clipping and unresolved auxiliary lines retain the source and original generation path. Unknown information is not turned into a constraint. A local worker is bounded to about 2.5 seconds; failure never automatically resends an AI request. Cancelled or stale callbacks cannot overwrite another candidate.

Observations are cached in page memory only, excluded from model JSON and autosave metadata. The ratio advisory adds no application confirmation and performs no automatic resizing. It cannot replace drawing dimensions or manual review, prove a unique solid, or guarantee improved accuracy for DeepSeek, GPT or other models.
