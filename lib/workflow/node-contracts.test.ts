import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { buildProjectContractReport, getNodeContract, resolveEdgeContract, validateEdgeContracts, validateNodeContract } from "./node-contracts"
import { parseWorkflowProject } from "./schema"

describe("workflow node contracts", () => {
  const project = parseWorkflowProject(workflowFixture)

  it("covers every default intelligence workflow node with variable and port contracts", () => {
    const report = buildProjectContractReport(project)

    expect(report.status).toBe("pass")
    expect(report.portCoverage).toEqual({
      nodesWithContracts: 6,
      totalNodes: 6,
      percent: 100,
      missingNodeIds: [],
    })
    expect(report.nodeContracts.map((entry) => [entry.nodeId, entry.contractId])).toEqual([
      ["schedule-5m", "intelligence.schedule.cron"],
      ["source-jin10", "intelligence.source.jin10"],
      ["agent-normalize", "intelligence.processing.normalize"],
      ["router-importance", "intelligence.router.importance"],
      ["inbox-review", "intelligence.output.inbox"],
      ["notify-preview", "intelligence.output.webhook"],
    ])
  })

  it("exposes explicit input and output port types for router nodes", () => {
    const router = project.nodes.find((node) => node.id === "router-importance")
    const contract = getNodeContract(router)

    expect(contract?.ports.map((port) => `${port.direction}:${port.id}:${port.type}`)).toEqual([
      "input:in:items[]",
      "output:review:items[]",
      "output:notify:items[]",
    ])
    expect(contract?.params).toContainEqual(
      expect.objectContaining({
        id: "expression",
        source: "params",
        type: "string",
        required: true,
      }),
    )
  })

  it("infers compatible edge ports for the default intelligence workflow", () => {
    const report = buildProjectContractReport(project)
    const routerNotify = resolveEdgeContract(project, project.edges.find((edge) => edge.id === "e-router-notify")!)

    expect(validateEdgeContracts(project)).toEqual([])
    expect(report.status).toBe("pass")
    expect(routerNotify.sourcePort?.id).toBe("notify")
    expect(routerNotify.targetPort?.id).toBe("in")
    expect(routerNotify.compatible).toBe(true)
  })

  it("fails edges that connect incompatible port types", () => {
    const invalidProject = parseWorkflowProject({
      ...workflowFixture,
      edges: [
        {
          id: "e-invalid",
          source: "schedule-5m",
          target: "notify-preview",
        },
      ],
    })

    expect(validateEdgeContracts(invalidProject)).toEqual([
      expect.objectContaining({
        contractId: "edge:e-invalid",
        status: "fail",
        summary: 'Edge "e-invalid" connects incompatible port types.',
      }),
    ])
  })

  it("fails invalid form params before a workflow reaches runtime", () => {
    const node = {
      id: "source-jin10",
      kind: "source" as const,
      capability: "fetch" as const,
      adapter: "jin10-kuaixun",
      params: { limit: 0, importantOnly: "yes" },
    }
    const adapter = project.adapters.find((candidate) => candidate.id === "jin10-kuaixun")
    const findings = validateNodeContract(node, adapter)

    expect(findings.map((finding) => finding.summary)).toEqual([
      'Param "limit" is below minimum.',
      'Param "importantOnly" should be boolean.',
    ])
  })
})
