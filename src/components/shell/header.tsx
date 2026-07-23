"use client";

import { useRouter } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/nav-fixtures";

/**
 * 來源：mockup L455–468
 *
 * 課別選單只列使用者有權進入的課別；無支援權限者 disabled。
 * A1.11 會把 gating 接上 user.supportSections，B1.3 由 server 強制（前端 disabled 只是 UX）。
 */
export function Header({ sectionId }: { sectionId: string }) {
  const router = useRouter();

  return (
    <header className="flex flex-shrink-0 flex-wrap items-center gap-[10px] border-b border-line bg-panel px-5 py-[10px]">
      <div>
        <div className="text-[16px] font-bold">Tool Center</div>
        <div className="text-[10px] text-ink3">Fab1 · 設備 AI 助理</div>
      </div>

      <label className="ml-4 text-[10px] font-bold tracking-wide text-ink3" htmlFor="section-select">
        課別
      </label>
      <select
        id="section-select"
        className="cursor-pointer rounded-[7px] border border-line bg-white px-[10px] py-[5px] text-[12px] outline-none"
        value={sectionId}
        onChange={(event) => router.push(`/section/${event.target.value}`)}
      >
        {NAV_SECTIONS.map((section) => (
          <option key={section.id} value={section.id} disabled={!section.accessible}>
            {section.name} {section.id}
            {section.accessible ? "（我的課別）" : "（需支援權限）"}
          </option>
        ))}
      </select>

      <span className="text-[9.5px] text-ink3">預設帶入所屬課別 · 開支援權限才能跨課</span>

      <button
        type="button"
        className="ml-auto cursor-pointer rounded-[6px] border border-line bg-panel px-[11px] py-[5px] text-[11px] text-ink2"
        onClick={() => router.push(`/section/${sectionId}/settings`)}
      >
        ⚙ 課別設定
      </button>
    </header>
  );
}
