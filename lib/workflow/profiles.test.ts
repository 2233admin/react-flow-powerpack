import { describe, expect, it } from "vitest"
import {
  getWorkflowProfileDefaultAdapters,
  getWorkflowProfileDefinition,
  getWorkflowProfileInspectorSections,
  WORKFLOW_PROFILE_IDS,
  WORKFLOW_PROFILE_REGISTRY,
} from "./profiles"
import { workflowProfileSchema, type WorkflowNodeKind } from "./schema"

const ALL_NODE_KINDS: WorkflowNodeKind[] = [
  "schedule",
  "source",
  "agent",
  "router",
  "notify",
  "inbox",
  "action",
]

describe("workflow profile registry", () => {
  it("covers every canonical workflow profile", () => {
    const schemaProfiles = workflowProfileSchema.options

    expect(WORKFLOW_PROFILE_IDS).toEqual(schemaProfiles)
    expect(Object.keys(WORKFLOW_PROFILE_REGISTRY).sort()).toEqual([...schemaProfiles].sort())
  })

  it("provides project settings defaults for intelligence", () => {
    const profile = getWorkflowProfileDefinition("intelligence")

    expect(profile.visiblePanels).toContain("project")
    expect(profile.defaultScoringProfile).toMatchObject({
      id: "importance",
      scoreField: "score",
      threshold: 0.7,
    })
    expect(getWorkflowProfileDefaultAdapters("intelligence").map((adapter) => adapter.id)).toEqual([
      "jin10-kuaixun",
      "simulated-webhook",
    ])
  })

  it("returns inspector sections for every node kind", () => {
    for (const profile of WORKFLOW_PROFILE_IDS) {
      for (const kind of ALL_NODE_KINDS) {
        const sections = getWorkflowProfileInspectorSections(profile, kind)

        expect(sections.length).toBeGreaterThan(0)
        expect(sections).toContain("identity")
      }
    }
  })

  it("keeps profile-specific inspector sections separate", () => {
    expect(getWorkflowProfileInspectorSections("agent-debug", "agent")).toContain("debug")
    expect(getWorkflowProfileInspectorSections("sdk-dev", "action")).toContain("sdk")
    expect(getWorkflowProfileInspectorSections("intelligence", "agent")).not.toContain("debug")
  })
})
