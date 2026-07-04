import { describe, expect, it } from "vitest"
import { getNodeDisplayId, localizeNodeText } from "./node-i18n"
import type { WorkflowNodeData } from "@/lib/flow/types"

describe("workflow node display localization", () => {
  it("localizes catalog nodes without mutating canonical ids", () => {
    expect(localizeNodeText("intelligence.source.jin10", { label: "JIN10 Source" }, "zh-CN")).toMatchObject({
      label: "金十快讯源",
    })
    expect(localizeNodeText("intelligence.source.jin10", { label: "JIN10 Source" }, "en-US")).toMatchObject({
      label: "JIN10 Source",
    })
  })

  it("infers display ids for fixture nodes that do not carry catalogId", () => {
    const node: WorkflowNodeData = {
      label: "source",
      nodeType: "http",
      category: "data",
      icon: "Globe",
      canonical: { kind: "source", capability: "fetch" },
    }

    expect(getNodeDisplayId(node)).toBe("intelligence.source.jin10")
  })

  it("does not localize external workflow translation nodes over their original labels", () => {
    const node: WorkflowNodeData = {
      label: "HTTP Request",
      nodeType: "http",
      category: "data",
      icon: "Globe",
      canonical: { kind: "source", capability: "fetch" },
      externalWorkflow: { source: "n8n", originalId: "http-1", type: "n8n-nodes-base.httpRequest" },
    }

    expect(getNodeDisplayId(node)).toBeUndefined()
    expect(localizeNodeText(getNodeDisplayId(node), { label: node.label }, "zh-CN")).toMatchObject({
      label: "HTTP Request",
    })
  })

  it("prefers primitive ids for bottom-level package components", () => {
    const node: WorkflowNodeData = {
      label: "Model Call",
      nodeType: "action",
      category: "action",
      icon: "Sparkles",
      primitiveId: "primitive.ai.model-call",
    }

    expect(getNodeDisplayId(node)).toBe("primitive.ai.model-call")
    expect(localizeNodeText(getNodeDisplayId(node), { label: node.label }, "zh-CN")).toMatchObject({
      label: "模型调用",
    })
  })

  it("localizes prompt, eval, and trace primitive atoms", () => {
    expect(localizeNodeText("primitive.ai.prompt-version", { label: "Prompt Version" }, "zh-CN").label).toBe("Prompt 版本")
    expect(localizeNodeText("primitive.verify.evaluator", { label: "Evaluator" }, "zh-CN").label).toBe("评测器")
    expect(localizeNodeText("primitive.verify.trace-span", { label: "Trace Span" }, "zh-CN").label).toBe("Trace Span")
  })

  it("localizes xyOps-style automation primitive atoms", () => {
    expect(localizeNodeText("primitive.ops.trigger-schedule", { label: "Schedule Trigger" }, "zh-CN").label).toBe("计划触发")
    expect(localizeNodeText("primitive.ops.limit-runtime", { label: "Runtime Limit" }, "zh-CN").label).toBe("运行超时限制")
    expect(localizeNodeText("primitive.ops.action-ticket", { label: "Ticket Action" }, "zh-CN").label).toBe("工单动作")
    expect(localizeNodeText("primitive.ops.secret-ref", { label: "Secret Ref" }, "zh-CN").label).toBe("密钥引用")
  })

  it("localizes n8n-style core primitive atoms", () => {
    expect(localizeNodeText("primitive.core.edit-fields", { label: "Edit Fields" }, "zh-CN").label).toBe("编辑字段")
    expect(localizeNodeText("primitive.core.http-request", { label: "HTTP Request" }, "zh-CN").label).toBe("HTTP 请求")
    expect(localizeNodeText("primitive.core.loop-over-items", { label: "Loop Over Items" }, "zh-CN").label).toBe("循环 Items")
    expect(localizeNodeText("primitive.core.respond-webhook", { label: "Respond to Webhook" }, "zh-CN").label).toBe("响应 Webhook")
  })

  it("localizes TurnMap-style map primitive atoms", () => {
    expect(localizeNodeText("primitive.map.source-anchor", { label: "Source Anchor" }, "zh-CN").label).toBe("来源锚点")
    expect(localizeNodeText("primitive.map.topic-collapse", { label: "Topic Collapse" }, "zh-CN").label).toBe("主题折叠")
    expect(localizeNodeText("primitive.map.knowledge-export", { label: "Knowledge Export" }, "zh-CN").label).toBe("知识图导出")
  })

  it("localizes DOP-level package operators", () => {
    expect(localizeNodeText("package.intelligence.pipeline", { label: "Intelligence Pipeline" }, "zh-CN").label).toBe("情报流水线")
    expect(localizeNodeText("package.ops.alert-response", { label: "Alert Response" }, "zh-CN").label).toBe("告警响应")
    expect(localizeNodeText("package.map.knowledge-map", { label: "Knowledge Map" }, "zh-CN").label).toBe("知识图包")
  })
})
