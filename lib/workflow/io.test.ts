import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import {
  exportReactFlowToWorkflowJson,
  exportReactFlowToWorkflowCanvas,
  exportReactFlowToWorkflowMermaid,
  exportReactFlowToWorkflowMarkdown,
  exportReactFlowToWorkflowOpml,
  importWorkflowJsonToReactFlow,
  importWorkflowMermaidToReactFlow,
} from "./io"
import { parseWorkflowProject } from "./schema"
import { workflowProjectToReactFlow } from "./to-react-flow"

describe("workflow UI import/export", () => {
  it("exports React Flow edits as canonical workflow JSON", () => {
    const project = parseWorkflowProject(workflowFixture)
    const projection = workflowProjectToReactFlow(project)
    const moved = projection.nodes.map((node) =>
      node.id === "source-jin10" ? { ...node, position: { x: 500, y: 240 } } : node,
    )

    const exported = exportReactFlowToWorkflowJson(project, { nodes: moved, edges: projection.edges })
    const parsed = parseWorkflowProject(JSON.parse(exported))

    expect(parsed.nodes.find((node) => node.id === "source-jin10")?.adapter).toBe("jin10-kuaixun")
    expect(parsed.nodes.find((node) => node.id === "source-jin10")?.ui?.position).toEqual({ x: 500, y: 240 })
  })

  it("imports canonical workflow JSON into React Flow projection", () => {
    const result = importWorkflowJsonToReactFlow(JSON.stringify(workflowFixture))

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.format).toBe("canonical")
    expect(result.project.id).toBe("workflow-intelligence")
    expect(result.flow.nodes.find((node) => node.id === "source-jin10")?.data.category).toBe("data")
  })

  it("imports n8n workflow JSON into React Flow projection", () => {
    const result = importWorkflowJsonToReactFlow(JSON.stringify({
      name: "n8n Slack import",
      nodes: [
        {
          id: "trigger",
          name: "Webhook Trigger",
          type: "n8n-nodes-base.webhook",
          position: [0, 0],
          parameters: { path: "lead-intake" },
        },
        {
          id: "slack",
          name: "Send Slack",
          type: "n8n-nodes-base.slack",
          position: [320, 0],
          parameters: { operation: "postMessage", text: "hello" },
        },
      ],
      connections: {
        trigger: { main: [[{ node: "slack", type: "main", index: 0 }]] },
      },
    }))

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.format).toBe("n8n")
    expect(result.flow.nodes.find((node) => node.id === "notify-send-slack")?.data.category).toBe("action")
    expect(result.flow.edges).toHaveLength(1)
  })

  it("exports React Flow edits as Mermaid from the canonical workflow", () => {
    const project = parseWorkflowProject(workflowFixture)
    const projection = workflowProjectToReactFlow(project)

    const exported = exportReactFlowToWorkflowMermaid(project, projection)

    expect(exported).toContain("flowchart TB")
    expect(exported).toContain("source-jin10 --> agent-normalize")
    expect(exported).toContain("class source-jin10 source,fetch;")
  })

  it("exports React Flow graph to knowledge map formats", () => {
    const project = parseWorkflowProject(workflowFixture)
    const projection = workflowProjectToReactFlow(project)

    const canvas = JSON.parse(exportReactFlowToWorkflowCanvas(project, projection)) as {
      nodes: Array<{ id: string; text: string }>
      edges: Array<{ fromNode: string; toNode: string }>
    }
    const opml = exportReactFlowToWorkflowOpml(project, projection)
    const markdown = exportReactFlowToWorkflowMarkdown(project, projection)

    expect(canvas.nodes.find((node) => node.id === "source-jin10")?.text).toContain("JIN10 Source")
    expect(canvas.edges.find((edge) => edge.fromNode === "source-jin10")?.toNode).toBe("agent-normalize")
    expect(opml).toContain("<opml version=\"2.0\">")
    expect(opml).toContain("JIN10 Source -&gt; Normalize Items")
    expect(markdown).toContain("## Nodes")
    expect(markdown).toContain("| Source | Target | Relationship | Weight |")
  })

  it("imports Mermaid workflow drafts into React Flow projection", () => {
    const result = importWorkflowMermaidToReactFlow(`
      flowchart LR
        schedule["Every 5m"] --> jin10["Jin10 feed"]
        jin10 --> inbox["Review inbox"]
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)
    expect(result.project.id).toBe("mermaid-import")
    expect(result.flow.nodes.find((node) => node.id === "jin10")?.data.category).toBe("data")
    expect(result.flow.edges).toHaveLength(2)
  })
})
