# Design: workflow interaction detection

## Interaction Model

- Box selection uses React Flow `SelectionMode.Partial`, so a node is selected when the selection rectangle overlaps it.
- Dragging a node computes a lightweight interaction probe independent of helper-line snapping.
- Probe targets are scoped to the same parent/network layer.
- Targets are marked as `near` or `overlap`.
- The overlay shows a dashed white ring for `near` and an orange warning ring for `overlap`.

## Motion Model

- GSAP is used for node feedback on interaction targets.
- Anime.js is used for lightweight SVG ring opacity motion.
- CSS remains responsible for base node/edge state animation and reduced-motion fallback.

## Data Contract

`HelperLines` now may include:

```ts
interaction?: {
  draggedId: string
  targets: Array<{
    id: string
    state: "near" | "overlap"
    rect: Rect
    distance: number
  }>
}
```

This keeps interaction detection agent-readable and usable by later collision, routing, or verification features.
