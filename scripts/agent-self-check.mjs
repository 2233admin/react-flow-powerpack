#!/usr/bin/env node
/**
 * Agent-readable self-check client.
 *
 * Usage:
 *   npm run agent:self-check
 *   BASE_URL=http://127.0.0.1:8080 npm run agent:self-check
 *   npm run agent:self-check -- --json
 */

const argv = new Set(process.argv.slice(2))
const JSON_OUT = argv.has("--json")
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:8080"
const TARGET = `${BASE_URL.replace(/\/$/, "")}/api/agent/self-check`

function color(code, text) {
  if (JSON_OUT || process.env.NO_COLOR) return text
  return `\x1b[${code}m${text}\x1b[0m`
}

function statusColor(status) {
  if (status === "pass") return color(32, status)
  if (status === "warn") return color(33, status)
  return color(31, status)
}

async function main() {
  const response = await fetch(TARGET, {
    headers: {
      Accept: "application/json",
    },
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = body ? JSON.stringify(body) : `${response.status} ${response.statusText}`
    throw new Error(`self-check endpoint failed: ${detail}`)
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(body, null, 2))
    return
  }

  console.log(`agent self-check: ${statusColor(body.status)} · ${body.project.id}`)
  console.log(body.agentEvidence.handoffSummary)
  console.log("")
  for (const check of body.checks) {
    console.log(`  ${statusColor(check.status).padEnd(14)} ${check.id} — ${check.summary}`)
  }
  console.log("")
  console.log(`trace: ${body.run.runtime.traceEventCount} events · ${body.run.runtime.executedNodeCount}/${body.run.runtime.nodeCount} nodes`)
  console.log(`endpoint: ${TARGET}`)
}

main().catch((error) => {
  console.error(`agent self-check failed: ${error instanceof Error ? error.message : error}`)
  process.exitCode = 1
})
