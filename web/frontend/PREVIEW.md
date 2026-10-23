# 界面预览（离线单文件）

生成可直接双击打开的预览 HTML，用于在没有后端的环境下检查界面。

```sh
cd web/frontend
pnpm build:preview          # 输出 web/preview-dist/preview.html
```

产物是单个 HTML（JS/CSS 全内联，约 2.2 MB），无需服务器，双击即可打开。

预览版由 `src/preview/mock-api.ts` 在浏览器内模拟全部接口与 WebSocket：
模型、凭证、频道、技能、工具、日志、会话均为演示数据；发送消息会分三段
模拟「思考 → 工具调用 → 回答」的流式回放。

正式构建（`pnpm build:backend`）不会包含 `src/preview/` 下的任何代码。
