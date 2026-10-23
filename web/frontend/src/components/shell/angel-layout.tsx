import { IconLayoutSidebar } from "@tabler/icons-react"
import { useSetAtom } from "jotai"
import { useEffect, useState } from "react"
import { Toaster } from "sonner"

import { AngelChat } from "@/components/shell/angel-chat"
import { AngelSettings } from "@/components/shell/angel-settings"
import { AngelSidebar } from "@/components/shell/angel-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePicoChat } from "@/hooks/use-pico-chat"
import { cn } from "@/lib/utils"
import { settingsOpenAtom } from "@/store/settings"

const NARROW_QUERY = "(max-width: 980px)"

export function AngelLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [narrow, setNarrow] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches,
  )
  const { switchSession, newChat } = usePicoChat()
  const setSettingsOpen = useSetAtom(settingsOpenAtom)

  useEffect(() => {
    const media = window.matchMedia(NARROW_QUERY)
    const onChange = (event: MediaQueryListEvent) => {
      setNarrow(event.matches)
      if (!event.matches) setMobileOpen(false)
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [])

  const handleNewChat = () => {
    void newChat()
    setMobileOpen(false)
  }

  const handleOpenSession = (id: string) => {
    void switchSession(id)
    setMobileOpen(false)
    setSettingsOpen(false)
  }

  const handleCollapse = () => {
    if (narrow) {
      setMobileOpen(false)
    } else {
      setCollapsed(true)
    }
  }

  const showReopen = narrow ? !mobileOpen : collapsed

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        handleNewChat()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  })

  return (
    <TooltipProvider>
      <div className="ac-app">
        <AngelSidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCollapse={handleCollapse}
          onNewChat={handleNewChat}
          onOpenSession={handleOpenSession}
        />
        <div className="relative flex min-h-0 min-w-0 flex-col">
          <button
            type="button"
            className={cn("ac-side-reopen", showReopen && "show")}
            title="展开侧栏"
            aria-label="展开侧栏"
            onClick={() => {
              if (narrow) setMobileOpen(true)
              else setCollapsed(false)
            }}
          >
            <IconLayoutSidebar />
          </button>
          <AngelChat />
        </div>
      </div>

      <AngelSettings onOpenSession={handleOpenSession} />
      <Toaster position="bottom-center" />
    </TooltipProvider>
  )
}
