import { describe, expect, it } from "vitest"
import { workflowProjectToReactFlow } from "./to-react-flow"
import { WORKFLOW_NODE_CATALOG, createWorkflowNodeFromCatalog } from "./node-catalog"
import { buildParameterInterfaceView } from "./parameter-interface"
import { parseWorkflowProject } from "./schema"
import workflowFixture from "./fixtures/workflow-intelligence.json"

describe("Houdini-style parameter interface", () => {
  it("derives ordinary canonical node parameters from declared internal public params", () => {
    const project = parseWorkflowProject(workflowFixture)
    const node = project.nodes.find((candidate) => candidate.id === "source-jin10")
    const adapter = project.adapters.find((candidate) => candidate.id === node?.adapter)
    const view = buildParameterInterfaceView({ node, adapter, nodes: workflowProjectToReactFlow(project).nodes })

    expect(view?.mode).toBe("exposed")
    expect(view?.title).toBe("Node Parameters")
    expect(view?.groups.map((group) => group.label)).toEqual(["Source", "Transform"])
    expect(view?.fields.find((field) => field.id === "filter.limit")).toMatchObject({
      label: "Limit",
      value: 20,
      readonly: false,
      binding: { nodeId: "source-jin10__filter", source: "params", fieldId: "limit" },
    })
    expect(view?.fields.find((field) => field.id === "fetch.mode")).toMatchObject({
      label: "Mode",
      value: "fixture",
      binding: { nodeId: "source-jin10__fetch", source: "adapter", fieldId: "mode" },
    })
  })

  it("derives package parameters from declared internal public params", () => {
    const item = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "package.map.knowledge-map")
    expect(item).toBeDefined()
    const node = createWorkflowNodeFromCatalog(item!, "pkg-map", { x: 0, y: 0 })
    const view = buildParameterInterfaceView({ node })

    expect(node.parameterInterface?.groups.map((group) => group.label)).toEqual(["Source", "Contract", "Runtime"])
    expect(view?.mode).toBe("exposed")
    expect(view?.fields.find((field) => field.id === "anchor.artifactPath")).toMatchObject({
      label: "Artifact Path",
      groupId: "source",
      value: "runs/{{runId}}/artifact.json",
      binding: { nodeId: "pkg-map__anchor", source: "params", fieldId: "artifactPath" },
    })
    expect(view?.fields.find((field) => field.id === "topic.nodeCount")).toMatchObject({
      readonly: true,
      value: 0,
    })
  })

  it("falls back to readonly internals summary when no public parameters are declared", () => {
    const node = parseWorkflowProject({
      id: "summary-only",
      name: "Summary Only",
      profile: "intelligence",
      version: 1,
      nodes: [
        {
          id: "pkg-summary",
          kind: "action",
          capability: "store",
          params: {},
          ui: { catalogId: "package.ops.event" },
        },
      ],
      edges: [],
    }).nodes[0]
    const view = buildParameterInterfaceView({ node })

    expect(view?.mode).toBe("summary")
    expect(view?.fields.every((field) => field.readonly)).toBe(true)
    expect(view?.fields.map((field) => field.label)).toContain("Manual trigger")
  })
})
