# Motion Spec: workflow motion polish

## Summary

- Change id: workflow-motion-polish-20260704
- Surfaces: workflow canvas nodes, edges, scissors trail, floating panels, context menu, toast
- Motion owner: Codex
- Implementation target: CSS
- Motion risk: low

## Motion Principles

- Purpose: Confirm state changes and improve spatial confidence while editing workflows.
- Product feeling: Tight, tool-like, Houdini/VS Code adjacent.
- What motion must never do: Delay node editing, hide connection state, move text enough to hurt scanability, or change palette semantics.
- Reduced-motion principle: Disable all non-essential animation while preserving static state cues.

## Interaction Inventory

| Element / flow | Trigger | User intent | Motion response | Required? |
| --- | --- | --- | --- | --- |
| Node card | load/add | orient to new node | 150ms opacity + 4px translate + 0.985 scale | yes |
| Node card | hover | inspect/select target | 90ms 1px lift + shadow | yes |
| Node card | active press | direct manipulation | 90ms slight compression | yes |
| Selected node | select | confirm target | static halo + scan line | yes |
| Running node | run status | see live processing | outline/shadow pulse | yes |
| Edge | mount/select | read data flow | dashed flow + selected highlight | yes |
| Scissors trail | hold Y and drag | cut only crossed edges | animated dashed orange trail | yes |
| Floating panel/menu/toast | open | preserve orientation | 90-150ms transform + opacity | yes |

## Timeline And Choreography

| Sequence | Starts when | Elements | Order | Duration | Delay / stagger | Can interrupt? |
| --- | --- | --- | --- | ---: | ---: | --- |
| Node feedback | pointer hover/press | node card | transform then shadow | 90ms | 0ms | yes |
| Panel entry | panel/menu open | wrapper | opacity + translate | 90-150ms | 0ms | yes |
| Edge flow | edge visible | path | dash movement | 1300ms loop | 0ms | yes |
| Scissors cut | Y drag | SVG trail | dash movement | 420ms loop | 0ms | yes |

## Easing

| Motion type | Easing | Why |
| --- | --- | --- |
| Small UI feedback | `cubic-bezier(0.2, 0.8, 0.2, 1)` | crisp but not bouncy |
| Enter / reveal | `cubic-bezier(0.16, 1, 0.3, 1)` | fast deceleration |
| Exit / dismiss | none in first pass | components unmount immediately |
| Route transition | n/a | no route motion |
| Scroll-linked motion | n/a | no scroll animation |

## Spatial Behavior

- Origin: component center for nodes, top-left for panels.
- Direction: node enters upward from 4px below; panels enter from 4px above.
- Distance: 1-8px only.
- Scale: node enter 0.985 to 1, active 0.992.
- Opacity: entry from 0 to 1.
- Blur/filter: no blur; selected edge uses small drop shadow.
- Transform-only where possible: yes.
- Layout-affecting animation allowed? no, because the workflow canvas must not shift during repeated editing.

## Accessibility

- `prefers-reduced-motion` behavior: disable keyframes, transforms, transitions for workflow motion classes.
- Keyboard focus behavior: unchanged.
- Screen reader impact: none; no semantic state depends only on animation.
- Animation pause/stop/skip: reduced-motion media query.
- Touch target stability: dimensions unchanged.
- No motion-only meaning: yes.

## Performance Budget

- Max animation duration before user can interact: 0ms; all motion is non-blocking.
- Target frame rate: 60fps.
- Properties allowed: transform, opacity, stroke-dashoffset, box-shadow for small elements.
- Properties avoided: layout, width, height, top, left, filter blur.
- Heavy asset strategy: no assets.
- Mobile fallback: same CSS, reduced-motion supported.

## Library Decision

| Candidate | Use when | Rejected because |
| --- | --- | --- |
| CSS transitions/keyframes | Simple state changes | selected |
| Anime.js | Lightweight scripted DOM/SVG motion | unnecessary dependency |
| GSAP | Complex choreography | unnecessary for this surface |
| React View Transitions | Route continuity | not a route change |
| Existing project library | tw-animate-css component transitions | existing primitives remain available |

Selected:

- Library: CSS
- Reason: The work is state feedback and SVG path motion, not choreography.
- Required companion skill: none.
- Dependency already present? yes, browser CSS.
- If new dependency, why CSS/existing library is insufficient: n/a.

## Implementation Notes

- Components/files: `app/globals.css`, `components/flow/workflow-editor.tsx`, `components/flow/edges/routed-edge.tsx`, `components/flow/edges/editable-edge.tsx`.
- Tokens/classes: `--motion-*`, `workflow-node-card`, `workflow-edge-path`, `workflow-floating-panel`, `workflow-context-menu`, `workflow-toast`, `workflow-scissor-trail`.
- Hooks/utilities: none.
- Cleanup/unmount behavior: existing React unmount, no timers added.
- Server/client boundary: CSS and client components only.
- Testing hooks: DOM class names and reduced-motion CSS.

## QA Scenarios

| Scenario | Expected result | Evidence |
| --- | --- | --- |
| First load | Nodes enter without layout shift | pending browser QA |
| Fast repeated click | Hover/press feedback interrupts cleanly | pending browser QA |
| Keyboard navigation | Existing shortcuts continue | typecheck/test |
| Reduced motion | Motion disabled by media query | CSS inspection |
| Mobile viewport | No clipped text from transforms | pending browser QA |
| Slow device/network | No JS animation dependency | static inspection |
| Route interruption | n/a | n/a |
| Scroll up/down repeatedly | Canvas zoom/pan unaffected | pending browser QA |

## Final Motion Score

| Dimension | Score | Notes |
| --- | ---: | --- |
| Purpose | 4 | Motion is tied to editing state. |
| Clarity | 4 | Edge and node state feedback is more consistent. |
| Responsiveness | 4 | Short durations, no blocking. |
| Accessibility | 4 | Reduced-motion support retained and widened. |
| Performance | 4 | Mostly transform/opacity/stroke dash. |
| Implementation fit | 4 | No new dependency, uses existing CSS layer. |
