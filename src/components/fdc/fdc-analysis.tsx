"use client";

import { useTranslations } from "next-intl";

/**
 * FDC 分析內容。同一份內容有兩種外框：
 *   variant="page"  直接開連結（完整頁面）
 *   variant="modal" 從 pane 點開（intercepting route 的覆蓋層）
 *
 * 內容本體待 A5（u chart）／A6（t chart）實作。
 */
export function FdcAnalysis({
  toolId,
  caseId,
  chart,
  variant,
}: {
  toolId: string;
  caseId: string;
  chart: "u" | "t";
  variant: "page" | "modal";
}) {
  const t = useTranslations("fdc");

  return (
    <div>
      <div className="text-[14px] font-bold">{t("heading", { caseId })}</div>
      <div className="text-[10px] text-ink3">{t("subtitle", { toolId, chart })}</div>

      <div className="mt-3 rounded-[10px] border border-dashed border-line px-4 py-3 text-[11px] text-ink3">
        {t.rich("pending", {
          a5: (chunks) => <span className="font-mono font-bold text-teal">{chunks}</span>,
          a6: (chunks) => <span className="font-mono font-bold text-teal">{chunks}</span>,
        })}
        <div className="mt-1">
          {t("variantLabelPrefix")}
          <span className="font-mono">{variant}</span>
          {variant === "modal" ? t("variantModalNote") : t("variantPageNote")}
        </div>
      </div>
    </div>
  );
}
