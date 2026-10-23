import type { ReactNode } from "react"

import type { OAuthProviderStatus } from "@/api/oauth"
import { cn } from "@/lib/utils"

interface CredentialRowProps {
  icon: ReactNode
  title: string
  description: string
  status: OAuthProviderStatus["status"]
  statusLabel: string
  details?: ReactNode
  actions: ReactNode
  footer?: ReactNode
}

const STATUS_TONE: Record<OAuthProviderStatus["status"], string> = {
  connected: "ok",
  needs_refresh: "wait",
  expired: "stop",
  not_logged_in: "",
}

export function CredentialRow({
  icon,
  title,
  description,
  status,
  statusLabel,
  details,
  actions,
  footer,
}: CredentialRowProps) {
  return (
    <div className="ac-cred-row">
      <div
        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg"
        style={{ background: "var(--bone-2)", color: "var(--ink-2)" }}
        aria-hidden
      >
        {icon}
      </div>

      <div className="ac-cred-main">
        <div className="ac-cred-title">
          <b>{title}</b>
          <span className={cn("ac-tag", STATUS_TONE[status])}>
            <i />
            {statusLabel}
          </span>
        </div>
        <span className="ac-cred-desc">{description}</span>
        {details}
        <div className="ac-cred-actions">{actions}</div>
      </div>

      {footer && <div className="shrink-0 self-center">{footer}</div>}
    </div>
  )
}
