import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import {
  exportWorkflowProjectToMermaid,
  importWorkflowProjectFromMermaid,
} from "./mermaid"
import { parseWorkflowProject } from "./schema"

const fixturePath = join(__dirname, "fixtures", "workflow-intelligence.mmd")

describe("workflow Mermaid import/export", () => {
  it("exports canonical workflow JSON as stable Mermaid flowchart", () => {
    const project = parseWorkflowProject(workflowFixture)
    const mermaid = exportWorkflowProjectToMermaid(project)

    expect(mermaid).toBe(readFileSync(fixturePath, "utf8"))
    expect(mermaid.endsWith("\n")).toBe(true)
  })

  it("imports simple Mermaid flowcharts into draft workflow projects", () => {
    const result = importWorkflowProjectFromMermaid(`
      flowchart LR
        cron["Every 5m"] --> newsFeed["Jin10 feed"]
        newsFeed --> scoreAgent["Score importance"]
        scoreAgent -- "important" --> opsInbox["Review inbox"]
        scoreAgent -- "urgent webhook" --> alertWebhook["Webhook alert"]
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)

    expect(result.project.id).toBe("mermaid-import")
    expect(result.project.nodes.find((node) => node.id === "cron")?.kind).toBe("schedule")
    expect(result.project.nodes.find((node) => node.id === "newsFeed")?.capability).toBe("fetch")
    expect(result.project.nodes.find((node) => node.id === "scoreAgent")?.capability).toBe("score")
    expect(result.project.nodes.find((node) => node.id === "opsInbox")?.kind).toBe("inbox")
    expect(result.project.edges.find((edge) => edge.target === "alertWebhook")?.label).toBe("urgent webhook")
  })

  it("allows explicit class overrides for kind and capability", () => {
    const result = importWorkflowProjectFromMermaid(`
      flowchart LR
        raw["Ambiguous step"] --> done["Done"]
        class raw source,fetch;
        class done workflow-kind-inbox,workflow-capability-store;
    `)

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.error)

    expect(result.project.nodes.find((node) => node.id === "raw")?.kind).toBe("source")
    expect(result.project.nodes.find((node) => node.id === "raw")?.capability).toBe("fetch")
    expect(result.project.nodes.find((node) => node.id === "done")?.kind).toBe("inbox")
    expect(result.project.nodes.find((node) => node.id === "done")?.capability).toBe("store")
  })

  it("returns readable errors for unsupported Mermaid instead of throwing", () => {
    const result = importWorkflowProjectFromMermaid(`
      flowchart LR
        a --> b
        click a href "https://example.com"
    `)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("Unsupported Mermaid line")
    }
  })
})
