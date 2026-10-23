import { useCallback, useEffect, useState } from "react"

export type ThemeMode = "auto" | "light" | "dark"
export type EffectiveTheme = "light" | "dark"

const THEME_STORAGE_KEY = "angel-code:theme"
const LEGACY_THEME_STORAGE_KEY = "theme"

export const THEME_LABELS: Record<ThemeMode, string> = {
  auto: "跟随系统",
  light: "浅色",
  dark: "深色",
}

export const THEME_NEXT: Record<ThemeMode, ThemeMode> = {
  auto: "light",
  light: "dark",
  dark: "auto",
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "auto" || value === "light" || value === "dark"
}

function getStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "auto"
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemeMode(stored)) return stored

    // 迁移旧版二态主题
    const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    if (legacy === "light" || legacy === "dark") {
      localStorage.setItem(THEME_STORAGE_KEY, legacy)
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
      return legacy
    }
  } catch {
    /* 忽略存储异常 */
  }
  return "auto"
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function resolveEffectiveTheme(mode: ThemeMode): EffectiveTheme {
  if (mode === "auto") {
    return systemPrefersDark() ? "dark" : "light"
  }
  return mode
}

function applyThemeToDocument(theme: EffectiveTheme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.classList.toggle("dark", theme === "dark")
}

export function useTheme() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(getStoredThemeMode)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  const effectiveTheme: EffectiveTheme =
    themeMode === "auto" ? (systemDark ? "dark" : "light") : themeMode

  useEffect(() => {
    applyThemeToDocument(effectiveTheme)
  }, [effectiveTheme])

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches)
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
      localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
    } catch {
      /* 忽略存储异常 */
    }
  }, [])

  const cycleThemeMode = useCallback(() => {
    setThemeModeState((prev) => {
      const next = THEME_NEXT[prev]
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
        localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
      } catch {
        /* 忽略存储异常 */
      }
      return next
    })
  }, [])

  return {
    themeMode,
    theme: effectiveTheme,
    systemDark,
    setThemeMode,
    cycleThemeMode,
    /** 兼容旧调用：循环切换主题 */
    toggleTheme: cycleThemeMode,
  }
}

/** 在 React 挂载前尽早应用主题，避免闪烁 */
export function initializeTheme() {
  applyThemeToDocument(resolveEffectiveTheme(getStoredThemeMode()))
}
