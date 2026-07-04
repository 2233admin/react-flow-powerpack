import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { exportWorkflowProjectToJson, importWorkflowProjectFromJson } from "./codec"
import { parseWorkflowProject } from "./schema"

describe("workflow JSON import/export", () => {
  it("imports canonical JSON and exports stable canonical JSON", () => {
    const imported = importWorkflowProjectFromJson(JSON.stringify(workflowFixture))
    expect(imported.ok).toBe(true)
    if (!imported.ok) throw new Error(imported.error)

    const exported = exportWorkflowProjectToJson(imported.project)
    const reparsed = parseWorkflowProject(JSON.parse(exported))

    expect(reparsed.id).toBe("workflow-intelligence")
    expect(reparsed.nodes.find((node) => node.id === "source-jin10")?.adapter).toBe("jin10-kuaixun")
    expect(exported.endsWith("\n")).toBe(true)
  })

  it("imports n8n workflow JSON by translating it to canonical workflow JSON", () => {
    const imported = importWorkflowProjectFromJson(JSON.stringify({
      name: "n8n HTTP import",
      nodes: [
        {
          id: "manual",
          name: "Manual Trigger",
          type: "n8n-nodes-base.manualTrigger",
          position: [0, 0],
          parameters: {},
        },
        {
          id: "request",
          name: "HTTP Request",
          type: "n8n-nodes-base.httpRequest",
          position: [300, 0],
          parameters: { method: "GET", url: "https://example.com" },
        },
      ],
      connections: {
        manual: { main: [[{ node: "request", type: "main", index: 0 }]] },
      },
    }))

    expect(imported.ok).toBe(true)
    if (!imported.ok) throw new Error(imported.error)
    expect(imported.format).toBe("n8n")
    expect(imported.report?.nodeCount).toBe(2)
    expect(imported.project.nodes.find((node) => node.id === "source-http-request")?.params.url).toBe("https://example.com")
  })

  it("returns a displayable import error for invalid workflow JSON", () => {
    const result = importWorkflowProjectFromJson("{")

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("Invalid workflow JSON")
    }
  })
})
