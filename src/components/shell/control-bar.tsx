"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  isToolMode,
  NAV_TOOLS,
  TOOL_MODE_LABEL,
  TOOL_MODES,
  type ToolMode,
} from "@/lib/nav-fixtures";

type View = "overview" | ToolMode;

const VIEW_LABEL: Readonly<Record<View, string>> = {
  overview: "🧱 機台一覽（全部）",
  live: "🔴 當機處理",
  history: "📈 病史分析",
  diagnosis: "🔬 深度診斷",
};

/**
 * 來源：mockup L470–490
 *
 * 檢視與機台都是 URL 的一部分（mockup 只存在 DOM，reload 就掉）。
 * 一覽模式下機台欄位停用——與 mockup L2127 的行為一致。
 */
export function ControlBar({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const toolIndex = segments.indexOf("tool");
  const pathToolId = toolIndex >= 0 ? segments[toolIndex + 1] : undefined;
  const pathMode = toolIndex >= 0 ? segments[toolIndex + 2] : undefined;

  const view: View = pathMode !== undefined && isToolMode(pathMode) ? pathMode : "overview";
  const toolId = pathToolId ?? NAV_TOOLS[0]!.id;
  const isOverview = view === "overview";

  function go(nextView: View, nextToolId: string) {
    if (nextView === "overview") {
      router.push(`/section/${sectionId}`);
      return;
    }
    router.push(`/section/${sectionId}/tool/${nextToolId}/${nextView}`);
  }

  return (
    <div className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-line bg-panel px-5 py-[9px]">
      <label className="text-[10px] font-bold tracking-wide text-ink3" htmlFor="view-select">
        檢視
      </label>
      <select
        id="view-select"
        className="cursor-pointer rounded-[7px] border border-line bg-white px-[10px] py-[6px] text-[12px] outline-none"
        value={view}
        onChange={(event) => go(event.target.value as View, toolId)}
      >
        <option value="overview">{VIEW_LABEL.overview}</option>
        {TOOL_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {VIEW_LABEL[mode]}
          </option>
        ))}
      </select>

      <label className="text-[10px] font-bold tracking-wide text-ink3" htmlFor="tool-select">
        機台
      </label>
      <select
        id="tool-select"
        className="cursor-pointer rounded-[7px] border border-line bg-white px-[10px] py-[6px] text-[12px] outline-none disabled:cursor-not-allowed disabled:bg-[#f3f4f6] disabled:text-ink3"
        value={toolId}
        disabled={isOverview}
        onChange={(event) => go(view, event.target.value)}
      >
        {NAV_TOOLS.map((tool) => (
          <option key={tool.id} value={tool.id}>
            {tool.id} · {tool.type}（{tool.status}）
          </option>
        ))}
      </select>

      <span className="ml-auto text-[10px] text-ink3">
        {isOverview
          ? "一覽模式：機台欄位停用 · 點 brick 直接進入"
          : `${TOOL_MODE_LABEL[view]} · ${toolId}`}
      </span>
    </div>
  );
}
