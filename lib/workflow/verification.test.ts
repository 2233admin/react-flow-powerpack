import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { createDefaultAdapterRegistry } from "./adapter-registry"
import { parseWorkflowProject } from "./schema"
import { simulateWorkflowRun } from "./simulation"
import { verifyWorkflowRun } from "./verification"

describe("workflow verification harness", () => {
  it("reports chip-verification-style assertions, coverage, scoreboard, and waveform", async () => {
    const project = parseWorkflowProject(workflowFixture)
    const run = await simulateWorkflowRun(project, createDefaultAdapterRegistry())
    const report = verifyWorkflowRun(project, run)

    expect(report).toMatchObject({
      methodology: "chip-verification-inspired",
      status: "pass",
      testbench: {
        name: "workflow-intelligence-deterministic-testbench",
        deterministic: true,
        driver: "simulateWorkflowRun",
        monitor: "workflow trace events",
      },
      coverage: {
        node: {
          covered: 6,
          total: 6,
          percent: 100,
          missingIds: [],
        },
        event: {
          missing: [],
        },
      },
      scoreboard: {
        mismatches: [],
      },
      scorecard: {
        overall: 0.925,
      },
      contracts: {
        status: "pass",
        portCoverage: {
          percent: 100,
        },
      },
    })
    expect(report.assertions.map((assertion) => assertion.id)).toEqual([
      "assert-node-contracts-valid",
      "assert-edge-port-contracts-valid",
      "assert-no-missing-node-coverage",
      "assert-no-scoreboard-mismatch",
      "assert-safe-side-effects",
      "assert-trace-order",
      "assert-span-tree-available",
      "assert-regression-gate",
    ])
    expect(report.waveform.map((event) => `${event.tick}:${event.signal}:${event.nodeId}`)).toEqual([
      "1:triggered:schedule-5m",
      "2:fetched:source-jin10",
      "3:normalized:agent-normalize",
      "4:routed:router-importance",
      "5:stored:inbox-review",
      "6:sent:notify-preview",
    ])
    expect(report.agentInterface.primaryPointers).toContain("/verification/contracts")
    expect(report.agentInterface.primaryPointers).toContain("/verification/waveform")
    expect(report.agentInterface.primaryPointers).toContain("/run/spans")
    expect(report.agentInterface.primaryPointers).toContain("/run/evaluation")
  })
})
