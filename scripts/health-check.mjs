#!/usr/bin/env node
/**
 * 根路径渲染健康检查：访问 /?health=1，读取 <HealthCheck> 面板中的 data-health-* 结果，
 * 输出每个关键组件的挂载状态。所有组件挂载成功时退出码为 0，否则为 1。
 *
 * 用法：
 *   node scripts/health-check.mjs                # 默认 http://localhost:8080
 *   BASE_URL=http://localhost:8080 node scripts/health-check.mjs
 */
import { chromium } from "playwright"

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080"
const TARGET = `${BASE_URL}/?health=1`
const TIMEOUT_MS = Number(process.env.HEALTH_TIMEOUT ?? 45_000)

const color = (code, text) => `\x1b[${code}m${text}\x1b[0m`
const green = (t) => color(32, t)
const red = (t) => color(31, t)
const yellow = (t) => color(33, t)
const dim = (t) => color(90, t)

async function main() {
  console.log(dim(`→ GET ${TARGET}`))
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const page = await context.newPage()

  try {
    await page.goto(TARGET, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS })
    await page.waitForSelector("[data-health-panel]", { timeout: TIMEOUT_MS })
    // 等健康检查内部轮询稳定（至多 ~5s）
    await page
      .waitForSelector('[data-health-panel][data-health-status="healthy"]', { timeout: 6_000 })
      .catch(() => {})

    const summary = await page.evaluate(() => {
      const panel = document.querySelector("[data-health-panel]")
      if (!panel) return null
      const items = Array.from(panel.querySelectorAll("[data-health-key]")).map((el) => ({
        key: el.getAttribute("data-health-key"),
        ok: el.getAttribute("data-health-ok") === "true",
        optional: el.getAttribute("data-health-optional") === "true",
        state: el.getAttribute("data-health-state") ?? "",
      }))
      return {
        status: panel.getAttribute("data-health-status"),
        passed: Number(panel.getAttribute("data-health-passed") ?? 0),
        total: Number(panel.getAttribute("data-health-total") ?? 0),
        items,
      }
    })

    if (!summary) {
      console.error(red("✗ 未找到健康检查面板"))
      process.exitCode = 1
      return
    }

    console.log("")
    for (const item of summary.items) {
      const tag = item.ok ? green("✓ OK  ") : item.optional ? yellow("- OPT ") : red("✗ FAIL")
      console.log(`  ${tag}  ${item.key}`)
    }
    console.log("")
    const line = `${summary.passed}/${summary.total} 组件挂载 · status=${summary.status}`
    if (summary.status === "healthy") {
      console.log(green(`✓ ${line}`))
    } else {
      console.log(red(`✗ ${line}`))
      process.exitCode = 1
    }
  } catch (err) {
    console.error(red(`✗ 健康检查失败: ${err instanceof Error ? err.message : err}`))
    process.exitCode = 1
  } finally {
    await browser.close()
  }
}

main()
