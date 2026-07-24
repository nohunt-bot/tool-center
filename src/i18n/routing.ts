import { defineRouting } from "next-intl/routing";

/**
 * i18n 路由設定：支援 zh-TW（預設）與 en。
 *
 * 架構決定（見報告）：架構做滿、messages/en.json 內容留空、缺鍵一律 fallback 到
 * zh-TW（見 src/i18n/request.ts 的 deepMerge）。翻譯內容留到真的需要英文時再補。
 */
export const routing = defineRouting({
  locales: ["zh-TW", "en"],
  defaultLocale: "zh-TW",
});
