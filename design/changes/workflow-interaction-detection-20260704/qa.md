# QA: workflow interaction detection

## Static Checks

- Typecheck: `npm run typecheck` pass.
- Tests: `npm test` pass, 35 files / 149 tests.
- Build: `npm run build` pass.

## Browser Checks

- URL: `http://127.0.0.1:8080/`
- Console/page errors: none captured.
- Partial selection: pass; selection rectangle overlapping only a node corner selected 1 node.
- Drag interaction: pass; drag overlap produced 1 `.workflow-proximity-ring`.
- Overlap state: pass; overlap ring count 1.
- Release cleanup: pass; after mouse up ring count 0.

## Dependency Notes

- Added `gsap`.
- Added `animejs`.
- `npm install` reported 2 moderate audit findings and a `sharp` install-script allowlist notice. Not fixed in this change because it may require broader dependency-policy decisions.

## Final Verdict

Pass.
