import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useEffect, useState } from "react"

import { getLauncherAuthStatus } from "@/api/launcher-auth"
import { AngelLayout } from "@/components/shell/angel-layout"
import { initializeChatStore } from "@/features/chat/controller"
import { isLauncherAuthPathname } from "@/lib/launcher-login-path"

const RootLayout = () => {
  const routerState = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      matches: s.matches,
    }),
  })

  const windowPath =
    typeof globalThis.location !== "undefined"
      ? globalThis.location.pathname || "/"
      : routerState.pathname

  const isAuthPage =
    isLauncherAuthPathname(windowPath) ||
    isLauncherAuthPathname(routerState.pathname) ||
    routerState.matches.some(
      (m) => m.routeId === "/launcher-login" || m.routeId === "/launcher-setup",
    )

  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthPage) return
    void getLauncherAuthStatus()
      .then((s) => {
        if (!s.initialized) {
          globalThis.location.assign("/launcher-setup")
        } else if (!s.authenticated) {
          globalThis.location.assign("/launcher-login")
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && /^status 40[13]$/.test(err.message)) {
          globalThis.location.assign("/launcher-login")
        } else {
          setAuthError(
            err instanceof Error
              ? err.message
              : "Auth service unavailable. Reset dashboard password storage and restart the application.",
          )
        }
      })
  }, [isAuthPage])

  useEffect(() => {
    if (isAuthPage) return
    initializeChatStore()
  }, [isAuthPage])

  if (isAuthPage) {
    return (
      <>
        <Outlet />
        {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
      </>
    )
  }

  return (
    <>
      {authError && (
        <div className="bg-red-soft text-bad fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-4 py-2 text-sm shadow-md">
          <span>认证服务异常：{authError}</span>
          <button
            className="ml-4 opacity-70 hover:opacity-100"
            onClick={() => setAuthError(null)}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      )}
      <AngelLayout />
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })
