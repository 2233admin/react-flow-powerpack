"use client"

import { useEffect, useState } from "react"

type Check = { key: string; label: string; selector: string; optional?: boolean }

const CHECKS: Check[] = [
  { key: "command-strip", label: "Command Strip", selector: '[data-health="command-strip"]' },
  { key: "workflow-editor", label: "Workflow Editor", selector: '[data-health="workflow-editor"]' },
  { key: "react-flow", label: "React Flow Canvas", selector: ".react-flow" },
  { key: "react-flow-viewport", label: "RF Viewport", selector: ".react-flow__viewport" },
  { key: "react-flow-node", label: "RF Node", selector: ".react-flow__node" },
  { key: "inspector", label: "Inspector (选中节点后)", selector: '[data-health="inspector"]', optional: true },
]

export function HealthCheck() {
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(true)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const run = () => {
      if (cancelled) return
      const next: Record<string, boolean> = {}
      for (const c of CHECKS) next[c.key] = document.querySelector(c.selector) !== null
      setResults(next)
      attempts++
      const allOk = CHECKS.every((c) => next[c.key])
      if (!allOk && attempts < 20) setTimeout(run, 250)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const required = CHECKS.filter((c) => !c.optional)
  const total = required.length
  const passed = required.filter((c) => results[c.key]).length
  const optionalPassed = CHECKS.filter((c) => c.optional && results[c.key]).length
  const optionalTotal = CHECKS.length - total
  const allOk = passed === total
  const status = allOk ? "healthy" : passed === 0 ? "pending" : "degraded"

  if (!open) return null

  return (
    <div
      data-health-panel
      data-health-status={status}
      data-health-passed={passed}
      data-health-total={total}
      className="pointer-events-auto fixed bottom-3 left-3 z-[9999] w-64 rounded-lg border border-border bg-popover/95 p-3 font-mono text-[11px] text-popover-foreground shadow-2xl backdrop-blur"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Health · {status}
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="关闭健康检查"
        >
          ×
        </button>
      </div>
      <ul className="space-y-1">
        {CHECKS.map((c) => {
          const ok = results[c.key]
          const state = ok ? "ok" : c.optional ? "skip" : "fail"
          const label = ok ? "OK" : c.optional ? "—" : "…"
          const cls = ok ? "text-emerald-400" : c.optional ? "text-muted-foreground" : "text-red-400"
          return (
            <li key={c.key} className="flex items-center justify-between gap-2">
              <span className="truncate">{c.label}</span>
              <span
                data-health-key={c.key}
                data-health-ok={ok ? "true" : "false"}
                data-health-optional={c.optional ? "true" : "false"}
                data-health-state={state}
                className={cls}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ul>
      <div className="mt-2 border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
        必需 {passed}/{total} · 可选 {optionalPassed}/{optionalTotal} · <code>?health=1</code>
      </div>
    </div>
  )
}
