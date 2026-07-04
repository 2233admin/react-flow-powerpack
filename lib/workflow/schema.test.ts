import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { parseWorkflowProject } from "./schema"

describe("workflowProjectSchema", () => {
  it("parses the intelligence fixture as canonical workflow data", () => {
    const project = parseWorkflowProject(workflowFixture)

    expect(project.profile).toBe("intelligence")
    expect(project.nodes.find((node) => node.id === "source-jin10")?.adapter).toBe("jin10-kuaixun")
    expect(project.adapters.find((adapter) => adapter.id === "simulated-webhook")?.mode).toBe("mock")
    expect(project.agentPermissions.canSendNotifications).toBe(false)
  })

  it("rejects edges that point at missing nodes", () => {
    expect(() =>
      parseWorkflowProject({
        ...workflowFixture,
        edges: [{ id: "bad-edge", source: "source-jin10", target: "missing-node" }],
      }),
    ).toThrow(/missing target/)
  })

  it("keeps old edges compatible while accepting explicit port contracts", () => {
    const legacy = parseWorkflowProject(workflowFixture)
    const explicit = parseWorkflowProject({
      ...workflowFixture,
      edges: workflowFixture.edges.map((edge) =>
        edge.id === "e-router-inbox"
          ? { ...edge, sourcePort: "review", targetPort: "in" }
          : edge,
      ),
    })

    expect(legacy.edges.find((edge) => edge.id === "e-router-inbox")?.sourcePort).toBeUndefined()
    expect(explicit.edges.find((edge) => edge.id === "e-router-inbox")).toMatchObject({
      sourcePort: "review",
      targetPort: "in",
    })
  })

  it("rejects nodes bound to missing adapters", () => {
    expect(() =>
      parseWorkflowProject({
        ...workflowFixture,
        nodes: workflowFixture.nodes.map((node) =>
          node.id === "source-jin10" ? { ...node, adapter: "missing-adapter" } : node,
        ),
      }),
    ).toThrow(/missing adapter/)
  })
})
