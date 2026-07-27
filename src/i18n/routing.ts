import { defineRouting } from "next-intl/routing";

/**
 * i18n 路由設定：支援 zh-TW（預設）與 en。
 *
 * 架構決定（見報告）：架構做滿、messages/en.json 內容留空、缺鍵一律 fallback 到
 * zh-TW（見 src/i18n/request.ts 的 deepMerge）。翻譯內容留到真的需要英文時再補。
 *
 * R5（docs/decisions/0002-route-and-locale.md）：`localePrefix: "never"`——
 * 語系不進 URL，真相來源是 `User.locale`（見 src/i18n/request.ts）。
 * `[locale]/` 資料夾本身保留：next-intl 在這個設定下仍會把請求內部 rewrite
 * 到 `[locale]` 動態段（用 `request.ts` 解出來的 locale），只是不再要求
 * URL 本身帶這一段、也不會用這一段做 302 導向。
 */
export const routing = defineRouting({
  locales: ["zh-TW", "en"],
  defaultLocale: "zh-TW",
  localePrefix: "never",
});
