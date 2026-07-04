# QA: Strudel Flow internalization

## Static Checks

- `npm run typecheck`: pass.
- `npm test`: pass, 37 files / 156 tests.
- `npm run build`: pass.

## Browser Checks

- URL: `http://127.0.0.1:8080/`
- Console/page errors: none captured.
- Right-click node then `Select Connected Component`: selected 6 nodes and 5 edges.
- Share URL action: address bar contains `?flow=`.
- Share URL length in fixture QA: 3427 characters.
- Reload same share URL: restored 6 workflow nodes.

## Dependency Notes

- Added `lz-string`.
- Existing npm audit output still reports 2 moderate findings and a `sharp` install-script allowlist notice.

## Final Verdict

Pass.
