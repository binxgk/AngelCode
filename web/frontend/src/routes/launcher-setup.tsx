import {
  IconDeviceDesktop,
  IconLanguage,
  IconMoon,
  IconSun,
} from "@tabler/icons-react"
import { createFileRoute } from "@tanstack/react-router"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { postLauncherDashboardSetup } from "@/api/launcher-auth"
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

function LauncherSetupPage() {
  const { t } = useTranslation()
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    if (password !== confirm) {
      setError(t("launcherSetup.errorMismatch"))
      return
    }
    setSubmitting(true)
    try {
      const result = await postLauncherDashboardSetup(password, confirm)
      if (result.ok) {
        globalThis.location.assign("/launcher-login")
        return
      }
      setError(result.error)
    } catch {
      setError(t("launcherSetup.errorNetwork"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell>
      <div className="border-line-2 bg-paper rounded-2xl border p-7 shadow-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="ac-glow mb-4 size-12 rounded-2xl">
            <AngelMark style={{ color: "#fff" }} />
          </div>
          <h1 className="m-0 text-[20px] font-medium tracking-tight">
            {t("launcherSetup.title")}
          </h1>
          <p className="text-ink-3 mt-1.5 text-[12.5px] leading-relaxed">
            {t("launcherSetup.description")}
          </p>
        </div>

        <form className="flex flex-col gap-3" onSubmit={onSubmit}>
          <label className="block" htmlFor="setup-password">
            <span className="text-ink-2 mb-1.5 block text-[12px] font-medium">
              {t("launcherSetup.passwordLabel")}
            </span>
            <input
              id="setup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("launcherSetup.passwordPlaceholder")}
              className="border-line-2 bg-paper-soft text-ink focus:border-clay focus:ring-clay/15 h-10 w-full rounded-lg border px-3 text-[13.5px] transition outline-none focus:ring-[3px]"
            />
          </label>
          <label className="block" htmlFor="setup-confirm">
            <span className="text-ink-2 mb-1.5 block text-[12px] font-medium">
              {t("launcherSetup.confirmLabel")}
            </span>
            <input
              id="setup-confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("launcherSetup.confirmPlaceholder")}
              className="border-line-2 bg-paper-soft text-ink focus:border-clay focus:ring-clay/15 h-10 w-full rounded-lg border px-3 text-[13.5px] transition outline-none focus:ring-[3px]"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="bg-clay hover:bg-clay-deep mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg text-[13.5px] font-medium text-white shadow-sm transition disabled:cursor-default disabled:opacity-60"
          >
            {submitting ? t("labels.loading") : t("launcherSetup.submit")}
          </button>
          {error ? (
            <p className="text-bad text-[12.5px]" role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </AuthShell>
  )
}

export const Route = createFileRoute("/launcher-setup")({
  component: LauncherSetupPage,
})
