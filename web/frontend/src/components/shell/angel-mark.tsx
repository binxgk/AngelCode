import type { ImgHTMLAttributes } from "react"

import logoUrl from "@/assets/angelcode-logo.png"
import { cn } from "@/lib/utils"

/**
 * Angel Code 品牌标记：使用品牌 logo 图片（src/assets/angelcode-logo.png）。
 * 尺寸由调用处的 className / 父级样式决定，object-contain 保证不变形。
 */
export function AngelMark({
  className,
  alt = "",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src={logoUrl}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={cn("block object-contain", className)}
      {...props}
    />
  )
}
