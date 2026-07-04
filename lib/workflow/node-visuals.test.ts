import { describe, expect, it } from "vitest"
import { getNodeVisualSignature } from "./node-visuals"
import type { WorkflowNodeData } from "@/lib/flow/types"

describe("workflow node visual signatures", () => {
  it("gives JIN10 source a stable visual memory code", () => {
    const data: WorkflowNodeData = {
      label: "source",
      nodeType: "http",
      category: "data",
      icon: "Globe",
      canonical: { kind: "source", capability: "fetch" },
    }

    expect(getNodeVisualSignature(data)).toMatchObject({
      code: "J10",
      glyph: "S",
      pattern: "dots",
    })
  })

  it("distinguishes router and inbox nodes by code and pattern", () => {
    const router: WorkflowNodeData = {
      label: "router",
      nodeType: "condition",
      category: "logic",
      icon: "GitBranch",
      canonical: { kind: "router", capability: "route" },
    }
    const inbox: WorkflowNodeData = {
      label: "inbox",
      nodeType: "action",
      category: "data",
      icon: "Inbox",
      canonical: { kind: "inbox", capability: "store" },
    }

    expect(getNodeVisualSignature(router).code).toBe("RTE")
    expect(getNodeVisualSignature(router).pattern).toBe("gate")
    expect(getNodeVisualSignature(inbox).code).toBe("INB")
    expect(getNodeVisualSignature(inbox).pattern).toBe("split")
  })

  it("uses primitive signatures before generic category fallback", () => {
    const data: WorkflowNodeData = {
      label: "Evidence Pack",
      nodeType: "transform",
      category: "data",
      icon: "Database",
      primitiveId: "primitive.business.evidence-pack",
      primitiveCategory: "business",
    }

    expect(getNodeVisualSignature(data)).toMatchObject({
      code: "EVD",
      glyph: "E",
      pattern: "split",
    })
  })

  it("adds visual memory codes for prompt, eval, and trace atoms", () => {
    expect(getNodeVisualSignature({
      label: "Prompt Version",
      nodeType: "action",
      category: "action",
      icon: "History",
      primitiveId: "primitive.ai.prompt-version",
    }).code).toBe("PVR")
    expect(getNodeVisualSignature({
      label: "Evaluator",
      nodeType: "transform",
      category: "logic",
      icon: "BadgeCheck",
      primitiveId: "primitive.verify.evaluator",
    }).code).toBe("EVL")
    expect(getNodeVisualSignature({
      label: "Trace Span",
      nodeType: "transform",
      category: "logic",
      icon: "Activity",
      primitiveId: "primitive.verify.trace-span",
    }).code).toBe("SPN")
  })

  it("adds visual memory codes for xyOps-style automation atoms", () => {
    expect(getNodeVisualSignature({
      label: "Schedule Trigger",
      nodeType: "trigger",
      category: "logic",
      icon: "Clock",
      primitiveId: "primitive.ops.trigger-schedule",
    }).code).toBe("SCH")
    expect(getNodeVisualSignature({
      label: "Ticket Action",
      nodeType: "action",
      category: "action",
      icon: "MessageSquare",
      primitiveId: "primitive.ops.action-ticket",
    }).code).toBe("TKT")
    expect(getNodeVisualSignature({
      label: "Secret Ref",
      nodeType: "transform",
      category: "data",
      icon: "ShieldCheck",
      primitiveId: "primitive.ops.secret-ref",
    }).code).toBe("SEC")
  })

  it("adds visual memory codes for n8n-style core atoms", () => {
    expect(getNodeVisualSignature({
      label: "Edit Fields",
      nodeType: "transform",
      category: "data",
      icon: "ArrowRightLeft",
      primitiveId: "primitive.core.edit-fields",
    }).code).toBe("SET")
    expect(getNodeVisualSignature({
      label: "Merge",
      nodeType: "transform",
      category: "logic",
      icon: "GitMerge",
      primitiveId: "primitive.core.merge",
    }).code).toBe("MRG")
    expect(getNodeVisualSignature({
      label: "Loop Over Items",
      nodeType: "condition",
      category: "logic",
      icon: "Repeat",
      primitiveId: "primitive.core.loop-over-items",
    }).code).toBe("LOP")
  })

  it("adds visual memory codes for TurnMap-style map atoms", () => {
    expect(getNodeVisualSignature({
      label: "Source Anchor",
      nodeType: "transform",
      category: "data",
      icon: "Link2",
      primitiveId: "primitive.map.source-anchor",
    }).code).toBe("SRC")
    expect(getNodeVisualSignature({
      label: "Topic Collapse",
      nodeType: "transform",
      category: "logic",
      icon: "Group",
      primitiveId: "primitive.map.topic-collapse",
    }).code).toBe("TPC")
    expect(getNodeVisualSignature({
      label: "Knowledge Export",
      nodeType: "action",
      category: "data",
      icon: "FileCode2",
      primitiveId: "primitive.map.knowledge-export",
    }).code).toBe("EXP")
  })

  it("adds visual memory codes for DOP-level package operators", () => {
    expect(getNodeVisualSignature({
      label: "Intelligence Pipeline",
      nodeType: "action",
      category: "action",
      icon: "Network",
      canonical: { catalogId: "package.intelligence.pipeline" },
    }).code).toBe("PKI")
    expect(getNodeVisualSignature({
      label: "Alert Response",
      nodeType: "action",
      category: "action",
      icon: "Bell",
      canonical: { catalogId: "package.ops.alert-response" },
    }).code).toBe("ALT")
    expect(getNodeVisualSignature({
      label: "Knowledge Map",
      nodeType: "action",
      category: "data",
      icon: "Network",
      canonical: { catalogId: "package.map.knowledge-map" },
    }).code).toBe("KMP")
  })
})
