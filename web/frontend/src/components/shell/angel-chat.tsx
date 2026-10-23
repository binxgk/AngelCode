import {
  IconArrowUp,
  IconBrain,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconPhotoPlus,
  IconSparkles,
  IconTool,
  IconX,
} from "@tabler/icons-react"
import { useAtom } from "jotai"
import {
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react"
import { useTranslation } from "react-i18next"
import ReactMarkdown from "react-markdown"
import TextareaAutosize from "react-textarea-autosize"
import rehypeHighlight from "rehype-highlight"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"

import type { ModelInfo } from "@/api/models"
import { MarkdownCodeBlock } from "@/components/chat/message-code-block"
import { AngelMark } from "@/components/shell/angel-mark"
import {
  CHAT_IMAGE_ACCEPT,
  buildChatImageAttachments,
  getTransferredFiles,
  hasFileTransfer,
} from "@/features/chat/image-input"
import { useChatModels } from "@/hooks/use-chat-models"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { useGateway } from "@/hooks/use-gateway"
import { usePicoChat } from "@/hooks/use-pico-chat"
import { cn } from "@/lib/utils"
import {
  type AssistantDetailVisibility,
  type ChatAttachment,
  type ChatMessage,
  type ChatToolCall,
  type ContextUsage,
  assistantDetailVisibilityAtom,
  shouldShowAssistantMessage,
} from "@/store/chat"
import { openSettingsAtom } from "@/store/settings"

const DETAIL_LABELS: Record<AssistantDetailVisibility, string> = {
  all: "均展示",
  thought: "仅思考",
  tool_calls: "仅工具",
  none: "隐藏",
}

const DETAIL_ORDER: AssistantDetailVisibility[] = [
  "all",
  "thought",
  "tool_calls",
  "none",
]

function formatTokens(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  return String(value)
}

function resolveDisabledReason({
  gatewayState,
  connectionState,
  hasDefaultModel,
}: {
  gatewayState: string
  connectionState: string
  hasDefaultModel: boolean
}): string | null {
  if (gatewayState === "unknown") return "正在检测本地服务…"
  if (gatewayState === "starting") return "服务正在启动，请稍候…"
  if (gatewayState === "restarting") return "服务正在重启，请稍候…"
  if (gatewayState === "stopping") return "服务正在停止，请稍候…"
  if (gatewayState === "stopped") return "本地服务未启动，请先在左下角启动。"
  if (gatewayState === "error") return "本地服务异常，请查看日志后重启。"
  if (connectionState === "connecting") return "正在连接对话服务…"
  if (connectionState === "disconnected") return "对话连接已断开，正在重连…"
  if (connectionState === "error") return "对话连接失败，正在重试…"
  if (!hasDefaultModel) return "尚未设置默认模型，请前往设置 → 模型。"
  return null
}

function ToolCallCard({ toolCall }: { toolCall: ChatToolCall }) {
  const [expanded, setExpanded] = useState(false)
  const name = toolCall.function?.name?.trim() || "工具调用"
  const args = toolCall.function?.arguments?.trim() || ""
  const explanation =
    toolCall.extraContent?.toolFeedbackExplanation?.trim() || ""
  const summary = args.replace(/\s+/g, " ").slice(0, 80)

  return (
    <div className="ac-tool">
      <div
        className="ac-tool-head"
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setExpanded((value) => !value)
          }
        }}
      >
        <IconTool />
        <b>{name}</b>
        {summary && <code>{summary}</code>}
        <span className={cn("badge", expanded ? "ok" : "")}>
          {expanded ? "收起" : "展开"}
        </span>
      </div>
      {expanded && (explanation || args) && (
        <pre className="ac-tool-body">
          {explanation ? `${explanation}\n\n` : ""}
          {args || "（无参数）"}
        </pre>
      )}
    </div>
  )
}

function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
      components={{ pre: MarkdownCodeBlock }}
    >
      {content}
    </ReactMarkdown>
  )
}

function BotMessage({ message }: { message: ChatMessage }) {
  const { copy, isCopied } = useCopyToClipboard()
  const isThought = message.kind === "thought"
  const isToolCalls = message.kind === "tool_calls"
  const [collapsed, setCollapsed] = useState(true)
  const hasText = message.content.trim().length > 0
  const toolCalls = message.toolCalls ?? []
  const images = (message.attachments ?? []).filter(
    (item) => item.type === "image",
  )
  const files = (message.attachments ?? []).filter(
    (item) => item.type !== "image",
  )
  const blockLabel = isThought ? "思考过程" : "工具调用"

  return (
    <div className="ac-tmsg bot">
      <div className="av">
        <AngelMark />
      </div>
      <div className="body">
        {(isThought || isToolCalls) && (
          <div className="ac-tool">
            <div
              className="ac-tool-head"
              role="button"
              tabIndex={0}
              onClick={() => setCollapsed((value) => !value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  setCollapsed((value) => !value)
                }
              }}
            >
              {isThought ? <IconBrain /> : <IconTool />}
              <b>{blockLabel}</b>
              {message.modelName && <code>{message.modelName}</code>}
              <span className={cn("badge", collapsed ? "" : "ok")}>
                <IconChevronDown
                  className={cn(
                    "inline-block size-3 transition-transform",
                    collapsed ? "" : "rotate-180",
                  )}
                />
              </span>
            </div>
            {!collapsed && hasText && (
              <div className="ac-tool-body whitespace-pre-wrap">
                {message.content}
              </div>
            )}
          </div>
        )}

        {isToolCalls &&
          toolCalls.map((toolCall, index) => (
            <ToolCallCard
              key={toolCall.id ?? `${toolCall.function?.name}-${index}`}
              toolCall={toolCall}
            />
          ))}

        {!isThought && !isToolCalls && hasText && (
          <div className="ac-md text-[13.5px] leading-[1.72]">
            <Markdown content={message.content} />
          </div>
        )}

        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((attachment, index) => (
              <a
                key={`${attachment.url}-${index}`}
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="border-line overflow-hidden rounded-xl border"
              >
                <img
                  src={attachment.url}
                  alt={attachment.filename || "图片"}
                  className="max-h-72 max-w-[280px] object-contain"
                />
              </a>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((attachment, index) => (
              <a
                key={`${attachment.url}-${index}`}
                href={attachment.url}
                download={attachment.filename}
                className="border-line bg-paper text-ink-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12px]"
              >
                {attachment.filename || "文件"}
              </a>
            ))}
          </div>
        )}

        {!isThought && !isToolCalls && hasText && (
          <div className="ac-tmeta">
            <button
              type="button"
              className="ac-chip"
              onClick={() => void copy(message.content)}
            >
              {isCopied ? <IconCheck /> : <IconCopy />}
              {isCopied ? "已复制" : "复制"}
            </button>
            <span className="ln" />
            {message.modelName && <span>{message.modelName}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function UserMessage({ message }: { message: ChatMessage }) {
  const images = (message.attachments ?? []).filter(
    (item) => item.type === "image",
  )
  return (
    <div className="ac-tmsg user">
      <div className="flex max-w-[76%] flex-col items-end gap-2">
        {images.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {images.map((attachment, index) => (
              <img
                key={`${attachment.url}-${index}`}
                src={attachment.url}
                alt={attachment.filename || "图片"}
                className="border-line max-h-64 rounded-xl border object-cover"
              />
            ))}
          </div>
        )}
        {message.content.trim() && (
          <div className="ac-u-bubble">{message.content}</div>
        )}
      </div>
    </div>
  )
}

const QUICK_PROMPTS = [
  {
    text: "查一下今天的天气",
    icon: <IconSparkles />,
  },
  {
    text: "把本周支出整理成表格",
    icon: <IconSparkles />,
  },
  {
    text: "看看本地服务当前的状态",
    icon: <IconSparkles />,
  },
  {
    text: "帮我写一个 Go 的小工具",
    icon: <IconSparkles />,
  },
]

function ContextChip({ usage }: { usage?: ContextUsage }) {
  const [, setOpenSettings] = useAtom(openSettingsAtom)
  if (!usage) return null
  return (
    <span
      className="ac-chip static"
      title="当前上下文占用"
      onClick={() => setOpenSettings("service")}
    >
      已用 {formatTokens(usage.used_tokens)} /{" "}
      {formatTokens(usage.total_tokens)}
    </span>
  )
}

export function AngelChat() {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragDepthRef = useRef(0)
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [detail, setDetail] = useAtom(assistantDetailVisibilityAtom)
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [detailMenuOpen, setDetailMenuOpen] = useState(false)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [, setOpenSettings] = useAtom(openSettingsAtom)
  const modelMenuRef = useRef<HTMLDivElement>(null)
  const detailMenuRef = useRef<HTMLDivElement>(null)

  // 用 document 级监听关闭菜单。此前用全屏遮罩（z-40）盖住了 dock（z-20），
  // 导致模型与思考菜单一点就关、无法选择。
  useEffect(() => {
    if (!modelMenuOpen && !detailMenuOpen) return
    const closeMenus = () => {
      setModelMenuOpen(false)
      setDetailMenuOpen(false)
    }
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (modelMenuRef.current?.contains(target)) return
      if (detailMenuRef.current?.contains(target)) return
      closeMenus()
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeMenus()
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [modelMenuOpen, detailMenuOpen])

  const { messages, connectionState, isTyping, contextUsage, sendMessage } =
    usePicoChat()
  const { state: gatewayState } = useGateway()
  const isGatewayRunning = gatewayState === "running"

  const {
    defaultModelName,
    selectableModels,
    hasSelectableModels,
    settingDefault,
    handleSetDefault,
  } = useChatModels({ isConnected: isGatewayRunning })

  const allModels: ModelInfo[] = selectableModels

  const disabledReason = resolveDisabledReason({
    gatewayState,
    connectionState,
    hasDefaultModel: Boolean(defaultModelName),
  })
  const canInput = disabledReason === null

  const syncScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setIsAtBottom(el.scrollHeight - el.scrollTop <= el.clientHeight + 12)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isAtBottom) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages, isTyping, isAtBottom])

  const appendImageFiles = async (files: readonly File[]) => {
    if (!canInput || files.length === 0) return
    const next = await buildChatImageAttachments(files, t)
    if (next.length === 0) return
    setAttachments((prev) => [...prev, ...next])
  }

  const handleSend = () => {
    const text = input.trim()
    if ((!text && attachments.length === 0) || !canInput) return
    if (sendMessage({ content: text, attachments })) {
      setInput("")
      setAttachments([])
      setIsAtBottom(true)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const native = event.nativeEvent as Event & {
      isComposing?: boolean
      keyCode?: number
    }
    if (native.isComposing || native.keyCode === 229) return
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleImageSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    await appendImageFiles(files)
  }

  const handlePaste = async (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = getTransferredFiles(event.clipboardData)
    if (files.length === 0) return
    await appendImageFiles(files)
  }

  // 拖拽兜底：把文件拖出窗口、或拖拽被系统取消时，composer 收不到 dragleave，
  // 虚线遮罩会一直卡住。这里在 window 级别兜底复位。
  useEffect(() => {
    const resetDrag = () => {
      dragDepthRef.current = 0
      setIsDragActive(false)
    }
    const onWindowDragLeave = (event: globalThis.DragEvent) => {
      if (!event.relatedTarget) resetDrag()
    }
    window.addEventListener("dragend", resetDrag)
    window.addEventListener("drop", resetDrag)
    window.addEventListener("dragleave", onWindowDragLeave)
    return () => {
      window.removeEventListener("dragend", resetDrag)
      window.removeEventListener("drop", resetDrag)
      window.removeEventListener("dragleave", onWindowDragLeave)
    }
  }, [])

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileTransfer(event.dataTransfer)) return
    event.preventDefault()
    if (!canInput) return
    dragDepthRef.current += 1
    setIsDragActive(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileTransfer(event.dataTransfer)) return
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setIsDragActive(false)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileTransfer(event.dataTransfer)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = canInput ? "copy" : "none"
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    if (!hasFileTransfer(event.dataTransfer)) return
    event.preventDefault()
    const files = getTransferredFiles(event.dataTransfer)
    dragDepthRef.current = 0
    setIsDragActive(false)
    if (!canInput) return
    await appendImageFiles(files)
  }

  const hasMessages = messages.length > 0 || isTyping
  const canSend =
    canInput && (input.trim().length > 0 || attachments.length > 0)
  // chip 上显示模型名（而不是 provider）：切换模型后立刻能看到变化
  const modelLabel = defaultModelName || "未选择模型"
  const currentModelReady =
    allModels.find((model) => model.model_name === defaultModelName)
      ?.available !== false

  return (
    <main className="ac-main">
      <div className="ac-stage" ref={scrollRef} onScroll={syncScroll}>
        {!hasMessages && (
          <section className="ac-welcome">
            <div className="ac-glow">
              <AngelMark style={{ color: "#fff" }} />
            </div>
            <h1>今天我能为您做些什么？</h1>
            <p>您可以询问我天气、设置或其他任何任务，我随时为您效劳。</p>
            <div className="ac-quick">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  type="button"
                  onClick={() => {
                    setInput(prompt.text)
                    setIsAtBottom(true)
                  }}
                >
                  {prompt.icon}
                  {prompt.text}
                </button>
              ))}
            </div>
          </section>
        )}

        {hasMessages && (
          <section className="ac-thread">
            {messages.map((message) => {
              if (
                message.role === "assistant" &&
                !shouldShowAssistantMessage(detail, message.kind)
              ) {
                return null
              }
              return (
                <div key={message.id}>
                  {message.role === "assistant" ? (
                    <BotMessage message={message} />
                  ) : (
                    <UserMessage message={message} />
                  )}
                </div>
              )
            })}

            {isTyping && (
              <div className="ac-tmsg bot">
                <div className="av">
                  <AngelMark />
                </div>
                <div className="body">
                  <span className="ac-dots">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <div className="ac-dock">
        <div
          className="ac-composer"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragActive && (
            <div className="border-clay bg-clay-soft/60 pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-[20px] border-2 border-dashed">
              <span className="bg-paper rounded-full px-4 py-1.5 text-[12.5px] font-medium shadow-sm">
                松开以添加图片
              </span>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 px-3 pt-3">
              {attachments.map((attachment, index) => (
                <div
                  key={`${attachment.url}-${index}`}
                  className="border-line relative h-16 w-16 overflow-hidden rounded-lg border"
                >
                  <img
                    src={attachment.url}
                    alt={attachment.filename || "图片"}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="bg-paper/90 text-ink absolute top-0.5 right-0.5 grid size-5 place-items-center rounded-full shadow-sm"
                    aria-label="移除图片"
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    <IconX className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="ac-where">
            <div className="relative" ref={modelMenuRef}>
              <button
                type="button"
                className="ac-chip solid"
                disabled={!hasSelectableModels}
                title={modelLabel}
                aria-haspopup="menu"
                aria-expanded={modelMenuOpen}
                onClick={() => {
                  setModelMenuOpen((value) => !value)
                  setDetailMenuOpen(false)
                }}
              >
                <span className={cn("dotlive", !currentModelReady && "warn")} />
                <span className="ac-chip-label">{modelLabel}</span>
                <IconChevronDown />
              </button>
              {modelMenuOpen && (
                <div className="ac-menu" role="menu">
                  {allModels.length === 0 ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setModelMenuOpen(false)
                        setOpenSettings("models")
                      }}
                    >
                      前往设置添加模型
                    </button>
                  ) : (
                    allModels.map((model) => (
                      <button
                        key={model.index ?? model.model_name}
                        type="button"
                        role="menuitemradio"
                        title={model.model_name}
                        aria-checked={model.model_name === defaultModelName}
                        className={cn(
                          model.model_name === defaultModelName && "sel",
                        )}
                        disabled={settingDefault}
                        onClick={() => {
                          setModelMenuOpen(false)
                          void handleSetDefault(model.model_name)
                        }}
                      >
                        {model.model_name}
                        {model.available === false && (
                          <span className="ac-menu-hint">未就绪</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <span
              className="mx-1 h-[13px] w-px"
              style={{ background: "var(--line-2)" }}
            />

            <div className="relative" ref={detailMenuRef}>
              <button
                type="button"
                className="ac-chip"
                aria-haspopup="menu"
                aria-expanded={detailMenuOpen}
                onClick={() => {
                  setDetailMenuOpen((value) => !value)
                  setModelMenuOpen(false)
                }}
              >
                思考与工具调用 ·
                <b style={{ fontWeight: 500, color: "var(--ink)" }}>
                  {DETAIL_LABELS[detail]}
                </b>
              </button>
              {detailMenuOpen && (
                <div className="ac-menu" role="menu">
                  {DETAIL_ORDER.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={value === detail}
                      className={cn(value === detail && "sel")}
                      onClick={() => {
                        setDetail(value)
                        setDetailMenuOpen(false)
                      }}
                    >
                      {DETAIL_LABELS[value]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <span className="ac-grow" />
            <ContextChip usage={contextUsage} />
          </div>

          <TextareaAutosize
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={disabledReason ?? "输入新消息…"}
            disabled={!canInput}
            minRows={1}
            maxRows={8}
          />

          <div className="ac-cbar">
            <button
              type="button"
              className="ac-icon-btn"
              title="添加图片"
              aria-label="添加图片"
              disabled={!canInput}
              onClick={() => fileInputRef.current?.click()}
            >
              <IconPhotoPlus />
            </button>
            <span className="ac-grow" />
            <span className="ac-kbd-hint">
              按 Enter 发送，Shift + Enter 换行
            </span>
            <button
              type="button"
              className={cn("ac-send", canSend && "ready")}
              aria-label="发送消息"
              disabled={!canSend}
              onClick={handleSend}
            >
              <IconArrowUp />
            </button>
          </div>
        </div>
        <p className="ac-foot-note">
          Angel Code 只在这台机器上运行，改动仅作用于本地配置与服务。
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={CHAT_IMAGE_ACCEPT}
        multiple
        hidden
        onChange={handleImageSelection}
      />
    </main>
  )
}
