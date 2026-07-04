# Design: workflow motion polish

## Direction

Use operational motion: fast, interruptible feedback that confirms state and preserves orientation. Motion must feel like an engineering tool, not a marketing surface.

## Components

- Workflow node cards keep the current compact card shape and current palette.
- Node hover lifts by 1px with a small shadow; active press compresses slightly.
- Selected nodes add a subtle white halo without changing layout.
- Running nodes pulse outline and shadow using the existing warning/action token.
- All custom edge types share the same dashed flow, selected highlight, and draft styling.
- Floating panels, context menus, breadcrumbs, and toast use short transform/opacity entry motion.
- Scissors trail keeps the current orange line but adds dashed motion and a faint glow.

## Tokens

- `--motion-fast`: 90ms
- `--motion-base`: 150ms
- `--motion-slow`: 240ms
- `--motion-ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)`
- `--motion-ease-in-out`: `cubic-bezier(0.65, 0, 0.35, 1)`
- `--motion-spring`: `cubic-bezier(0.2, 0.8, 0.2, 1)`

## Accessibility

- `prefers-reduced-motion: reduce` disables node, edge, panel, toast, and scissors animations.
- No motion-only meaning: selected, running, draft, locked, and cut states still have color, outline, text, or structural cues.
- Stable dimensions are preserved; transforms do not reflow the canvas.
