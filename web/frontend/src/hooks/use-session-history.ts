import { useAtomValue } from "jotai"
import { useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"

import {
  type SessionsState,
  loadSessions,
  removeSession,
  sessionsAtom,
} from "@/store/sessions"

const LIMIT = 20

interface UseSessionHistoryOptions {
  activeSessionId: string
  onDeletedActiveSession: () => void
  /** 挂载时自动加载（默认 true） */
  autoLoad?: boolean
}

export interface UseSessionHistoryResult {
  sessions: SessionsState["sessions"]
  hasMore: boolean
  loading: boolean
  loadError: boolean
  loadErrorMessage: string
  observerRef: React.RefObject<HTMLDivElement | null>
  loadSessions: (reset?: boolean) => Promise<void>
  handleDeleteSession: (id: string) => Promise<void>
}

/**
 * 会话列表读取封装。
 *
 * 数据来自全局 sessionsAtom，因此侧栏与设置「历史」分区共享同一份
 * 结果，不会重复请求 /api/sessions。
 */
export function useSessionHistory({
  activeSessionId,
  onDeletedActiveSession,
  autoLoad = true,
}: UseSessionHistoryOptions): UseSessionHistoryResult {
  const { t } = useTranslation()
  const observerRef = useRef<HTMLDivElement>(null)
  const state = useAtomValue(sessionsAtom)

  useEffect(() => {
    if (!autoLoad) return
    if (state.loaded || state.loading) return
    void loadSessions(true)
  }, [autoLoad, state.loaded, state.loading])

  // 无限滚动：观察哨兵元素
  useEffect(() => {
    const node = observerRef.current
    if (!node || !state.hasMore || state.loading || state.error) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !state.loading) {
          void loadSessions(false)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [state.hasMore, state.loading, state.error])

  const handleDeleteSession = useCallback(
    async (id: string) => {
      try {
        const deletedLoadedSession = state.sessions.some(
          (session) => session.id === id,
        )
        await removeSession(id)
        if (deletedLoadedSession && id === activeSessionId) {
          onDeletedActiveSession()
        }
      } catch (err) {
        console.error("Failed to delete session:", err)
      }
    },
    [activeSessionId, onDeletedActiveSession, state.sessions],
  )

  return {
    sessions: state.sessions,
    hasMore: state.hasMore,
    loading: state.loading,
    loadError: state.error,
    loadErrorMessage: t("chat.historyLoadFailed"),
    observerRef,
    loadSessions,
    handleDeleteSession,
  }
}

export { LIMIT }
