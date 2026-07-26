"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import type { ToolSummary } from "@/domain/tool";
import { isToolMode, TOOL_MODES, type ToolMode } from "@/lib/nav-fixtures";

type View = "overview" | ToolMode;

/**
 * emoji 是純裝飾、不隨語系變化，所以留在程式碼裡，不搬進 messages（F2）。
 * 對應的文字部分（無 emoji）統一放在 messages/zh-TW.json 的 shell.view* 鍵，
 * viewLabel 物件（見下方）跟 toolModeHint 共用同一份文字，不再另外從
 * nav-fixtures 拿一份獨立、容易跟這裡的文字對不齊的 mode 文案表。
 */
const VIEW_EMOJI: Readonly<Record<View, string>> = {
  overview: "🧱",
  live: "🔴",
  history: "📈",
  diagnosis: "🔬",
};

/**
 * 來源：mockup L470–490
 *
 * 檢視與機台都是 URL 的一部分（mockup 只存在 DOM，reload 就掉）。
 * 一覽模式下機台欄位停用——與 mockup L2127 的行為一致。
 *
 * usePathname 特意用 next/navigation 版（含 locale 前綴）：下面只是找 "tool" 這個
 * literal 片段再取後兩段，跟 locale 前綴無關，不需要 next-intl 版本。
 * useRouter 則要用 next-intl 版（@/i18n/navigation），push 時才會自動帶目前 locale。
 *
 * M1：`tools` 一律由呼叫端（layout.tsx，Server Component）呼叫
 * `fixturesDataSource.listTools(sectionId)` 算好再當 prop 傳入，
 * ControlBar 本身（檔案開頭有 client 指令、是 client component）不 import
 * 任何 @/data/fixtures 模組。
 * 原本這裡直接呼叫 `listToolSummariesFixture()` 會把整個
 * `@/data/fixtures/tools` 模組（含機台屬性側欄的 attributesByToolId：
 * 內部 IP、PE/EE 姓名、vendor、TAP/TCS 版本）打進 client bundle——
 * `ToolSummary` 本身不含 attributes，但同一個模組檔案裡的其他資料會被
 * bundler 一起帶進去。跟 Header 現在的模式（layout.tsx 算 navSections
 * 再傳下去）一致。這也順帶解決 Stage B 接真實 API 後 ControlBar 沒辦法
 * 自己觸發資料查詢的問題——client component 本來就不該自己決定資料怎麼來。
 */
export function ControlBar({
  sectionId,
  tools,
}: {
  sectionId: string;
  tools: readonly ToolSummary[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("shell");

  const segments = pathname.split("/").filter(Boolean);
  const toolIndex = segments.indexOf("tool");
  const pathToolId = toolIndex >= 0 ? segments[toolIndex + 1] : undefined;
  const pathMode = toolIndex >= 0 ? segments[toolIndex + 2] : undefined;

  const view: View = pathMode !== undefined && isToolMode(pathMode) ? pathMode : "overview";
  const hasTools = tools.length > 0;
  // M7：改前是 `NAV_TOOLS[0]!.id`，那份常數保證非空。現在 `tools` 來自
  // 課別過濾後的 fixture，理論上可以是空陣列（例如某課別目前沒有任何
  // 機台）——這種情況下不能 fallback 出空字串當 toolId，否則使用者一旦
  // 切到 tool 模式就會產生 `/section/x/tool//live` 這種畸形 URL。
  // 下面把「機台下拉停用」跟「不允許切到 tool 模式」（mode select 的
  // 非 overview 選項 disabled）兩件事都做了，"" 只是安全落底、
  // 正常情況下不會真的被拿去組 URL。
  const toolId = pathToolId ?? tools[0]?.id ?? "";
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
        <option value="overview">
          {VIEW_EMOJI.overview} {viewLabel.overview}
        </option>
        {TOOL_MODES.map((mode) => (
          // M7：沒有機台可選時，tool 模式的選項整批 disable——不允許切到
          // tool 模式，避免落到上面 toolId === "" 的安全落底、組出畸形 URL。
          <option key={mode} value={mode} disabled={!hasTools}>
            {VIEW_EMOJI[mode]} {viewLabel[mode]}
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
        disabled={isOverview || !hasTools}
        onChange={(event) => go(view, event.target.value)}
      >
        {tools.map((tool) => (
          <option key={tool.id} value={tool.id}>
            {t("toolOptionLabel", { toolId: tool.id, type: tool.type, status: tool.status })}
          </option>
        ))}
      </select>

      <span className="ml-auto text-[10px] text-ink3">
        {isOverview ? t("overviewModeHint") : t("toolModeHint", { mode: viewLabel[view], toolId })}
      </span>
    </div>
  );
}
