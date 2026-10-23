import {
  IconDeviceDesktop,
  IconDots,
  IconLayoutSidebar,
  IconLoader2,
  IconMessagePlus,
  IconMoon,
  IconRefresh,
  IconSettings,
  IconSquare,
  IconSun,
  IconTrash,
} from "@tabler/icons-react"
import { useAtom } from "jotai"
import { useEffect, useMemo, useRef } from "react"

import type { SessionSummary } from "@/api/sessions"
import { AngelMark } from "@/components/shell/angel-mark"
import { useGateway } from "@/hooks/use-gateway"
import { usePicoChat } from "@/hooks/use-pico-chat"
import { useSessionHistory } from "@/hooks/use-session-history"
import { THEME_LABELS, useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"
import {
  type SettingsSection,
  settingsOpenAtom,
  settingsSectionAtom,
} from "@/store/settings"

interface AngelSidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCollapse: () => void
  onNewChat: () => void
  onOpenSession: (id: string) => void
}

type SessionGroupKey = "今天" | "昨天" | "更早"

const DAY_MS = 24 * 60 * 60 * 1000

function groupSessions(
  sessions: SessionSummary[],
): Record<SessionGroupKey, SessionSummary[]> {
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const groups: Record<SessionGroupKey, SessionSummary[]> = {
    今天: [],
    昨天: [],
    更早: [],
  }

  for (const session of sessions) {
    const parsed = Date.parse(session.updated)
    if (Number.isNaN(parsed)) {
      groups.更早.push(session)
      continue
    }
    if (parsed >= startOfToday) {
      groups.今天.push(session)
    } else if (parsed >= startOfToday - DAY_MS) {
      groups.昨天.push(session)
    } else {
      groups.更早.push(session)
    }
  }

  return groups
}

function formatSessionTime(raw: string): string {
  const parsed = Date.parse(raw)
  if (Number.isNaN(parsed)) return ""
  const date = new Date(parsed)
  const now = new Date()
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`

  if (date.toDateString() === now.toDateString()) {
    return `今天 ${time}`
  }

  const yesterday = new Date(now.getTime() - DAY_MS)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${time}`
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`
}

export function AngelSidebar({
  collapsed,
  mobileOpen,
  onCollapse,
  onNewChat,
  onOpenSession,
}: AngelSidebarProps) {
  const { themeMode, systemDark, cycleThemeMode } = useTheme()
  const {
    state: gatewayState,
    loading: gatewayLoading,
    start,
    stop,
    restart,
  } = useGateway()
  const { activeSessionId, isTyping, messages } = usePicoChat()
  const [, setSettingsOpen] = useAtom(settingsOpenAtom)
  const [settingsSection, setSettingsSection] = useAtom(settingsSectionAtom)

  const {
    sessions,
    loadSessions,
    hasMore,
    loading: sessionsLoading,
    loadError,
    handleDeleteSession,
  } = useSessionHistory({
    activeSessionId,
    onDeletedActiveSession: onNewChat,
  })

  // 网关重启后刷新会话列表
  const prevGatewayRef = useRef(gatewayState)
  useEffect(() => {
    const prev = prevGatewayRef.current
    prevGatewayRef.current = gatewayState
    if (prev !== "running" && gatewayState === "running") {
      void loadSessions(true)
    }
  }, [gatewayState, loadSessions])

  // 一轮回复结束后刷新会话列表（首条消息会新建会话）
  const prevTypingRef = useRef(isTyping)
  const prevMessageCountRef = useRef(messages.length)
  useEffect(() => {
    const wasTyping = prevTypingRef.current
    const prevCount = prevMessageCountRef.current
    prevTypingRef.current = isTyping
    prevMessageCountRef.current = messages.length

    if (wasTyping && !isTyping) {
      // 后端写入会话文件后再拉取，避免列表为空
      const timer = window.setTimeout(() => void loadSessions(true), 600)
      return () => window.clearTimeout(timer)
    }
    if (messages.length === 0 && prevCount > 0) {
      void loadSessions(true)
    }
  }, [isTyping, messages.length, loadSessions])

  const grouped = useMemo(() => groupSessions(sessions), [sessions])
  const isRunning = gatewayState === "running"
  const isBusy =
    gatewayState === "starting" ||
    gatewayState === "restarting" ||
    gatewayState === "stopping"

  const openSettings = (section: SettingsSection) => {
    setSettingsSection(section)
    setSettingsOpen(true)
  }

  const themeLabel = `主题：${THEME_LABELS[themeMode]}${
    themeMode === "auto" ? `（系统为${systemDark ? "深色" : "浅色"}）` : ""
  }`

  return (
    <aside
      className={cn("ac-side", collapsed && "collapsed", mobileOpen && "open")}
      aria-label="会话与设置"
    >
      <div className="ac-side-top">
        <div className="ac-brand">
          <AngelMark className="ac-brand-mark" />
          <span className="ac-brand-name">
            Angel <em>Code</em>
          </span>
          <button
            type="button"
            className="ac-brand-collapse"
            title="收起侧栏"
            aria-label="收起侧栏"
            onClick={onCollapse}
          >
            <IconLayoutSidebar />
          </button>
        </div>

        <button type="button" className="ac-new-btn" onClick={onNewChat}>
          <IconMessagePlus />
          新建对话
          <kbd>⌘K</kbd>
        </button>
      </div>

      <div className="ac-side-scroll">
        {loadError ? (
          <div className="text-ink-3 px-2 py-6 text-[11.5px] leading-relaxed">
            <p className="m-0">会话列表加载失败。</p>
            <button
              type="button"
              className="ac-mini-btn mt-2 w-full"
              disabled={sessionsLoading}
              onClick={() => void loadSessions(true)}
            >
              {sessionsLoading ? "重试中…" : "重试"}
            </button>
          </div>
        ) : sessions.length === 0 && !sessionsLoading ? (
          <div className="text-ink-3 px-2 py-6 text-[11.5px] leading-relaxed">
            还没有会话。发送第一条消息即可开始。
          </div>
        ) : (
          (["今天", "昨天", "更早"] as SessionGroupKey[]).map((group) => {
            const items = grouped[group]
            if (items.length === 0) return null
            return (
              <div key={group}>
                <div className="ac-side-label">
                  {group}
                  <span className="grow" />
                </div>
                {items.map((session) => {
                  const active = session.id === activeSessionId
                  const waiting = active && isTyping
                  return (
                    <div
                      key={session.id}
                      className={cn("ac-sess", active && "active")}
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenSession(session.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          onOpenSession(session.id)
                        }
                      }}
                    >
                      <span className="ac-sess-t">
                        <b>
                          {session.title || session.preview || "未命名会话"}
                        </b>
                        <span>{formatSessionTime(session.updated)}</span>
                      </span>
                      <span
                        className={cn("ac-sess-dot", waiting && "wait")}
                        aria-hidden
                      />
                      <button
                        type="button"
                        className="ac-sess-del"
                        aria-label="删除会话"
                        title="删除会话"
                        onClick={(event) => {
                          event.stopPropagation()
                          void handleDeleteSession(session.id)
                        }}
                      >
                        <IconTrash />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })
        )}

        {hasMore && sessions.length > 0 && (
          <button
            type="button"
            className="ac-mini-btn mt-2 w-full"
            disabled={sessionsLoading}
            onClick={() => void loadSessions(false)}
          >
            {sessionsLoading ? (
              <IconLoader2 className="animate-spin" />
            ) : (
              <IconDots />
            )}
            加载更多
          </button>
        )}
      </div>

      <div className="ac-side-foot">
        <div className="ac-local-card">
          <div className="ac-local-line">
            <span
              className="live"
              style={
                isRunning
                  ? undefined
                  : {
                      background: "var(--red)",
                      boxShadow: "0 0 0 3px var(--red-soft)",
                    }
              }
            />
            <b>本地</b>
            <span style={{ color: "var(--ink-3)" }}>
              {gatewayState === "running"
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
            <span className="mono">{window.location.host}</span>
          </div>
          <div className="ac-local-acts">
            <button
              type="button"
              className="ac-mini-btn clay"
              title="重启网关并重新加载配置"
              disabled={gatewayLoading || isBusy || !isRunning}
              onClick={() => void restart()}
            >
              {isBusy ? (
                <IconLoader2 className="animate-spin" />
              ) : (
                <IconRefresh />
              )}
              热加载
            </button>
            {isRunning || isBusy ? (
              <button
                type="button"
                className="ac-mini-btn danger"
                title="停止本地服务"
                disabled={gatewayLoading || isBusy}
                onClick={() => void stop()}
              >
                <IconSquare />
                停止
              </button>
            ) : (
              <button
                type="button"
                className="ac-mini-btn"
                title="启动本地服务"
                disabled={gatewayLoading}
                onClick={() => void start()}
              >
                启动
              </button>
            )}
          </div>
        </div>

        <div className="ac-user-row">
          <div className="ac-user-btn">
            <div className="ac-avatar">A</div>
            <div className="who">
              <b>Angel Code</b>
              <span>本地部署</span>
            </div>
          </div>
          <button
            type="button"
            className="ac-icon-btn"
            data-mode={themeMode}
            title={themeLabel}
            aria-label={themeLabel}
            onClick={cycleThemeMode}
          >
            {themeMode === "auto" ? (
              <IconDeviceDesktop />
            ) : themeMode === "light" ? (
              <IconSun />
            ) : (
              <IconMoon />
            )}
          </button>
          <button
            type="button"
            className="ac-icon-btn"
            title="设置"
            aria-label="设置"
            onClick={() => openSettings(settingsSection)}
          >
            <IconSettings />
          </button>
        </div>
      </div>
    </aside>
  )
}
