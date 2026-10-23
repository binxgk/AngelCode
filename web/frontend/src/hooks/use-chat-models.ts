import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { type ModelInfo, getModels, setDefaultModel } from "@/api/models"
import { showSaveSuccessOrRestartToast } from "@/lib/restart-required"
import { refreshGatewayState } from "@/store/gateway"

interface UseChatModelsOptions {
  isConnected: boolean
}

function isLocalModel(model: ModelInfo): boolean {
  const isLocalHostBase = Boolean(
    model.api_base?.includes("localhost") ||
    model.api_base?.includes("127.0.0.1"),
  )

  return (
    model.auth_method === "local" || (!model.auth_method && isLocalHostBase)
  )
}

export function useChatModels({ isConnected }: UseChatModelsOptions) {
  const { t } = useTranslation()
  const [modelList, setModelList] = useState<ModelInfo[]>([])
  const [defaultModelName, setDefaultModelName] = useState("")
  const [settingDefault, setSettingDefault] = useState(false)
  const setDefaultRequestIdRef = useRef(0)
  const loadModelsRequestIdRef = useRef(0)
  const setDefaultQueueRef = useRef<Promise<void>>(Promise.resolve())

  const syncDefaultModelName = useCallback((defaultModel: string) => {
    setDefaultModelName(defaultModel.trim())
  }, [])

  const loadModels = useCallback(async () => {
    try {
      const requestId = ++loadModelsRequestIdRef.current
      await setDefaultQueueRef.current.catch(() => {})
      if (requestId !== loadModelsRequestIdRef.current) return
      const data = await getModels()
      if (requestId !== loadModelsRequestIdRef.current) return
      setModelList(data.models)
      syncDefaultModelName(data.default_model)
    } catch {
      // silently fail
    }
  }, [syncDefaultModelName])

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadModels()
    }, 0)

    return () => clearTimeout(timerId)
  }, [isConnected, loadModels])

  const handleSetDefault = useCallback(
    async (modelName: string) => {
      if (modelName === defaultModelName) return
      const requestId = ++setDefaultRequestIdRef.current
      const previousModelName = defaultModelName
      ++loadModelsRequestIdRef.current
      setSettingDefault(true)
      // 乐观更新：先让 chip 立刻显示新模型，避免“点了没反应”的错觉
      syncDefaultModelName(modelName)

      const request = setDefaultQueueRef.current
        .catch(() => {})
        .then(async () => {
          if (requestId !== setDefaultRequestIdRef.current) return
          await setDefaultModel(modelName)
          if (requestId !== setDefaultRequestIdRef.current) return
          const data = await getModels()
          if (requestId !== setDefaultRequestIdRef.current) return

          setModelList(data.models)
          // POST 已成功，默认模型就是刚选中的那个：直接用它，避免后端列表/回读
          // 滞后时把 chip 弹回旧值（用户会以为“点了没反应”）。
          syncDefaultModelName(modelName)
          const gateway = await refreshGatewayState({ force: true })
          if (requestId !== setDefaultRequestIdRef.current) return
          showSaveSuccessOrRestartToast(
            t,
            t("models.defaultChangeSuccess"),
            modelName,
            gateway?.restartRequired === true,
          )
        })
      setDefaultQueueRef.current = request
      try {
        await request
      } catch (err) {
        if (requestId !== setDefaultRequestIdRef.current) return
        // 失败回滚乐观更新
        syncDefaultModelName(previousModelName)
        void loadModels()
        console.error("Failed to set default model:", err)
        toast.error(err instanceof Error ? err.message : t("models.loadError"))
      } finally {
        if (requestId === setDefaultRequestIdRef.current) {
          setSettingDefault(false)
        }
      }
    },
    [defaultModelName, loadModels, syncDefaultModelName, t],
  )

  const defaultSelectableModels = useMemo(() => {
    const modelsByAlias = new Map<string, ModelInfo[]>()
    for (const model of modelList) {
      const entries = modelsByAlias.get(model.model_name) ?? []
      entries.push(model)
      modelsByAlias.set(model.model_name, entries)
    }
    return [...modelsByAlias.values()].flatMap((entries) =>
      entries.every(
        (model) =>
          model.default_model_allowed !== false &&
          model.is_virtual !== true &&
          model.status !== "unconfigured",
      )
        ? [entries.find((model) => model.available) ?? entries[0]]
        : [],
    )
  }, [modelList])

  const hasAvailableModels = useMemo(
    () => defaultSelectableModels.some((m) => m.available),
    [defaultSelectableModels],
  )

  const oauthModels = useMemo(
    () =>
      defaultSelectableModels.filter(
        (m) => m.available && m.auth_method === "oauth",
      ),
    [defaultSelectableModels],
  )

  const localModels = useMemo(
    () => defaultSelectableModels.filter((m) => m.available && isLocalModel(m)),
    [defaultSelectableModels],
  )

  const apiKeyModels = useMemo(
    () =>
      defaultSelectableModels.filter(
        (m) => m.available && m.auth_method !== "oauth" && !isLocalModel(m),
      ),
    [defaultSelectableModels],
  )

  const hasSelectableModels = defaultSelectableModels.length > 0

  return {
    defaultModelName,
    /** 已配置的模型（含暂时不可用的），用于绘制选择菜单 */
    selectableModels: defaultSelectableModels,
    /** 是否有可选模型（不再要求 available，避免整块菜单被隐藏） */
    hasSelectableModels,
    hasAvailableModels,
    apiKeyModels,
    oauthModels,
    localModels,
    settingDefault,
    handleSetDefault,
  }
}
