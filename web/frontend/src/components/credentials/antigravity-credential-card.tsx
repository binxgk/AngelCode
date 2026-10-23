import {
  IconBrandGoogle,
  IconLoader2,
  IconLockOpen,
  IconPlayerStopFilled,
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import type { OAuthProviderStatus } from "@/api/oauth"

import { CredentialRow } from "./credential-card"

interface AntigravityCredentialCardProps {
  status?: OAuthProviderStatus
  activeAction: string
  onStopLoading: () => void
  onStartBrowserOAuth: () => void
  onAskLogout: () => void
}

const statusLabelKey: Record<string, string> = {
  connected: "credentials.status.connected",
  needs_refresh: "credentials.status.needsRefresh",
  expired: "credentials.status.expired",
  not_logged_in: "credentials.status.notLoggedIn",
}

export function AntigravityCredentialCard({
  status,
  activeAction,
  onStopLoading,
  onStartBrowserOAuth,
  onAskLogout,
}: AntigravityCredentialCardProps) {
  const { t } = useTranslation()
  const actionBusy = activeAction !== ""
  const browserLoading = activeAction === "google-antigravity:browser"
  const statusValue = status?.status ?? "not_logged_in"

  return (
    <CredentialRow
      icon={<IconBrandGoogle className="size-4" />}
      title="Google Antigravity"
      description={t("credentials.providers.antigravity.description")}
      status={statusValue}
      statusLabel={t(statusLabelKey[statusValue] ?? statusLabelKey.not_logged_in)}
      details={
        status?.email || status?.project_id ? (
          <div className="mt-1 space-y-0.5 font-mono text-[11px] text-ink-3">
            {status?.email && (
              <div>
                {t("credentials.labels.email")}: {status.email}
              </div>
            )}
            {status?.project_id && (
              <div>
                {t("credentials.labels.project")}: {status.project_id}
              </div>
            )}
          </div>
        ) : null
      }
      actions={
        <>
          <button
            type="button"
            className="ac-mini-btn"
            disabled={actionBusy}
            onClick={onStartBrowserOAuth}
          >
            {browserLoading ? (
              <IconLoader2 className="animate-spin" />
            ) : (
              <IconLockOpen />
            )}
            {t("credentials.actions.browser")}
          </button>

          {browserLoading && (
            <button
              type="button"
              className="ac-mini-btn danger"
              onClick={onStopLoading}
              aria-label={t("credentials.actions.stopLoading")}
              title={t("credentials.actions.stopLoading")}
            >
              <IconPlayerStopFilled />
            </button>
          )}
        </>
      }
      footer={
        status?.logged_in ? (
          <button
            type="button"
            className="ac-mini-btn danger"
            disabled={actionBusy}
            onClick={onAskLogout}
          >
            {activeAction === "google-antigravity:logout" && (
              <IconLoader2 className="animate-spin" />
            )}
            {t("credentials.actions.logout")}
          </button>
        ) : null
      }
    />
  )
}
