# Developer Guide

This project is a local workflow IDE built on React Flow with a canonical workflow schema underneath.

Use this guide when adding a new atomic workflow node or changing the editor behavior.

## Mental Model

The editor has three layers:

- Canonical workflow data: `lib/workflow/schema.ts`
- Primitive package components: `lib/workflow/node-primitives.ts`
- React Flow canvas state: `lib/flow/types.ts`

Do not make React Flow node data the source of truth for product workflow behavior. Add behavior to the canonical workflow layer, then project it into React Flow.
Primitive components are the reusable bottom layer used to explain and draft packaged nodes. They can appear in nested workspaces without becoming canonical workflow nodes.

## Add An Atomic Node

Atomic nodes are profile-aware business operators such as `JIN10 Source`, `Importance Score`, or `Webhook Notify`.

1. Add the catalog entry.

   File: `lib/workflow/node-catalog.ts`

   Include:

   - `id`: stable catalog id, for example `intelligence.agent.score`
   - `idPrefix`: default node id prefix, for example `score`
   - `kind`: canonical node kind from `workflowNodeKindSchema`
   - `capability`: canonical capability from `workflowCapabilitySchema`
   - `params`: default canonical params
   - `requiredAdapters`: only when the node needs an adapter binding
   - `keywords`: search terms for the command palette

2. Add the parameter template.

   File: `lib/workflow/node-templates.ts`

   Add a `NodeTemplate` with typed fields:

   - `text`
   - `textarea`
   - `number`
   - `boolean`
   - `select`
   - `slider`
   - `tokens`

   Template fields can target:

   - `source: "params"` for `workflowProject.nodes[].params`
   - `source: "adapter"` for adapter mode/config

3. Add tests.

   Minimum tests:

   - `lib/workflow/node-catalog.test.ts`
   - `lib/workflow/node-templates.test.ts`
   - `lib/flow/store.test.ts` if insertion or param updates change

4. Verify UI.

   Run:

   ```bash
   npm run typecheck
   npm test
   npm run build
   npm run smoke
   ```

   Then open the app, press `Ctrl+K`, add the node, select it, and confirm the Inspector renders the template.

## Data Flow

Adding a catalog node:

```text
Command Palette
  -> addWorkflowNodeFromCatalog
  -> addCatalogNodeToWorkflowProject
  -> workflowNodeToReactFlow
  -> canvas node appears
```

Editing a parameter template:

```text
Inspector
  -> updateWorkflowNodeParams
  -> workflowProject.nodes[].params or workflowProject.adapters[]
  -> React Flow node fields/canonical metadata update
  -> JSON/Mermaid export sees canonical changes
```

Inspecting node internals:

```text
Inspector
  -> getNodeInternals
  -> show package sub-capabilities under the main node
  -> map each internal step to a primitive component
  -> double-click / Dive into Network opens locked primitive workspace
```

Drafting package internals:

```text
Command Palette
  -> Internal Primitive Components
  -> addPrimitiveNode
  -> draft node appears in the current nested workspace
  -> canonical workflow remains unchanged until proposal/human accept
```

## Add A Primitive Component

Primitive components are low-level building blocks such as `Parse JSON`, `Map Fields`, `Condition Gate`, `Assert Schema`, and `Coverage Mark`.

1. Add the primitive entry.

   File: `lib/workflow/node-primitives.ts`

   Include stable `id`, `idPrefix`, `category`, React Flow presentation fields, ports, default fields, and search keywords.

2. Map internal capabilities when needed.

   File: `lib/workflow/node-primitives.ts`

   Update `CAPABILITY_TO_PRIMITIVE_ID` so packaged internals resolve deterministically instead of relying on keyword search.

3. Use the primitive in package internals.

   File: `lib/workflow/node-internals.ts`

   Add or update `steps` for the packaged node. The editor converts each step into a locked/draft primitive node when diving or unlocking internals.

4. Add tests.

   Minimum tests:

   - `lib/workflow/node-primitives.test.ts`
   - `lib/workflow/node-internals.test.ts`
   - `lib/flow/store.test.ts` when insertion behavior changes

## Files To Know

- `lib/workflow/schema.ts`: canonical workflow contract
- `lib/workflow/node-catalog.ts`: operator library
- `lib/workflow/node-primitives.ts`: bottom-level package component library
- `lib/workflow/node-templates.ts`: Inspector parameter templates
- `lib/workflow/node-internals.ts`: packaged internals that map main nodes to primitive steps
- `lib/workflow/to-react-flow.ts`: canonical -> canvas projection
- `lib/workflow/from-react-flow.ts`: canvas edits -> canonical export
- `lib/flow/store.ts`: editor actions
- `components/flow/command-palette.tsx`: add operators
- `components/flow/inspector.tsx`: parameter editing
- `components/flow/node-management-panel.tsx`: node/adapter/run/proposal overview

## Rules

- Keep JSON canonical as the source of truth.
- Keep adapter access behind adapter bindings.
- Keep live network disabled unless permissions say otherwise.
- Add fixtures before live fetch paths.
- Add tests for each new atomic node and adapter.
- Add primitive components for reusable sub-node behavior before hard-coding one-off internals.
- Update `.gstack` task/outcome notes for durable project memory.
