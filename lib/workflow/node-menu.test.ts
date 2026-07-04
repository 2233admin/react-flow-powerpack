import { describe, expect, it } from "vitest"
import { groupPrimitivesForNodeMenu, PRIMITIVE_MENU_ORDER } from "./node-menu"
import { WORKFLOW_PRIMITIVES } from "./node-primitives"

describe("node context menu grouping", () => {
  it("keeps primitive atoms in second-level menu groups", () => {
    const groups = groupPrimitivesForNodeMenu(WORKFLOW_PRIMITIVES)

    expect(groups.map((group) => group.category)).toEqual(PRIMITIVE_MENU_ORDER)
    expect(groups.find((group) => group.category === "transform")?.items.map((item) => item.id)).toContain(
      "primitive.transform.parse-json",
    )
    expect(groups.find((group) => group.category === "verify")?.items.map((item) => item.id)).toContain(
      "primitive.verify.assert-schema",
    )
    expect(groups.find((group) => group.category === "business")?.items.map((item) => item.id)).toContain(
      "primitive.business.evidence-pack",
    )
    expect(groups.find((group) => group.category === "ops")?.items.map((item) => item.id)).toContain(
      "primitive.ops.trigger-schedule",
    )
    expect(groups.find((group) => group.category === "ops")?.items.map((item) => item.id)).toContain(
      "primitive.ops.action-ticket",
    )
    expect(groups.find((group) => group.category === "core")?.items.map((item) => item.id)).toContain(
      "primitive.core.edit-fields",
    )
    expect(groups.find((group) => group.category === "core")?.items.map((item) => item.id)).toContain(
      "primitive.core.merge",
    )
    expect(groups.find((group) => group.category === "map")?.items.map((item) => item.id)).toContain(
      "primitive.map.source-anchor",
    )
    expect(groups.find((group) => group.category === "map")?.items.map((item) => item.id)).toContain(
      "primitive.map.knowledge-export",
    )
  })
})
