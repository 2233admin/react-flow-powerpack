import { describe, expect, it } from "vitest"
import { connectedComponentEdges, findConnectedComponentForNode, findConnectedComponents } from "./graph-components"
import type { WorkflowEdge, WorkflowNode } from "./types"

function node(id: string): WorkflowNode {
  return {
    id,
    type: "workflow",
    position: { x: 0, y: 0 },
    data: { label: id, nodeType: "action", category: "action", icon: "Zap" },
  }
}

function edge(id: string, source: string, target: string): WorkflowEdge {
  return { id, source, target, type: "workflow" }
}

describe("graph components", () => {
  it("finds undirected connected components", () => {
    const nodes = [node("a"), node("b"), node("c"), node("d")]
    const edges = [edge("e1", "a", "b"), edge("e2", "c", "d")]

    expect(findConnectedComponents(nodes, edges)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ])
  })

  it("returns the component and internal edges for a node", () => {
    const nodes = [node("a"), node("b"), node("c")]
    const edges = [edge("e1", "a", "b"), edge("e2", "b", "c"), edge("external", "c", "missing")]
    const component = findConnectedComponentForNode("b", nodes, edges)

    expect(component.sort()).toEqual(["a", "b", "c"])
    expect(connectedComponentEdges(component, edges)).toEqual(["e1", "e2"])
  })
})
