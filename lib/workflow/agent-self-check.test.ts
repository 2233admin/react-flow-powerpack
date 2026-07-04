import { rm } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { createAgentSelfCheckReport } from "./agent-self-check"
import { createWorkflowRunArtifact } from "./run-artifacts"

describe("agent self-check report", () => {
  it("creates an agent-readable headless run report", async () => {
    const report = await createAgentSelfCheckReport(workflowFixture, {
      now: new Date("2026-07-04T06:30:00.000Z"),
      endpoint: "/api/agent/self-check",
    })

    expect(report).toMatchObject({
      schemaVersion: 1,
      generatedAt: "2026-07-04T06:30:00.000Z",
      status: "pass",
      project: {
        id: "workflow-intelligence",
        profile: "intelligence",
      },
      contract: {
        endpoint: "/api/agent/self-check",
      },
      graph: {
        nodeCount: 6,
        edgeCount: 5,
        missingTraceNodeIds: [],
      },
    })
    expect(report.checks.map((check) => check.id)).toEqual([
      "workflow-schema",
      "adapter-registry",
      "headless-simulation",
      "middle-state-evidence",
      "verification-harness",
      "side-effect-safety",
    ])
    expect(report.verification).toMatchObject({
      methodology: "chip-verification-inspired",
      status: "pass",
      coverage: {
        node: {
          percent: 100,
        },
      },
      contracts: {
        portCoverage: {
          percent: 100,
        },
      },
      scoreboard: {
        mismatches: [],
      },
      scorecard: {
        overall: 0.925,
      },
    })
    expect(report.agentEvidence.observations).toContainEqual(
      expect.objectContaining({
        jsonPointer: "/verification",
      }),
    )
    expect(report.agentEvidence.observations).toContainEqual(
      expect.objectContaining({
        jsonPointer: "/verification/contracts",
      }),
    )
    expect(report.run.trace.map((event) => event.nodeId)).toEqual([
      "schedule-5m",
      "source-jin10",
      "agent-normalize",
      "router-importance",
      "inbox-review",
      "notify-preview",
    ])
    expect(report.agentEvidence.traceByNode["router-importance"][0]).toMatchObject({
      event: "routed",
      itemCount: 2,
    })
    expect(report.agentEvidence.observations).toContainEqual(
      expect.objectContaining({
        jsonPointer: "/run/trace",
      }),
    )
    expect(report.agentEvidence.observations).toContainEqual(
      expect.objectContaining({
        jsonPointer: "/run/spans",
      }),
    )
    expect(report.agentEvidence.observations).toContainEqual(
      expect.objectContaining({
        jsonPointer: "/run/evaluation",
      }),
    )
    expect(report.run.spans.map((span) => span.type)).toContain("model.call")
    expect(report.run.evaluation).toMatchObject({
      status: "pass",
      scorecard: { overall: 0.925 },
    })
  })

  it("points agents at the latest durable run artifact when one exists", async () => {
    const artifact = await createWorkflowRunArtifact(workflowFixture, {
      runId: "zzzz-agent-self-check-artifact",
      now: new Date("2026-07-04T08:30:00.000Z"),
    })

    const report = await createAgentSelfCheckReport(workflowFixture)

    expect(report.agentEvidence.latestRunArtifact).toMatchObject({
      runId: "zzzz-agent-self-check-artifact",
      artifactPath: artifact.artifactPath,
      apiPath: "/api/workflow/runs/zzzz-agent-self-check-artifact",
    })

    await rm(artifact.artifactPath, { force: true })
  })

  it("fails when a source adapter provider is not registered", async () => {
    const report = await createAgentSelfCheckReport({
      ...workflowFixture,
      adapters: workflowFixture.adapters.map((adapter) =>
        adapter.id === "jin10-kuaixun" ? { ...adapter, provider: "missing-provider" } : adapter,
      ),
    })

    expect(report.status).toBe("fail")
    expect(report.checks.find((check) => check.id === "adapter-registry")).toMatchObject({
      status: "fail",
    })
    expect(report.agentEvidence.nextActions[0]).toContain("/checks")
  })
})
