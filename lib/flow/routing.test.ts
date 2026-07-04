import { describe, it, expect } from "vitest"
import { routeOrthogonal, pointsToPath, type Rect } from "./routing"

const inside = (p: { x: number; y: number }, o: Rect, pad = 0) =>
  p.x > o.x - pad && p.x < o.x + o.width + pad && p.y > o.y - pad && p.y < o.y + o.height + pad

describe("routeOrthogonal", () => {
  it("无障碍时返回起点与终点", () => {
    const path = routeOrthogonal({ x: 0, y: 0 }, { x: 200, y: 0 }, [])
    expect(path.length).toBeGreaterThanOrEqual(2)
    expect(path[0]).toEqual({ x: 0, y: 0 })
    expect(path[path.length - 1]).toEqual({ x: 200, y: 0 })
  })

  it("路径首尾恒等于 source / target", () => {
    const source = { x: 10, y: 20 }
    const target = { x: 300, y: 240 }
    const path = routeOrthogonal(source, target, [{ x: 140, y: 0, width: 60, height: 300 }])
    expect(path[0]).toEqual(source)
    expect(path[path.length - 1]).toEqual(target)
  })

  it("绕开中间障碍物（中间路径点不落在障碍内部）", () => {
    const source = { x: 0, y: 100 }
    const target = { x: 400, y: 100 }
    const obstacle: Rect = { x: 180, y: 40, width: 60, height: 120 }
    const path = routeOrthogonal(source, target, [obstacle])

    // 直线会穿过障碍，因此应产生额外拐点
    expect(path.length).toBeGreaterThan(2)
    // 中间点不应落在障碍内部
    for (let i = 1; i < path.length - 1; i++) {
      expect(inside(path[i], obstacle)).toBe(false)
    }
  })

  it("障碍规模过大时安全回退为直线", () => {
    const path = routeOrthogonal({ x: 0, y: 0 }, { x: 500000, y: 500000 }, [])
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 500000, y: 500000 },
    ])
  })
})

describe("pointsToPath", () => {
  it("点数少于 2 返回空字符串", () => {
    expect(pointsToPath([])).toBe("")
    expect(pointsToPath([{ x: 0, y: 0 }])).toBe("")
  })

  it("两点生成以 M 开头、含 L 的路径", () => {
    const d = pointsToPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ])
    expect(d.startsWith("M 0,0")).toBe(true)
    expect(d).toContain("L")
  })

  it("多点转角使用二次贝塞尔（含 Q 命令）实现圆角", () => {
    const d = pointsToPath([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ])
    expect(d).toContain("Q")
  })
})
