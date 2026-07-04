import { describe, expect, it } from "vitest"
import { buildShareUrl, decodeShareState, encodeShareState, loadShareStateFromUrl } from "./share-state"
import workflowFixture from "../workflow/fixtures/workflow-intelligence.json"
import { parseWorkflowProject } from "../workflow/schema"
import { workflowProjectToReactFlow } from "../workflow/to-react-flow"

describe("share state", () => {
  it("roundtrips compressed workflow canvas state", () => {
    const workflowProject = parseWorkflowProject(workflowFixture)
    const flow = workflowProjectToReactFlow(workflowProject)
    const encoded = encodeShareState({ workflowProject, nodes: flow.nodes, edges: flow.edges })
    const decoded = decodeShareState(encoded)

    expect(decoded?.workflowProject.id).toBe(workflowProject.id)
    expect(decoded?.nodes).toHaveLength(flow.nodes.length)
    expect(decoded?.edges).toHaveLength(flow.edges.length)
  })

  it("builds and loads a share URL", () => {
    const workflowProject = parseWorkflowProject(workflowFixture)
    const flow = workflowProjectToReactFlow(workflowProject)
    const url = buildShareUrl({ workflowProject, nodes: flow.nodes, edges: flow.edges }, "http://localhost:8080/")

    expect(url).toContain("?flow=")
    expect(loadShareStateFromUrl(url)?.workflowProject.id).toBe(workflowProject.id)
  })
})
