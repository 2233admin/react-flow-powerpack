import { describe, it, expect } from "vitest"
import { rectsIntersect, resolveCollisions, findFreePosition, nodeRect } from "./collision"
import type { WorkflowNode } from "./types"

function makeNode(id: string, x: number, y: number, parentId?: string): WorkflowNode {
  return {
    id,
    type: "workflow",
    position: { x, y },
    measured: { width: 240, height: 96 },
    ...(parentId ? { parentId } : {}),
    data: { label: id, nodeType: "action", category: "action", icon: "Zap", color: "#fff" },
  } as WorkflowNode
}

describe("rectsIntersect", () => {
  it("detects overlap", () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 100, height: 100 }),
    ).toBe(true)
  })
  it("detects separation", () => {
    expect(
      rectsIntersect({ x: 0, y: 0, width: 100, height: 100 }, { x: 200, y: 0, width: 100, height: 100 }),
    ).toBe(false)
  })
})

describe("resolveCollisions", () => {
  it("pushes overlapping siblings apart, keeping the priority node fixed", () => {
    const nodes = [makeNode("a", 0, 0), makeNode("b", 20, 10)]
    const result = resolveCollisions(nodes, "a")
    const a = result.find((n) => n.id === "a")!
    const b = result.find((n) => n.id === "b")!
    expect(a.position).toEqual({ x: 0, y: 0 })
    expect(rectsIntersect(nodeRect(a), nodeRect(b))).toBe(false)
  })

  it("resolves a stack of three overlapping nodes with no remaining overlaps", () => {
    const nodes = [makeNode("a", 0, 0), makeNode("b", 10, 10), makeNode("c", 20, 20)]
    const result = resolveCollisions(nodes, "a")
    for (const p of result) {
      for (const q of result) {
        if (p.id === q.id) continue
        expect(rectsIntersect(nodeRect(p), nodeRect(q))).toBe(false)
      }
    }
  })

  it("does not push nodes in a different parent layer", () => {
    const nodes = [makeNode("a", 0, 0), makeNode("child", 10, 10, "group-1")]
    const result = resolveCollisions(nodes, "a")
    expect(result.find((n) => n.id === "child")!.position).toEqual({ x: 10, y: 10 })
  })

  it("leaves already-separated nodes untouched", () => {
    const nodes = [makeNode("a", 0, 0), makeNode("b", 500, 500)]
    const result = resolveCollisions(nodes, "a")
    expect(result.find((n) => n.id === "b")!.position).toEqual({ x: 500, y: 500 })
  })
})

describe("findFreePosition", () => {
  it("returns desired position when free", () => {
    const nodes = [makeNode("a", 1000, 1000)]
    const pos = findFreePosition(nodes, { x: 0, y: 0 }, { width: 240, height: 96 })
    expect(pos).toEqual({ x: 0, y: 0 })
  })

  it("finds a non-overlapping slot when desired is occupied", () => {
    const nodes = [makeNode("a", 0, 0)]
    const pos = findFreePosition(nodes, { x: 0, y: 0 }, { width: 240, height: 96 })
    const candidate = { x: pos.x, y: pos.y, width: 240, height: 96 }
    expect(rectsIntersect(candidate, nodeRect(nodes[0]))).toBe(false)
  })

  it("only considers nodes in the same parent layer", () => {
    const nodes = [makeNode("child", 0, 0, "group-1")]
    const pos = findFreePosition(nodes, { x: 0, y: 0 }, { width: 240, height: 96 })
    expect(pos).toEqual({ x: 0, y: 0 })
  })
})
