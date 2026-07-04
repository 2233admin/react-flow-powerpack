import { describe, expect, it } from "vitest"
import fixture from "./fixtures/workflow-intelligence.json"
import { getNodeInternals } from "./node-internals"
import { parseWorkflowProject } from "./schema"

describe("node internals", () => {
  const project = parseWorkflowProject(fixture)

  it("resolves internals for the default JIN10 source", () => {
    const node = project.nodes.find((candidate) => candidate.id === "source-jin10")
    const internals = getNodeInternals(node)

    expect(internals?.title).toBe("JIN10 Internals")
    expect(internals?.steps.map((step) => step.id)).toEqual([
      "fetch",
      "parse",
      "filter",
      "cache",
      "errors",
      "output",
    ])
  })

  it("resolves scoring internals by canonical capability", () => {
    const internals = getNodeInternals({
      id: "score",
      kind: "agent",
      capability: "score",
      params: { threshold: 0.7 },
    })

    expect(internals?.steps.map((step) => step.label)).toContain("Threshold")
    expect(internals?.steps.map((step) => step.label)).toContain("Confidence")
  })

  it("covers every default intelligence node with package internals", () => {
    expect(project.nodes.map((node) => [node.id, getNodeInternals(node)?.steps.length])).toEqual([
      ["schedule-5m", 3],
      ["source-jin10", 6],
      ["agent-normalize", 4],
      ["router-importance", 5],
      ["inbox-review", 4],
      ["notify-preview", 6],
    ])
  })

  it("does not invent internals for unsupported generic nodes", () => {
    expect(
      getNodeInternals({
        id: "generic-action",
        kind: "action",
        capability: "send",
        params: {},
      }),
    ).toBeUndefined()
  })

  it("resolves DOP-level package internals by catalog id", () => {
    const internals = getNodeInternals({
      id: "knowledge-map",
      kind: "action",
      capability: "store",
      params: { template: "knowledge-map" },
      ui: { catalogId: "package.map.knowledge-map" },
    })

    expect(internals?.title).toBe("Knowledge Map Package")
    expect(internals?.steps.map((step) => step.capability)).toEqual([
      "anchor",
      "semantic",
      "weight",
      "topic",
      "format",
    ])
  })
})
