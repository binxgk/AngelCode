import type { ReactNode } from "react"

import { useEmbedded } from "@/components/shell/embed-context-value"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  titleExtra?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * 页面头。独立路由下显示标题与操作；嵌入设置抽屉时只渲染操作区，
 * 避免与抽屉标题重复。
 */
export function PageHeader({
  title,
  titleExtra,
  children,
  className,
}: PageHeaderProps) {
  const embedded = useEmbedded()

  if (embedded) {
    if (!children && !titleExtra) {
      return null
    }
    return (
      <div className={cn("ac-embed-toolbar", className)}>
        {titleExtra}
        <span className="ac-grow" />
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-4 px-6 pt-2",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <h2 className="text-ink truncate text-xl font-medium tracking-tight">
          {title}
        </h2>
        {titleExtra}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
