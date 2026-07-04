# Brief: workflow interaction detection

- Goal: Make node selection and node-to-node interaction feel direct instead of requiring exact full containment.
- Audience: Human workflow operators editing dense node graphs.
- Surface: Selection box, node drag proximity/overlap detection, interaction overlay, motion runtime.
- Constraints: Keep current React Flow base, add GSAP and Anime.js because the project now needs real motion dependencies, preserve reduced-motion behavior.
- Non-goals: No replacement of React Flow selection engine, no automatic rewiring on overlap, no physics simulation.
- Acceptance checks: Partial selection works, drag proximity/overlap has visible feedback, detection works even when snap is off, static checks and browser QA pass.
