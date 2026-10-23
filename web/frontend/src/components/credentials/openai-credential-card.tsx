import {
  IconBrandOpenai,
  IconClockHour4,
  IconKey,
  IconLoader2,
  IconPlayerStopFilled,
} from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import type { OAuthProviderStatus } from "@/api/oauth"
import { Input } from "@/components/ui/input"

import { CredentialRow } from "./credential-card"

interface OpenAICredentialCardProps {
  status?: OAuthProviderStatus
  activeAction: string
  token: string
  onTokenChange: (value: string) => void
  onStartBrowserOAuth: () => void
  onStartDeviceCode: () => void
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

export function OpenAICredentialCard({
  status,
  activeAction,
  token,
  onTokenChange,
  onStartBrowserOAuth,
  onStartDeviceCode,
  onStopLoading,
  onSaveToken,
  onAskLogout,
}: OpenAICredentialCardProps) {
  const { t } = useTranslation()
  const actionBusy = activeAction !== ""
  const browserLoading = activeAction === "openai:browser"
  const deviceLoading = activeAction === "openai:device"
  const oauthLoading = browserLoading || deviceLoading
  const tokenLoading = activeAction === "openai:token"
  const statusValue = status?.status ?? "not_logged_in"

  return (
    <CredentialRow
      icon={<IconBrandOpenai className="size-4" />}
      title="OpenAI"
      description={t("credentials.providers.openai.description")}
      status={statusValue}
      statusLabel={t(statusLabelKey[statusValue] ?? statusLabelKey.not_logged_in)}
      details={
        status?.account_id ? (
          <span className="mt-1 block font-mono text-[11px] text-ink-3">
            {t("credentials.labels.account")}: {status.account_id}
          </span>
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
              <IconBrandOpenai />
            )}
            {t("credentials.actions.browser")}
          </button>

          <button
            type="button"
            className="ac-mini-btn"
            disabled={actionBusy}
            onClick={onStartDeviceCode}
          >
            {deviceLoading ? (
              <IconLoader2 className="animate-spin" />
            ) : (
              <IconClockHour4 />
            )}
            {t("credentials.actions.deviceCode")}
          </button>

          {oauthLoading && !deviceLoading && (
            <button
              type="button"
              className="ac-mini-btn danger"
              onClick={onStopLoading}
              aria-label={t("credentials.actions.stopLoading")}
            >
              <IconPlayerStopFilled />
            </button>
          )}

          <div className="ac-cred-token">
            <Input
              value={token}
              onChange={(event) => onTokenChange(event.target.value)}
              type="password"
              placeholder={t("credentials.fields.openaiToken")}
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
            {activeAction === "openai:logout" && (
              <IconLoader2 className="animate-spin" />
            )}
            {t("credentials.actions.logout")}
          </button>
        ) : null
      }
    />
  )
}
