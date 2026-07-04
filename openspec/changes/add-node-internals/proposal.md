# Add Node Internals

## Why

The editor now has profile-aware atomic workflow nodes, but each main node is still too coarse for operators.

Users need to see what happens inside a main node without exploding the React Flow canvas into dozens of implementation steps.

## What Changes

- Add a workflow node internals registry.
- Cover the first intelligence workflow main nodes:
  - Cron Schedule
  - JIN10 Source
  - LLM Summary
  - Importance Score
  - Importance Router
  - Webhook Notify
- Render internals in the Inspector Config tab.
- Allow supported nodes to be opened as a nested workspace.
- Keep nested internals locked/read-only by default.
- Allow explicit unlock into a draft/proposal editing surface.

## Non-Goals

- Do not persist unlocked internal nodes into the canonical workflow without human acceptance.
- Do not add runtime execution for each internal step yet.
- Do not replace canonical workflow nodes with a deeper schema yet.

## Design

Main nodes remain the canonical workflow unit. Internals can be inspected either in the Inspector or by diving into a nested workspace:

```text
Workflow Node
  -> Internals
    -> sub-capabilities
    -> params they depend on
    -> runtime evidence target
    -> validation warnings
  -> Dive into Network
    -> locked internal nodes
    -> breadcrumb / Up / Esc return path
    -> optional unlock into draft/proposal
```

This preserves operator clarity while keeping the canvas readable.
