import { describe, expect, it } from "vitest"
import expectedRun from "./fixtures/run-intelligence.json"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { createDefaultAdapterRegistry } from "./adapter-registry"
import { parseWorkflowProject } from "./schema"
import { simulateWorkflowRun } from "./simulation"

describe("workflow deterministic simulation", () => {
  it("matches the pinned intelligence workflow run fixture", async () => {
    const project = parseWorkflowProject(workflowFixture)
    const run = await simulateWorkflowRun(project, createDefaultAdapterRegistry())

    expect(run).toEqual(expectedRun)
  })

  it("keeps workflow schema data immutable while simulating", async () => {
    const project = parseWorkflowProject(workflowFixture)
    const before = JSON.stringify(project)

    await simulateWorkflowRun(project, createDefaultAdapterRegistry())

    expect(JSON.stringify(project)).toBe(before)
  })

  it("emits stable trace events by workflow node id", async () => {
    const project = parseWorkflowProject(workflowFixture)
    const first = await simulateWorkflowRun(project, createDefaultAdapterRegistry())
    const second = await simulateWorkflowRun(project, createDefaultAdapterRegistry())

    expect(first.trace.map((event) => event.nodeId)).toEqual([
      "schedule-5m",
      "source-jin10",
      "agent-normalize",
      "router-importance",
      "inbox-review",
      "notify-preview",
    ])
    expect(second.trace).toEqual(first.trace)
  })
})
