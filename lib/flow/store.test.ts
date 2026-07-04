import { describe, it, expect, beforeEach } from "vitest"
import { useFlowStore } from "./store"
import type { WorkflowNode, WorkflowEdge } from "./types"
import { WORKFLOW_NODE_CATALOG, createWorkflowNodeFromCatalog } from "../workflow/node-catalog"
import { WORKFLOW_PRIMITIVES } from "../workflow/node-primitives"
import { parseWorkflowProject } from "../workflow/schema"
import { workflowProjectToReactFlow } from "../workflow/to-react-flow"

function makeNode(id: string, x = 0, y = 0, selected = false): WorkflowNode {
  return {
    id,
    type: "workflow",
    position: { x, y },
    selected,
    data: {
      label: id,
      nodeType: "action",
      category: "action",
      icon: "Zap",
      color: "var(--chart-1)",
      status: "idle",
    },
  }
}

function makeEdge(id: string, source: string, target: string): WorkflowEdge {
  return { id, source, target, type: "workflow" }
}

function seed(nodes: WorkflowNode[], edges: WorkflowEdge[] = []) {
  useFlowStore.setState({ nodes, edges, past: [], future: [], drawings: [] })
}

describe("flow store", () => {
  beforeEach(() => {
    seed([makeNode("a"), makeNode("b", 300)])
  })

  describe("undo / redo", () => {
    it("撤销恢复到操作前的状态", () => {
      const { takeSnapshot, updateNodeData } = useFlowStore.getState()
      takeSnapshot()
      updateNodeData("a", { label: "changed" })
      expect(useFlowStore.getState().nodes.find((n) => n.id === "a")?.data.label).toBe("changed")

      useFlowStore.getState().undo()
      expect(useFlowStore.getState().nodes.find((n) => n.id === "a")?.data.label).toBe("a")
    })

    it("重做重新应用被撤销的变更", () => {
      const { takeSnapshot, updateNodeData } = useFlowStore.getState()
      takeSnapshot()
      updateNodeData("a", { label: "changed" })
      useFlowStore.getState().undo()
      useFlowStore.getState().redo()
      expect(useFlowStore.getState().nodes.find((n) => n.id === "a")?.data.label).toBe("changed")
    })

    it("无历史时撤销是安全的空操作", () => {
      seed([makeNode("a")])
      expect(() => useFlowStore.getState().undo()).not.toThrow()
      expect(useFlowStore.getState().nodes).toHaveLength(1)
    })
  })

  describe("成组 / 解组", () => {
    it("将选中节点成组会创建一个 group 父节点", () => {
      seed([makeNode("a", 0, 0, true), makeNode("b", 200, 0, true)])
      useFlowStore.getState().groupSelection()
      const { nodes } = useFlowStore.getState()
      const group = nodes.find((n) => n.type === "group")
      expect(group).toBeDefined()
      // 原节点应挂到 group 上
      expect(nodes.filter((n) => n.parentId === group!.id)).toHaveLength(2)
    })

    it("解组会移除 group 并释放子节点", () => {
      seed([makeNode("a", 0, 0, true), makeNode("b", 200, 0, true)])
      useFlowStore.getState().groupSelection()
      const group = useFlowStore.getState().nodes.find((n) => n.type === "group")!
      // 选中 group 再解组
      useFlowStore.setState((s) => ({
        nodes: s.nodes.map((n) => ({ ...n, selected: n.id === group.id })),
      }))
      useFlowStore.getState().ungroupSelection()
      const { nodes } = useFlowStore.getState()
      expect(nodes.find((n) => n.type === "group")).toBeUndefined()
      expect(nodes.filter((n) => n.parentId === group.id)).toHaveLength(0)
    })
  })

  describe("attachToParent / resizeGroupToFit", () => {
    function makeGroup(id: string, x = 0, y = 0, width = 320, height = 220): WorkflowNode {
      return {
        id,
        type: "group",
        position: { x, y },
        width,
        height,
        style: { width, height },
        data: {
          label: "分组",
          nodeType: "group",
          category: "logic",
          icon: "Group",
          color: "var(--chart-5)",
          status: "idle",
        },
      }
    }

    it("attach 后 parent 一定排在 child 之前（修复子节点消失）", () => {
      // child 故意放在 group 之前
      seed([makeNode("child", 50, 50), makeGroup("g1", 0, 0)])
      useFlowStore.getState().attachToParent("child", "g1")
      const { nodes } = useFlowStore.getState()
      const gIdx = nodes.findIndex((n) => n.id === "g1")
      const cIdx = nodes.findIndex((n) => n.id === "child")
      expect(gIdx).toBeLessThan(cIdx)
      expect(nodes[cIdx].parentId).toBe("g1")
    })

    it("attach 会把绝对坐标转换为相对父级坐标", () => {
      seed([makeGroup("g1", 100, 100), makeNode("child", 150, 180)])
      useFlowStore.getState().attachToParent("child", "g1")
      const child = useFlowStore.getState().nodes.find((n) => n.id === "child")!
      expect(child.position).toEqual({ x: 50, y: 80 })
    })

    it("子节点超出边界时分组自动扩容", () => {
      seed([makeGroup("g1", 0, 0, 320, 220), makeNode("child", 10, 10)])
      useFlowStore.getState().attachToParent("child", "g1")
      // 把子节点移到远超分组尺寸的位置
      useFlowStore.setState((s) => ({
        nodes: s.nodes.map((n) => (n.id === "child" ? { ...n, position: { x: 500, y: 400 } } : n)),
      }))
      useFlowStore.getState().resizeGroupToFit("g1")
      const group = useFlowStore.getState().nodes.find((n) => n.id === "g1")!
      expect(group.width as number).toBeGreaterThan(500)
      expect(group.height as number).toBeGreaterThan(400)
    })

    it("子节点拖到分组左上侧（负坐标）时平移分组原点并修正子节点", () => {
      seed([makeGroup("g1", 200, 200), makeNode("child", 10, 10)])
      useFlowStore.getState().attachToParent("child", "g1")
      useFlowStore.setState((s) => ({
        nodes: s.nodes.map((n) => (n.id === "child" ? { ...n, position: { x: -80, y: -60 } } : n)),
      }))
      useFlowStore.getState().resizeGroupToFit("g1")
      const { nodes } = useFlowStore.getState()
      const group = nodes.find((n) => n.id === "g1")!
      const child = nodes.find((n) => n.id === "child")!
      // 分组原点向左上平移，子节点坐标被修正为非负
      expect(group.position.x).toBeLessThan(200)
      expect(group.position.y).toBeLessThan(200)
      expect(child.position.x).toBeGreaterThanOrEqual(0)
      expect(child.position.y).toBeGreaterThanOrEqual(0)
    })

    it("detach 恢复绝对坐标且清除 parentId", () => {
      seed([makeGroup("g1", 100, 100), makeNode("child", 150, 180)])
      useFlowStore.getState().attachToParent("child", "g1")
      useFlowStore.getState().detachFromParent("child")
      const child = useFlowStore.getState().nodes.find((n) => n.id === "child")!
      expect(child.parentId).toBeUndefined()
      expect(child.position).toEqual({ x: 150, y: 180 })
    })
  })

  describe("addChildNode 纵向布局", () => {
    it("子节点加在父节点下方且不与父节点重叠", () => {
      seed([makeNode("p", 100, 100)])
      useFlowStore.getState().addChildNode("p")
      const { nodes, edges } = useFlowStore.getState()
      expect(nodes).toHaveLength(2)
      const child = nodes.find((n) => n.id !== "p")!
      // 端口在上下 → 子节点必须在父节点下方
      expect(child.position.y).toBeGreaterThan(100 + 90)
      expect(edges.some((e) => e.source === "p" && e.target === child.id)).toBe(true)
    })

    it("连续 addChild 互不重叠", () => {
      seed([makeNode("p", 0, 0)])
      useFlowStore.getState().addChildNode("p")
      useFlowStore.getState().addChildNode("p")
      useFlowStore.getState().addChildNode("p")
      const children = useFlowStore.getState().nodes.filter((n) => n.id !== "p")
      expect(children).toHaveLength(3)
      // 两两之间 AABB 不重叠（节点尺寸约 240x96）
      for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
          const a = children[i].position
          const b = children[j].position
          const overlapX = Math.abs(a.x - b.x) < 240
          const overlapY = Math.abs(a.y - b.y) < 96
          expect(overlapX && overlapY).toBe(false)
        }
      }
    })
  })

  describe("Houdini-style parameter interface", () => {
    it("updates exposed parent parameters and writes them back to bound internal node fields", () => {
      const item = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "package.map.knowledge-map")!
      const projectNode = createWorkflowNodeFromCatalog(item, "pkg-map", { x: 0, y: 0 })
      const project = parseWorkflowProject({
        id: "parameter-interface",
        name: "Parameter Interface",
        profile: "intelligence",
        version: 1,
        nodes: [projectNode],
        edges: [],
      })
      const flow = workflowProjectToReactFlow(project)
      const parent = flow.nodes[0]
      const internal: WorkflowNode = {
        id: "pkg-map__anchor",
        type: "workflow",
        position: { x: 0, y: 160 },
        data: {
          label: "Source anchor",
          nodeType: "transform",
          category: "data",
          icon: "Link2",
          color: "var(--chart-4)",
          fields: [
            { id: "artifactPath", label: "Artifact Path", value: "runs/{{runId}}/artifact.json" },
          ],
          internalOf: "pkg-map",
        },
      }

      useFlowStore.setState({
        workflowProject: project,
        nodes: [parent, internal],
        edges: [],
        past: [],
        future: [],
        drawings: [],
      })

      useFlowStore.getState().updateParameterInterfaceField("pkg-map", "anchor.artifactPath", "runs/run-42/artifact.json")

      const nextState = useFlowStore.getState()
      const nextParent = nextState.nodes.find((node) => node.id === "pkg-map")
      const nextInternal = nextState.nodes.find((node) => node.id === "pkg-map__anchor")
      const nextProjectNode = nextState.workflowProject.nodes.find((node) => node.id === "pkg-map")

      expect(nextParent?.data.parameterInterface?.fields.find((field) => field.id === "anchor.artifactPath")?.value).toBe("runs/run-42/artifact.json")
      expect(nextInternal?.data.fields?.find((field) => field.id === "artifactPath")?.value).toBe("runs/run-42/artifact.json")
      expect(nextProjectNode?.parameterInterface?.fields.find((field) => field.id === "anchor.artifactPath")?.value).toBe("runs/run-42/artifact.json")
    })

    it("does not update readonly exposed parameters", () => {
      const item = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "package.map.knowledge-map")!
      const projectNode = createWorkflowNodeFromCatalog(item, "pkg-map", { x: 0, y: 0 })
      const project = parseWorkflowProject({
        id: "parameter-interface-readonly",
        name: "Parameter Interface Readonly",
        profile: "intelligence",
        version: 1,
        nodes: [projectNode],
        edges: [],
      })
      const flow = workflowProjectToReactFlow(project)
      useFlowStore.setState({
        workflowProject: project,
        nodes: flow.nodes,
        edges: [],
        past: [],
        future: [],
        drawings: [],
      })

      useFlowStore.getState().updateParameterInterfaceField("pkg-map", "topic.nodeCount", 7)

      const field = useFlowStore
        .getState()
        .workflowProject.nodes[0].parameterInterface?.fields.find((candidate) => candidate.id === "topic.nodeCount")
      expect(field?.value).toBe(0)
    })

    it("uses parent parameter values when internals are generated after editing", () => {
      const item = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "package.map.knowledge-map")!
      const projectNode = createWorkflowNodeFromCatalog(item, "pkg-map", { x: 0, y: 0 })
      const project = parseWorkflowProject({
        id: "parameter-interface-enter",
        name: "Parameter Interface Enter",
        profile: "intelligence",
        version: 1,
        nodes: [projectNode],
        edges: [],
      })
      const flow = workflowProjectToReactFlow(project)
      useFlowStore.setState({
        workflowProject: project,
        nodes: flow.nodes,
        edges: [],
        past: [],
        future: [],
        drawings: [],
      })

      useFlowStore.getState().updateParameterInterfaceField("pkg-map", "anchor.artifactPath", "runs/run-42/artifact.json")
      useFlowStore.getState().enterNodeNetwork("pkg-map")

      const anchor = useFlowStore.getState().nodes.find((node) => node.id === "pkg-map__anchor")
      expect(anchor?.data.fields?.find((field) => field.id === "artifactPath")?.value).toBe("runs/run-42/artifact.json")
    })

    it("uses ordinary node internals as the public parameter backing surface", () => {
      useFlowStore.getState().reset()

      useFlowStore.getState().updateParameterInterfaceField("source-jin10", "filter.limit", 42)
      useFlowStore.getState().updateParameterInterfaceField("source-jin10", "fetch.mode", "mock")

      let state = useFlowStore.getState()
      expect(state.workflowProject.nodes.find((node) => node.id === "source-jin10")?.params.limit).toBe(42)
      expect(state.workflowProject.adapters.find((adapter) => adapter.id === "jin10-kuaixun")?.mode).toBe("mock")
      expect(
        state.nodes.find((node) => node.id === "source-jin10")?.data.parameterInterface?.fields.find(
          (field) => field.id === "filter.limit",
        )?.value,
      ).toBe(42)

      useFlowStore.getState().enterNodeNetwork("source-jin10")
      state = useFlowStore.getState()
      expect(state.nodes.find((node) => node.id === "source-jin10__filter")?.data.fields?.find((field) => field.id === "limit")?.value).toBe("42")
      expect(state.nodes.find((node) => node.id === "source-jin10__fetch")?.data.fields?.find((field) => field.id === "mode")?.value).toBe("mock")
    })
  })

  describe("连线操作", () => {
    beforeEach(() => {
      seed([makeNode("a"), makeNode("b", 300)], [makeEdge("e1", "a", "b")])
    })

    it("切换连线类型", () => {
      useFlowStore.getState().updateEdgeType("e1", "routed")
      expect(useFlowStore.getState().edges.find((e) => e.id === "e1")?.type).toBe("routed")
    })

    it("切换连线动画开关", () => {
      const before = useFlowStore.getState().edges[0].animated ?? false
      useFlowStore.getState().toggleEdgeAnimated("e1")
      expect(useFlowStore.getState().edges[0].animated).toBe(!before)
    })

    it("断开选中节点的所有连接但保留节点", () => {
      seed(
        [makeNode("a", 0, 0, true), makeNode("b", 300), makeNode("c", 600)],
        [makeEdge("e1", "a", "b"), makeEdge("e2", "c", "a"), makeEdge("e3", "b", "c")],
      )

      const removed = useFlowStore.getState().disconnectSelectedConnections()

      expect(removed).toBe(2)
      expect(useFlowStore.getState().nodes.map((n) => n.id)).toEqual(["a", "b", "c"])
      expect(useFlowStore.getState().edges.map((e) => e.id)).toEqual(["e3"])
    })

    it("断开选中边但保留未选中边", () => {
      seed(
        [makeNode("a"), makeNode("b", 300), makeNode("c", 600)],
        [{ ...makeEdge("e1", "a", "b"), selected: true }, makeEdge("e2", "b", "c")],
      )

      const removed = useFlowStore.getState().disconnectSelectedConnections()

      expect(removed).toBe(1)
      expect(useFlowStore.getState().edges.map((e) => e.id)).toEqual(["e2"])
    })

    it("断开指定节点连接用于拖拽晃动手势", () => {
      seed(
        [makeNode("a"), makeNode("b", 300), makeNode("c", 600)],
        [makeEdge("e1", "a", "b"), makeEdge("e2", "b", "c")],
      )

      const removed = useFlowStore.getState().disconnectNodeConnections("b")

      expect(removed).toBe(2)
      expect(useFlowStore.getState().nodes).toHaveLength(3)
      expect(useFlowStore.getState().edges).toHaveLength(0)
    })

    it("按 id 精确移除连线用于剪刀划线", () => {
      seed(
        [makeNode("a"), makeNode("b", 300), makeNode("c", 600)],
        [makeEdge("e1", "a", "b"), makeEdge("e2", "b", "c"), makeEdge("e3", "a", "c")],
      )

      const removed = useFlowStore.getState().removeEdgesByIds(["e2", "missing"])

      expect(removed).toBe(1)
      expect(useFlowStore.getState().edges.map((e) => e.id)).toEqual(["e1", "e3"])
      expect(useFlowStore.getState().nodes).toHaveLength(3)
    })

    it("按节点选中整个连通组件", () => {
      seed(
        [makeNode("a"), makeNode("b", 300), makeNode("c", 600), makeNode("d", 900)],
        [makeEdge("e1", "a", "b"), makeEdge("e2", "b", "c")],
      )

      const result = useFlowStore.getState().selectConnectedComponent("b")

      expect(result.nodeIds.sort()).toEqual(["a", "b", "c"])
      expect(result.edgeIds).toEqual(["e1", "e2"])
      expect(useFlowStore.getState().nodes.filter((node) => node.selected).map((node) => node.id).sort()).toEqual([
        "a",
        "b",
        "c",
      ])
      expect(useFlowStore.getState().edges.filter((edge) => edge.selected).map((edge) => edge.id)).toEqual(["e1", "e2"])
    })
  })

  describe("自动排布", () => {
    it("默认使用 ELK 按从上到下方向重排当前节点", async () => {
      seed(
        [makeNode("a", 400, 400), makeNode("b", 20, 20), makeNode("c", 700, 80)],
        [makeEdge("e1", "a", "b"), makeEdge("e2", "b", "c")],
      )

      await useFlowStore.getState().autoLayout("TB", undefined, false)

      const nodes = useFlowStore.getState().nodes
      const a = nodes.find((node) => node.id === "a")!
      const b = nodes.find((node) => node.id === "b")!
      const c = nodes.find((node) => node.id === "c")!
      expect(a.position.y).toBeLessThan(b.position.y)
      expect(b.position.y).toBeLessThan(c.position.y)
      expect(useFlowStore.getState().past).toHaveLength(1)
    })

    it("ELK 分层排布分支图时不让兄弟节点重叠", async () => {
      seed(
        [
          makeNode("root", 0, 0),
          makeNode("left", 0, 0),
          makeNode("right", 0, 0),
          makeNode("join", 0, 0),
        ],
        [
          makeEdge("e1", "root", "left"),
          makeEdge("e2", "root", "right"),
          makeEdge("e3", "left", "join"),
          makeEdge("e4", "right", "join"),
        ],
      )

      await useFlowStore.getState().autoLayout("TB", "elk", false)

      const nodes = useFlowStore.getState().nodes
      const root = nodes.find((node) => node.id === "root")!
      const left = nodes.find((node) => node.id === "left")!
      const right = nodes.find((node) => node.id === "right")!
      const join = nodes.find((node) => node.id === "join")!
      expect(root.position.y).toBeLessThan(left.position.y)
      expect(root.position.y).toBeLessThan(right.position.y)
      expect(left.position.y).toBeLessThan(join.position.y)
      expect(right.position.y).toBeLessThan(join.position.y)
      expect(Math.abs(left.position.x - right.position.x)).toBeGreaterThan(100)
    })
  })

  describe("剪贴板", () => {
    it("复制后粘贴会增加节点数量且 id 不冲突", () => {
      seed([makeNode("a", 0, 0, true)])
      const store = useFlowStore.getState()
      store.copy()
      store.paste()
      const { nodes } = useFlowStore.getState()
      expect(nodes.length).toBe(2)
      expect(new Set(nodes.map((n) => n.id)).size).toBe(2)
    })
  })

  describe("canonical catalog nodes", () => {
    it("adds atomic workflow nodes to both canonical project and canvas", () => {
      useFlowStore.getState().reset()
      const item = WORKFLOW_NODE_CATALOG.find((candidate) => candidate.id === "intelligence.agent.score")!

      useFlowStore.getState().addWorkflowNodeFromCatalog(item, { x: 444, y: 222 })

      const state = useFlowStore.getState()
      const projectNode = state.workflowProject.nodes.find((node) => node.id === "score")
      const canvasNode = state.nodes.find((node) => node.id === "score")
      expect(projectNode).toMatchObject({ kind: "agent", capability: "score" })
      expect(canvasNode).toMatchObject({
        id: "score",
        position: { x: 444, y: 222 },
        data: { label: "Importance Score", canonical: { capability: "score" } },
      })
    })

    it("updates canonical node params and adapter mode from template controls", () => {
      useFlowStore.getState().reset()

      useFlowStore.getState().updateWorkflowNodeParams("source-jin10", { limit: 12 }, { mode: "live" })

      const state = useFlowStore.getState()
      expect(state.workflowProject.nodes.find((node) => node.id === "source-jin10")?.params.limit).toBe(12)
      expect(state.workflowProject.adapters.find((adapter) => adapter.id === "jin10-kuaixun")?.mode).toBe("live")
      expect(
        state.nodes.find((node) => node.id === "source-jin10")?.data.fields?.find((field) => field.id === "limit")
          ?.value,
      ).toBe("12")
    })
  })

  describe("primitive package components", () => {
    it("adds reusable low-level primitive nodes as package drafts", () => {
      useFlowStore.getState().reset()
      const item = WORKFLOW_PRIMITIVES.find((candidate) => candidate.id === "primitive.transform.parse-json")!

      useFlowStore.getState().addPrimitiveNode(item, { x: 123, y: 456 })

      const node = useFlowStore.getState().nodes.find((candidate) => candidate.data.primitiveId === item.id)
      expect(node).toMatchObject({
        type: "workflow",
        position: { x: 123, y: 456 },
        data: {
          label: "Parse JSON",
          primitiveId: "primitive.transform.parse-json",
          packageDraft: true,
        },
      })
      expect(node?.data.primitivePorts).toContainEqual(expect.objectContaining({ id: "object", direction: "output" }))
    })

    it("exposes business primitives for intelligence packaging", () => {
      useFlowStore.getState().reset()
      const item = WORKFLOW_PRIMITIVES.find((candidate) => candidate.id === "primitive.business.evidence-pack")!

      useFlowStore.getState().addPrimitiveNode(item, { x: 20, y: 40 })

      const node = useFlowStore.getState().nodes.find((candidate) => candidate.data.primitiveId === item.id)
      expect(node?.data).toMatchObject({
        label: "Evidence Pack",
        primitiveCategory: "business",
        packageDraft: true,
      })
      expect(node?.data.primitivePorts).toContainEqual(expect.objectContaining({ id: "evidence", type: "evidencePack[]" }))
    })
  })

  describe("node internals subnet", () => {
    it("dives into a node network and restores the parent network", () => {
      useFlowStore.getState().reset()

      const count = useFlowStore.getState().enterNodeNetwork("router-importance")

      let state = useFlowStore.getState()
      expect(count).toBe(5)
      expect(state.networkStack.map((entry) => entry.nodeId)).toEqual(["router-importance"])
      expect(state.nodes.map((node) => node.id)).toEqual([
        "router-importance__expression",
        "router-importance__branches",
        "router-importance__default",
        "router-importance__preview",
        "router-importance__warnings",
      ])
      expect(state.edges).toHaveLength(4)
      expect(state.nodes.every((node) => node.data.internalLocked === true)).toBe(true)
      expect(state.nodes.every((node) => node.draggable === false)).toBe(true)
      expect(state.nodes.find((node) => node.id === "router-importance__expression")?.data.primitiveId).toBe("primitive.logic.condition")

      expect(useFlowStore.getState().exitNodeNetwork()).toBe(true)
      state = useFlowStore.getState()
      expect(state.networkStack).toHaveLength(0)
      expect(state.nodes.some((node) => node.id === "router-importance")).toBe(true)
      expect(state.nodes.some((node) => node.id === "router-importance__expression")).toBe(false)
    })

    it("unlocks canonical node internals as lower-level canvas nodes", () => {
      useFlowStore.getState().reset()

      const count = useFlowStore.getState().unlockNodeInternals("router-importance")

      const state = useFlowStore.getState()
      const internalNodes = state.nodes.filter((node) => node.data.internalOf === "router-importance")
      expect(count).toBeGreaterThan(0)
      expect(internalNodes.map((node) => node.id)).toContain("router-importance__expression")
      expect(internalNodes.every((node) => node.data.internalDraft === true)).toBe(true)
      expect(internalNodes.some((node) => typeof node.data.primitiveId === "string")).toBe(true)
      expect(state.nodes.find((node) => node.id === "router-importance")?.data.internalsUnlocked).toBe(true)
      expect(state.edges.some((edge) => edge.data?.internalOf === "router-importance")).toBe(true)
    })

    it("locks previously unlocked node internals and removes internal edges", () => {
      useFlowStore.getState().reset()
      useFlowStore.getState().unlockNodeInternals("router-importance")

      const count = useFlowStore.getState().lockNodeInternals("router-importance")

      const state = useFlowStore.getState()
      expect(count).toBeGreaterThan(0)
      expect(state.nodes.some((node) => node.data.internalOf === "router-importance")).toBe(false)
      expect(state.edges.some((edge) => edge.data?.internalOf === "router-importance")).toBe(false)
      expect(state.nodes.find((node) => node.id === "router-importance")?.data.internalsUnlocked).toBe(false)
    })
  })
})
