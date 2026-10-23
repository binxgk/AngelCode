import { atom } from "jotai"

export type SettingsSection =
  | "models"
  | "credentials"
  | "channels"
  | "agents"
  | "service"
  | "history"
  | "config"
  | "general"

export type AgentsTab = "hub" | "skills" | "tools"

export const settingsOpenAtom = atom(false)
export const settingsSectionAtom = atom<SettingsSection>("models")
export const settingsChannelNameAtom = atom<string | null>(null)
export const settingsAgentsTabAtom = atom<AgentsTab>("skills")

export const openSettingsAtom = atom(
  null,
  (_get, set, section?: SettingsSection) => {
    if (section) {
      set(settingsSectionAtom, section)
    }
    set(settingsOpenAtom, true)
  },
)
