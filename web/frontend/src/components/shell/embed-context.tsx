import type { ReactNode } from "react"

import { EmbeddedContext } from "./embed-context-value"

export function EmbeddedProvider({
  children,
  value = true,
}: {
  children: ReactNode
  value?: boolean
}) {
  return (
    <EmbeddedContext.Provider value={value}>
      {children}
    </EmbeddedContext.Provider>
  )
}
