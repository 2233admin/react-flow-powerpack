# React Flow Powerpack

An open-source Next.js + React Flow workflow editor for building node-based automation tools.

React Flow Powerpack focuses on the engineering layer that sits below polished workflow UIs:

- Houdini-style parameter interfaces backed by exposed internal node parameters.
- Package/DOP-style nodes with inspectable internal networks.
- Semantic edges with contracts, weights, source anchors, jump-back metadata, and run artifacts.
- Import/export for canonical workflow JSON, Mermaid drafts, Obsidian Canvas, OPML, Markdown, PNG, and SVG.
- n8n workflow translation: import n8n `nodes[] + connections{}` JSON and convert it into the canonical workflow model.

## Quick Start

```bash
npm install
npm run dev
```

Open http://127.0.0.1:8080/.

## n8n Workflow Translation

Use **Import / Export -> Import JSON / Mermaid / n8n** and select an n8n workflow JSON file. The importer keeps the original n8n node labels, stores source metadata under `ui.n8n`, redacts credential identifiers, maps common n8n nodes into canonical trigger/source/agent/router/inbox/notify/action nodes, and preserves connections as semantic contract edges.

This works with workflow JSON files from collections such as [Zie619/n8n-workflows](https://github.com/Zie619/n8n-workflows).

## Verify The Project

Use the full check before uploading or handing the zip to someone else:

```bash
npm run check
```

That runs:

- `npm run typecheck`
- `npm test`
- `npm run build:verify`

For a faster UI-only probe against a running dev server:

```bash
npm run health-check
```

## Developer Guides

Use these before adding workflow behavior:

- [Developer Guide](docs/developer-guide.md): add atomic nodes, parameter templates, and canonical workflow behavior.
- [Adapter Guide](docs/adapter-guide.md): add source adapters with fixture/mock/live modes. JIN10 is the reference adapter.

## Lovable / Upload Notes

- Production builds write to `dist/` through `next.config.mjs`.
- Development uses `.next/`, so dev cache and upload/build output stay separate.
- `allowedDevOrigins` includes `127.0.0.1`, `localhost`, `0.0.0.0`, and Lovable preview hosts. If the canvas renders data but no nodes, restart `npm run dev` after editing this list.
- The project uses npm. `bun.lock` is present from the original export, but the verified path here is npm.

## Common Commands

```bash
npm run dev           # local editor at port 8080
npm run build         # production build into dist/
npm run build:verify  # production build + HTTP smoke test
npm run smoke         # smoke test an existing dist build
npm run smoke:visual  # Playwright visual smoke test
npm test              # unit tests
npm run typecheck     # TypeScript check
npm run clean         # remove .next and dist
```

## Troubleshooting

### `npm run lint` fails

`lint` is intentionally mapped to TypeScript checking in this export. Run:

```bash
npm run typecheck
```

### Health check says inspector is optional

The inspector only mounts after selecting a node. It is reported as optional so the root page can still be healthy before selection.

### `dist/` is missing

Run:

```bash
npm run build
```

`npm run smoke` and `npm run smoke:visual` expect a completed production build.
