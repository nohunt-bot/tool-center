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
  return (
    <div>
      <div className="text-[14px] font-bold">{caseId} · AI 判讀</div>
      <div className="text-[10px] text-ink3">
        {toolId} · 近 90 天 · ML kernel 分析 · 目前分頁：{chart} chart
      </div>

      <div className="mt-3 rounded-[10px] border border-dashed border-line px-4 py-3 text-[11px] text-ink3">
        u chart 待 <span className="font-mono font-bold text-teal">A5</span> 實作 · t chart 待{" "}
        <span className="font-mono font-bold text-teal">A6</span> 實作
        <div className="mt-1">
          外框模式：<span className="font-mono">{variant}</span>
          {variant === "modal"
            ? "（從 pane 點開，底下頁面保持不動）"
            : "（直接開連結，完整頁面）"}
        </div>
      </div>
    </div>
  );
}
