"use client"

// Standalone "Computing Flows" demo — a small ReactFlow instance with just
// the math node types. Isolated from the main editor's store so it starts
// clean every time.

import { useCallback, useState } from "react"
import Link from "next/link"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import MathNode, { type MathNodeData } from "@/components/flow/nodes/math-node"

const nodeTypes = { math: MathNode }

const initialNodes: Node<MathNodeData>[] = [
  { id: "a", type: "math", position: { x: 0, y: 0 }, data: { kind: "input", value: 3 } },
  { id: "b", type: "math", position: { x: 0, y: 120 }, data: { kind: "input", value: 4 } },
  { id: "op", type: "math", position: { x: 260, y: 60 }, data: { kind: "op", op: "add" } },
  { id: "out", type: "math", position: { x: 520, y: 60 }, data: { kind: "output" } },
]

const initialEdges: Edge[] = [
  { id: "a-op", source: "a", target: "op", targetHandle: "a" },
  { id: "b-op", source: "b", target: "op", targetHandle: "b" },
  { id: "op-out", source: "op", target: "out" },
]

function Canvas() {
  const [nodes, setNodes] = useState<Node<MathNodeData>[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<MathNodeData>>[]) =>
      setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((es) => applyEdgeChanges(changes, es)),
    [],
  )
  const onConnect = useCallback(
    (c: Connection) => setEdges((es) => addEdge({ ...c, animated: true }, es)),
    [],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#26282c" />
      <Controls />
    </ReactFlow>
  )
}

export function ComputingDemo() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Link
          href="/examples"
          className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← Examples
        </Link>
        <span className="text-muted-foreground/60">/</span>
        <span className="font-mono text-[11px]">Computing Flows</span>
        <span className="ml-auto text-[11px] text-muted-foreground">
          修改左侧 INPUT 数值，右侧 OUTPUT 自动重算
        </span>
      </header>
      <div className="min-h-0 flex-1">
        <ReactFlowProvider>
          <Canvas />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
