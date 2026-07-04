import { describe, expect, it } from "vitest"
import duplicatePushFixture from "./fixtures/agent-proposal-duplicate-push.json"
import workflowFixture from "./fixtures/workflow-intelligence.json"
import {
  acceptAgentProposal,
  parseAgentProposal,
  rejectAgentProposal,
  type WorkflowProjectDraft,
} from "./proposal"
import { parseWorkflowProject } from "./schema"

describe("agent proposal operations", () => {
  it("parses risk labels, validation evidence, and typed operations", () => {
    const proposal = parseAgentProposal(duplicatePushFixture)

    expect(proposal.risk).toBe("medium")
    expect(proposal.validationEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "duplicate-push-check",
          passed: false,
        }),
      ]),
    )
    expect(proposal.operations.map((operation) => operation.type)).toEqual([
      "addNode",
      "addEdge",
      "updateProjectSettings",
      "updateProfileRubric",
    ])
  })

  it("accepts a proposal by applying operations to a draft without mutating the source workflow", () => {
    const project = parseWorkflowProject(workflowFixture)
    const accepted = acceptAgentProposal(project, {
      id: "proposal-add-dedupe",
      title: "Add duplicate guard",
      risk: "low",
      validationEvidence: [{ id: "dry-run", label: "Dry run", passed: true }],
      operations: [
        {
          type: "addNode",
          node: {
            id: "agent-dedupe",
            kind: "agent",
            capability: "dedupe",
            params: { key: "headline" },
          },
        },
        {
          type: "updateNodeParams",
          nodeId: "source-jin10",
          params: { limit: 50 },
        },
        {
          type: "removeEdge",
          edgeId: "e-source-normalize",
        },
        {
          type: "addEdge",
          edge: {
            id: "e-source-dedupe",
            source: "source-jin10",
            target: "agent-dedupe",
          },
        },
        {
          type: "addEdge",
          edge: {
            id: "e-dedupe-normalize",
            source: "agent-dedupe",
            target: "agent-normalize",
          },
        },
        {
          type: "updateProjectSettings",
          settings: { maxItemsPerRun: 50 },
        },
        {
          type: "updateProfileRubric",
          rubric: { duplicatePolicy: "drop-exact-headline" },
        },
      ],
    })

    expect(project.nodes.some((node) => node.id === "agent-dedupe")).toBe(false)
    expect(project.settings.maxItemsPerRun).toBe(20)
    expect(project.nodes.find((node) => node.id === "source-jin10")?.params.limit).toBe(20)

    expect(accepted.nodes.find((node) => node.id === "agent-dedupe")?.capability).toBe("dedupe")
    expect(accepted.edges.map((edge) => edge.id)).toEqual(
      expect.arrayContaining(["e-source-dedupe", "e-dedupe-normalize"]),
    )
    expect(accepted.edges.some((edge) => edge.id === "e-source-normalize")).toBe(false)
    expect(accepted.settings.maxItemsPerRun).toBe(50)
    expect(accepted.nodes.find((node) => node.id === "source-jin10")?.params.limit).toBe(50)
    expect(accepted.profileRubric).toEqual({ duplicatePolicy: "drop-exact-headline" })
  })

  it("reject leaves the workflow unchanged", () => {
    const project = parseWorkflowProject(workflowFixture)

    expect(rejectAgentProposal(project)).toBe(project)
  })

  it("removes connected edges when removing a node", () => {
    const project = parseWorkflowProject(workflowFixture)
    const accepted = acceptAgentProposal(project, {
      id: "proposal-remove-notify",
      title: "Remove mock notify branch",
      risk: "low",
      operations: [{ type: "removeNode", nodeId: "notify-preview" }],
    })

    expect(accepted.nodes.some((node) => node.id === "notify-preview")).toBe(false)
    expect(accepted.edges.some((edge) => edge.target === "notify-preview")).toBe(false)
  })

  it("rejects duplicate node and edge additions before applying the fixture", () => {
    const project = parseWorkflowProject(workflowFixture)

    expect(() => acceptAgentProposal(project, duplicatePushFixture)).toThrow(/duplicate node/)
    expect(project.edges.some((edge) => edge.id === "e-router-duplicate-push")).toBe(false)
  })

  it("validates the accepted draft references after operations", () => {
    const project: WorkflowProjectDraft = parseWorkflowProject(workflowFixture)

    expect(() =>
      acceptAgentProposal(project, {
        id: "proposal-bad-edge",
        title: "Add broken edge",
        risk: "high",
        operations: [
          {
            type: "addEdge",
            edge: {
              id: "e-missing",
              source: "router-importance",
              target: "missing-node",
            },
          },
        ],
      }),
    ).toThrow(/missing target/)
  })
})
