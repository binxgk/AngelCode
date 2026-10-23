import dayjs from "dayjs"
import "dayjs/locale/bn"
import "dayjs/locale/cs"
import "dayjs/locale/en"
import "dayjs/locale/pt-br"
import "dayjs/locale/zh-cn"
import localizedFormat from "dayjs/plugin/localizedFormat"
import relativeTime from "dayjs/plugin/relativeTime"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import bnIn from "./locales/bn-in.json"
import cs from "./locales/cs.json"
import en from "./locales/en.json"
import ptBr from "./locales/pt-br.json"
import zh from "./locales/zh.json"

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

const SUPPORTED_LANGUAGES = ["zh", "en", "pt-BR", "bn-IN", "cs"] as const
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

/** 用户显式选择的语言才写这里；浏览器语言不再参与判断。 */
const LANGUAGE_STORAGE_KEY = "angelcode.lang"
/** 旧版 i18next-browser-languagedetector 的缓存键，读到就清掉，避免把界面锁成英文。 */
const LEGACY_DETECTOR_KEY = "i18nextLng"

function matchSupportedLanguage(value: string | null | undefined) {
  const raw = value?.trim()
  if (!raw) return undefined
  return SUPPORTED_LANGUAGES.find((lng) =>
    raw.toLowerCase().startsWith(lng.toLowerCase()),
  )
}

/**
 * 默认简体中文：界面外壳本身就是中文，再按浏览器语言给英文会出现
 * 「设置面板是中文、表单是英文」的混排。只有用户手动切换过语言才用用户的选择。
 */
function resolveInitialLanguage(): SupportedLanguage {
  try {
    const stored = matchSupportedLanguage(
      globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY),
    )
    if (stored) return stored
    globalThis.localStorage?.removeItem(LEGACY_DETECTOR_KEY)
  } catch {
    // 读不到 localStorage 就按默认中文
  }
  return "zh"
}

i18n
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources: {
      en: {
        translation: en,
      },
      "pt-BR": {
        translation: ptBr,
      },
      "bn-IN": {
        translation: bnIn,
      },
      zh: {
        translation: zh,
      },
      cs: {
        translation: cs,
      },
    },
    fallbackLng: "zh",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    lng: resolveInitialLanguage(),
    debug: false,

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
  })

/** 切换并记住语言（设置里的语言开关走这里）。 */
export function setAppLanguage(value: string) {
  const next = matchSupportedLanguage(value) ?? "zh"
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, next)
  } catch {
    // 写不进去也只影响下次启动的默认值
  }
  void i18n.changeLanguage(next)
}

export function getAppLanguage(): SupportedLanguage {
  const current =
    matchSupportedLanguage(i18n.resolvedLanguage ?? i18n.language) ?? "zh"
  return current
}

export function toggleAppLanguage() {
  setAppLanguage(getAppLanguage().startsWith("zh") ? "en" : "zh")
}

i18n.on("languageChanged", (lng) => {
  if (lng.startsWith("zh")) {
    dayjs.locale("zh-cn")
  } else if (lng.startsWith("pt")) {
    dayjs.locale("pt-br")
  } else if (lng.startsWith("bn")) {
    dayjs.locale("bn")
  } else if (lng.startsWith("cs")) {
    dayjs.locale("cs")
  } else {
    dayjs.locale("en")
  }
})

export default i18n
