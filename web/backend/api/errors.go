package api

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// writeAPIError 以统一 JSON 格式返回 API 错误。
//
// 之前各 handler 直接用 http.Error 返回 text/plain，导致前端必须区分
// 纯文本与 JSON 两种错误体，且日志/监控难以结构化解析。现在所有
// /api/* 错误统一为：
//
//	{"error": "...", "status": 400}
//
// 前端 api/http.ts 的 readErrorMessage 仍兼容旧格式，便于滚动升级。
func writeAPIError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	body, err := json.Marshal(map[string]any{
		"error":  message,
		"status": status,
	})
	if err != nil {
		// 极少数情况下（非法 UTF-8 等）退化为纯文本，避免二次失败。
		_, _ = fmt.Fprintf(w, `{"error":"%s","status":%d}`, "internal error", status)
		return
	}
	_, _ = w.Write(body)
}

// writeAPIErrorf 是 writeAPIError 的格式化版本。
func writeAPIErrorf(w http.ResponseWriter, status int, format string, args ...any) {
	writeAPIError(w, status, fmt.Sprintf(format, args...))
}
