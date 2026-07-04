import { describe, expect, it } from "vitest"
import duplicatePushFixture from "./fixtures/agent-proposal-duplicate-push.json"
import { parseAgentProposal } from "./proposal"
import { summarizeAgentProposal } from "./proposal-summary"

describe("agent proposal summary", () => {
  it("summarizes fixture risk, evidence, and operations", () => {
    const proposal = parseAgentProposal(duplicatePushFixture)
    const summary = summarizeAgentProposal(proposal)

    expect(summary).toMatchObject({
      id: "agent-proposal-duplicate-push",
      title: "Add duplicate push guard",
      risk: "medium",
      riskTone: "warning",
      evidencePassed: 1,
      evidenceTotal: 2,
      failedEvidence: 1,
      operationCount: 4,
    })
    expect(summary.operationSummaries.map((operation) => operation.label)).toEqual([
      "Add node",
      "Add edge",
      "Project settings",
      "Profile rubric",
    ])
    expect(summary.operationSummaries[0]?.detail).toBe("notify-preview (notify/send)")
    expect(summary.operationSummaries[1]?.detail).toBe("router-importance -> notify-preview")
  })
})
