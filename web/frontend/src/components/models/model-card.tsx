import {
  IconArrowAutofitDown,
  IconCheck,
  IconEdit,
  IconStar,
  IconStarFilled,
  IconTrash,
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import type { ModelInfo } from "@/api/models"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface ModelCardProps {
  model: ModelInfo
  onEdit: (model: ModelInfo) => void
  onSetDefault: (model: ModelInfo) => void
  onToggleFallback: (model: ModelInfo) => void
  onDelete: (model: ModelInfo) => void
  inFallbackChain: boolean
  isDefault: boolean
  defaultChainAllowed: boolean
  fallbackDefaultConflict: boolean
  deleteDisabled: boolean
}

export function ModelCard({
  model,
  onEdit,
  onSetDefault,
  onToggleFallback,
  onDelete,
  inFallbackChain,
  isDefault,
  defaultChainAllowed,
  fallbackDefaultConflict,
  deleteDisabled,
}: ModelCardProps) {
  const { t } = useTranslation()
  const isOAuth = model.auth_method === "oauth"
  const status = model.status
  const statusLabel = t(`models.status.${status}`)
  const canSetDefault = model.available && !isDefault && defaultChainAllowed
  const canUseInFallback =
    model.available &&
    !isDefault &&
    !fallbackDefaultConflict &&
    defaultChainAllowed

  const setDefaultLabel = t("models.action.setDefault")
  const setDefaultDisabledReason = (() => {
    if (!model.available)
      return t("models.action.setDefaultDisabled.unavailable")
    if (isDefault) return t("models.action.setDefaultDisabled.isDefault")
    if (model.is_virtual) return t("models.action.setDefaultDisabled.isVirtual")
    if (!defaultChainAllowed) {
      return t("models.action.setDefaultDisabled.unsupportedProvider")
    }
    return setDefaultLabel
  })()

  const editLabel = t("models.action.edit")
  const toggleFallbackLabel = inFallbackChain
    ? t("models.action.removeFromFallback")
    : t("models.action.addToFallback")
  const toggleFallbackDisabledReason = (() => {
    if (!model.available)
      return t("models.action.setDefaultDisabled.unavailable")
    if (model.is_virtual) return t("models.action.setDefaultDisabled.isVirtual")
    if (!defaultChainAllowed) {
      return t("models.action.setDefaultDisabled.unsupportedProvider")
    }
    if (isDefault || fallbackDefaultConflict)
      return t("models.action.addToFallbackDisabled.isDefault")
    return toggleFallbackLabel
  })()
  const deleteLabel = t("models.action.delete")
  const deleteDisabledReason = deleteDisabled
    ? t("models.action.deleteDisabled.isDefault")
    : deleteLabel

  const secondary = isOAuth
    ? "OAuth"
    : model.api_key && status === "available"
      ? model.api_key
      : statusLabel

  return (
    <div className={cn("ac-model-row", !model.available && "is-muted")}>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          isDefault
            ? "bg-ok shadow-[0_0_0_3px_var(--green-soft)]"
            : status === "available"
              ? "bg-ok"
              : status === "unreachable"
                ? "bg-warn"
                : "bg-line-2",
        )}
        title={statusLabel}
        aria-label={statusLabel}
      />

      <div className="ac-model-main">
        <div className="ac-model-title">
          <span className="ac-model-name">{model.model_name}</span>
          {isDefault && (
            <span className="ac-tag ok">{t("models.badge.default")}</span>
          )}
          {model.is_virtual && (
            <span className="ac-tag">{t("models.badge.virtual")}</span>
          )}
          {inFallbackChain && (
            <span className="ac-tag wait">
              {t("models.defaultChain.fallbackChain")}
            </span>
          )}
        </div>
        <span className="ac-model-sub">
          {model.model}
          {" · "}
          {secondary}
        </span>
      </div>

      <div className="ac-model-actions">
        {isDefault ? (
          <span
            className="ac-icon-btn text-clay"
            title={t("models.badge.default")}
            aria-label={t("models.badge.default")}
          >
            <IconStarFilled className="size-3.5" />
          </span>
        ) : (
          <Tooltip delayDuration={canSetDefault ? 700 : 0}>
            <TooltipTrigger asChild>
              <span className={!canSetDefault ? "cursor-not-allowed" : ""}>
                <button
                  type="button"
                  className="ac-icon-btn"
                  onClick={() => onSetDefault(model)}
                  disabled={!canSetDefault}
                  aria-label={setDefaultLabel}
                >
                  <IconStar className="size-3.5" />
                </button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{setDefaultDisabledReason}</TooltipContent>
          </Tooltip>
        )}

        <button
          type="button"
          className="ac-icon-btn"
          onClick={() => onEdit(model)}
          aria-label={editLabel}
          title={editLabel}
        >
          <IconEdit className="size-3.5" />
        </button>

        <Tooltip delayDuration={canUseInFallback ? 700 : 0}>
          <TooltipTrigger asChild>
            <span className={!canUseInFallback ? "cursor-not-allowed" : ""}>
              <button
                type="button"
                className={cn(
                  "ac-icon-btn",
                  inFallbackChain && "text-clay-deep",
                )}
                onClick={() => onToggleFallback(model)}
                disabled={!canUseInFallback}
                aria-label={toggleFallbackLabel}
              >
                {inFallbackChain ? (
                  <IconCheck className="size-3.5" />
                ) : (
                  <IconArrowAutofitDown className="size-3.5" />
                )}
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{toggleFallbackDisabledReason}</TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={deleteDisabled ? 0 : 700}>
          <TooltipTrigger asChild>
            <span className={deleteDisabled ? "cursor-not-allowed" : ""}>
              <button
                type="button"
                className="ac-icon-btn"
                onClick={() => onDelete(model)}
                disabled={deleteDisabled}
                aria-label={deleteLabel}
                style={
                  deleteDisabled
                    ? undefined
                    : { color: "var(--ink-3)" }
                }
                onMouseEnter={(event) => {
                  if (!deleteDisabled) {
                    event.currentTarget.style.color = "var(--red)"
                    event.currentTarget.style.background = "var(--red-soft)"
                  }
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.color = "var(--ink-3)"
                  event.currentTarget.style.background = "transparent"
                }}
              >
                <IconTrash className="size-3.5" />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{deleteDisabledReason}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
