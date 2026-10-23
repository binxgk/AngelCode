import {
  IconDeviceDesktop,
  IconLanguage,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import { useTranslation } from "react-i18next"

import {
  getLauncherAuthStatus,
  postLauncherDashboardLogin,
} from "@/api/launcher-auth"
import { AngelMark } from "@/components/shell/angel-mark"
import { THEME_LABELS, type ThemeMode, useTheme } from "@/hooks/use-theme"
import { toggleAppLanguage } from "@/i18n"

function AuthShell({ children }: { children: React.ReactNode }) {
  const { themeMode, setThemeMode } = useTheme()

  return (
    <div className="bg-bone text-ink flex min-h-dvh flex-col">
      <header className="flex h-14 shrink-0 items-center justify-end gap-2 px-5">
        <div className="ac-seg">
          {(["auto", "light", "dark"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={themeMode === mode ? "on" : ""}
              onClick={() => setThemeMode(mode)}
              title={`主题：${THEME_LABELS[mode]}`}
            >
              {mode === "auto" ? (
                <IconDeviceDesktop className="size-3.5" />
              ) : mode === "light" ? (
                <IconSun className="size-3.5" />
              ) : (
                <IconMoon className="size-3.5" />
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="ac-icon-btn"
          title="切换语言"
          onClick={() => toggleAppLanguage()}
        >
          <IconLanguage />
        </button>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
    </div>
  )
}

function AuthCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="border-line-2 bg-paper rounded-2xl border p-7 shadow-md">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="ac-glow mb-4 size-12 rounded-2xl">
          <AngelMark style={{ color: "#fff" }} />
        </div>
        <h1 className="m-0 text-[20px] font-medium tracking-tight">{title}</h1>
        <p className="text-ink-3 mt-1.5 text-[12.5px] leading-relaxed">
          {description}
        </p>
      </div>
      {children}
    </div>
  )
}

function AuthField({
  id,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-ink-2 mb-1.5 block text-[12px] font-medium">
        {label}
      </span>
      <input
        id={id}
        className="border-line-2 bg-paper-soft text-ink focus:border-clay focus:ring-clay/15 h-10 w-full rounded-lg border px-3 text-[13.5px] transition outline-none focus:ring-[3px]"
        {...props}
      />
    </label>
  )
}

function AuthSubmit({
  pending,
  children,
}: {
  pending: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-clay hover:bg-clay-deep mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg text-[13.5px] font-medium text-white shadow-sm transition disabled:cursor-default disabled:opacity-60"
    >
      {children}
    </button>
  )
}

function LauncherLoginPage() {
  const { t } = useTranslation()
  const [password, setPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    void getLauncherAuthStatus()
      .then((s) => {
        if (!s.initialized) {
          globalThis.location.assign("/launcher-setup")
        }
      })
      .catch(() => {
        /* 网络异常时留在登录页 */
      })
  }, [])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      const result = await postLauncherDashboardLogin(password)
      if (result.ok) {
        globalThis.location.assign("/")
        return
      }
      if (result.status === 409) {
        globalThis.location.assign("/launcher-setup")
        return
      }
      if (result.status === 401) {
        setError(t("launcherLogin.errorInvalid"))
        return
      }
      setError(result.error)
    } catch {
      setError(t("launcherLogin.errorNetwork"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <AuthCard title="Angel Code" description={t("launcherLogin.description")}>
        <form className="flex flex-col" onSubmit={onSubmit}>
          <AuthField
            id="launcher-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            label={t("launcherLogin.passwordLabel")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("launcherLogin.passwordPlaceholder")}
          />
          <AuthSubmit pending={submitting}>
            {submitting ? t("labels.loading") : t("launcherLogin.submit")}
          </AuthSubmit>
          {error ? (
            <p className="text-bad mt-3 text-[12.5px]" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </AuthCard>
    </AuthShell>
  )
}

export const Route = createFileRoute("/launcher-login")({
  component: LauncherLoginPage,
})
