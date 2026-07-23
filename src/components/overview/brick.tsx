"use client";

import { useRouter } from "next/navigation";
import type { ToolSummary } from "@/domain/tool";
import { statusClass } from "@/lib/status";

/**
 * 一格＝一台機台（mockup L509–565）。
 * 整格底色＝機台狀態；chamber chip 底色＝各自狀態——色義一致，一律用 statusClass()。
 * 點擊（或 Enter/Space）導到該機台的當機處理頁（live）。
 */
export function Brick({ sectionId, tool }: { sectionId: string; tool: ToolSummary }) {
  const router = useRouter();

  function open() {
    router.push(`/section/${sectionId}/tool/${tool.id}/live`);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          open();
        }
      }}
      className={`flex min-h-[100px] cursor-pointer flex-col rounded-[10px] p-[10px_12px] shadow-[0_2px_6px_rgba(0,0,0,.15)] transition-transform duration-[120ms] hover:-translate-y-0.5 ${statusClass(tool.status)}`}
    >
      <div className="text-[13px] font-bold">{tool.id}</div>
      <div className="text-[10px] opacity-85">
        {tool.type} · {tool.model}
      </div>
      <div className="mb-auto font-mono text-[9px] opacity-90">{statLine(tool)}</div>
      <div className="text-[9px] font-bold tracking-[0.08em] opacity-95">{tool.status}</div>
      <div className="mt-[5px] flex flex-wrap gap-1">
        {tool.chambers.map((chamber) => (
          <span
            key={chamber.id}
            className={`rounded-[4px] border border-white/55 px-[6px] py-[3px] text-[9px] font-bold ${statusClass(chamber.status)}`}
          >
            {chamber.id}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * brick 上那行 7 日統計文字。規則依 mockup 8 個實例反推（見報告「spec 沒涵蓋而你做的決定」）：
 * 有 MTBI 就顯示 alarm 數 + MTBI；沒有 MTBI 但有 note 且 alarm 數為 0（如「PM 中」）只顯示 note；
 * 其餘情況 alarm 數與 note（若有）並列顯示。
 */
function statLine(tool: ToolSummary): string {
  const { alarms7d, mtbiHours, note } = tool.stats;
  if (mtbiHours !== null) return `7日 alarm ${alarms7d} · MTBI ${mtbiHours}h`;
  if (note !== null && alarms7d === 0) return note;
  if (note !== null) return `7日 alarm ${alarms7d} · ${note}`;
  return `7日 alarm ${alarms7d}`;
}
