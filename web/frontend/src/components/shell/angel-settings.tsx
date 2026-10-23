import {
  IconArrowUpRight,
  IconBox,
  IconCircleDot,
  IconHistory,
  IconKey,
  IconLoader2,
  IconRefresh,
  IconServer,
  IconSettings2,
  IconSparkles,
  IconUsers,
  IconX,
} from "@tabler/icons-react"
import { useAtom } from "jotai"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { getChannelsCatalog } from "@/api/channels"
import { getSystemVersionInfo } from "@/api/system"
import { HubPage } from "@/components/agent/hub/hub-page"
import { SkillsPage } from "@/components/agent/skills/skills-page"
import { ToolsPage } from "@/components/agent/tools/tools-page"
import { ChannelConfigPage } from "@/components/channels/channel-config-page"
import { getChannelDisplayName } from "@/components/channels/channel-display-name"
import { ConfigPage } from "@/components/config/config-page"
import { RawConfigPage } from "@/components/config/raw-config-page"
import { CredentialsPage } from "@/components/credentials/credentials-page"
import { LogLevelSelect } from "@/components/logs/log-level-select"
import { LogsPanel } from "@/components/logs/logs-panel"
import { ModelsPage } from "@/components/models/models-page"
import { AngelMark } from "@/components/shell/angel-mark"
import { EmbeddedProvider } from "@/components/shell/embed-context"
import { useGateway } from "@/hooks/use-gateway"
import { useGatewayLogs } from "@/hooks/use-gateway-logs"
import { useLogWrapColumns } from "@/hooks/use-log-wrap-columns"
import { usePicoChat } from "@/hooks/use-pico-chat"
import { useSessionHistory } from "@/hooks/use-session-history"
import { THEME_LABELS, type ThemeMode, useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"
import {
  type SettingsSection,
  settingsOpenAtom,
  settingsSectionAtom,
} from "@/store/settings"

const NAV: Array<{
  id: SettingsSection
  label: string
  desc: string
  icon: React.ReactNode
}> = [
  {
    id: "models",
    label: "模型",
    desc: "选择对话默认使用的模型，管理模型与备用链。",
    icon: <IconBox />,
  },
  {
    id: "credentials",
    label: "凭据",
    desc: "OAuth 登录与各家模型的密钥，仅保存在本机。",
    icon: <IconKey />,
  },
  {
    id: "channels",
    label: "频道",
    desc: "把对话接到飞书、微信、Discord、Telegram 等平台。",
    icon: <IconCircleDot />,
  },
  {
    id: "agents",
    label: "智能体",
    desc: "技能、工具与市场，决定 Angel Code 能做什么。",
    icon: <IconSparkles />,
  },
  {
    id: "service",
    label: "服务",
    desc: "本地网关的运行状态、配置与日志。",
    icon: <IconServer />,
  },
  {
    id: "history",
    label: "历史",
    desc: "所有本地会话，点一条即可接着聊。",
    icon: <IconHistory />,
  },
  {
    id: "config",
    label: "配置",
    desc: "完整的系统配置项与原始 JSON。",
    icon: <IconSettings2 />,
  },
  {
    id: "general",
    label: "通用",
    desc: "外观主题与账户。",
    icon: <IconUsers />,
  },
]

function ServiceSection() {
  const {
    state: gatewayState,
    loading,
    canStart,
    startReason,
    restartRequired,
    start,
    stop,
    restart,
  } = useGateway()
  const { clearLogs, clearing, logs } = useGatewayLogs()
  const { contentRef, measureRef, wrapColumns } = useLogWrapColumns()
  const isRunning = gatewayState === "running"

  return (
    <div className="ac-scroll-y ac-pad flex flex-col gap-1">
      <div className="ac-grp">
        <div className="ac-grp-h">
          运行状态
          <span className="hint">
            <span className={cn("ac-tag", isRunning ? "ok" : "stop")}>
              <i />
              {isRunning
                ? "运行中"
                : gatewayState === "starting"
                  ? "启动中"
                  : gatewayState === "restarting"
                    ? "重启中"
                    : gatewayState === "stopping"
                      ? "停止中"
                      : gatewayState === "error"
                        ? "异常"
                        : "已停止"}
            </span>
          </span>
        </div>
        <div className="ac-row">
          <div className="k">
            <b>本地网关</b>
            <span>
              {window.location.host}
              {restartRequired ? " · 配置已变更，需重启生效" : ""}
              {!canStart && startReason ? ` · ${startReason}` : ""}
            </span>
          </div>
          <div className="ctl">
            {isRunning ? (
              <>
                <button
                  type="button"
                  className="ac-mini-btn clay"
                  disabled={loading}
                  title="重启网关以重新加载配置"
                  onClick={() => void restart()}
                >
                  {loading ? (
                    <IconLoader2 className="animate-spin" />
                  ) : (
                    <IconRefresh />
                  )}
                  热加载
                </button>
                <button
                  type="button"
                  className="ac-mini-btn danger"
                  disabled={loading}
                  onClick={() => void stop()}
                >
                  停止
                </button>
              </>
            ) : (
              <button
                type="button"
                className="ac-mini-btn"
                disabled={loading || !canStart}
                onClick={() => void start()}
              >
                启动
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="ac-grp">
        <div className="ac-grp-h">
          日志
          <span className="hint" style={{ display: "flex", gap: 6 }}>
            <LogLevelSelect />
            <button
              type="button"
              className="ac-mini-btn"
              style={{ flex: "0 0 auto", height: 26 }}
              disabled={clearing || logs.length === 0}
              onClick={() => void clearLogs()}
            >
              清空
            </button>
          </span>
        </div>
        <div className="mt-2 flex h-[380px] flex-col">
          <LogsPanel
            logs={logs}
            wrapColumns={wrapColumns}
            contentRef={contentRef}
            measureRef={measureRef}
          />
        </div>
      </div>
    </div>
  )
}

function AgentsSection() {
  const [tab, setTab] = useState<"skills" | "tools" | "hub">("skills")

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="ac-tabs">
        {(
          [
            ["skills", "技能"],
            ["tools", "工具"],
            ["hub", "市场"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={cn(tab === key && "on")}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col pt-2">
        {tab === "skills" ? (
          <SkillsPage />
        ) : tab === "tools" ? (
          <ToolsPage />
        ) : (
          <HubPage />
        )}
      </div>
    </div>
  )
}

function ChannelsSection() {
  const { t } = useTranslation()
  const [channels, setChannels] = useState<
    Array<{ name: string; config_key: string; variant?: string }>
  >([])
  const [active, setActive] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    void getChannelsCatalog()
      .then((catalog) => {
        if (!alive) return
        setChannels(catalog.channels)
        setActive((prev) => prev ?? catalog.channels[0]?.name ?? null)
      })
      .catch(() => {
        if (alive) setChannels([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <IconLoader2 className="text-ink-3 size-5 animate-spin" />
      </div>
    )
  }

  if (channels.length === 0) {
    return <p className="ac-grp-desc py-8">没有可用的频道。</p>
  }

  const current = channels.find((item) => item.name === active) ?? channels[0]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="ac-grp" style={{ borderBottom: 0, paddingTop: 4 }}>
        <div className="ac-grp-h">
          已接入频道
          <span className="hint">{channels.length} 个</span>
        </div>
        <div className="ac-embed-toolbar">
          {channels.map((channel) => (
            <button
              key={channel.name}
              type="button"
              className={cn(
                "ac-mini-btn",
                channel.name === current.name && "clay",
              )}
              style={{ flex: "0 0 auto", height: 28, padding: "0 10px" }}
              onClick={() => setActive(channel.name)}
            >
              {getChannelDisplayName(channel, t)}
            </button>
          ))}
        </div>
      </div>

      <div className="ac-embed-body">
        <ChannelConfigPage channelName={current.name} />
      </div>
    </div>
  )
}

function HistorySection({ onOpen }: { onOpen: (id: string) => void }) {
  const { activeSessionId } = usePicoChat()
  const { sessions, loadSessions, hasMore, handleDeleteSession } =
    useSessionHistory({
      activeSessionId,
      onDeletedActiveSession: () => undefined,
    })
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter(
      (session) =>
        session.title.toLowerCase().includes(q) ||
        session.preview.toLowerCase().includes(q),
    )
  }, [query, sessions])

  return (
    <div className="ac-scroll-y ac-pad flex flex-col">
      <div className="ac-grp">
        <div className="ac-grp-h">
          会话
          <span className="hint">
            {filtered.length}
            {query ? ` / ${sessions.length}` : ""} 个
          </span>
        </div>
        <input
          className="border-line-2 bg-paper text-ink focus:border-clay mb-2 w-full rounded-md border px-2.5 py-1.5 text-[12.5px] outline-none"
          placeholder="搜索标题或内容"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {filtered.length === 0 ? (
          <p className="ac-grp-desc py-3">没有匹配的会话。</p>
        ) : (
          filtered.map((session) => (
            <div
              key={session.id}
              className="ac-row act"
              role="button"
              tabIndex={0}
              onClick={() => onOpen(session.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onOpen(session.id)
                }
              }}
            >
              <div className="k">
                <b>{session.title || "未命名会话"}</b>
                <span>
                  {session.message_count} 条消息 · {session.updated}
                </span>
              </div>
              <div className="ctl">
                <button
                  type="button"
                  className="ac-mini-btn danger"
                  style={{ flex: "0 0 auto", height: 24, padding: "0 8px" }}
                  onClick={(event) => {
                    event.stopPropagation()
                    void handleDeleteSession(session.id)
                  }}
                >
                  删除
                </button>
                <IconArrowUpRight className="chev" />
              </div>
            </div>
          ))
        )}
        {hasMore && filtered.length > 0 && (
          <div className="ac-embed-toolbar">
            <span className="ac-grow" />
            <button
              type="button"
              className="ac-mini-btn"
              style={{ flex: "0 0 auto", height: 26 }}
              onClick={() => void loadSessions(false)}
            >
              加载更多
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function GeneralSection() {
  const { themeMode, systemDark, setThemeMode } = useTheme()
  const version = useSystemVersionInfoSafe()
  const CH = (
    <IconArrowUpRight
      className="chev"
      style={{ transform: "none" }}
      aria-hidden
    />
  )

  return (
    <div className="ac-scroll-y ac-pad flex flex-col">
      <div className="ac-grp">
        <div className="ac-grp-h">外观</div>
        <p className="ac-grp-desc">
          浅色是暖纸底，深色是墨黑底，两者共用同一套陶土橙点缀。
        </p>
        <div className="ac-row">
          <div className="k">
            <b>主题</b>
            <span>
              当前：{THEME_LABELS[themeMode]}
              {themeMode === "auto"
                ? `（系统为${systemDark ? "深色" : "浅色"}）`
                : ""}
            </span>
          </div>
          <div className="ctl">
            <div className="ac-seg">
              {(["auto", "light", "dark"] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={cn(themeMode === mode && "on")}
                  onClick={() => setThemeMode(mode)}
                >
                  {THEME_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ac-grp">
        <div className="ac-grp-h">账户</div>
        <div className="ac-row">
          <div
            className="k"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <div className="ac-avatar">A</div>
            <div>
              <b>Angel Code</b>
              <span>本地部署</span>
            </div>
          </div>
          <div className="ctl">
            <span className="ac-tag ok">
              <i />
              已登录
            </span>
          </div>
        </div>
        <div
          className="ac-row act"
          role="button"
          tabIndex={0}
          onClick={() =>
            window.open("https://docs.picoclaw.io/", "_blank", "noreferrer")
          }
        >
          <div className="k">
            <b>使用文档</b>
            <span>配置项、频道接入与常见问题</span>
          </div>
          <div className="ctl">{CH}</div>
        </div>
        <div
          className="ac-row act quit"
          role="button"
          tabIndex={0}
          onClick={async () => {
            await fetch("/api/auth/logout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: "{}",
            })
            window.location.assign("/launcher-login")
          }}
        >
          <div className="k">
            <b>退出登录</b>
            <span>清除本机会话，不影响已保存的配置</span>
          </div>
          <div className="ctl">{CH}</div>
        </div>
      </div>

      <div className="ac-grp">
        <div className="ac-grp-h">关于</div>
        <div className="ac-row">
          <div className="k">
            <b>Angel Code</b>
            <span>本地部署 · 网关 {window.location.host}</span>
          </div>
          <div className="ctl">
            <span className="mono text-ink-3 text-[11.5px]">
              {version ? `v${version}` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function useSystemVersionInfoSafe(): string {
  const [version, setVersion] = useState("")
  useEffect(() => {
    void getSystemVersionInfo()
      .then((info) => setVersion(info.version || ""))
      .catch(() => setVersion(""))
  }, [])
  return version
}

function ConfigSection() {
  const [raw, setRaw] = useState(false)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="ac-embed-toolbar">
        <span className="ac-grow" />
        <button
          type="button"
          className={cn("ac-mini-btn", !raw && "clay")}
          style={{ flex: "0 0 auto", height: 26 }}
          onClick={() => setRaw(false)}
        >
          可视化
        </button>
        <button
          type="button"
          className={cn("ac-mini-btn", raw && "clay")}
          style={{ flex: "0 0 auto", height: 26 }}
          onClick={() => setRaw(true)}
        >
          原始 JSON
        </button>
      </div>
      <div className="ac-embed-body">
        {raw ? <RawConfigPage /> : <ConfigPage />}
      </div>
    </div>
  )
}

const SECTION_RENDERERS: Record<
  SettingsSection,
  (props: { onOpenSession: (id: string) => void }) => React.ReactNode
> = {
  models: () => <ModelsPage />,
  credentials: () => <CredentialsPage />,
  channels: () => <ChannelsSection />,
  agents: () => <AgentsSection />,
  service: () => <ServiceSection />,
  history: ({ onOpenSession }) => <HistorySection onOpen={onOpenSession} />,
  config: () => <ConfigSection />,
  general: () => <GeneralSection />,
}

export function AngelSettings({
  onOpenSession,
}: {
  onOpenSession: (id: string) => void
}) {
  const [open, setOpen] = useAtom(settingsOpenAtom)
  const [section, setSection] = useAtom(settingsSectionAtom)
  const version = useSystemVersionInfoSafe()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, setOpen])

  const current = NAV.find((item) => item.id === section) ?? NAV[0]
  const content = SECTION_RENDERERS[current.id]({ onOpenSession })

  return (
    <>
      <div
        className={cn("ac-scrim", open && "show")}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <aside
        className={cn("ac-settings", open && "open")}
        aria-label="设置"
        aria-hidden={!open}
      >
        <div className="ac-set-head">
          <AngelMark className="text-clay size-5" />
          <h2>设置</h2>
          {version && <span className="ver">v{version}</span>}
          <button
            type="button"
            className="ac-icon-btn"
            aria-label="关闭设置"
            onClick={() => setOpen(false)}
          >
            <IconX />
          </button>
        </div>

        <div className="ac-set-body">
          <nav className="ac-set-nav" aria-label="设置分区">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(item.id === current.id && "on")}
                onClick={() => setSection(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          <div className="ac-set-main">
            <div className="ac-set-main-head">
              <h3>{current.label}</h3>
              <p>{current.desc}</p>
            </div>
            <div className="ac-set-content">
              <EmbeddedProvider>{content}</EmbeddedProvider>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
