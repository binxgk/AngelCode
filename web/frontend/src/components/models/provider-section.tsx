import { IconChevronDown } from "@tabler/icons-react"
import { useState } from "react"

import type { ModelInfo } from "@/api/models"
import { cn } from "@/lib/utils"

import { ModelCard } from "./model-card"
import { ProviderIcon } from "./provider-icon"
import type { ProviderCatalogEntry } from "./provider-registry"

interface ProviderSectionProps {
  provider: Pick<ProviderCatalogEntry, "key" | "label" | "iconSlug" | "domain">
  models: ModelInfo[]
  onEdit: (model: ModelInfo) => void
  onSetDefault: (model: ModelInfo) => void
  onToggleFallback: (model: ModelInfo) => void
  onDelete: (model: ModelInfo) => void
  fallbackChain: string[]
  defaultModelName: string
  defaultModelEntryCount: number
  defaultChainAllowedModelNames: Set<string>
  fallbackDefaultConflictModelNames: Set<string>
}

export function ProviderSection({
  provider,
  models,
  onEdit,
  onSetDefault,
  onToggleFallback,
  onDelete,
  fallbackChain,
  defaultModelName,
  defaultModelEntryCount,
  defaultChainAllowedModelNames,
  fallbackDefaultConflictModelNames,
}: ProviderSectionProps) {
  const [open, setOpen] = useState(true)

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ac-grp-toggle"
        aria-expanded={open}
      >
        <ProviderIcon provider={provider} />
        <span>{provider.label}</span>
        <span className="count">{models.length}</span>
        <IconChevronDown className={cn("chev", open && "rotate-180")} />
      </button>

      {open && (
        <div className="pb-1">
          {models.map((model) => (
            <ModelCard
              key={model.index}
              model={model}
              onEdit={onEdit}
              onSetDefault={onSetDefault}
              onToggleFallback={onToggleFallback}
              onDelete={onDelete}
              inFallbackChain={fallbackChain.includes(model.model_name)}
              isDefault={defaultModelName === model.model_name}
              deleteDisabled={
                defaultModelName === model.model_name &&
                defaultModelEntryCount <= 1
              }
              defaultChainAllowed={defaultChainAllowedModelNames.has(
                model.model_name,
              )}
              fallbackDefaultConflict={fallbackDefaultConflictModelNames.has(
                model.model_name,
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
