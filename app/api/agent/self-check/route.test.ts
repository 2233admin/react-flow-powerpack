import { describe, expect, it } from "vitest"
import { GET, POST } from "./route"

describe("agent self-check API", () => {
  it("returns the default workflow self-check report", async () => {
    const response = await GET(new Request("http://localhost/api/agent/self-check"))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: 1,
      status: "pass",
      project: {
        id: "workflow-intelligence",
      },
      agentEvidence: {
        traceByNode: {
          "router-importance": expect.any(Array),
        },
      },
      run: {
        spans: expect.any(Array),
        evaluation: {
          status: "pass",
        },
      },
    })
  })

  it("returns an actionable 400 for invalid posted workflows", async () => {
    const response = await POST(
      new Request("http://localhost/api/agent/self-check", {
        method: "POST",
        body: JSON.stringify({ id: "" }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: "AGENT_SELF_CHECK_FAILED",
      message: expect.any(String),
    })
  })
})
