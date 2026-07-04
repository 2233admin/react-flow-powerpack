import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { createDefaultAdapterRegistry, runWorkflowSourceNode } from "./adapter-registry"
import { parseWorkflowProject } from "./schema"

describe("workflow adapter registry", () => {
  it("runs the JIN10 source adapter declared by a workflow node", async () => {
    const project = parseWorkflowProject(workflowFixture)
    const registry = createDefaultAdapterRegistry()
    const result = await runWorkflowSourceNode(project, "source-jin10", registry)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({ source: "jin10", id: "jin10-20260704-001" })
  })

  it("returns a displayable error when a provider is not registered", async () => {
    const project = parseWorkflowProject({
      ...workflowFixture,
      adapters: workflowFixture.adapters.map((adapter) =>
        adapter.id === "jin10-kuaixun" ? { ...adapter, provider: "missing-provider" } : adapter,
      ),
    })

    const result = await runWorkflowSourceNode(project, "source-jin10", createDefaultAdapterRegistry())

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Source adapter provider "missing-provider" is not registered')
    }
  })

  it("uses live mode for JIN10 source bindings", async () => {
    const project = parseWorkflowProject({
      ...workflowFixture,
      adapters: workflowFixture.adapters.map((adapter) =>
        adapter.id === "jin10-kuaixun" ? { ...adapter, mode: "live" } : adapter,
      ),
    })
    const registry = createDefaultAdapterRegistry({
      fetcher: async () =>
        new Response(JSON.stringify({
          status: 200,
          data: [
            {
              id: "live-1",
              time: "2026-07-04 06:15:00",
              important: 1,
              data: { source: "金十数据", content: "【Live】registry route" },
            },
          ],
        })),
    })

    const result = await runWorkflowSourceNode(project, "source-jin10", registry)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.items[0]).toMatchObject({ id: "live-1", title: "Live" })
  })
})
