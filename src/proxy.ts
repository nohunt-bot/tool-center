import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * i18n locale 偵測與內部 rewrite（R5：`localePrefix: "never"` 之後，
 * 這裡不再「導向」帶 locale 的 URL——外部路徑一律不帶語系段，這個
 * middleware 只負責談出當次請求該用哪個 locale（cookie 優先，其次
 * Accept-Language，其餘 fallback 到 `routing.defaultLocale`），再把請求
 * rewrite 到內部的 `/<locale>/...` 路徑（對應 `src/app/[locale]/` 資料夾），
 * 使用者看到的網址列不會變。若請求本身帶了 locale 前綴（如 `/zh-TW/...`），
 * next-intl 的 middleware 在 "never" 模式下會直接 307 redirect 掉這一段，
 * 讓網址回到不帶前綴的形狀——這不是本檔要手動處理的分支，`createMiddleware`
 * 內建就是這個行為（見 node_modules/next-intl 原始碼）。
 *
 * matcher 不用因為 localePrefix 改變而調整：排除規則本來就只跟「哪些路徑
 * 需要 locale 協商」有關，跟協商完的路徑帶不帶 locale 段是兩回事。
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
