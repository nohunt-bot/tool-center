"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Section } from "@/domain/tool";

/**
 * 課別下拉選單要顯示的一筆課別——`Section`（code/nameEn/nameZh）再帶一個
 * `accessible` 欄位。R3：這個欄位不是課別本身的靜態屬性，是「目前使用者對
 * 這個課別有沒有支援權限」的動態結果（`canEnterSection()`），所以不是
 * fixture 資料的一部分，而是由呼叫端（layout.tsx，Server Component）算好
 * 再當 props 傳進來——Header 是 Client Component，沒辦法直接呼叫
 * `getCurrentUser()`／`listSections()` 這兩個 async API（H3 沿用的既有限制，
 * 這一波沒有重構 client/server 邊界，只是把「哪裡算 accessible」從一份靜態
 * fixture 換成呼叫端算好再往下傳）。
 */
export type NavSection = Section & { readonly accessible: boolean };

/**
 * 來源：mockup L455–468
 *
 * 課別選單只列使用者有權進入的課別；無支援權限者 disabled。
 * A1.11 會把 gating 接上 user.supportSections，B1.3 由 server 強制（前端 disabled 只是 UX）。
 *
 * R7（`docs/decisions/0002-route-and-locale.md`）：語系不再由這個元件切換
 * （`localePrefix: "never"`，真相來源是 `User.locale`，見 `@/i18n/request`）。
 * 拿掉語系切換函式與語系下拉之後，這裡不再讀網址列的查詢參數，原本為了
 * 那個 hook 加的 Suspense 邊界與 loading 骨架子元件整組一起刪掉——那層
 * Suspense 存在的唯一理由就是那個 hook 強制要求呼叫端包一層，理由本身
 * 消失了，不需要留著空殼。
 *
 * 元件仍維持 Client Component：課別 `<select>` 的 `onChange` 需要
 * `useRouter().push()`，settings 按鈕的 `onClick` 也一樣，兩者都要瀏覽器端
 * 互動，沒有可以改回 Server Component 的空間。
 */
export function Header({
  sectionId,
  sections,
}: {
  sectionId: string;
  sections: readonly NavSection[];
}) {
  const router = useRouter();
  const t = useTranslations("shell");

  return (
    <header className="flex flex-shrink-0 flex-wrap items-center gap-[10px] border-b border-line bg-panel px-5 py-[10px]">
      <div>
        <div className="text-[16px] font-bold">{t("appName")}</div>
        <div className="text-[10px] text-ink3">{t("tagline")}</div>
      </div>

      <label className="ml-4 text-[10px] font-bold tracking-wide text-ink3" htmlFor="section-select">
        {t("sectionLabel")}
      </label>
      <select
        id="section-select"
        className="cursor-pointer rounded-[7px] border border-line bg-white px-[10px] py-[5px] text-[12px] outline-none"
        value={sectionId}
        onChange={(event) => router.push(`/section/${event.target.value}`)}
      >
        {sections.map((section) => (
          <option key={section.code} value={section.code} disabled={!section.accessible}>
            {/*
              M3：mockup L462–464 中英文名同時顯示（「黃光二課 LITHO-02（我的課別）」），
              不是 sectionDisplayName() 的「依 locale 二選一」——那個函式是給只需要
              「一個名字」的地方用的（如 overview 頁面標題）。這裡兩個名字都要同時在，
              就不該經過那個二選一函式，直接照 mockup 的「中文 英文」順序組字串。

              順序刻意不隨 locale 變動：兩個名字（nameZh／nameEn）本來就都要同時顯示，
              「哪個語系換哪個順序」沒有實際的可讀性收益，換順序反而讓 en 切 zh-TW
              時選單文字整批跳動；固定「中文 英文」＝ mockup 定案的唯一順序，兩個
              locale 都一樣。`（我的課別）`／`（需支援權限）` 後綴維持既有行為，
              仍是 t()（en.json 目前是 {} → 兩個 locale 現況都吃 zh-TW 的中文後綴，
              見 @/i18n/request.ts 的 deepMerge fallback）。
            */}
            {section.nameZh} {section.nameEn}
            {section.accessible ? t("sectionMySuffix") : t("sectionRestrictedSuffix")}
          </option>
        ))}
      </select>

      <span className="text-[9.5px] text-ink3">{t("sectionHint")}</span>

      <button
        type="button"
        className="ml-auto cursor-pointer rounded-[6px] border border-line bg-panel px-[11px] py-[5px] text-[11px] text-ink2"
        onClick={() => router.push(`/section/${sectionId}/settings`)}
      >
        {t("settingsButton")}
      </button>
    </header>
  );
}
