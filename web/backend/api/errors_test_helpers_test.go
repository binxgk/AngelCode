package api

import (
	"encoding/json"
	"strings"
)

// apiErrorContains 断言 JSON 错误体中包含指定文本。
// 后端统一改为 {"error": "..."} 后，直接对原始 body 做字符串匹配会因为
// JSON 转义（引号变成 \"）而失败，因此这里先解析再比对。
func apiErrorContains(body []byte, want string) bool {
	var parsed struct {
		Error string `json:"error"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return strings.Contains(string(body), want)
	}
	return strings.Contains(parsed.Error, want)
}
