# Motion Spec: workflow interaction detection

## Summary

- Change id: workflow-interaction-detection-20260704
- Surfaces: node selection box behavior, node drag interaction overlay, target node feedback
- Motion owner: Codex
- Implementation target: CSS + GSAP + Anime.js
- Motion risk: medium

## Motion Principles

- Purpose: Make graph editing feel immediate by showing which nodes are being touched, approached, or overlapped.
- Product feeling: Houdini-like operational feedback, not decorative animation.
- What motion must never do: Hide selection state, delay drag, or create layout shifts.
- Reduced-motion principle: CSS animation disables under `prefers-reduced-motion`; JS runtime skips GSAP/Anime work when reduced motion is active.

## Interaction Inventory

| Element / flow | Trigger | User intent | Motion response | Required? |
| --- | --- | --- | --- | --- |
| Selection box | drag rectangle over any part of node | select nodes without exact full containment | React Flow partial selection | yes |
| Drag near target | dragged node within near threshold | understand spatial relationship | dashed white ring + GSAP target pulse | yes |
| Drag overlap target | dragged node overlaps target | understand collision | orange ring + stronger GSAP pulse | yes |
| Release drag | mouse up | commit position | interaction rings clear | yes |

## Library Decision

| Candidate | Use when | Rejected because |
| --- | --- | --- |
| CSS transitions/keyframes | base state motion | still used |
| Anime.js | lightweight SVG ring feedback | selected |
| GSAP | direct node target feedback | selected |
| React View Transitions | route continuity | not relevant |

Selected:

- Library: GSAP + Anime.js.
- Reason: The project now needs real motion dependencies for richer node-canvas interactions.
- Dependency already present? added in this change.

## QA Scenarios

| Scenario | Expected result | Evidence |
| --- | --- | --- |
| Partial box select | corner overlap selects node | Playwright selected node count 1 |
| Drag overlap | interaction ring appears while dragging | Playwright ring count 1, overlap count 1 |
| Release drag | interaction ring clears | Playwright after-drag ring count 0 |
| Reduced motion | JS runtime skips motion | code path checks media query |
