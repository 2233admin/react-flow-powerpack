import { rm } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { createWorkflowRunArtifact, readWorkflowRunArtifact } from "./run-artifacts"

describe("workflow run artifacts", () => {
  it("persists and reads durable workflow run evidence", async () => {
    const runId = "test-workflow-run-artifact"
    const artifact = await createWorkflowRunArtifact(workflowFixture, {
      runId,
      now: new Date("2026-07-04T08:00:00.000Z"),
    })

    const readBack = await readWorkflowRunArtifact(runId)
    expect(readBack).toMatchObject({
      runId,
      project: { id: "workflow-intelligence" },
      verification: {
        status: "pass",
      },
      run: {
        spans: expect.any(Array),
        evaluation: {
          status: "pass",
        },
      },
    })
    expect(readBack?.artifactPath).toBe(artifact.artifactPath)

    await rm(artifact.artifactPath, { force: true })
  })

  it("returns null for missing run artifacts", async () => {
    await expect(readWorkflowRunArtifact("missing-run-artifact")).resolves.toBeNull()
  })
})
