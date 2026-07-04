import { describe, expect, it } from "vitest"
import {
  buildJin10FlashUrl,
  fetchJin10Live,
  fetchJin10Fixture,
  normalizeJin10ApiItem,
  normalizeJin10FlashRow,
  type Jin10FlashRow,
} from "./jin10"

describe("JIN10 source adapter", () => {
  it("normalizes Jin10 flash rows into workflow source items", () => {
    const row: Jin10FlashRow = {
      id: "1",
      time: "2026-07-04T05:05:00+08:00",
      title: "重要数据提醒",
      content: "美国非农就业数据即将公布。",
      important: true,
      source: "金十数据",
      channels: ["macro"],
      tags: ["macro", "非农"],
      url: "https://www.jin10.com/",
    }

    expect(normalizeJin10FlashRow(row)).toMatchObject({
      id: "1",
      source: "jin10",
      occurredAt: "2026-07-04T05:05:00+08:00",
      title: "重要数据提醒",
      body: "美国非农就业数据即将公布。",
      important: true,
      tags: ["macro", "非农"],
    })
  })

  it("supports fixture-mode fetch with limit and importantOnly filters", () => {
    const items = fetchJin10Fixture({ limit: 1, importantOnly: true })

    expect(items).toHaveLength(1)
    expect(items[0].source).toBe("jin10")
    expect(items[0].important).toBe(true)
  })

  it("builds the public Jin10 flash API URL with optional filters", () => {
    const url = buildJin10FlashUrl({ channel: "-8200", hot: "2,3" })

    expect(url.hostname).toBe("flash-api.jin10.com")
    expect(url.pathname).toBe("/get_flash_list")
    expect(url.searchParams.get("channel")).toBe("-8200")
    expect(url.searchParams.get("hot")).toBe("2,3")
  })

  it("normalizes Jin10 live API items into source items", () => {
    const item = normalizeJin10ApiItem({
      id: "20260613041809603800",
      time: "2026-06-13 04:18:09",
      important: 1,
      channel: [1, 5],
      tags: [{ name: "美股" }, "IPO"],
      data: {
        title: "",
        source: "金十数据",
        content: "【SpaceX上市首日上涨19%】金十数据6月13日讯，SpaceX(SPCX.O)上涨。<br>成交活跃。",
      },
    })

    expect(item).toMatchObject({
      id: "20260613041809603800",
      source: "jin10",
      occurredAt: "2026-06-13 04:18:09",
      title: "SpaceX上市首日上涨19%",
      body: "金十数据6月13日讯，SpaceX(SPCX.O)上涨。 成交活跃。",
      important: true,
      tags: ["1", "5", "美股", "IPO"],
      url: "https://flash.jin10.com/detail/20260613041809603800",
    })
  })

  it("fetches live Jin10 data through an injected fetcher", async () => {
    const fetcher = async () =>
      new Response(
        JSON.stringify({
          status: 200,
          data: [
            {
              id: "1",
              time: "2026-07-04 06:00:00",
              important: 0,
              channel: [1],
              tags: [],
              data: { source: "金十数据", content: "普通快讯" },
            },
            {
              id: "2",
              time: "2026-07-04 06:01:00",
              important: 1,
              channel: [5],
              tags: ["宏观"],
              data: { source: "金十数据", content: "【重要快讯】内容" },
            },
          ],
        }),
      )

    const items = await fetchJin10Live({ limit: 1, importantOnly: true, fetcher })

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ id: "2", title: "重要快讯", important: true })
  })
})
