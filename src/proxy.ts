import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * i18n locale 偵測與導向：無 locale 的路徑導到預設 zh-TW。
 *
 * 檔名決定：spec 原文寫「middleware.ts」，但 Next 16.2.11 已把這個檔案慣例
 * 重新命名為 proxy.ts（middleware.ts 仍能動，但建置時會印 deprecation 警告，
 * 見 node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 * 與 node_modules/next/dist/build/index.js 的 warnOnce 呼叫）。
 * AGENTS.md 也明確要求 heed deprecation notices，所以這裡用 proxy.ts，
 * 功能與原本要的 middleware 完全等價（next-intl 的 createMiddleware 本來就是
 * 檔名無關的一般函式，不管檔案叫 middleware.ts 還是 proxy.ts 都能用）。
 */
export default createMiddleware(routing);

export const config = {
  // 排除 Next 內部資產與看起來像檔案（含副檔名）的路徑，其餘一律經過 locale 導向。
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
