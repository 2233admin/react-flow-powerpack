# Design: Strudel Flow internalization

## Borrowed Patterns

### Connected Components

Strudel Flow uses connected components to control an entire connected node group. For this workflow IDE, the same idea becomes `Select Connected Component`: pick one node, select and focus the whole connected workflow component.

### Compressed URL State

Strudel Flow uses `lz-string` to encode shareable URL state. This project now uses `?flow=` with a compressed payload containing workflow project, nodes, edges, and drawings.

## Non-Goals

- No Strudel music runtime.
- No instrument or pattern node types.
- No global audio playback controls.
- No theme importing from Strudel Flow.

## UX Surface

- Node right-click menu: `Select Connected Component`.
- Import/export dropdown: `复制压缩分享 URL`.
- URL startup recovery: if `?flow=` exists, restore the compressed workflow state.
