import { rm } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import workflowFixture from "../../../../lib/workflow/fixtures/workflow-intelligence.json"
import { POST } from "./route"

describe("workflow run API", () => {
  it("persists a workflow run artifact", async () => {
    const response = await POST(
      new Request("http://localhost/api/workflow/run", {
        method: "POST",
        body: JSON.stringify(workflowFixture),
      }),
    )

    expect(response.status).toBe(200)
    const artifact = await response.json()
    expect(artifact).toMatchObject({
      schemaVersion: 1,
      project: { id: "workflow-intelligence" },
      verification: { status: "pass" },
      run: {
        spans: expect.any(Array),
        evaluation: {
          status: "pass",
        },
      },
    })
    expect(artifact.runId).toEqual(expect.any(String))
    expect(artifact.artifactPath).toEqual(expect.stringContaining("react-flow-powerpack-lovable-fix"))

    await rm(artifact.artifactPath, { force: true })
  })
})
