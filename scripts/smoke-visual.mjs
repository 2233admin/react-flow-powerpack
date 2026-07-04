#!/usr/bin/env node
/**
 * Playwright 可视化 smoke test。
 *
 * 用法：
 *   node scripts/smoke-visual.mjs              # 启动 next start，跑视觉断言
 *   PORT=4124 node scripts/smoke-visual.mjs
 *   SMOKE_BASE_URL=https://x.lovable.app node scripts/smoke-visual.mjs
 *
 * 产物（无论成功/失败都写）：/tmp/smoke-visual/*.png
 * 失败时额外写 <name>.html 便于回溯。
 */
import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs"
import { setTimeout as sleep } from "node:timers/promises"
import path from "node:path"

const PORT = process.env.PORT ?? "4124"
const HOST = "127.0.0.1"
const EXTERNAL = process.env.SMOKE_BASE_URL
const BASE = EXTERNAL ?? `http://${HOST}:${PORT}`
const OUT = "/tmp/smoke-visual"
const READY_TIMEOUT_MS = 30_000
const NAV_TIMEOUT_MS = 20_000
const NEXT_CLI = path.resolve("node_modules/next/dist/bin/next")

const CASES = [
  {
    name: "root",
    path: "/",
    selectors: [
      '[data-health="workflow-editor"]',
      '[data-health="command-strip"]',
      ".react-flow",
      ".react-flow__viewport",
      ".react-flow__node",
    ],
  },
  {
    name: "examples",
    path: "/examples",
    selectors: ["main, body", "text=交互示例总览"],
  },
]

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

function log(tag, msg) { process.stdout.write(`[visual:${tag}] ${msg}\n`) }

/** 探测可用的 chromium：优先环境变量，其次沙箱预装路径，最后交给 Playwright 默认。 */
function resolveChromium() {
  const env = process.env.PLAYWRIGHT_CHROMIUM_PATH
  if (env && existsSync(env)) return env
  const candidates = [
    "/chromium_headless_shell-1194/chrome-linux/headless_shell",
    "/chromium-1194/chrome-linux/chrome",
  ]
  for (const p of candidates) if (existsSync(p)) return p
  return undefined
}

async function waitReady() {
  const start = Date.now()
  while (Date.now() - start < READY_TIMEOUT_MS) {
    try {
      const r = await fetch(BASE + "/", { redirect: "manual" })
      if (r.status < 500) return
    } catch { /* not ready */ }
    await sleep(400)
  }
  throw new Error(`server not ready after ${READY_TIMEOUT_MS}ms`)
}

async function main() {
  let child = null
  const serverLogs = []
  if (!EXTERNAL) {
    if (!existsSync("dist/BUILD_ID")) {
      log("fail", "dist/ 未构建，先运行 `bun run build`")
      process.exit(1)
    }
    log("start", `next start on ${BASE}`)
    child = spawn(
      process.execPath,
      [NEXT_CLI, "start", "--port", PORT, "--hostname", HOST],
      { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NODE_ENV: "production" } },
    )
    child.stdout.on("data", (d) => serverLogs.push(String(d)))
    child.stderr.on("data", (d) => serverLogs.push(String(d)))
  }

  const { chromium } = await import("playwright")
  const results = []
  let browser = null
  try {
    if (!EXTERNAL) await waitReady()
    browser = await chromium.launch({
      headless: true,
      executablePath: resolveChromium(),
    })
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })

    for (const c of CASES) {
      const page = await ctx.newPage()
      const pageErrors = []
      const consoleErrors = []
      page.on("pageerror", (e) => pageErrors.push(String(e?.stack ?? e)))
      page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()) })

      const url = BASE + c.path
      const missing = []
      let ok = true
      let detail = ""
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS })
        for (const sel of c.selectors) {
          try {
            await page.waitForSelector(sel, { state: "visible", timeout: 6000 })
          } catch {
            missing.push(sel)
          }
        }
        if (missing.length) { ok = false; detail = `missing: ${JSON.stringify(missing)}` }
        else detail = "ok"
      } catch (e) {
        ok = false
        detail = `nav: ${e?.message ?? e}`
      }

      const shot = path.join(OUT, `${c.name}.png`)
      try { await page.screenshot({ path: shot }) } catch { /* ignore */ }

      if (!ok) {
        try {
          const html = await page.content()
          writeFileSync(path.join(OUT, `${c.name}.html`), html)
        } catch { /* ignore */ }
        if (pageErrors.length)
          writeFileSync(path.join(OUT, `${c.name}.pageerrors.txt`), pageErrors.join("\n\n"))
        if (consoleErrors.length)
          writeFileSync(path.join(OUT, `${c.name}.console.txt`), consoleErrors.join("\n"))
      }

      results.push({ name: c.name, path: c.path, ok, detail, screenshot: shot,
        pageErrors: pageErrors.length, consoleErrors: consoleErrors.length })
      log(ok ? "ok" : "fail", `${c.path} — ${detail} (screenshot: ${shot})`)
      await page.close()
    }
  } catch (e) {
    log("fail", `runner: ${e?.message ?? e}`)
    results.push({ name: "runner", ok: false, detail: String(e?.message ?? e) })
  } finally {
    if (browser) await browser.close()
    if (child) {
      child.kill("SIGTERM")
      await sleep(300)
      if (!child.killed) child.kill("SIGKILL")
    }
  }

  const failed = results.filter((r) => !r.ok)
  writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ base: BASE, results }, null, 2))
  if (failed.length) {
    process.stdout.write("---- next server logs (tail) ----\n")
    process.stdout.write(serverLogs.slice(-40).join(""))
    log("fail", `${results.length - failed.length}/${results.length} 通过；产物：${OUT}`)
    process.exit(1)
  }
  log("done", `${results.length}/${results.length} 通过；截图：${OUT}`)
}

main().catch((e) => { process.stderr.write(String(e?.stack ?? e) + "\n"); process.exit(1) })
