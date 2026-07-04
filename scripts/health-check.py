#!/usr/bin/env python3
"""根路径渲染健康检查（Python + Playwright）。

访问 /?health=1，读取 <HealthCheck> 面板中的 data-health-* 结果，
输出每个关键组件的挂载状态。全部通过 → exit 0，否则 exit 1。

用法：
    python3 scripts/health-check.py
    BASE_URL=http://localhost:8080 python3 scripts/health-check.py
"""
from __future__ import annotations
import asyncio
import os
import sys

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
TARGET = f"{BASE_URL}/?health=1"
TIMEOUT_MS = int(os.environ.get("HEALTH_TIMEOUT", "45000"))


def color(code: int, text: str) -> str:
    return f"\x1b[{code}m{text}\x1b[0m"


async def main() -> int:
    print(color(90, f"→ GET {TARGET}"))
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 900})
        page = await context.new_page()
        try:
            await page.goto(TARGET, wait_until="domcontentloaded", timeout=TIMEOUT_MS)
            await page.wait_for_selector("[data-health-panel]", timeout=TIMEOUT_MS)
            try:
                await page.wait_for_selector(
                    '[data-health-panel][data-health-status="healthy"]', timeout=6000
                )
            except Exception:
                pass

            summary = await page.evaluate(
                """() => {
                    const panel = document.querySelector('[data-health-panel]');
                    if (!panel) return null;
                    const items = Array.from(panel.querySelectorAll('[data-health-key]')).map(el => ({
                        key: el.getAttribute('data-health-key'),
                        ok: el.getAttribute('data-health-ok') === 'true',
                        optional: el.getAttribute('data-health-optional') === 'true',
                    }));
                    return {
                        status: panel.getAttribute('data-health-status'),
                        items,
                    };
                }"""
            )
            if not summary:
                print(color(31, "✗ 未找到健康检查面板"))
                return 1

            required = [i for i in summary["items"] if not i["optional"]]
            optional = [i for i in summary["items"] if i["optional"]]
            req_pass = sum(1 for i in required if i["ok"])
            opt_pass = sum(1 for i in optional if i["ok"])

            print()
            for item in summary["items"]:
                if item["ok"]:
                    tag = color(32, "✓ OK  ")
                elif item["optional"]:
                    tag = color(90, "· skip")
                else:
                    tag = color(31, "✗ FAIL")
                print(f"  {tag}  {item['key']}")
            print()
            line = (
                f"必需 {req_pass}/{len(required)} · 可选 {opt_pass}/{len(optional)} · "
                f"status={summary['status']}"
            )
            if summary["status"] == "healthy":
                print(color(32, f"✓ {line}"))
                return 0
            print(color(31, f"✗ {line}"))
            return 1
        finally:
            await browser.close()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
