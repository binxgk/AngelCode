import { createContext, useContext } from "react"

export const EmbeddedContext = createContext(false)

export function useEmbedded(): boolean {
  return useContext(EmbeddedContext)
}
