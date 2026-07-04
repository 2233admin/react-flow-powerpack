import { describe, expect, it } from "vitest"
import expectedRun from "./fixtures/run-intelligence.json"
import { summarizeWorkflowRun } from "./run-summary"
import type { WorkflowSimulationRun } from "./simulation"

describe("workflow run summary", () => {
  it("formats deterministic run metrics and trace rows", () => {
    const summary = summarizeWorkflowRun(expectedRun as unknown as WorkflowSimulationRun)

    expect(summary.runId).toBe("sim-workflow-intelligence")
    expect(summary.quality.map((metric) => [metric.label, metric.value, metric.tone])).toEqual([
      ["Fetched", "2", "neutral"],
      ["Normalized", "2", "neutral"],
      ["Routed", "2", "neutral"],
      ["Important", "1", "good"],
      ["Stored", "2", "neutral"],
      ["Notified", "1", "neutral"],
      ["Dropped", "0", "good"],
      ["Coverage", "100%", "good"],
      ["Avg score", "0.725", "neutral"],
    ])
    expect(summary.runtime.at(-1)).toEqual({
      key: "duration",
      label: "Duration",
      value: "37ms",
      tone: "neutral",
    })
    expect(summary.trace.map((event) => `${event.sequence}:${event.label}:${event.nodeId}`)).toEqual([
      "01:Triggered:schedule-5m",
      "02:Fetched:source-jin10",
      "03:Normalized:agent-normalize",
      "04:Routed:router-importance",
      "05:Stored:inbox-review",
      "06:Sent:notify-preview",
    ])
    expect(summary.trace[1].details).toBe("adapter=jin10-kuaixun  itemIds=[jin10-20260704-001, jin10-20260704-002]")
  })
})
