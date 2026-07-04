# Brief: workflow motion polish

- Goal: Improve the perceived quality of canvas interactions without changing the established dark Houdini/VS Code color posture.
- Audience: Human operators building and inspecting agent workflows under repeated-use pressure.
- Surface: Workflow nodes, edges, scissors trail, context menu, floating panels, network breadcrumb, toast feedback.
- Constraints: Keep React Flow / Next / Tailwind stack, avoid new animation dependencies, preserve reduced-motion behavior, do not change product palette.
- Non-goals: No route transitions, no GSAP/Anime dependency, no replacement of the node canvas architecture.
- Acceptance checks: Nodes feel sharper and more responsive, edge states are consistent across edge types, scissors trail is visible while cutting, panels/menu/toast enter without layout shift.
