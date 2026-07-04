import { describe, expect, it } from "vitest"
import { getProposalFocus, getProposalOperationFocus } from "./proposal-focus"

describe("proposal focus targets", () => {
  it("focuses nodes touched by node operations", () => {
    expect(
      getProposalOperationFocus({
        type: "updateNodeParams",
        nodeId: "source-jin10",
        params: { limit: 50 },
      }),
    ).toEqual({ nodeIds: ["source-jin10"], edgeIds: [] })
  })

  it("focuses both endpoints and edge id for edge additions", () => {
    expect(
      getProposalOperationFocus({
        type: "addEdge",
        edge: { id: "e-a-b", source: "a", target: "b" },
      }),
    ).toEqual({ nodeIds: ["a", "b"], edgeIds: ["e-a-b"] })
  })

  it("deduplicates full proposal focus targets", () => {
    const focus = getProposalFocus([
      { type: "removeNode", nodeId: "a" },
      { type: "addEdge", edge: { id: "e-a-b", source: "a", target: "b" } },
    ])

    expect(focus).toEqual({ nodeIds: ["a", "b"], edgeIds: ["e-a-b"] })
  })
})
