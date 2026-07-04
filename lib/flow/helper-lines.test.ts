import { describe, it, expect } from "vitest"
import type { NodeChange, NodePositionChange } from "@xyflow/react"
import { getHelperLines, getNodeInteractionProbe, applyHelperLines } from "./helper-lines"
import type { WorkflowNode } from "./types"

function node(id: string, x: number, y: number, width = 200, height = 100): WorkflowNode {
  return {
    id,
    position: { x, y },
    width,
    height,
    data: {
      label: id,
      nodeType: "action",
      category: "action",
      icon: "Zap",
      color: "var(--chart-1)",
    },
  } as WorkflowNode
}

describe("getHelperLines", () => {
  it("左边缘足够接近时吸附对齐 x", () => {
    const nodes = [node("a", 103, 400), node("b", 100, 0)]
    const change: NodePositionChange = {
      id: "a",
      type: "position",
      dragging: true,
      position: { x: 103, y: 400 },
    }
    const result = getHelperLines(change, nodes)
    expect(result.snapPosition.x).toBe(100) // 吸附到 b 的左边缘
    expect(result.vertical).toBe(100)
  })

  it("距离超过阈值时不吸附", () => {
    const nodes = [node("a", 130, 400), node("b", 100, 0)]
    const change: NodePositionChange = {
      id: "a",
      type: "position",
      dragging: true,
      position: { x: 130, y: 400 },
    }
    const result = getHelperLines(change, nodes)
    expect(result.snapPosition.x).toBeUndefined()
  })

  it("顶部边缘接近时吸附对齐 y", () => {
    const nodes = [node("a", 500, 202), node("b", 0, 200)]
    const change: NodePositionChange = {
      id: "a",
      type: "position",
      dragging: true,
      position: { x: 500, y: 202 },
    }
    const result = getHelperLines(change, nodes)
    expect(result.snapPosition.y).toBe(200)
    expect(result.horizontal).toBe(200)
  })

  it("不同父容器的节点之间不参与对齐", () => {
    const a = { ...node("a", 103, 400), parentId: "g1" } as WorkflowNode
    const b = { ...node("b", 100, 0), parentId: "g2" } as WorkflowNode
    const change: NodePositionChange = {
      id: "a",
      type: "position",
      dragging: true,
      position: { x: 103, y: 400 },
    }
    const result = getHelperLines(change, [a, b])
    expect(result.snapPosition.x).toBeUndefined()
  })
})

describe("getNodeInteractionProbe", () => {
  it("节点靠近但未重叠时输出 near target", () => {
    const nodes = [node("a", 0, 0), node("b", 240, 0)]
    const change: NodePositionChange = {
      id: "a",
      type: "position",
      dragging: true,
      position: { x: 8, y: 0 },
    }

    const result = getNodeInteractionProbe(change, nodes)

    expect(result?.draggedId).toBe("a")
    expect(result?.targets).toContainEqual(expect.objectContaining({ id: "b", state: "near" }))
  })

  it("节点重叠时输出 overlap target", () => {
    const nodes = [node("a", 0, 0), node("b", 160, 0)]
    const change: NodePositionChange = {
      id: "a",
      type: "position",
      dragging: true,
      position: { x: 20, y: 0 },
    }

    const result = getNodeInteractionProbe(change, nodes)

    expect(result?.targets[0]).toMatchObject({ id: "b", state: "overlap", distance: 0 })
  })
})

describe("applyHelperLines", () => {
  it("没有拖拽位置变更时原样返回", () => {
    const nodes = [node("a", 0, 0)]
    const changes: NodeChange<WorkflowNode>[] = [{ id: "a", type: "select", selected: true }]
    const result = applyHelperLines(changes, nodes)
    expect(result.changes).toBe(changes)
    expect(result.helperLines.snapPosition).toEqual({})
  })

  it("拖拽时把吸附位置写回对应的位置变更", () => {
    const nodes = [node("a", 103, 400), node("b", 100, 0)]
    const changes: NodeChange<WorkflowNode>[] = [
      { id: "a", type: "position", dragging: true, position: { x: 103, y: 400 } },
    ]
    const result = applyHelperLines(changes, nodes)
    const posChange = result.changes[0] as NodePositionChange
    expect(posChange.position?.x).toBe(100) // 被吸附
    expect(posChange.position?.y).toBe(400) // y 无对齐目标，保持不变
  })

  it("关闭吸附时仍保留节点交互检测", () => {
    const nodes = [node("a", 0, 0), node("b", 230, 0)]
    const changes: NodeChange<WorkflowNode>[] = [
      { id: "a", type: "position", dragging: true, position: { x: 0, y: 0 } },
    ]

    const result = applyHelperLines(changes, nodes, false)
    const posChange = result.changes[0] as NodePositionChange

    expect(posChange.position?.x).toBe(0)
    expect(result.helperLines.interaction?.targets).toContainEqual(expect.objectContaining({ id: "b", state: "near" }))
  })
})
