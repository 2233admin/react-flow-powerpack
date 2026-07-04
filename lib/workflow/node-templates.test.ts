import { describe, expect, it } from "vitest"
import fixture from "./fixtures/workflow-intelligence.json"
import { getNodeTemplate, readTemplateFieldValue } from "./node-templates"
import { parseWorkflowProject } from "./schema"

describe("node templates", () => {
  const project = parseWorkflowProject(fixture)

  it("matches the default JIN10 source node", () => {
    const node = project.nodes.find((candidate) => candidate.id === "source-jin10")
    const template = getNodeTemplate(node)

    expect(template?.id).toBe("intelligence.source.jin10")
    expect(template?.fields.map((field) => field.id)).toEqual(["mode", "limit", "importantOnly", "channel"])
  })

  it("reads adapter-backed field values", () => {
    const node = project.nodes.find((candidate) => candidate.id === "source-jin10")!
    const adapter = project.adapters.find((candidate) => candidate.id === node.adapter)
    const template = getNodeTemplate(node)!

    expect(readTemplateFieldValue(node, adapter, template.fields[0])).toBe("fixture")
    expect(readTemplateFieldValue(node, adapter, template.fields[1])).toBe(20)
  })

  it("matches score and router templates by capability", () => {
    expect(getNodeTemplate({ id: "score", kind: "agent", capability: "score", params: {} })?.id).toBe(
      "intelligence.agent.score",
    )
    expect(getNodeTemplate({ id: "router", kind: "router", capability: "route", params: {} })?.id).toBe(
      "intelligence.router.importance",
    )
  })
})
