import {
  IconKey,
  IconLoader2,
  IconPlayerStopFilled,
  IconSparkles,
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import type { OAuthProviderStatus } from "@/api/oauth"
import { Input } from "@/components/ui/input"

import { CredentialRow } from "./credential-card"

interface AnthropicCredentialCardProps {
  status?: OAuthProviderStatus
  activeAction: string
  token: string
  onTokenChange: (value: string) => void
  onStopLoading: () => void
  onSaveToken: () => void
  onAskLogout: () => void
}

const statusLabelKey: Record<string, string> = {
  connected: "credentials.status.connected",
  needs_refresh: "credentials.status.needsRefresh",
  expired: "credentials.status.expired",
  not_logged_in: "credentials.status.notLoggedIn",
}

export function AnthropicCredentialCard({
  status,
  activeAction,
  token,
  onTokenChange,
  onStopLoading,
  onSaveToken,
  onAskLogout,
}: AnthropicCredentialCardProps) {
  const { t } = useTranslation()
  const actionBusy = activeAction !== ""
  const tokenLoading = activeAction === "anthropic:token"
  const statusValue = status?.status ?? "not_logged_in"

  return (
    <CredentialRow
      icon={<IconSparkles className="size-4" />}
      title="Anthropic"
      description={t("credentials.providers.anthropic.description")}
      status={statusValue}
      statusLabel={t(statusLabelKey[statusValue] ?? statusLabelKey.not_logged_in)}
      actions={
        <>
          <div className="ac-cred-token">
            <Input
              value={token}
              onChange={(event) => onTokenChange(event.target.value)}
              type="password"
              placeholder={t("credentials.fields.anthropicToken")}
            />
            <button
              type="button"
              className="ac-mini-btn"
              disabled={actionBusy || !token.trim()}
              onClick={onSaveToken}
            >
              {tokenLoading ? (
                <IconLoader2 className="animate-spin" />
              ) : (
                <IconKey />
              )}
              {t("credentials.actions.saveToken")}
            </button>
          </div>

          {tokenLoading && (
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
            {activeAction === "anthropic:logout" && (
              <IconLoader2 className="animate-spin" />
            )}
            {t("credentials.actions.logout")}
          </button>
        ) : null
      }
    />
  )
}
