#!/usr/bin/env node
/**
 * 生产构建 smoke test。
 *
 * 用法：
 *   node scripts/smoke-test.mjs            # 启动本地 next start，跑分组断言
 *   PORT=4123 node scripts/smoke-test.mjs
 *   SMOKE_BASE_URL=https://foo.lovable.app node scripts/smoke-test.mjs
 *   node scripts/smoke-test.mjs --json     # 机器可读输出
 *
 * 分组：
 *   1. pages   页面路由 200 + 关键 DOM 标记
 *   2. api     API 路由存在性（POST 空 body → 4xx，非 404/5xx）
 *   3. assets  静态资源
 */
import { spawn } from "node:child_process"
import { readFileSync, existsSync, readdirSync } from "node:fs"
import { setTimeout as sleep } from "node:timers/promises"
import path from "node:path"

const argv = new Set(process.argv.slice(2))
const JSON_OUT = argv.has("--json")
const PORT = process.env.PORT ?? "4123"
const HOST = "127.0.0.1"
const EXTERNAL = process.env.SMOKE_BASE_URL
const BASE = EXTERNAL ?? `http://${HOST}:${PORT}`
const READY_TIMEOUT_MS = 30_000
const OVERALL_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 45_000)
const REQ_TIMEOUT_MS = 8_000
const DIST = path.resolve("dist")
const NEXT_CLI = path.resolve("node_modules/next/dist/bin/next")

/** @type {{group:string,name:string,ok:boolean,detail:string}[]} */
const results = []
const logs = []

function log(tag, msg) {
  if (!JSON_OUT) process.stdout.write(`[smoke:${tag}] ${msg}\n`)
}
function record(group, name, ok, detail) {
  results.push({ group, name, ok, detail })
  log(ok ? "ok" : "fail", `${group}/${name} — ${detail}`)
}

async function fetchWithTimeout(url, init = {}) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), REQ_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
}

async function waitReady() {
  const start = Date.now()
  while (Date.now() - start < READY_TIMEOUT_MS) {
    try {
      const r = await fetchWithTimeout(BASE + "/", { redirect: "manual" })
      if (r.status < 500) return
    } catch { /* not ready */ }
    await sleep(400)
  }
  throw new Error(`server not ready after ${READY_TIMEOUT_MS}ms`)
}

/* ---------------- pages ---------------- */

const PAGES = [
  {
    path: "/",
    must: [
      'data-health="workflow-editor"',
      'data-health="command-strip"',
      "react-flow",
    ],
  },
  { path: "/examples", must: ["交互示例总览", "Computing Flows"] },
  { path: "/examples/computing", must: ["<html", "bg-background"] },
]

async function checkPage(p) {
  try {
    const res = await fetchWithTimeout(BASE + p.path)
    const body = await res.text()
    if (res.status !== 200) return record("pages", p.path, false, `HTTP ${res.status}`)
    const missing = p.must.filter((tok) => !body.includes(tok))
    if (missing.length)
      return record("pages", p.path, false, `缺少标记 ${JSON.stringify(missing)}`)
    record("pages", p.path, true, `200 (${body.length} bytes)`)
  } catch (e) {
    record("pages", p.path, false, String(e?.message ?? e))
  }
}

/* ---------------- api ---------------- */

const APIS = [
  { path: "/api/generate-workflow", method: "POST", body: "{}" },
  { path: "/api/render", method: "POST", body: "{}" },
]

async function checkApi(a) {
  try {
    const res = await fetchWithTimeout(BASE + a.path, {
      method: a.method,
      headers: { "content-type": "application/json" },
      body: a.body,
    })
    // 存在的路由应返回 400/422/500 之类；404 说明未挂载
    if (res.status === 404)
      return record("api", `${a.method} ${a.path}`, false, "HTTP 404 (未挂载)")
    record("api", `${a.method} ${a.path}`, true, `HTTP ${res.status}`)
  } catch (e) {
    record("api", `${a.method} ${a.path}`, false, String(e?.message ?? e))
  }
}

/* ---------------- assets ---------------- */

function findFirstStaticChunk() {
  const staticDir = path.join(DIST, "static")
  if (!existsSync(staticDir)) return null
  // 递归找一个 .js 文件
  const walk = (dir) => {
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, name.name)
      if (name.isDirectory()) {
        const hit = walk(p)
        if (hit) return hit
      } else if (name.name.endsWith(".js")) {
        return p
      }
    }
    return null
  }
  const abs = walk(staticDir)
  if (!abs) return null
  return "/_next/" + path.relative(DIST, abs).split(path.sep).join("/")
}

async function checkAssets() {
  // icon.svg
  try {
    const res = await fetchWithTimeout(BASE + "/icon.svg")
    const ct = res.headers.get("content-type") ?? ""
    if (res.status !== 200 || !/svg/i.test(ct))
      record("assets", "/icon.svg", false, `HTTP ${res.status} ct=${ct}`)
    else record("assets", "/icon.svg", true, `200 ${ct}`)
  } catch (e) {
    record("assets", "/icon.svg", false, String(e?.message ?? e))
  }

  // 一个真实的静态 chunk
  const chunk = findFirstStaticChunk()
  if (!chunk) {
    record("assets", "_next/static/*.js", false, "dist/static 下未找到 .js")
    return
  }
  try {
    const res = await fetchWithTimeout(BASE + chunk)
    if (res.status !== 200)
      record("assets", chunk, false, `HTTP ${res.status}`)
    else record("assets", chunk, true, `200`)
  } catch (e) {
    record("assets", chunk, false, String(e?.message ?? e))
  }
}

/* ---------------- runner ---------------- */

async function runSuite() {
  for (const p of PAGES) await checkPage(p)
  for (const a of APIS) await checkApi(a)
  await checkAssets()
}

async function main() {
  const started = Date.now()
  let child = null

  if (!EXTERNAL) {
    if (!existsSync(path.join(DIST, "BUILD_ID"))) {
      log("fail", "dist/ 未构建，先运行 `bun run build`")
      process.exit(1)
    }
    log("start", `next start on ${BASE}`)
    child = spawn(
      process.execPath,
      [NEXT_CLI, "start", "--port", PORT, "--hostname", HOST],
      { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production" } },
    )
    child.stdout.on("data", (d) => logs.push(String(d)))
    child.stderr.on("data", (d) => logs.push(String(d)))
    child.on("exit", (code) => logs.push(`[next] exited ${code}\n`))
  } else {
    log("start", `using external ${BASE}`)
  }

  const timer = setTimeout(() => {
    log("fail", `overall timeout ${OVERALL_TIMEOUT_MS}ms`)
    if (child) child.kill("SIGKILL")
    process.exit(1)
  }, OVERALL_TIMEOUT_MS)

  try {
    if (!EXTERNAL) await waitReady()
    await runSuite()
  } catch (e) {
    record("runner", "boot", false, String(e?.message ?? e))
  } finally {
    clearTimeout(timer)
    if (child) {
      child.kill("SIGTERM")
      await sleep(300)
      if (!child.killed) child.kill("SIGKILL")
    }
  }

  const failed = results.filter((r) => !r.ok)
  const summary = {
    base: BASE,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    durationMs: Date.now() - started,
    results,
  }

  if (JSON_OUT) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n")
  } else {
    log(
      failed.length ? "fail" : "done",
      `${summary.passed}/${summary.total} 通过，用时 ${summary.durationMs}ms`,
    )
    if (failed.length) {
      process.stdout.write("---- next server logs (tail) ----\n")
      process.stdout.write(logs.slice(-40).join(""))
    }
  }
  process.exit(failed.length ? 1 : 0)
}

main().catch((e) => {
  process.stderr.write(String(e?.stack ?? e) + "\n")
  process.exit(1)
})
