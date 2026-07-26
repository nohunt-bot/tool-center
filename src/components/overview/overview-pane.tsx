import { getTranslations } from "next-intl/server";
import type { ToolSummary } from "@/domain/tool";
import { statusToken, TOOL_STATUSES, type ToolStatus } from "@/lib/status";
import { Brick } from "@/components/overview/brick";

/** 頂部統計列要特別標出來的狀態，順序與 mockup L497 一致 */
const CALLOUT_STATUSES = ["DOWN", "LOST", "PM"] as const;

/**
 * 機台一覽 pane（mockup L494–565）：頂部標題列 + legend + brick grid + 底部說明。
 * 資料來自 FixturesDataSource.listTools()，計數一律由 tools 統計，不寫死。
 *
 * Server Component（F4）：這裡不需要任何互動狀態或瀏覽器 API，先前掛的 client
 * 指令只是之前為了測試方便加上的，實際只省 4,181 B（0.6%）。改回 async function +
 * getTranslations，子層的 Brick 才是真的需要 client（點擊/鍵盤導覽）。
 */
export async function OverviewPane({
  sectionId,
  sectionName,
  tools,
}: {
  sectionId: string;
  sectionName: string;
  tools: readonly ToolSummary[];
}) {
  const t = await getTranslations("overview");

  if (tools.length === 0) {
    return (
      <div className="h-full overflow-y-auto px-5 py-4">
        <div className="rounded-[10px] border border-dashed border-line bg-panel px-4 py-3 text-[11px] text-ink3">
          {t("emptyState", { sectionName, sectionId })}
        </div>
      </div>
    );
  }

  const counts = countByStatus(tools);

  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[14px] font-bold">
          <span>{t("header", { sectionName, count: tools.length })}</span>
          {CALLOUT_STATUSES.filter((status) => counts[status] > 0).map((status) => (
            <span key={status} className="flex items-center gap-1 text-[13px]">
              <StatusDot status={status} />
              {status} {counts[status]}
            </span>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          {TOOL_STATUSES.map((status) => (
            <span key={status} className="flex items-center gap-1 text-[10px] text-ink2">
              <StatusDot status={status} />
              {status}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {tools.map((tool) => (
          <Brick key={tool.id} sectionId={sectionId} tool={tool} />
        ))}
      </div>

      <div className="mt-3 text-center text-[10px] leading-[1.6] text-ink3">{t("footerNote")}</div>
    </div>
  );
}

/** legend／統計列共用的狀態色小方塊——只借 statusToken 的底色，不自行寫色碼 */
function StatusDot({ status }: { status: ToolStatus }) {
  return <i className={`inline-block h-[10px] w-[10px] rounded-[2px] ${statusToken(status).bg}`} />;
}

function countByStatus(tools: readonly ToolSummary[]): Record<ToolStatus, number> {
  const counts: Record<ToolStatus, number> = { UP: 0, DOWN: 0, OFF: 0, WEQ: 0, PM: 0, LOST: 0 };
  for (const tool of tools) {
    counts[tool.status] += 1;
  }
  return counts;
}
