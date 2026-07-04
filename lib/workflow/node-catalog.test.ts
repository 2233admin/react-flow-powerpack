import { describe, expect, it } from "vitest"
import fixture from "./fixtures/workflow-intelligence.json"
import {
  addCatalogNodeToWorkflowProject,
  createWorkflowNodeFromCatalog,
  getWorkflowNodeCatalog,
  WORKFLOW_NODE_CATALOG,
} from "./node-catalog"
import { parseWorkflowProject } from "./schema"

describe("workflow node catalog", () => {
  it("exposes intelligence operators and DOP-level package nodes for the first product profile", () => {
    const catalog = getWorkflowNodeCatalog("intelligence")

    expect(catalog.map((item) => item.id)).toEqual(expect.arrayContaining([
      "intelligence.schedule.cron",
      "intelligence.source.jin10",
      "intelligence.processing.normalize",
      "intelligence.processing.dedupe",
      "intelligence.agent.summary",
      "intelligence.agent.score",
      "intelligence.agent.tag",
      "intelligence.router.importance",
      "intelligence.output.inbox",
      "intelligence.output.webhook",
      "package.intelligence.pipeline",
      "package.ops.event",
      "package.ops.monitor-guard",
      "package.ops.alert-response",
      "package.ai.prompt-experiment",
      "package.verify.regression-gate",
      "package.map.knowledge-map",
      "package.review.human-review",
    ]))
    expect(catalog.filter((item) => item.category === "package")).toHaveLength(8)
  })

  it("turns a catalog item into a valid canonical workflow node", () => {
    const item = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "intelligence.agent.score")
    expect(item).toBeDefined()

    const node = createWorkflowNodeFromCatalog(item!, "score-test", { x: 12, y: 34 })

    expect(node).toMatchObject({
      id: "score-test",
      kind: "agent",
      capability: "score",
      params: { threshold: 0.7 },
      ui: { label: "Importance Score", position: { x: 12, y: 34 } },
    })
  })

  it("adds required adapter bindings when inserting adapter-backed nodes", () => {
    const base = parseWorkflowProject({
      ...fixture,
      adapters: [],
      nodes: [fixture.nodes[0]],
      edges: [],
    })
    const jin10 = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "intelligence.source.jin10")
    expect(jin10).toBeDefined()

    const project = addCatalogNodeToWorkflowProject(base, jin10!, "source-jin10-test", { x: 100, y: 200 })

    expect(project.adapters).toContainEqual(
      expect.objectContaining({ id: "jin10-kuaixun", type: "source", provider: "jin10", mode: "fixture" }),
    )
    expect(project.nodes.find((node) => node.id === "source-jin10-test")).toMatchObject({
      kind: "source",
      capability: "fetch",
      adapter: "jin10-kuaixun",
    })
  })

  it("turns a package catalog item into a template canonical workflow node", () => {
    const item = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "package.map.knowledge-map")
    expect(item).toBeDefined()

    const node = createWorkflowNodeFromCatalog(item!, "knowledge-map-test", { x: 10, y: 20 })

    expect(node).toMatchObject({
      id: "knowledge-map-test",
      kind: "action",
      capability: "store",
      params: { template: "knowledge-map", runtime: "template", lockedInternals: true },
      ui: { catalogId: "package.map.knowledge-map", label: "Knowledge Map", position: { x: 10, y: 20 } },
    })
  })
})
