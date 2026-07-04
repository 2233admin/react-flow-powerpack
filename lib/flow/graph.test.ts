import { describe, it, expect } from "vitest"
import { wouldCreateCycle, countHandleConnections, validateConnection } from "./graph"
import type { Edge } from "@xyflow/react"

const e = (source: string, target: string, extra: Partial<Edge> = {}): Edge =>
  ({ id: `${source}-${target}`, source, target, ...extra }) as Edge

describe("wouldCreateCycle", () => {
  it("detects self-loop", () => {
    expect(wouldCreateCycle([], "a", "a")).toBe(true)
  })
  it("detects direct cycle", () => {
    expect(wouldCreateCycle([e("a", "b")], "b", "a")).toBe(true)
  })
  it("detects transitive cycle", () => {
    const edges = [e("a", "b"), e("b", "c")]
    expect(wouldCreateCycle(edges, "c", "a")).toBe(true)
  })
  it("allows DAG additions", () => {
    const edges = [e("a", "b"), e("a", "c")]
    expect(wouldCreateCycle(edges, "b", "c")).toBe(false)
  })
})

describe("countHandleConnections", () => {
  it("counts by node + handle + direction", () => {
    const edges = [
      e("a", "b", { sourceHandle: "out" }),
      e("a", "c", { sourceHandle: "out" }),
      e("a", "d", { sourceHandle: "err" }),
    ]
    expect(countHandleConnections(edges, "a", "out", "source")).toBe(2)
    expect(countHandleConnections(edges, "a", "err", "source")).toBe(1)
    expect(countHandleConnections(edges, "b", null, "target")).toBe(1)
  })
})

describe("validateConnection", () => {
  it("rejects cycles when preventCycles is on", () => {
    const res = validateConnection([e("a", "b")], { source: "b", target: "a", sourceHandle: null, targetHandle: null }, { preventCycles: true })
    expect(res.ok).toBe(false)
  })
  it("allows cycles when preventCycles is off", () => {
    const res = validateConnection([e("a", "b")], { source: "b", target: "a", sourceHandle: null, targetHandle: null }, { preventCycles: false })
    expect(res.ok).toBe(true)
  })
  it("enforces source connection limit", () => {
    const res = validateConnection(
      [e("a", "b"), e("a", "c")],
      { source: "a", target: "d", sourceHandle: null, targetHandle: null },
      { preventCycles: false, maxSourceConnections: 2 },
    )
    expect(res.ok).toBe(false)
  })
  it("enforces target connection limit", () => {
    const res = validateConnection(
      [e("a", "b")],
      { source: "c", target: "b", sourceHandle: null, targetHandle: null },
      { preventCycles: false, maxTargetConnections: 1 },
    )
    expect(res.ok).toBe(false)
  })
})
