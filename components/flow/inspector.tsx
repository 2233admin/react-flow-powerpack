"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { useFlowStore } from "@/lib/flow/store"
import type { WorkflowNodeData, FieldConfig } from "@/lib/flow/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { getNodeInternals, type NodeInternalStatus } from "@/lib/workflow/node-internals"
import { getNodeContract } from "@/lib/workflow/node-contracts"
import { getWorkflowProfileInspectorSections } from "@/lib/workflow/profiles"
import { getNodeTemplate } from "@/lib/workflow/node-templates"
import { buildParameterInterfaceView, type ParameterInterfaceViewField } from "@/lib/workflow/parameter-interface"
import { cn } from "@/lib/utils"

const stateText: Record<string, string> = {
  idle: "Idle",
  running: "Running",
  success: "Done",
  error: "Error",
}

const stateDotClass: Record<string, string> = {
  idle: "border-muted-foreground/50 bg-transparent",
  running: "border-[#ff7a17] bg-[#ff7a17]",
  success: "border-[#4ade80] bg-[#4ade80]",
  error: "border-destructive bg-destructive",
}

const edgeTypeOptions = [
  { value: "workflow", label: "默认（贝塞尔曲线）" },
  { value: "editable", label: "可编辑路径" },
  { value: "routed", label: "智能避障（正交路由）" },
]

const edgeTypeHints: Record<string, string> = {
  workflow: "标准平滑曲线连线。",
  editable: "选中后可拖动控制点调整路径，双击线条添加控制点、双击控制点删除。",
  routed: "自动绕开中间节点的正交折线，适合密集流程图。",
}

const internalStatusLabel: Record<NodeInternalStatus, string> = {
  ready: "READY",
  simulated: "SIM",
  future: "NEXT",
}

const internalStatusClass: Record<NodeInternalStatus, string> = {
  ready: "border-[#4ade80]/30 bg-[#4ade80]/10 text-[#4ade80]",
  simulated: "border-[#a0c3ec]/30 bg-[#a0c3ec]/10 text-[#a0c3ec]",
  future: "border-border bg-muted text-muted-foreground",
}

function SectionCaption({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
      {children}
    </p>
  )
}

function MonoRow({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate text-foreground">{v}</span>
    </div>
  )
}

function PanelStatus({ status }: { status?: string }) {
  if (!status) return null
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 text-muted-foreground"
      title={`Status: ${stateText[status] ?? status}`}
    >
      <span className={cn("size-1.5 rounded-full border", stateDotClass[status] ?? stateDotClass.idle)} />
      <span>{stateText[status] ?? status}</span>
    </span>
  )
}

function PanelShell({
  title,
  typeLine,
  status,
  onClose,
  children,
}: {
  title: string
  typeLine: string
  status?: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <aside
      data-health="inspector"
      className="absolute bottom-3 right-3 top-3 z-40 flex w-72 flex-col overflow-hidden rounded-lg border bg-sidebar/95 shadow-2xl backdrop-blur-sm duration-150 animate-in fade-in slide-in-from-right-4"
      aria-label="参数面板"
    >
      <div className="flex items-start gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          <SectionCaption>Parameter Interface</SectionCaption>
          <h2 className="mt-1 truncate text-sm font-medium">{title}</h2>
          <div className="mt-0.5 flex items-center justify-between gap-2 font-mono text-[10px]">
            <span className="truncate text-muted-foreground">{typeLine}</span>
            <PanelStatus status={status} />
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="关闭参数面板"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <ScrollArea className="flex-1">{children}</ScrollArea>
    </aside>
  )
}

export function Inspector() {
  const nodes = useFlowStore((s) => s.nodes)
  const edges = useFlowStore((s) => s.edges)
  const workflowProject = useFlowStore((s) => s.workflowProject)
  const updateNodeData = useFlowStore((s) => s.updateNodeData)
  const updateEdgeData = useFlowStore((s) => s.updateEdgeData)
  const updateEdgeType = useFlowStore((s) => s.updateEdgeType)
  const toggleEdgeAnimated = useFlowStore((s) => s.toggleEdgeAnimated)
  const updateWorkflowNodeParams = useFlowStore((s) => s.updateWorkflowNodeParams)
  const updateParameterInterfaceField = useFlowStore((s) => s.updateParameterInterfaceField)
  const takeSnapshot = useFlowStore((s) => s.takeSnapshot)
  const setNodes = useFlowStore((s) => s.setNodes)
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange)
  const [nodeTab, setNodeTab] = useState<"config" | "prompt" | "run" | "trace">("config")
  const [parameterGroupTab, setParameterGroupTab] = useState("")

  const selected = nodes.filter((n) => n.selected)
  const selectedEdges = edges.filter((e) => e.selected)

  const deselectAll = () => {
    setNodes((ns) => ns.map((n) => (n.selected ? { ...n, selected: false } : n)))
    onEdgesChange(edges.filter((e) => e.selected).map((e) => ({ id: e.id, type: "select" as const, selected: false })))
  }

  /* ---- edge parameter interface ---- */
  if (selected.length === 0 && selectedEdges.length === 1) {
    const edge = selectedEdges[0]
    const edgeType = edge.type ?? "workflow"
    return (
      <PanelShell
        title="Connection"
        typeLine={`EDGE::${edgeType.toUpperCase()}`}
        onClose={deselectAll}
      >
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="edge-label" className="font-mono text-[10px] uppercase tracking-wider">
              Label
            </Label>
            <Input
              id="edge-label"
              value={(edge.data?.label as string) ?? ""}
              onFocus={takeSnapshot}
              onChange={(e) => updateEdgeData(edge.id, { label: e.target.value })}
              placeholder="例如：成功 / 失败"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-wider">Type</Label>
            <Select value={edgeType} onValueChange={(v) => v && updateEdgeType(edge.id, v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {edgeTypeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{edgeTypeHints[edgeType]}</p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="edge-anim" className="font-mono text-[10px] uppercase tracking-wider">
                Flow Animation
              </Label>
              <p className="text-[11px] text-muted-foreground">显示流向的虚线动画</p>
            </div>
            <Switch id="edge-anim" checked={!!edge.animated} onCheckedChange={() => toggleEdgeAnimated(edge.id)} />
          </div>

          <Separator />
          <div className="space-y-1.5 rounded-md border bg-card p-3">
            <SectionCaption>Debug</SectionCaption>
            <MonoRow k="id" v={edge.id} />
            <MonoRow k="wire" v={`${edge.source} → ${edge.target}`} />
          </div>
        </div>
      </PanelShell>
    )
  }

  /* ---- nothing (or multiple) selected: stay out of the way ---- */
  if (selected.length !== 1) return null

  /* ---- node parameter interface ---- */
  const node = selected[0]
  const data = node.data as WorkflowNodeData
  const canonical = data.canonical as { kind?: string; capability?: string; adapter?: string; params?: Record<string, unknown> } | undefined
  const projectNode = workflowProject.nodes.find((candidate) => candidate.id === node.id)
  const projectAdapter = projectNode?.adapter
    ? workflowProject.adapters.find((candidate) => candidate.id === projectNode.adapter)
    : undefined
  const nodeTemplate = getNodeTemplate(projectNode)
  const parameterInterfaceView = buildParameterInterfaceView({ node: projectNode, adapter: projectAdapter, nodes })
  const nodeInternals = getNodeInternals(projectNode)
  const nodeContract = getNodeContract(projectNode)
  const profileSections = canonical?.kind
    ? getWorkflowProfileInspectorSections(workflowProject.profile, canonical.kind as never)
    : []
  const promptCapable =
    canonical?.kind === "agent" ||
    typeof data.primitiveId === "string" && (data.primitiveId.includes("prompt") || data.primitiveId.includes("model"))

  const update = (patch: Partial<WorkflowNodeData>) => updateNodeData(node.id, patch)

  const updateField = (fieldId: string, value: string) => {
    const fields = (data.fields ?? []).map((f: FieldConfig) =>
      f.id === fieldId ? { ...f, value } : f,
    )
    update({ fields })
  }

  const updateParameterField = (field: ParameterInterfaceViewField, value: unknown) => {
    if (field.readonly) return
    if (parameterInterfaceView?.mode === "template") {
      if (field.binding.source === "adapter") {
        if (field.binding.fieldId === "mode") {
          updateWorkflowNodeParams(node.id, {}, { mode: value as never })
          return
        }
        updateWorkflowNodeParams(node.id, {}, { config: { [field.binding.fieldId]: value } })
        return
      }
      if (field.binding.source === "data") {
        update({ [field.binding.fieldId]: value } as Partial<WorkflowNodeData>)
        return
      }
      updateWorkflowNodeParams(node.id, { [field.binding.fieldId]: value })
      return
    }
    updateParameterInterfaceField(node.id, field.id, value)
  }

  const renderParameterField = (field: ParameterInterfaceViewField) => {
    const raw = field.value
    const fieldId = `parameter-${field.id}`
    const label = (
      <div className="space-y-0.5">
        <Label htmlFor={fieldId} className="font-mono text-[10px] uppercase tracking-wider">
          {field.label}
        </Label>
        {field.description ? <p className="text-[11px] leading-relaxed text-muted-foreground">{field.description}</p> : null}
      </div>
    )
    const readonlyTone = field.readonly ? "opacity-70" : ""

    if (field.type === "boolean") {
      const checked = raw === true || raw === "true"
      return (
        <div key={field.id} className={cn("flex items-center justify-between gap-3 rounded-md border bg-card p-3", readonlyTone)}>
          {label}
          <Switch
            id={fieldId}
            checked={checked}
            disabled={field.readonly}
            onCheckedChange={(checkedValue) => updateParameterField(field, checkedValue)}
          />
        </div>
      )
    }

    if (field.type === "select") {
      const value = typeof raw === "string" ? raw : field.options?.[0]?.value
      return (
        <div key={field.id} className={cn("space-y-1.5", readonlyTone)}>
          {label}
          {field.readonly ? (
            <Input id={fieldId} readOnly value={field.options?.find((option) => option.value === value)?.label ?? value ?? ""} className="font-mono text-xs" />
          ) : (
            <Select value={value} onValueChange={(next) => updateParameterField(field, next)}>
              <SelectTrigger id={fieldId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )
    }

    if (field.type === "textarea") {
      return (
        <div key={field.id} className={cn("space-y-1.5", readonlyTone)}>
          {label}
          <Textarea
            id={fieldId}
            rows={3}
            readOnly={field.readonly}
            className="font-mono text-xs"
            value={typeof raw === "string" ? raw : ""}
            onChange={(e) => updateParameterField(field, e.target.value)}
          />
        </div>
      )
    }

    if (field.type === "tokens") {
      const selectedValues = new Set(
        Array.isArray(raw)
          ? raw.filter((value): value is string => typeof value === "string")
          : typeof raw === "string" && raw
            ? raw.split(",").map((value) => value.trim()).filter(Boolean)
            : [],
      )
      return (
        <div key={field.id} className={cn("space-y-1.5", readonlyTone)}>
          {label}
          <div className="flex flex-wrap gap-1.5">
            {(field.options ?? []).map((option) => {
              const selectedToken = selectedValues.has(option.value)
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={field.readonly}
                  onClick={() => {
                    const next = new Set(selectedValues)
                    if (next.has(option.value)) next.delete(option.value)
                    else next.add(option.value)
                    updateParameterField(field, Array.from(next))
                  }}
                  className={cn(
                    "rounded-sm border px-2 py-1 font-mono text-[10px] transition-colors disabled:pointer-events-none disabled:opacity-60",
                    selectedToken ? "border-[#ff7a17] bg-[#ff7a17]/10 text-[#ff7a17]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (field.type === "slider") {
      const value = typeof raw === "number" ? raw : Number(raw ?? field.min ?? 0)
      const safeValue = Number.isFinite(value) ? value : field.min ?? 0
      return (
        <div key={field.id} className={cn("space-y-2", readonlyTone)}>
          <div className="flex items-center justify-between gap-2">
            {label}
            <span className="font-mono text-[11px] text-foreground">{safeValue.toFixed(2)}</span>
          </div>
          <input
            id={fieldId}
            type="range"
            min={field.min ?? 0}
            max={field.max ?? 1}
            step={field.step ?? 0.01}
            value={safeValue}
            disabled={field.readonly}
            onChange={(e) => updateParameterField(field, Number(e.target.value))}
            className="w-full accent-[#ff7a17] disabled:opacity-60"
          />
        </div>
      )
    }

    if (field.type === "number") {
      const value = typeof raw === "number" ? raw : Number(raw ?? 0)
      return (
        <div key={field.id} className={cn("space-y-1.5", readonlyTone)}>
          {label}
          <Input
            id={fieldId}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            readOnly={field.readonly}
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => updateParameterField(field, Number(e.target.value))}
            className="font-mono text-xs"
          />
        </div>
      )
    }

    return (
      <div key={field.id} className={cn("space-y-1.5", readonlyTone)}>
        {label}
        <Input
          id={fieldId}
          value={typeof raw === "string" || typeof raw === "number" ? String(raw) : ""}
          placeholder={field.placeholder}
          readOnly={field.readonly}
          onChange={(e) => updateParameterField(field, e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    )
  }

  const isCondition = data.nodeType === "condition"
  const ports = nodeContract
    ? nodeContract.ports.map((port) => ({ name: port.id, dir: port.direction, type: port.type, description: port.description }))
    : [
        { name: "in", dir: "input", type: data.category, description: "Generic input port." },
        ...(isCondition
          ? [
              { name: "true", dir: "output", type: "branch", description: "True branch output." },
              { name: "false", dir: "output", type: "branch", description: "False branch output." },
            ]
          : [{ name: "out", dir: "output", type: data.category, description: "Generic output port." }]),
      ]
  const parameterGroups = parameterInterfaceView?.groups ?? []
  const activeParameterGroupId = parameterGroups.some((group) => group.id === parameterGroupTab)
    ? parameterGroupTab
    : parameterGroups[0]?.id
  const activeParameterFields = parameterInterfaceView?.fields.filter((field) => field.groupId === activeParameterGroupId) ?? []

  return (
    <PanelShell
      title={data.label}
      typeLine={`${data.category}::${data.nodeType}`.toUpperCase() + " · V1.0"}
      status={data.status}
      onClose={deselectAll}
    >
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-4 gap-1 rounded-md bg-muted p-1 font-mono text-[10px] uppercase">
          {(["config", "prompt", "run", "trace"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                if (tab === "prompt" && !promptCapable) return
                setNodeTab(tab)
              }}
              className={cn(
                "rounded-sm px-2 py-1 transition-colors",
                nodeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                tab === "prompt" && !promptCapable && "opacity-40",
              )}
            >
              {tab === "config" ? "Config" : tab === "prompt" ? "Prompt" : tab === "run" ? "Run Result" : "Trace"}
            </button>
          ))}
        </div>

        {nodeTab === "prompt" ? (
          <div className="space-y-3">
            <SectionCaption>Prompt Playground</SectionCaption>
            <div className="rounded-md border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">
              Prompt edits are staged through Agent proposal before they update the canonical workflow.
            </div>
            <MonoRow k="preset" v={String(canonical?.params?.style ?? data.fields?.find((field) => field.id === "preset")?.value ?? "macro-brief")} />
            <MonoRow k="version" v={String(canonical?.params?.promptVersion ?? data.fields?.find((field) => field.id === "version")?.value ?? "v1")} />
            <MonoRow k="model" v={String(canonical?.params?.model ?? data.fields?.find((field) => field.id === "model")?.value ?? "deepseek/mock")} />
            <Separator />
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-wider">Test Input</Label>
              <Textarea readOnly rows={3} className="font-mono text-xs" value="JIN10 macro news sample with policy/market impact." />
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-wider">Mock Output</Label>
              <Textarea readOnly rows={4} className="font-mono text-xs" value="3-bullet macro brief, impact score, source refs, and risk note." />
            </div>
            <div className="rounded-md border bg-card p-3">
              <SectionCaption>Version Note</SectionCaption>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Baseline prompt version for deterministic local evaluation and regression gate.
              </p>
            </div>
          </div>
        ) : nodeTab === "run" ? (
          <div className="space-y-3">
            <SectionCaption>Run Result</SectionCaption>
            <div className="rounded-md border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">
              Explicit run results live in Run Trace. This node is ready for deterministic simulation.
            </div>
            <MonoRow k="node" v={node.id} />
            {canonical?.capability ? <MonoRow k="capability" v={canonical.capability} /> : null}
            {canonical?.adapter ? <MonoRow k="adapter" v={canonical.adapter} /> : null}
          </div>
        ) : nodeTab === "trace" ? (
          <div className="space-y-3">
            <SectionCaption>Trace</SectionCaption>
            <div className="rounded-md border bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">
              Open Run Trace, press Run, then inspect ordered node events by id.
            </div>
            <MonoRow k="profile" v={workflowProject.profile} />
            {canonical?.kind ? <MonoRow k="kind" v={canonical.kind} /> : null}
          </div>
        ) : (
          <>
        {profileSections.length > 0 ? (
          <div className="space-y-2">
            <SectionCaption>Profile Sections</SectionCaption>
            <div className="flex flex-wrap gap-1.5">
              {profileSections.map((section) => (
                <Badge key={section} variant="secondary" className="font-mono text-[10px]">
                  {section}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {parameterInterfaceView ? (
          <div className="space-y-3 rounded-md border bg-card p-3">
            <div className="space-y-1">
              <SectionCaption>{parameterInterfaceView.title}</SectionCaption>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{parameterInterfaceView.summary}</p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-md bg-muted p-1 font-mono text-[10px] uppercase">
              {parameterGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setParameterGroupTab(group.id)}
                  className={cn(
                    "rounded-sm px-2 py-1 transition-colors",
                    activeParameterGroupId === group.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {group.label}
                </button>
              ))}
            </div>
            <Separator />
            <div className="space-y-3">{activeParameterFields.map((field) => renderParameterField(field))}</div>
          </div>
        ) : null}

        {nodeContract ? (
          <div className="space-y-3 rounded-md border bg-card p-3">
            <div className="space-y-1">
              <SectionCaption>Contract</SectionCaption>
              <h3 className="text-xs font-medium text-foreground">{nodeContract.title}</h3>
              <p className="font-mono text-[10px] text-muted-foreground">{nodeContract.dataModel}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <MonoRow k="ports" v={nodeContract.ports.length} />
              <MonoRow k="params" v={nodeContract.params.length} />
            </div>
            <Separator />
            <div className="space-y-1.5">
              {nodeContract.params.slice(0, 4).map((param) => (
                <div key={param.id} className="flex items-center justify-between gap-2 font-mono text-[10px]">
                  <span className="truncate text-foreground">{param.id}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {param.source} · {param.type}{param.required ? " · required" : ""}
                  </span>
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-1">
              {nodeContract.assertions.slice(0, 3).map((assertion) => (
                <p key={assertion} className="line-clamp-1 text-[11px] text-muted-foreground">
                  {assertion}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {nodeInternals ? (
          <div className="space-y-3 rounded-md border bg-card p-3">
            <div className="space-y-1">
              <SectionCaption>Internals</SectionCaption>
              <h3 className="text-xs font-medium text-foreground">{nodeInternals.title}</h3>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{nodeInternals.summary}</p>
            </div>
            <div className="space-y-2">
              {nodeInternals.steps.map((step, index) => (
                <div key={step.id} className="rounded-md border bg-background/50 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="truncate text-xs font-medium text-foreground">{step.label}</p>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{step.description}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-sm border px-1.5 py-0.5 font-mono text-[9px]",
                        internalStatusClass[step.status],
                      )}
                    >
                      {internalStatusLabel[step.status]}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[10px] text-muted-foreground/80">
                    <span>{step.capability}</span>
                    <span className="truncate">{step.evidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <SectionCaption>{nodeTemplate ? "Identity" : "Parameters"}</SectionCaption>
          <div className="space-y-1.5">
            <Label htmlFor="node-label" className="font-mono text-[10px] uppercase tracking-wider">
              Name
            </Label>
            <Input
              id="node-label"
              value={data.label}
              onFocus={takeSnapshot}
              onChange={(e) => update({ label: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="node-desc" className="font-mono text-[10px] uppercase tracking-wider">
              Description
            </Label>
            <Textarea
              id="node-desc"
              rows={3}
              value={data.description ?? ""}
              onFocus={takeSnapshot}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="添加描述..."
            />
          </div>

          {isCondition ? (
            <div className="space-y-1.5">
              <Label htmlFor="node-cond" className="font-mono text-[10px] uppercase tracking-wider">
                Expression
              </Label>
              <Textarea
                id="node-cond"
                rows={2}
                className="font-mono text-xs"
                value={data.condition ?? ""}
                onFocus={takeSnapshot}
                onChange={(e) => update({ condition: e.target.value })}
              />
            </div>
          ) : null}

          {!nodeTemplate && data.fields && data.fields.length > 0
            ? data.fields.map((f: FieldConfig) => (
                <div key={f.id} className="space-y-1.5">
                  <Label
                    htmlFor={`field-${f.id}`}
                    className="font-mono text-[10px] uppercase tracking-wider"
                  >
                    {f.label}
                  </Label>
                  <Input
                    id={`field-${f.id}`}
                    value={f.value}
                    onFocus={takeSnapshot}
                    onChange={(e) => updateField(f.id, e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              ))
            : null}
        </div>

        {data.nodeType !== "note" && data.nodeType !== "group" ? (
          <>
            <Separator />
            <div className="space-y-1.5 rounded-md border bg-card p-3">
              <SectionCaption>Ports</SectionCaption>
              {ports.map((p) => (
                <div
                  key={`${p.dir}-${p.name}`}
                  className="flex items-center justify-between font-mono text-[11px]"
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "size-1.5 rounded-[2px]",
                        p.dir === "input" ? "bg-[#a0c3ec]" : "bg-[#3a3d42]",
                      )}
                      aria-hidden
                    />
                    <span className="text-foreground">{p.name}</span>
                  </span>
                  <span className="text-muted-foreground/70">
                    {p.dir.toUpperCase()} · {p.type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <Separator />
        <div className="space-y-1.5 rounded-md border bg-card p-3">
          <SectionCaption>Debug</SectionCaption>
          <MonoRow k="id" v={node.id} />
          <MonoRow k="pos" v={`${Math.round(node.position.x)}, ${Math.round(node.position.y)}`} />
          {node.parentId ? <MonoRow k="parent" v={node.parentId} /> : null}
        </div>
          </>
        )}
      </div>
    </PanelShell>
  )
}
