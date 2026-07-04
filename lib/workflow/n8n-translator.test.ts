import { describe, expect, it } from "vitest"
import { translateN8nWorkflowToWorkflowProject } from "./n8n-translator"

const n8nSample = {
  name: "Slack Lead Router",
  nodes: [
    {
      id: "manual-1",
      name: "Manual Trigger",
      type: "n8n-nodes-base.manualTrigger",
      typeVersion: 1,
      position: [100, 120],
      parameters: {},
    },
    {
      id: "http-1",
      name: "Fetch leads",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4,
      position: [420, 120],
      parameters: { method: "GET", url: "https://example.com/leads" },
      credentials: { httpBasicAuth: { id: "secret-id", name: "prod-basic" } },
    },
    {
      id: "if-1",
      name: "High value?",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [740, 120],
      parameters: {
        conditions: {
          number: [{ leftValue: "={{ $json.value }}", operation: "larger", rightValue: 1000 }],
        },
      },
    },
    {
      id: "slack-1",
      name: "Send Slack",
      type: "n8n-nodes-base.slack",
      typeVersion: 2,
      position: [1060, 120],
      parameters: { operation: "postMessage", channel: "#ops", text: "={{ $json.title }}" },
    },
  ],
  connections: {
    "Manual Trigger": {
      main: [[{ node: "http-1", type: "main", index: 0 }]],
    },
    "http-1": {
      main: [[{ node: "High value?", type: "main", index: 0 }]],
    },
    "High value?": {
      main: [[{ node: "slack-1", type: "main", index: 0 }]],
    },
  },
}

describe("n8n workflow translator", () => {
  it("translates n8n nodes and mixed name/id connections into a canonical workflow", () => {
    const result = translateN8nWorkflowToWorkflowProject(n8nSample)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)

    expect(result.report).toMatchObject({
      source: "n8n",
      workflowName: "Slack Lead Router",
      nodeCount: 4,
      edgeCount: 3,
      unsupportedConnectionCount: 0,
    })
    expect(result.project.id).toBe("n8n-slack-lead-router")
    expect(result.project.nodes.map((node) => [node.kind, node.capability])).toEqual([
      ["schedule", "trigger"],
      ["source", "fetch"],
      ["router", "route"],
      ["notify", "send"],
    ])
    expect(result.project.edges.map((edge) => [edge.source, edge.target])).toEqual([
      ["trigger-manual-trigger", "source-fetch-leads"],
      ["source-fetch-leads", "router-high-value"],
      ["router-high-value", "notify-send-slack"],
    ])
    expect(result.project.nodes.find((node) => node.id === "source-fetch-leads")?.params).toMatchObject({
      n8nType: "httpRequest",
      method: "GET",
      url: "https://example.com/leads",
    })
    expect(result.project.nodes.find((node) => node.id === "source-fetch-leads")?.ui?.n8n).toMatchObject({
      originalId: "http-1",
      credentials: { httpBasicAuth: { id: "[redacted]", name: "[redacted]" } },
    })
    expect(result.project.adapters).toContainEqual(expect.objectContaining({
      id: "n8n-source-fetch-leads",
      type: "source",
      provider: "httprequest",
    }))
  })

  it("keeps sticky notes as translated context nodes", () => {
    const result = translateN8nWorkflowToWorkflowProject({
      name: "Sticky context",
      nodes: [
        {
          id: "note-1",
          name: "Sticky Note",
          type: "n8n-nodes-base.stickyNote",
          position: [0, 0],
          parameters: { content: "Remember to configure credentials." },
        },
      ],
      connections: {},
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.project.nodes[0]).toMatchObject({
      kind: "action",
      capability: "store",
      params: { content: "Remember to configure credentials." },
      ui: { n8n: { isStickyNote: true } },
    })
  })
})
