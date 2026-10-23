export function maskedSecretPlaceholder(value: unknown, fallback = ""): string {
  const secret = typeof value === "string" ? value.trim() : ""
  if (!secret) {
    return fallback
  }

  // ensure at least 40% of the characters are masked for secrets of length 4 or more
  if (secret.length <= 6) {
    const first = secret[0]
    const last = secret[secret.length - 1]
    return `${first}***${last}`
  }

  if (secret.length <= 12) {
    const firstTwo = secret.slice(0, 2)
    const lastTwo = secret.slice(-2)
    return `${firstTwo}****${lastTwo}`
  }

  const prefix = secret.slice(0, 3)
  const suffix = secret.slice(-4)
  return `${prefix}*****${suffix}`
}

/**
 * 判断用户输入的值是否是后端返回的掩码（如 "****"、"sk-****-1"）。
 *
 * 后端 `maskAPIKey` 会把密钥替换成掩码返回；如果用户把掩码原样提交回去，
 * 真正的密钥就会被覆盖成 "****"。提交前应把这类值视为"未修改"。
 */
export function isMaskedSecretValue(value: unknown): boolean {
  if (typeof value !== "string") {
    return false
  }
  const trimmed = value.trim()
  if (trimmed === "") {
    return false
  }
  // 纯星号，或含连续 4 个及以上星号
  return /^\*+$/.test(trimmed) || /\*{4,}/.test(trimmed)
}
