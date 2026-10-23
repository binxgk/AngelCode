/**
 * 预览版 mock 层：拦截 /api/* 与 WebSocket，返回演示数据。
 * 仅在 preview 构建中使用，不进入正式产物。
 */

type Json = Record<string, unknown>

const NOW = Date.now()

const PROVIDER_OPTIONS = [
  {
    id: "openai",
    display_name: "OpenAI",
    icon_slug: "openai",
    domain: "openai.com",
    default_api_base: "https://api.openai.com/v1",
    empty_api_key_allowed: false,
    create_allowed: true,
    default_model_allowed: true,
    supports_fetch: true,
    priority: 100,
    common_models: ["gpt-4o", "gpt-4o-mini"],
    aliases: [],
  },
  {
    id: "anthropic",
    display_name: "Anthropic",
    icon_slug: "anthropic",
    domain: "anthropic.com",
    default_api_base: "https://api.anthropic.com",
    empty_api_key_allowed: false,
    create_allowed: true,
    default_model_allowed: true,
    supports_fetch: true,
    priority: 90,
    common_models: ["claude-sonnet-4"],
    aliases: [],
  },
  {
    id: "deepseek",
    display_name: "DeepSeek",
    icon_slug: "deepseek",
    domain: "deepseek.com",
    default_api_base: "https://api.deepseek.com",
    empty_api_key_allowed: false,
    create_allowed: true,
    default_model_allowed: true,
    supports_fetch: true,
    priority: 80,
    common_models: ["deepseek-chat", "deepseek-reasoner"],
    aliases: [],
  },
  {
    id: "ollama",
    display_name: "Ollama",
    icon_slug: "ollama",
    domain: "ollama.com",
    default_api_base: "http://127.0.0.1:11434",
    empty_api_key_allowed: true,
    create_allowed: true,
    default_model_allowed: true,
    supports_fetch: true,
    local: true,
    priority: 10,
    common_models: ["qwen2.5", "llama3.2"],
    aliases: [],
  },
]

const MODELS = [
  {
    index: 0,
    model_name: "gpt-4o-mini",
    provider: "openai",
    model: "gpt-4o-mini",
    api_base: "https://api.openai.com/v1",
    api_key: "sk-****-1",
    enabled: true,
    available: true,
    status: "available",
    is_default: true,
    is_virtual: false,
    default_model_allowed: true,
  },
  {
    index: 1,
    model_name: "claude-sonnet",
    provider: "anthropic",
    model: "claude-sonnet-4",
    api_key: "****",
    enabled: true,
    available: true,
    status: "available",
    is_default: false,
    is_virtual: false,
    default_model_allowed: true,
  },
  {
    index: 2,
    model_name: "deepseek-chat",
    provider: "deepseek",
    model: "deepseek-chat",
    api_key: "****",
    enabled: true,
    available: true,
    status: "available",
    is_default: false,
    is_virtual: false,
    default_model_allowed: true,
  },
  {
    index: 3,
    model_name: "local-qwen",
    provider: "ollama",
    model: "qwen2.5",
    api_base: "http://127.0.0.1:11434",
    api_key: "",
    auth_method: "local",
    enabled: false,
    available: false,
    status: "unreachable",
    is_default: false,
    is_virtual: false,
    default_model_allowed: true,
  },
]

const CHANNELS = [
  { name: "weixin", config_key: "weixin" },
  { name: "telegram", config_key: "telegram" },
  { name: "discord", config_key: "discord" },
  { name: "slack", config_key: "slack" },
  { name: "feishu", config_key: "feishu" },
  { name: "dingtalk", config_key: "dingtalk" },
  { name: "wecom", config_key: "wecom" },
  { name: "pico", config_key: "pico" },
  { name: "matrix", config_key: "matrix" },
  { name: "irc", config_key: "irc" },
  { name: "mqtt", config_key: "mqtt" },
]

const CHANNEL_CONFIGS: Record<string, Json> = {
  telegram: {
    enabled: true,
    base_url: "https://api.telegram.org",
    proxy: "",
    use_markdown_v2: true,
    media_group_delay_ms: 0,
  },
  discord: {
    enabled: false,
    proxy: "",
    use_markdown: true,
  },
  feishu: {
    enabled: false,
    app_id: "",
    proxy: "",
  },
  pico: {
    enabled: true,
    host: "0.0.0.0",
    port: 18790,
  },
  mqtt: {
    enabled: false,
    broker: "mqtt://broker.example.com:1883",
    agent_id: "my-agent",
    topic_prefix: "/picoclaw",
    username: "",
  },
}

const SESSIONS = [
  {
    id: "demo-session-1",
    title: "把本周支出整理成表格",
    preview: "可以，我先读取一下你的记录文件……",
    message_count: 6,
    created: new Date(NOW - 3600_000).toISOString(),
    updated: new Date(NOW - 600_000).toISOString(),
  },
  {
    id: "demo-session-2",
    title: "飞书频道为什么没消息",
    preview: "检查后发现 app_secret 未配置……",
    message_count: 4,
    created: new Date(NOW - 86400_000).toISOString(),
    updated: new Date(NOW - 82800_000).toISOString(),
  },
  {
    id: "demo-session-3",
    title: "帮我写一个 Go 的小工具",
    preview: "这个工具可以按目录统计代码行数……",
    message_count: 8,
    created: new Date(NOW - 3 * 86400_000).toISOString(),
    updated: new Date(NOW - 2.5 * 86400_000).toISOString(),
  },
]

const DEMO_HISTORY: Record<string, unknown[]> = {
  "demo-session-1": [
    { role: "user", content: "把本周支出整理成表格", created_at: new Date(NOW - 3600_000).toISOString() },
    {
      role: "assistant",
      content: "我先读取一下你的记录文件。",
      kind: "normal",
      model_name: "gpt-4o-mini",
      created_at: new Date(NOW - 3500_000).toISOString(),
    },
    {
      role: "assistant",
      content: '读取文件 `~/notes/expenses.md` 并解析成表格。',
      kind: "tool_calls",
      model_name: "gpt-4o-mini",
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: { name: "read_file", arguments: '{"path":"~/notes/expenses.md"}' },
        },
      ],
      created_at: new Date(NOW - 3400_000).toISOString(),
    },
    {
      role: "assistant",
      content:
        "整理好了：\n\n| 日期 | 项目 | 金额 |\n| --- | --- | --- |\n| 10-20 | 午餐 | ¥38 |\n| 10-20 | 地铁 | ¥6 |\n| 10-21 | 咖啡 | ¥22 |\n| 10-21 | 晚餐 | ¥64 |\n\n合计 **¥130**。",
      kind: "normal",
      model_name: "gpt-4o-mini",
      created_at: new Date(NOW - 3300_000).toISOString(),
    },
  ],
  "demo-session-2": [
    { role: "user", content: "飞书频道为什么没消息", created_at: new Date(NOW - 86400_000).toISOString() },
    {
      role: "assistant",
      content:
        "检查后发现 `app_secret` 未配置，飞书回调无法完成验签，所以消息不会进入会话。\n\n在「设置 → 频道 → 飞书」里补上 App Secret 并保存，然后点左下角「热加载」即可。",
      kind: "normal",
      model_name: "gpt-4o-mini",
      created_at: new Date(NOW - 86300_000).toISOString(),
    },
  ],
  "demo-session-3": [
    { role: "user", content: "帮我写一个 Go 的小工具", created_at: new Date(NOW - 3 * 86400_000).toISOString() },
    {
      role: "assistant",
      content:
        "可以。这个工具会按目录统计代码行数：\n\n```go\npackage main\n\nimport (\n\t\"fmt\"\n\t\"os\"\n\t\"path/filepath\"\n)\n\nfunc main() {\n\troot := os.Args[1]\n\ttotal := 0\n\tfilepath.Walk(root, func(path string, info os.FileInfo, err error) error {\n\t\tif err == nil && !info.IsDir() {\n\t\t\ttotal++\n\t\t}\n\t\treturn nil\n\t})\n\tfmt.Println(\"files:\", total)\n}\n```\n\n需要我加上按扩展名分类统计吗？",
      kind: "normal",
      model_name: "gpt-4o-mini",
      created_at: new Date(NOW - 2.9 * 86400_000).toISOString(),
    },
  ],
}

const CONFIG: Json = {
  version: 2,
  agents: {
    defaults: {
      workspace: "~/.picoclaw/workspace",
      model: "gpt-4o-mini",
      max_tokens: 8192,
      temperature: 0.7,
    },
  },
  gateway: { host: "localhost", port: 18790, hot_reload: false, log_level: "info" },
  tools: { exec: { enabled: true, timeout: 60 } },
  channel_list: {
    pico: { enabled: true, type: "pico", settings: { token: "demo-token" } },
    telegram: { enabled: true, type: "telegram", settings: { base_url: "https://api.telegram.org" } },
    discord: { enabled: false, type: "discord", settings: {} },
  },
}

const LOGS = [
  "2026-10-22 09:12:01 INF gateway listening on 127.0.0.1:18790",
  "2026-10-22 09:12:01 INF loaded 4 models, 3 channels",
  "2026-10-22 09:12:02 INF channel pico connected",
  "2026-10-22 09:12:02 INF channel telegram connected",
  "2026-10-22 09:14:37 WRN channel discord skipped: token missing",
  "2026-10-22 09:15:10 INF agent turn finished in 1.2s",
  "2026-10-22 09:15:10 INF hot reload finished in 218ms",
]

const SKILLS = [
  { name: "web-search", path: "/skills/web-search", source: "builtin", description: "网页检索与摘要", origin_kind: "builtin" },
  { name: "file-tools", path: "/skills/file-tools", source: "builtin", description: "本地文件读写与搜索", origin_kind: "builtin" },
  { name: "sheet", path: "/skills/sheet", source: "workspace", description: "表格生成与处理", origin_kind: "manual" },
]

const TOOLS = [
  { name: "exec", description: "在本地执行 Shell 命令", category: "system", config_key: "exec", status: "enabled" },
  { name: "read_file", description: "读取本地文件内容", category: "files", config_key: "read_file", status: "enabled" },
  { name: "write_file", description: "写入本地文件", category: "files", config_key: "write_file", status: "enabled" },
  { name: "web_search", description: "联网搜索", category: "web", config_key: "web_search", status: "enabled" },
  { name: "browser", description: "打开网页并读取内容", category: "web", config_key: "browser", status: "disabled", reason_code: "not_configured" },
  { name: "spawn", description: "启动后台子代理", category: "agents", config_key: "spawn", status: "disabled" },
]

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function route(path: string): Response {
  const url = new URL(path, "http://mock.local")
  const p = url.pathname

  if (p === "/api/auth/status") return json({ authenticated: true, initialized: true })
  if (p === "/api/auth/login" || p === "/api/auth/logout" || p === "/api/auth/setup")
    return json({ status: "ok" })

  if (p === "/api/gateway/status")
    return json({
      gateway_status: "running",
      gateway_start_allowed: true,
      gateway_restart_required: false,
      pid: 4242,
      boot_default_model: "gpt-4o-mini",
      config_default_model: "gpt-4o-mini",
    })

  if (p === "/api/gateway/logs")
    return json({ logs: LOGS, log_total: LOGS.length, log_run_id: 1 })

  if (p === "/api/gateway/start" || p === "/api/gateway/stop" || p === "/api/gateway/restart")
    return json({ status: "ok", pid: 4242, log_total: LOGS.length, log_run_id: 1 })

  if (p === "/api/gateway/logs/clear") return json({ status: "ok", log_total: 0, log_run_id: 2 })

  if (p === "/api/models")
    return json({
      models: MODELS,
      total: MODELS.length,
      default_model: "gpt-4o-mini",
      default_provider: "openai",
      fallback_chain: ["claude-sonnet"],
      provider_options: PROVIDER_OPTIONS,
    })

  if (p === "/api/models/default-chain")
    return json({ default_model: "gpt-4o-mini", fallback_chain: ["claude-sonnet"] })

  if (p === "/api/models/catalog") return json({ entries: [], total: 0 })
  if (p.startsWith("/api/models/")) return json({ status: "ok" })

  if (p === "/api/oauth/providers")
    return json({
      providers: [
        {
          provider: "openai",
          display_name: "OpenAI",
          methods: ["browser", "device_code", "token"],
          logged_in: false,
          status: "not_logged_in",
        },
        {
          provider: "anthropic",
          display_name: "Anthropic",
          methods: ["token"],
          logged_in: true,
          status: "connected",
          auth_method: "token",
          account_id: "demo@example.com",
        },
        {
          provider: "google-antigravity",
          display_name: "Google Antigravity",
          methods: ["browser"],
          logged_in: false,
          status: "not_logged_in",
        },
      ],
    })

  if (p.startsWith("/api/oauth/")) return json({ status: "ok" })

  if (p === "/api/channels/catalog") return json({ channels: CHANNELS })

  if (p.startsWith("/api/channels/") && p.endsWith("/config")) {
    const name = decodeURIComponent(p.split("/")[3] ?? "")
    return json({
      config: CHANNEL_CONFIGS[name] ?? { enabled: false },
      configured_secrets: name === "telegram" ? ["token"] : [],
      config_key: name,
    })
  }

  if (p === "/api/sessions") return json(SESSIONS)
  if (p.startsWith("/api/sessions/")) {
    const id = decodeURIComponent(p.split("/")[3] ?? "")
    const messages = DEMO_HISTORY[id] ?? []
    return json({
      id,
      messages,
      summary: "",
      created: new Date(NOW - 86400_000).toISOString(),
      updated: new Date(NOW - 600_000).toISOString(),
    })
  }

  if (p === "/api/config") return json(CONFIG)
  if (p === "/api/config/reset") return json({ status: "ok" })

  if (p === "/api/skills") return json({ skills: SKILLS })
  if (p === "/api/skills/search") return json({ results: [], limit: 20, offset: 0, has_more: false })
  if (p.startsWith("/api/skills/")) return json({ status: "ok" })

  if (p === "/api/tools") return json({ tools: TOOLS })
  if (p === "/api/tools/web-search-config")
    return json({
      provider: "duckduckgo",
      current_service: "duckduckgo",
      prefer_native: false,
      providers: [],
      settings: {},
    })
  if (p.startsWith("/api/tools/")) return json({ status: "ok" })

  if (p === "/api/system/version")
    return json({ version: "preview", git_commit: "demo", go_version: "go1.25" })

  if (p === "/api/system/launcher-config")
    return json({
      port: 18800,
      public: false,
      allowed_cidrs: [],
      allow_localhost_bypass: true,
      trusted_proxy_cidrs: [],
    })

  if (p === "/api/system/autostart")
    return json({ enabled: false, supported: true, platform: "preview" })

  if (p === "/api/pico/info")
    return json({ ws_url: "/pico/ws", enabled: true, configured: true })

  if (p === "/api/pico/token" || p === "/api/pico/setup")
    return json({ ws_url: "/pico/ws", enabled: true, configured: true, changed: false })

  return json({ status: "ok" })
}

/** 安装 fetch mock */
export function installFetchMock() {
  const realFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const raw =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url

    if (raw.startsWith("/api/") || raw.includes("/api/")) {
      return route(raw)
    }

    return realFetch(input, init)
  }
}

/** 模拟 WebSocket：收到 message.send 后分三段流式回放 */
class MockSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3

  readyState = MockSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  private timers: number[] = []
  private sessionId = ""

  constructor(url: string) {
    try {
      const parsed = new URL(url, "http://mock.local")
      this.sessionId = parsed.searchParams.get("session_id") ?? ""
    } catch {
      this.sessionId = ""
    }

    window.setTimeout(() => {
      this.readyState = MockSocket.OPEN
      this.onopen?.(new Event("open"))
    }, 120)
  }

  private emit(type: string, payload: Record<string, unknown>) {
    this.onmessage?.(
      new MessageEvent("message", {
        data: JSON.stringify({
          type,
          payload,
          ...(this.sessionId ? { session_id: this.sessionId } : {}),
        }),
      }),
    )
  }

  private later(fn: () => void, delay: number) {
    this.timers.push(window.setTimeout(fn, delay))
  }

  send(raw: string) {
    let message: { type?: string; payload?: { content?: string } }
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }
    if (message.type !== "message.send") return

    const text = (message.payload?.content ?? "").trim()

    this.later(() => this.emit("typing.start", {}), 120)
    this.later(
      () =>
        this.emit("message.create", {
          message_id: "m-thought",
          content: `用户想要：${text || "（空消息）"}。我先判断是否需要调用工具，再组织回答。`,
          kind: "thought",
          model_name: "gpt-4o-mini",
        }),
      500,
    )
    this.later(
      () =>
        this.emit("message.create", {
          message_id: "m-tool",
          content: "",
          kind: "tool_calls",
          model_name: "gpt-4o-mini",
          tool_calls: [
            {
              id: "call_demo",
              type: "function",
              function: {
                name: "read_file",
                arguments: '{\n  "path": "~/notes/today.md"\n}',
              },
              extra_content: {
                tool_feedback_explanation: "先读取今天的记录，确认上下文后再回答。",
              },
            },
          ],
        }),
      1100,
    )
    this.later(
      () =>
        this.emit("message.create", {
          message_id: "m-answer",
          content: [
            `收到你的消息：**${text || "（空消息）"}**`,
            "",
            "这是预览版的模拟回复，用于检查界面渲染效果：",
            "",
            "- 流式消息与打字指示器",
            "- 思考过程与工具调用折叠",
            "- Markdown 表格与代码块",
            "",
            "| 项目 | 状态 |",
            "| --- | --- |",
            "| 网关 | 运行中 |",
            "| 模型 | gpt-4o-mini |",
            "| 频道 | 2 个已连接 |",
            "",
            "```go",
            'fmt.Println("hello, angel code")',
            "```",
            "",
            "真实环境下这里会输出模型的实际回复。",
          ].join("\n"),
          kind: "normal",
          model_name: "gpt-4o-mini",
          context_usage: {
            used_tokens: 1240,
            total_tokens: 16384,
            history_tokens: 300,
            compress_at_tokens: 12000,
            used_percent: 7.6,
          },
        }),
      1700,
    )
    this.later(() => this.emit("typing.stop", {}), 1800)
  }

  close() {
    this.readyState = MockSocket.CLOSED
    for (const timer of this.timers) window.clearTimeout(timer)
    this.timers = []
    this.onclose?.(new CloseEvent("close"))
  }
}

export function installSocketMock() {
  // @ts-expect-error 预览环境替换为模拟实现
  globalThis.WebSocket = MockSocket
}

export function installPreviewMocks() {
  // 标记预览环境，供组件跳过外部 CDN 请求
  ;(globalThis as Record<string, unknown>).__ANGEL_PREVIEW__ = true
  installFetchMock()
  installSocketMock()
}
