import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import { reactFlowToWorkflowProject } from "./from-react-flow"
import { WORKFLOW_NODE_CATALOG, createWorkflowNodeFromCatalog } from "./node-catalog"
import { parseWorkflowProject } from "./schema"
import { workflowProjectToReactFlow } from "./to-react-flow"

describe("React Flow workflow adapter", () => {
  it("projects canonical workflow data into React Flow nodes and edges", () => {
    const project = parseWorkflowProject(workflowFixture)
    const projection = workflowProjectToReactFlow(project)

    const source = projection.nodes.find((node) => node.id === "source-jin10")
    expect(source?.data.category).toBe("data")
    expect(source?.data.fields?.find((field) => field.id === "limit")?.value).toBe("20")
    expect(projection.edges.map((edge) => edge.id)).toContain("e-source-normalize")
  })

  it("round-trips UI edits without erasing canonical adapter or params", () => {
    const project = parseWorkflowProject(workflowFixture)
    const projection = workflowProjectToReactFlow(project)
    const moved = {
      nodes: projection.nodes.map((node) =>
        node.id === "source-jin10"
          ? { ...node, position: { x: 111, y: 222 }, data: { ...node.data, label: "Edited label" } }
          : node,
      ),
      edges: projection.edges,
    }

    const next = reactFlowToWorkflowProject(project, moved)
    const source = next.nodes.find((node) => node.id === "source-jin10")

    expect(source?.adapter).toBe("jin10-kuaixun")
    expect(source?.params).toEqual({ limit: 20, importantOnly: false })
    expect(source?.ui?.position).toEqual({ x: 111, y: 222 })
    expect(source?.ui?.label).toBe("Edited label")
  })

  it("round-trips source anchors and semantic weighted edge contracts", () => {
    const project = parseWorkflowProject({
      ...workflowFixture,
      nodes: workflowFixture.nodes.map((node) =>
        node.id === "source-jin10"
          ? {
              ...node,
              sourceAnchor: {
                kind: "artifact",
                label: "JIN10 fixture run",
                runId: "run-1",
                artifactPath: "runs/run-1/artifact.json",
              },
              runArtifact: {
                runId: "run-1",
                artifactPath: "runs/run-1/artifact.json",
              },
            }
          : node,
      ),
      edges: workflowFixture.edges.map((edge) =>
        edge.id === "e-source-normalize"
          ? {
              ...edge,
              semantic: {
                relationship: "evidence",
                reason: "normalize consumes anchored source",
                confidence: 0.82,
              },
              weight: 0.75,
              contractId: "edge.contract.source-normalize",
              proposalState: "accepted",
            }
          : edge,
      ),
    })
    const projection = workflowProjectToReactFlow(project)
    const source = projection.nodes.find((node) => node.id === "source-jin10")
    const edge = projection.edges.find((candidate) => candidate.id === "e-source-normalize")

    expect(source?.data.sourceAnchor?.artifactPath).toBe("runs/run-1/artifact.json")
    expect(edge?.data?.semantic?.relationship).toBe("evidence")
    expect(edge?.data?.weight).toBe(0.75)

    const next = reactFlowToWorkflowProject(project, projection)
    expect(next.nodes.find((node) => node.id === "source-jin10")?.sourceAnchor?.runId).toBe("run-1")
    expect(next.edges.find((candidate) => candidate.id === "e-source-normalize")?.contractId).toBe("edge.contract.source-normalize")
  })

  it("round-trips package parameter interfaces and exposed bindings", () => {
    const item = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "package.map.knowledge-map")!
    const projectNode = createWorkflowNodeFromCatalog(item, "pkg-map", { x: 40, y: 80 })
    const project = parseWorkflowProject({
      id: "parameter-interface",
      name: "Parameter Interface",
      profile: "intelligence",
      version: 1,
      nodes: [projectNode],
      edges: [],
    })

    const projection = workflowProjectToReactFlow(project)
    expect(projection.nodes[0].data.parameterInterface?.fields.find((field) => field.id === "semantic.relationship")?.binding).toEqual({
      nodeId: "pkg-map__semantic",
      source: "params",
      fieldId: "relationship",
    })

    const next = reactFlowToWorkflowProject(project, projection)
    expect(next.nodes[0].parameterInterface?.fields.find((field) => field.id === "anchor.artifactPath")?.value).toBe("runs/{{runId}}/artifact.json")
  })
})
