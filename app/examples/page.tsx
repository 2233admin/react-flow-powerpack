import Link from "next/link"

const examples = [
  {
    slug: "interaction-props",
    title: "Interaction Props",
    desc: "在主编辑器右上角 Settings 面板中一键切换：nodesDraggable / panOnDrag / zoomOnScroll / selectionOnDrag / preventScrolling 等所有交互开关。",
    where: "主编辑器 · 右上角 ⚙︎",
  },
  {
    slug: "drag-and-drop",
    title: "Drag and Drop",
    desc: "从命令面板（⌘K / Tab）把节点拖入画布，或调用 store.addNodeFromPalette 编程添加。dataTransfer 使用 application/reactflow MIME。",
    where: "主编辑器 · 拖拽",
  },
  {
    slug: "save-restore",
    title: "Save & Restore",
    desc: "顶栏 💾 保存工作流到 localStorage，📂 恢复。⌘S 快捷键；导入 / 导出 JSON、PNG、SVG 一并提供。",
    where: "主编辑器 · 顶栏",
  },
  {
    slug: "prevent-cycles",
    title: "Prevent Cycles",
    desc: "开启 preventCycles 后，isValidConnection 用 BFS 检测新连线是否形成环，命中直接拒绝并 toast 提示。",
    where: "Settings · Validation",
  },
  {
    slug: "connection-limit",
    title: "Connection Limit",
    desc: "maxSourceConnections / maxTargetConnections 限制每个端口的出/入线条数。留空则不限制。",
    where: "Settings · Validation",
  },
  {
    slug: "computing",
    title: "Computing Flows",
    desc: "上下游节点通过 useHandleConnections + useNodesData 联动，实时计算数值 —— 加/减/乘/除。",
    where: "/examples/computing",
    link: "/examples/computing",
  },
  {
    slug: "contextual-zoom",
    title: "Contextual Zoom",
    desc: "节点根据 useStore(zoomSelector) 分级渲染：<0.5 只显示图标；0.5–1 精简；>1 全量信息。",
    where: "Settings · Interaction",
  },
  {
    slug: "collaborative",
    title: "Collaborative (Yjs)",
    desc: "Yjs + y-websocket 同步 nodes / edges / 光标。默认连 wss://demos.yjs.dev，可切换自建服务器与房间号。",
    where: "Settings · Collaboration",
  },
  {
    slug: "touch-device",
    title: "Touch Device",
    desc: "触摸模式：双指平移、单指选择、加大 handle 热区，适配手写板 / 移动端。",
    where: "Settings · touchMode",
  },
  {
    slug: "copy-paste",
    title: "Copy & Paste",
    desc: "⌘C / ⌘V / ⌘X / ⌘D 全键盘，复制会带上内部连线；粘贴锚定到当前鼠标位置。",
    where: "主编辑器 · 快捷键",
  },
  {
    slug: "undo-redo",
    title: "Undo & Redo",
    desc: "⌘Z / ⌘⇧Z / ⌘Y；100 步历史，每次移动 / 增删 / 连线自动 takeSnapshot。",
    where: "主编辑器 · 顶栏",
  },
  {
    slug: "validation-confirm",
    title: "Validation & Confirm Delete",
    desc: "typedHandles 校验端口类型；confirmDelete 打开后删除前弹 window.confirm。onBeforeDelete API。",
    where: "Settings · Validation",
  },
]

export default function ExamplesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          React Flow · Interaction
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">交互示例总览</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          官方文档 https://reactflow.dev/examples/interaction 上的 12 个交互示例，全部集成在主编辑器中，
          通过右上角 <span className="rounded-sm border border-border bg-card px-1 py-0.5 font-mono text-[10px]">⚙︎ Settings</span> 面板切换。
          Computing Flows 因为节点类型不同，单独在 <Link href="/examples/computing" className="underline">/examples/computing</Link> 展示。
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider hover:border-foreground/40"
          >
            ← 打开主编辑器
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {examples.map((e) => {
          const content = (
            <div className="h-full rounded-md border border-border bg-card p-4 transition-colors hover:border-foreground/40">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-medium">{e.title}</h2>
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {e.where}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{e.desc}</p>
            </div>
          )
          return e.link ? (
            <Link key={e.slug} href={e.link}>
              {content}
            </Link>
          ) : (
            <div key={e.slug}>{content}</div>
          )
        })}
      </div>
    </main>
  )
}
