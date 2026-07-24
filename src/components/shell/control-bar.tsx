"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  isToolMode,
  NAV_TOOLS,
  TOOL_MODE_LABEL,
  TOOL_MODES,
  type ToolMode,
} from "@/lib/nav-fixtures";

type View = "overview" | ToolMode;

/**
 * 來源：mockup L470–490
 *
 * 檢視與機台都是 URL 的一部分（mockup 只存在 DOM，reload 就掉）。
 * 一覽模式下機台欄位停用——與 mockup L2127 的行為一致。
 *
 * usePathname 特意用 next/navigation 版（含 locale 前綴）：下面只是找 "tool" 這個
 * literal 片段再取後兩段，跟 locale 前綴無關，不需要 next-intl 版本。
 * useRouter 則要用 next-intl 版（@/i18n/navigation），push 時才會自動帶目前 locale。
 */
export function ControlBar({ sectionId }: { sectionId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("shell");

  const segments = pathname.split("/").filter(Boolean);
  const toolIndex = segments.indexOf("tool");
  const pathToolId = toolIndex >= 0 ? segments[toolIndex + 1] : undefined;
  const pathMode = toolIndex >= 0 ? segments[toolIndex + 2] : undefined;

  const view: View = pathMode !== undefined && isToolMode(pathMode) ? pathMode : "overview";
  const toolId = pathToolId ?? NAV_TOOLS[0]!.id;
  const isOverview = view === "overview";

  const viewLabel: Readonly<Record<View, string>> = {
    overview: t("viewOverview"),
    live: t("viewLive"),
    history: t("viewHistory"),
    diagnosis: t("viewDiagnosis"),
  };

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
        {t("viewLabel")}
      </label>
      <select
        id="view-select"
        className="cursor-pointer rounded-[7px] border border-line bg-white px-[10px] py-[6px] text-[12px] outline-none"
        value={view}
        onChange={(event) => go(event.target.value as View, toolId)}
      >
        <option value="overview">{viewLabel.overview}</option>
        {TOOL_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {viewLabel[mode]}
          </option>
        ))}
      </select>

      <label className="text-[10px] font-bold tracking-wide text-ink3" htmlFor="tool-select">
        {t("toolLabel")}
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
        {isOverview ? t("overviewModeHint") : t("toolModeHint", { mode: TOOL_MODE_LABEL[view], toolId })}
      </span>
    </div>
  );
}
