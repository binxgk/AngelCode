import { createFileRoute } from "@tanstack/react-router"

function IndexRoute() {
  // 主界面由 __root 的 AngelLayout 渲染，这里只作为默认路由占位。
  return null
}

export const Route = createFileRoute("/")({
  component: IndexRoute,
})
