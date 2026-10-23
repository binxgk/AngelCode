import { IconLoader2 } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { PageHeader } from "@/components/page-header"
import { useCredentialsPage } from "@/hooks/use-credentials-page"

import { AnthropicCredentialCard } from "./anthropic-credential-card"
import { AntigravityCredentialCard } from "./antigravity-credential-card"
import { DeviceCodeSheet } from "./device-code-sheet"
import { LogoutConfirmDialog } from "./logout-confirm-dialog"
import { OpenAICredentialCard } from "./openai-credential-card"

export function CredentialsPage() {
  const { t } = useTranslation()
  const {
    loading,
    error,
    activeAction,
    activeFlow,
    flowHint,
    openAIToken,
    anthropicToken,
    openaiStatus,
    anthropicStatus,
    antigravityStatus,
    logoutDialogOpen,
    logoutConfirmProvider,
    logoutProviderLabel,
    deviceSheetOpen,
    deviceFlow,
    setOpenAIToken,
    setAnthropicToken,
    startBrowserOAuth,
    startOpenAIDeviceCode,
    stopLoading,
    saveToken,
    askLogout,
    handleConfirmLogout,
    handleLogoutDialogOpenChange,
    handleDeviceSheetOpenChange,
  } = useCredentialsPage()

  return (
    <div className="flex h-full flex-col">
      <PageHeader title={t("navigation.credentials")} />

      <div className="ac-embed-body px-1 sm:px-2">
        <p className="ac-grp-desc pt-1">{t("credentials.description")}</p>

        {error && (
          <div className="mb-3 rounded-lg border border-line bg-red-soft px-4 py-2.5 text-[12.5px] text-bad">
            {error}
          </div>
        )}

        {activeFlow && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-bone-2 px-4 py-2.5 text-[12.5px]">
            <span className="font-medium text-ink">
              {t("credentials.flow.current")}
            </span>
            <span className="text-ink-3">{flowHint}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-10 text-[12.5px] text-ink-3">
            <IconLoader2 className="size-4 animate-spin" />
            {t("credentials.loading")}
          </div>
        ) : (
          <div className="ac-grp" style={{ paddingTop: 0 }}>
            <OpenAICredentialCard
              status={openaiStatus}
              activeAction={activeAction}
              token={openAIToken}
              onTokenChange={setOpenAIToken}
              onStartBrowserOAuth={() => void startBrowserOAuth("openai")}
              onStartDeviceCode={() => void startOpenAIDeviceCode()}
              onStopLoading={stopLoading}
              onSaveToken={() => void saveToken("openai", openAIToken.trim())}
              onAskLogout={() => askLogout("openai")}
            />

            <AnthropicCredentialCard
              status={anthropicStatus}
              activeAction={activeAction}
              token={anthropicToken}
              onTokenChange={setAnthropicToken}
              onStopLoading={stopLoading}
              onSaveToken={() =>
                void saveToken("anthropic", anthropicToken.trim())
              }
              onAskLogout={() => askLogout("anthropic")}
            />

            <AntigravityCredentialCard
              status={antigravityStatus}
              activeAction={activeAction}
              onStopLoading={stopLoading}
              onStartBrowserOAuth={() =>
                void startBrowserOAuth("google-antigravity")
              }
              onAskLogout={() => askLogout("google-antigravity")}
            />
          </div>
        )}
      </div>

      <LogoutConfirmDialog
        open={logoutDialogOpen}
        providerLabel={logoutProviderLabel}
        isSubmitting={activeAction === `${logoutConfirmProvider}:logout`}
        onOpenChange={handleLogoutDialogOpenChange}
        onConfirm={handleConfirmLogout}
      />

      <DeviceCodeSheet
        open={deviceSheetOpen}
        flow={deviceFlow}
        flowHint={flowHint}
        onOpenChange={handleDeviceSheetOpenChange}
      />
    </div>
  )
}
