# React Flow Powerpack

React Flow Powerpack is a working prototype of a **workflow IDE layer** built on top of React Flow.

The goal is not to make another box-and-edge demo, and it is not an n8n runtime clone. The project explores the missing engineering layer that many workflow products eventually need: a visual canvas whose nodes have canonical data contracts, inspectable internals, promoted parameters, source evidence, run artifacts, and import/export paths.

In short: this repo is for people building their own workflow editor, automation canvas, agent pipeline UI, or knowledge-map workflow surface and who need more than raw React Flow primitives.

## Why This Exists

Most React Flow examples are good at drawing nodes and edges, but real workflow tools quickly need harder pieces:

- a canonical workflow schema that is not just React component state
- nodes that can be packaged into higher-level operators while still exposing lower-level parameters
- an Inspector that behaves more like Houdini's Parameter Interface than a fixed task form
- semantic edges that carry contracts, weights, source anchors, and run evidence
- import paths from existing workflow ecosystems, especially n8n-style JSON
- a proposal/human-accept loop for AI-generated changes instead of silent graph mutation

React Flow Powerpack is an implementation playground for that layer.

## What It Can Do Today

- Build and edit workflow graphs on a React Flow canvas: add nodes, connect edges, group, draw, undo/redo, auto-layout, and inspect selections.
- Keep workflow behavior in a canonical JSON model under `lib/workflow/schema.ts`, then project it into React Flow nodes and edges.
- Add profile-aware workflow operators such as schedule triggers, JIN10 source, normalize, dedupe, summary, score, tag, route, inbox, notify, and package nodes.
- Use Houdini-style Parameter Interface behavior: selected nodes show public parameters exposed by their internal steps; edits write back to canonical params, adapter config, or internal-node fields.
- Dive into or unlock node internals so package/DOP nodes can be inspected as lower-level primitive networks.
- Work with knowledge-map primitives: source anchors, jump-back metadata, mini-network previews, topic collapse, semantic links, link weights, contracts, and run artifacts.
- Import and export canonical workflow JSON, Mermaid drafts, Obsidian Canvas, OPML, Markdown, PNG, and SVG.
- Translate n8n workflow JSON into this project's canonical workflow shape while preserving node labels, selected parameters, connections, and redacted credential metadata.
- Simulate and verify the included intelligence workflow path with tests, run traces, contracts, and local fixtures.

## What It Is Not

- It is not a production workflow execution engine.
- It does not run arbitrary n8n integrations or replace an n8n server.
- It is not currently packaged as a polished npm component library.
- It is not a hosted SaaS product.
- It does not provide real secret management; imported credential metadata is intentionally redacted.

Treat it as a reference implementation and a starting point for building serious workflow-editor surfaces.

## Quick Start

```bash
npm install
npm run dev
```

Open http://127.0.0.1:8080/.

## n8n Workflow Translation

Use **Import / Export -> Import JSON / Mermaid / n8n** and select an n8n workflow JSON file. The importer keeps the original n8n node labels, stores source metadata under `ui.n8n`, redacts credential identifiers, maps common n8n nodes into canonical trigger/source/agent/router/inbox/notify/action nodes, and preserves connections as semantic contract edges.

This is a translation/import tool, not a runtime compatibility layer. It is useful for turning workflow collections such as [Zie619/n8n-workflows](https://github.com/Zie619/n8n-workflows) into editable graph material inside this project.

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
