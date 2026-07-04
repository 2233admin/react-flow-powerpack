import { describe, it, expect } from "vitest"
import { generateWorkflowLocally } from "./local-generate"

describe("generateWorkflowLocally", () => {
  it("总是生成一个触发节点作为起点", () => {
    const spec = generateWorkflowLocally("随便写点什么")
    expect(spec.nodes.length).toBeGreaterThan(0)
    const first = spec.nodes[0]
    expect(first.type).toBe("trigger")
  })

  it("节点 id 唯一", () => {
    const spec = generateWorkflowLocally("用户注册后发送邮件并写入数据库")
    const ids = spec.nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("所有边都连接到存在的节点", () => {
    const spec = generateWorkflowLocally("监听订单创建，校验库存，扣减库存，通知发货")
    const ids = new Set(spec.nodes.map((n) => n.id))
    for (const e of spec.edges) {
      expect(ids.has(e.source)).toBe(true)
      expect(ids.has(e.target)).toBe(true)
    }
  })

  it("包含条件关键词时生成 condition 节点与分支", () => {
    const spec = generateWorkflowLocally("如果库存充足则发货，否则通知补货")
    const hasCondition = spec.nodes.some((n) => n.type === "condition")
    expect(hasCondition).toBe(true)
    // 条件节点应至少有两条出边（是/否分支）
    const condition = spec.nodes.find((n) => n.type === "condition")!
    const outgoing = spec.edges.filter((e) => e.source === condition.id)
    expect(outgoing.length).toBeGreaterThanOrEqual(2)
  })

  it("生成的图是连通的（除起点外每个节点都有入边）", () => {
    const spec = generateWorkflowLocally("抓取网页，解析数据，存储结果")
    const withIncoming = new Set(spec.edges.map((e) => e.target))
    const roots = spec.nodes.filter((n) => !withIncoming.has(n.id))
    // 只应有一个根（触发器）
    expect(roots.length).toBe(1)
    expect(roots[0].type).toBe("trigger")
  })

  it("标题非空", () => {
    const spec = generateWorkflowLocally("发送每日报表")
    expect(spec.title.trim().length).toBeGreaterThan(0)
  })
})
