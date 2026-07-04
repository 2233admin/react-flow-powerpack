import { describe, expect, it } from "vitest"
import proposalFixture from "./fixtures/agent-proposal-duplicate-push.json"
import runFixture from "./fixtures/run-intelligence.json"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { parseAgentProposal } from "./proposal"
import { parseWorkflowProject } from "./schema"
import { summarizeNodeManagement } from "./node-management"
import type { WorkflowSimulationRun } from "./simulation"

describe("node management summary", () => {
  it("summarizes nodes, adapters, run state, and proposal impact", () => {
    const project = parseWorkflowProject(workflowFixture)
    const proposal = parseAgentProposal(proposalFixture)
    const summary = summarizeNodeManagement(project, runFixture as unknown as WorkflowSimulationRun, proposal)

    expect(summary.nodes).toHaveLength(6)
    expect(summary.nodes.find((node) => node.id === "source-jin10")).toMatchObject({
      kind: "source",
      adapter: "jin10-kuaixun",
      incoming: 1,
      outgoing: 1,
      lastEvent: "fetched",
    })
    expect(summary.adapters.find((adapter) => adapter.id === "jin10-kuaixun")?.usedBy).toEqual(["source-jin10"])
    expect(summary.run).toMatchObject({ traceEventCount: 6, notifiedItems: 1 })
    expect(summary.proposal).toMatchObject({ id: "agent-proposal-duplicate-push", risk: "medium" })
    expect(summary.nodes.find((node) => node.id === "notify-preview")?.proposalImpacted).toBe(true)
    expect(summary.contracts).toMatchObject({ status: "pass", coveragePercent: 100, findingsCount: 0 })
    expect(summary.nodes.find((node) => node.id === "router-importance")).toMatchObject({
      contractId: "intelligence.router.importance",
      contractStatus: "pass",
    })
    expect(summary.contracts.nodes.find((node) => node.nodeId === "router-importance")?.ports.map((port) => port.id)).toEqual([
      "in",
      "review",
      "notify",
    ])
  })
})
