import { IconLayoutGrid, IconLayoutList, IconSearch } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { getOriginLabel } from "./origin-utils"
import type { SkillLayoutMode, SkillSortOption } from "./types"

interface FilterBarProps {
  searchQuery: string
  sourceFilter: string
  availableOrigins: string[]
  sortOrder: SkillSortOption
  layoutMode: SkillLayoutMode
  onSearchQueryChange: (value: string) => void
  onSourceFilterChange: (value: string) => void
  onSortOrderChange: (value: SkillSortOption) => void
  onLayoutModeChange: (value: SkillLayoutMode) => void
}

export function FilterBar({
  searchQuery,
  sourceFilter,
  availableOrigins,
  sortOrder,
  layoutMode,
  onSearchQueryChange,
  onSourceFilterChange,
  onSortOrderChange,
  onLayoutModeChange,
}: FilterBarProps) {
  const { t } = useTranslation()

  return (
    <div className="border-border/40 bg-muted/20 flex flex-wrap items-center gap-3 rounded-xl border p-2 shadow-sm">
      <div className="relative min-w-[200px] flex-1">
        <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={t("pages.agent.skills.search_placeholder")}
          className="hover:bg-background/50 focus-visible:bg-background h-9 border-transparent bg-transparent pl-9 shadow-none focus-visible:ring-1"
        />
      </div>

      <div className="bg-border/60 hidden h-6 w-px sm:block" />

      <Select value={sourceFilter} onValueChange={onSourceFilterChange}>
        <SelectTrigger
          type="button"
          className="border-border/60 bg-background/60 hover:bg-background focus:bg-background h-9 w-auto min-w-[136px] cursor-pointer shadow-xs hover:ring-1 focus:ring-1"
        >
          <SelectValue placeholder={t("pages.agent.skills.source_label")} />
        </SelectTrigger>
        <SelectContent position="popper" align="end" sideOffset={6} className="z-[100]">
          <SelectItem value="all">
            {t("pages.agent.skills.origin.all")}
          </SelectItem>
          {availableOrigins.map((origin) => (
            <SelectItem key={origin} value={origin}>
              {getOriginLabel(origin, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="bg-border/60 hidden h-6 w-px sm:block" />

      <Select
        value={sortOrder}
        onValueChange={(value) => onSortOrderChange(value as SkillSortOption)}
      >
        <SelectTrigger
          type="button"
          className="border-border/60 bg-background/60 hover:bg-background focus:bg-background h-9 w-auto min-w-[196px] cursor-pointer shadow-xs hover:ring-1 focus:ring-1"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="text-muted-foreground shrink-0 text-xs">
              {t("pages.agent.skills.sort_label", {
                defaultValue: "Sort by",
              })}
              :
            </span>
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent position="popper" align="end" sideOffset={6} className="z-[100]">
          <SelectItem value="name-asc">
            {t("pages.agent.skills.sort.name_asc")}
          </SelectItem>
          <SelectItem value="name-desc">
            {t("pages.agent.skills.sort.name_desc")}
          </SelectItem>
          <SelectItem value="source">
            {t("pages.agent.skills.sort.source")}
          </SelectItem>
        </SelectContent>
      </Select>

      <div className="bg-border/60 hidden h-6 w-px sm:block" />

      <div className="bg-background/50 ring-border/20 inline-flex h-9 items-center gap-0.5 rounded-lg p-0.5 shadow-sm ring-1">
        <button
          type="button"
          aria-label={t("pages.agent.skills.layout_grouped", {
            defaultValue: "分组视图",
          })}
          className={cn(
            "inline-flex h-8 items-center justify-center rounded-md px-2.5 text-xs font-medium transition-all",
            layoutMode === "grouped"
              ? "bg-background text-foreground ring-border/30 shadow-sm ring-1"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onLayoutModeChange("grouped")}
        >
          <IconLayoutList className="size-4" />
        </button>
        <button
          type="button"
          aria-label={t("pages.agent.skills.layout_grid", {
            defaultValue: "网格视图",
          })}
          className={cn(
            "inline-flex h-8 items-center justify-center rounded-md px-2.5 text-xs font-medium transition-all",
            layoutMode === "grid"
              ? "bg-background text-foreground ring-border/30 shadow-sm ring-1"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => onLayoutModeChange("grid")}
        >
          <IconLayoutGrid className="size-4" />
        </button>
      </div>
    </div>
  )
}
