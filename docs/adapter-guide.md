# Adapter Guide

Adapters connect canonical workflow nodes to real or simulated external systems.

The first real data-source adapter is JIN10 / 金十数据. Notification delivery stays simulated or mock-first in this phase.

## Adapter Binding

Adapter bindings live on `workflowProject.adapters`.

Example:

```json
{
  "id": "jin10-kuaixun",
  "type": "source",
  "provider": "jin10",
  "mode": "fixture",
  "config": {
    "feed": "kuaixun"
  }
}
```

Modes:

- `fixture`: deterministic local data, best for tests and demos
- `mock`: simulated side effect, no external network
- `webhook`: outbound HTTP target, only when explicitly enabled
- `live`: real network fetch

## Source Adapter Shape

Source adapters are registered in `lib/workflow/adapter-registry.ts`.

They receive:

- the adapter binding
- the canonical workflow node

They return normalized source items.

Current source item shape is defined in:

```text
lib/workflow/adapters/jin10.ts
```

## Add A Source Adapter

1. Create the adapter implementation.

   Example path:

   ```text
   lib/workflow/adapters/my-source.ts
   ```

   Provide:

   - fixture fetch function
   - live fetch function if real network is in scope
   - normalization into `WorkflowSourceItem`
   - URL builder tests for live mode

2. Register it.

   File:

   ```text
   lib/workflow/adapter-registry.ts
   ```

   Add a provider entry:

   ```ts
   sourceAdapters: {
     "my-provider": {
       provider: "my-provider",
       fetch: (binding, node) => {
         if (binding.mode === "live") return fetchMySourceLive(...)
         return fetchMySourceFixture(...)
       },
     },
   }
   ```

3. Add an atomic node.

   File:

   ```text
   lib/workflow/node-catalog.ts
   ```

   Add `requiredAdapters` so command-palette insertion automatically creates the adapter binding.

4. Add a parameter template.

   File:

   ```text
   lib/workflow/node-templates.ts
   ```

   Include adapter mode as a field when the node needs fixture/live switching:

   ```ts
   {
     id: "mode",
     source: "adapter",
     type: "select",
     label: "Adapter Mode",
     options: [
       { value: "fixture", label: "fixture" },
       { value: "live", label: "live" },
     ],
   }
   ```

5. Test it.

   Minimum:

   - fixture parser test
   - live URL builder test
   - registry dispatch test
   - catalog insertion test
   - Inspector parameter template test if mode/config is editable

## JIN10 Reference

Files:

- `lib/workflow/adapters/jin10.ts`
- `lib/workflow/fixtures/jin10-sample.json`
- `lib/workflow/adapters/jin10.test.ts`
- `lib/workflow/adapter-registry.ts`
- `lib/workflow/node-catalog.ts`
- `lib/workflow/node-templates.ts`

Default node:

```json
{
  "id": "source-jin10",
  "kind": "source",
  "capability": "fetch",
  "adapter": "jin10-kuaixun",
  "params": {
    "limit": 20,
    "importantOnly": false
  }
}
```

## Safety Rules

- Fixture first, live second.
- Live mode must accept an injected fetcher for tests.
- Do not send notifications from simulation unless the adapter mode and permissions explicitly allow it.
- Keep raw provider payloads out of canonical workflow nodes.
- Store only normalized params in workflow JSON.
