# Read structure before building (experimental)

Under **AI modeling → Generate → API settings**, enable **Experimental: read structure before building**, then explicitly generate. It is off by default. Direct generation and pasted JSON retain their existing workflow.

For a new generation, stage one reads the original source and records parts, material and void boundaries, hole/slot directions, depth partitions, relationships, dimension sources and uncertainties. Stage two receives the same source again with this hypothesis record and produces the existing geometry format. Local validation and independent preview still run.

The record is an AI hypothesis, not a verified answer or user fact. The builder must check it against the original and may correct it. The program does not verify its agreement with the image.

Each new generation sends at most two requests, one per stage, with no automatic retry or silent fallback. A failed or truncated stage stops the operation and retains the workbench and prior candidate. Both stages keep the selected provider, model, thinking setting and **per-request** output budget. Total time and usage can increase, and the original image is sent twice to the selected provider. The existing Cancel button cancels the whole operation.

Revisions, replies, structure changes and source review use the existing flow without automatically rereading the structure. Source-review edit-range protections remain. External-AI instructions and pasted JSON require no new fields.

After success, expand **Details → Initial structure reading · AI hypotheses** to inspect the record. API diagnostics distinguish the two stages. The plan belongs to the current candidate only; it is not exported with geometry or promoted to confirmed user facts.

Improved accuracy remains unproven. Keep the experiment off by default and compare results on the same source before choosing it.
