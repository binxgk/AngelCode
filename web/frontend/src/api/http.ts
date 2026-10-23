import { isLauncherAuthPathname } from "@/lib/launcher-login-path"

function isLauncherAuthPath(): boolean {
  if (typeof globalThis.location === "undefined") {
    return false
  }
  if (isLauncherAuthPathname(globalThis.location.pathname || "/")) {
    return true
  }
  try {
    return isLauncherAuthPathname(
      new URL(globalThis.location.href).pathname || "/",
    )
  } catch {
    return false
  }
}

/**
 * Same-origin fetch that sends cookies; redirects to launcher login on 401 JSON responses.
 * Skips redirect while already on an auth page (login or setup) to avoid reload loops.
 */
export async function launcherFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, {
    credentials: "same-origin",
    ...init,
  })
  if (res.status === 401) {
    const ct = res.headers.get("content-type") || ""
    if (
      ct.includes("application/json") &&
      typeof globalThis.location !== "undefined" &&
      !isLauncherAuthPath()
    ) {
      globalThis.location.assign("/launcher-login")
    }
  }
  return res
}

/** 带 HTTP 状态码的 API 错误。 */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/**
 * 从错误响应中提取可读信息。
 *
 * 后端大部分端点用 `http.Error` 返回 `text/plain`（如
 * "Validation error: model_name is required"），少数端点返回
 * `{"error": "..."}` 或 `{"errors": [...]}`。这里按顺序兼容三种格式，
 * 避免前端把真实错误吞成 "Unexpected token" 之类的 JSON 解析异常。
 */
async function readErrorMessage(res: Response): Promise<string> {
  const fallback = `API error: ${res.status} ${res.statusText}`

  let raw: string
  try {
    raw = await res.text()
  } catch {
    return fallback
  }

  const trimmed = raw.trim()
  if (trimmed === "") {
    return fallback
  }

  // 结构化错误体
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const body = JSON.parse(trimmed) as {
        error?: unknown
        errors?: unknown
        message?: unknown
      }
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        return body.errors.map(String).join("; ")
      }
      if (typeof body.error === "string" && body.error.trim() !== "") {
        return body.error
      }
      if (typeof body.message === "string" && body.message.trim() !== "") {
        return body.message
      }
    } catch {
      // 不是合法 JSON，按纯文本处理
    }
  }

  return trimmed
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  /** 请求体；对象会被序列化为 JSON 并自动设置 Content-Type。 */
  body?: unknown
}

/**
 * 统一的 API 请求：注入 cookie、序列化 JSON、解析错误、返回 JSON。
 * 所有 `src/api/*` 模块都应通过它访问后端。
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, ...rest } = options

  const init: RequestInit = {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  }

  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body)
  }

  const res = await launcherFetch(path, init)
  if (!res.ok) {
    throw new ApiError(await readErrorMessage(res), res.status)
  }

  // 204 / 空响应体
  if (res.status === 204) {
    return undefined as T
  }
  const text = await res.text()
  if (text.trim() === "") {
    return undefined as T
  }
  return JSON.parse(text) as T
}

export { readErrorMessage }

/** 提取可展示的错误文案，兼容非 Error 抛出物。 */
export function errorMessage(error: unknown, fallback = "请求失败"): string {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message
  }
  if (typeof error === "string" && error.trim() !== "") {
    return error
  }
  return fallback
}
