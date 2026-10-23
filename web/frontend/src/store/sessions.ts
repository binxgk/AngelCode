import { atom, getDefaultStore } from "jotai"

import { type SessionSummary, deleteSession, getSessions } from "@/api/sessions"

const PAGE_LIMIT = 20
const store = getDefaultStore()

export interface SessionsState {
  sessions: SessionSummary[]
  /** 已加载到的偏移量 */
  offset: number
  hasMore: boolean
  loading: boolean
  error: boolean
  /** 至少成功加载过一次 */
  loaded: boolean
}

const DEFAULT_STATE: SessionsState = {
  sessions: [],
  offset: 0,
  hasMore: true,
  loading: false,
  error: false,
  loaded: false,
}

/**
 * 会话列表共享状态。
 *
 * 侧栏与设置里的「历史」分区都需要这份数据。之前各自调用
 * useSessionHistory，导致同一时刻重复请求 /api/sessions。
 * 现在收敛到一个 atom，任何一处加载的结果都直接复用。
 */
export const sessionsAtom = atom<SessionsState>(DEFAULT_STATE)

export function getSessionsState(): SessionsState {
  return store.get(sessionsAtom)
}

function patchSessions(
  patch: Partial<SessionsState> | ((prev: SessionsState) => SessionsState),
) {
  store.set(sessionsAtom, (prev) => {
    const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch }
    return next
  })
}

// 同一时刻只允许一个在途请求，后续调用复用它的结果
let inflight: Promise<void> | null = null

/**
 * 加载会话列表。
 * @param reset true 表示从第一页重新加载；false 表示追加下一页。
 */
export async function loadSessions(reset = true): Promise<void> {
  if (inflight) {
    await inflight
    // 已有请求完成，若需要刷新则重新发起
    if (!reset) return
  }

  const run = async () => {
    const prev = getSessionsState()
    const offset = reset ? 0 : prev.offset

    patchSessions({
      loading: true,
      ...(reset ? { error: false, hasMore: true } : {}),
    })

    try {
      const data = await getSessions(offset, PAGE_LIMIT)

      patchSessions((current) => {
        if (reset) {
          return {
            ...current,
            sessions: data,
            offset: data.length,
            hasMore: data.length >= PAGE_LIMIT,
            loading: false,
            error: false,
            loaded: true,
          }
        }

        const existing = new Set(current.sessions.map((item) => item.id))
        const appended = data.filter((item) => !existing.has(item.id))
        return {
          ...current,
          sessions: [...current.sessions, ...appended],
          offset: offset + data.length,
          hasMore: data.length >= PAGE_LIMIT,
          loading: false,
          error: false,
          loaded: true,
        }
      })
    } catch (err) {
      console.error("Failed to fetch session history:", err)
      patchSessions((current) => ({
        ...current,
        loading: false,
        error: true,
        // 追加失败时停止继续翻页，避免无限重试
        hasMore: reset ? current.hasMore : false,
        loaded: true,
      }))
    }
  }

  inflight = run().finally(() => {
    inflight = null
  })
  await inflight
}

/** 删除会话并从共享列表中移除。 */
export async function removeSession(id: string): Promise<void> {
  await deleteSession(id)
  patchSessions((prev) => {
    const nextSessions = prev.sessions.filter((item) => item.id !== id)
    return {
      ...prev,
      sessions: nextSessions,
      offset: Math.max(prev.offset - (prev.sessions.length - nextSessions.length), 0),
    }
  })
}

/** 清空共享状态（退出登录或切换服务时使用）。 */
export function resetSessionsStore() {
  inflight = null
  patchSessions(DEFAULT_STATE)
}
