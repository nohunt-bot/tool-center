"use client";

import { useTranslations } from "next-intl";

/**
 * A0 的路由骨架佔位元件。每個 pane 被實作時就從對應頁面移除。
 * 存在的意義是讓「路由結構可驗證」與「內容尚未實作」兩件事分開——
 * 空白頁看不出路由對不對。
 *
 * title 由呼叫端（各 page.tsx）用 getTranslations 翻好再傳進來；
 * 這裡的固定模板文字（「路由已建立…」）自己用 useTranslations，
 * phase 要套 teal 樣式所以用 t.rich() 而不是 t()。
 */
export function PanePlaceholder({
  title,
  phase,
  context,
}: {
  title: string;
  phase: string;
  context?: string;
}) {
  const t = useTranslations("panePlaceholder");
  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <div className="rounded-[10px] border border-dashed border-line bg-panel px-4 py-3">
        <div className="text-[14px] font-bold">{title}</div>
        <div className="mt-1 text-[11px] text-ink3">
          {t.rich("routeReady", {
            phase,
            styled: (chunks) => (
              <span className="font-mono font-bold text-teal">{chunks}</span>
            ),
          })}
          {context ? t("contextSuffix", { context }) : null}
        </div>
      </div>
    </div>
  );
}
