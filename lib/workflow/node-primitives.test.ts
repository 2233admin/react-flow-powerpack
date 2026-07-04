import { describe, expect, it } from "vitest"
import { getPrimitiveByStepCapability, getWorkflowPrimitives, primitiveToNodeData, WORKFLOW_PRIMITIVES } from "./node-primitives"

describe("workflow primitive components", () => {
  it("exposes bottom-level components for composing packaged nodes", () => {
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.transform.parse-json")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.verify.assert-schema")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.ai.prompt-version")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.verify.evaluator")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.verify.scorecard")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.verify.trace-span")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.business.evidence-pack")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.business.human-approval")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.ops.trigger-schedule")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.ops.limit-runtime")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.ops.action-ticket")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.ops.plugin-shell")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.ops.secret-ref")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.core.edit-fields")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.core.http-request")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.core.merge")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.core.loop-over-items")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.core.respond-webhook")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.map.source-anchor")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.map.topic-collapse")
    expect(WORKFLOW_PRIMITIVES.map((item) => item.id)).toContain("primitive.map.knowledge-export")
    expect(WORKFLOW_PRIMITIVES.length).toBeGreaterThanOrEqual(100)
  })

  it("searches primitives by package-building intent", () => {
    expect(getWorkflowPrimitives("filter").map((item) => item.id)).toContain("primitive.transform.filter-items")
    expect(getWorkflowPrimitives("coverage").map((item) => item.id)).toContain("primitive.verify.coverage-mark")
    expect(getWorkflowPrimitives("scorecard").map((item) => item.id)).toContain("primitive.verify.scorecard")
    expect(getWorkflowPrimitives("prompt").map((item) => item.id)).toContain("primitive.ai.prompt-version")
    expect(getWorkflowPrimitives("sentiment").map((item) => item.id)).toContain("primitive.business.sentiment-score")
    expect(getWorkflowPrimitives("人工").map((item) => item.id)).toContain("primitive.business.human-approval")
    expect(getWorkflowPrimitives("webhook").map((item) => item.id)).toContain("primitive.ops.trigger-webhook")
    expect(getWorkflowPrimitives("ticket").map((item) => item.id)).toContain("primitive.ops.action-ticket")
    expect(getWorkflowPrimitives("密钥").map((item) => item.id)).toContain("primitive.ops.secret-ref")
    expect(getWorkflowPrimitives("edit fields").map((item) => item.id)).toContain("primitive.core.edit-fields")
    expect(getWorkflowPrimitives("split in batches").map((item) => item.id)).toContain("primitive.core.loop-over-items")
    expect(getWorkflowPrimitives("respond").map((item) => item.id)).toContain("primitive.core.respond-webhook")
    expect(getWorkflowPrimitives("turnmap").map((item) => item.id)).toContain("primitive.map.mini-map")
    expect(getWorkflowPrimitives("topic").map((item) => item.id)).toContain("primitive.map.topic-collapse")
    expect(getWorkflowPrimitives("obsidian").map((item) => item.id)).toContain("primitive.map.knowledge-export")
  })

  it("maps internal step capabilities to primitive node data with ports", () => {
    const primitive = getPrimitiveByStepCapability("parse")
    const data = primitiveToNodeData(primitive)

    expect(data).toMatchObject({
      label: "Parse JSON",
      primitiveId: "primitive.transform.parse-json",
      internalDraft: true,
    })
    expect(data.primitivePorts).toEqual([
      expect.objectContaining({ id: "payload", direction: "input" }),
      expect.objectContaining({ id: "object", direction: "output" }),
    ])
  })

  it("maps xyOps-style automation capabilities into ops atoms", () => {
    expect(getPrimitiveByStepCapability("timeout").id).toBe("primitive.ops.limit-runtime")
    expect(getPrimitiveByStepCapability("ticket").id).toBe("primitive.ops.action-ticket")
    expect(getPrimitiveByStepCapability("monitor").id).toBe("primitive.ops.monitor-metric-expression")
    expect(getPrimitiveByStepCapability("secret").id).toBe("primitive.ops.secret-ref")
  })

  it("maps n8n-style core capabilities into core atoms", () => {
    expect(getPrimitiveByStepCapability("set").id).toBe("primitive.core.edit-fields")
    expect(getPrimitiveByStepCapability("code").id).toBe("primitive.core.code")
    expect(getPrimitiveByStepCapability("http").id).toBe("primitive.core.http-request")
    expect(getPrimitiveByStepCapability("merge").id).toBe("primitive.core.merge")
    expect(getPrimitiveByStepCapability("wait").id).toBe("primitive.core.wait")
  })

  it("maps TurnMap-style map capabilities into map atoms", () => {
    expect(getPrimitiveByStepCapability("anchor").id).toBe("primitive.map.source-anchor")
    expect(getPrimitiveByStepCapability("topic").id).toBe("primitive.map.topic-collapse")
    expect(getPrimitiveByStepCapability("semantic").id).toBe("primitive.map.semantic-link")
  })

  it("turns TurnMap-style atoms into engineering primitives with durable metadata", () => {
    expect(primitiveToNodeData(getPrimitiveByStepCapability("anchor"))).toMatchObject({
      sourceAnchor: {
        kind: "artifact",
        label: "Latest run artifact",
      },
      runArtifact: {
        runId: "{{runId}}",
      },
    })

    expect(primitiveToNodeData(getPrimitiveByStepCapability("topic"))).toMatchObject({
      topicCollapse: {
        mode: "draft",
        packageInternal: true,
      },
      internalsUnlocked: true,
    })

    expect(primitiveToNodeData(getPrimitiveByStepCapability("semantic"))).toMatchObject({
      semantic: {
        relationship: "evidence",
      },
      proposalState: "proposed",
    })
  })
})
