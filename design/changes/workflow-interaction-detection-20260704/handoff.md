# Handoff: workflow interaction detection

Status: complete.

Implemented:

- Added `gsap` and `animejs` dependencies.
- Changed React Flow selection to `SelectionMode.Partial`, so partial box overlap selects nodes.
- Added `getNodeInteractionProbe` to emit `near` and `overlap` targets during node drag.
- Kept interaction detection independent from helper-line snapping.
- Added SVG proximity/overlap rings in `HelperLinesRenderer`.
- Added `WorkflowMotionRuntime` using GSAP for target-node feedback and Anime.js for SVG ring feedback.

Verification:

- `npm run typecheck`: pass.
- `npm test`: pass, 35 files / 149 tests.
- `npm run build`: pass.
- Browser QA: partial corner selection selected 1 node; drag overlap showed 1 ring; release cleared ring; no console/page errors captured.

Known notes:

- `npm install` reported 2 moderate audit findings and a `sharp` install-script allowlist notice. Left for dependency policy follow-up.
