import { rm } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import workflowFixture from "../../../../../lib/workflow/fixtures/workflow-intelligence.json"
import { createWorkflowRunArtifact } from "../../../../../lib/workflow/run-artifacts"
import { GET } from "./route"

describe("workflow run artifact API", () => {
  it("reads a persisted workflow run artifact by runId", async () => {
    const artifact = await createWorkflowRunArtifact(workflowFixture, {
      runId: "test-api-run-artifact",
      now: new Date("2026-07-04T08:00:00.000Z"),
    })

    const response = await GET(new Request("http://localhost/api/workflow/runs/test-api-run-artifact"), {
      params: Promise.resolve({ runId: artifact.runId }),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      runId: "test-api-run-artifact",
      verification: { status: "pass" },
      run: {
        spans: expect.any(Array),
        evaluation: {
          status: "pass",
        },
      },
    })

    await rm(artifact.artifactPath, { force: true })
  })

  it("returns 404 for a missing workflow run artifact", async () => {
    const response = await GET(new Request("http://localhost/api/workflow/runs/missing"), {
      params: Promise.resolve({ runId: "missing" }),
    })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      error: "WORKFLOW_RUN_NOT_FOUND",
    })
  })
})
