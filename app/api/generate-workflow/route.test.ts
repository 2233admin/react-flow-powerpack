import { describe, expect, it } from "vitest"
import { POST } from "./route"

describe("POST /api/generate-workflow", () => {
  it("returns an actionable 400 when prompt is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-workflow", {
        method: "POST",
        body: "{}",
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: "MISSING_PROMPT",
      message: expect.stringContaining('{ "prompt": "'),
      example: {
        prompt: expect.any(String),
      },
    })
  })

  it("returns an actionable 400 for invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/generate-workflow", {
        method: "POST",
        body: "{",
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: "INVALID_JSON",
      message: expect.stringContaining("valid JSON"),
    })
  })
})
