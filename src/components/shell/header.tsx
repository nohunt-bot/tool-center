"use client";

import { Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
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
 * F5：內層用了 next/navigation 的 useSearchParams()，Next.js 要求呼叫它的元件
 * 必須包在 <Suspense> 底下，否則會把整棵樹（往上一路到 layout）都推去
 * client-side rendering，等於白白讓 App Router 的 server rendering 失去意義。
 * 這裡把「用到 useSearchParams 的部分」拆到 HeaderBar，Header 本身只負責包
 * Suspense boundary。
 */
export function Header({
  sectionId,
  sections,
}: {
  sectionId: string;
  sections: readonly NavSection[];
}) {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <HeaderBar sectionId={sectionId} sections={sections} />
    </Suspense>
  );
}

/**
 * 真實 header 與 fallback 共用同一個容器 class，但這只統一了 padding／border／
 * flex-wrap 等「樣式」規則，不保證高度一致——高度最終由子內容（文字行高、
 * select 的實際寬度換行時機）決定，骨架色塊的尺寸不是照真實內容逐一量出來
 * 校準的。H2：reviewer 實測 9 種 viewport 寬度，找不到任何一個寬度讓真實
 * header 與這個 fallback 高度相等（連 flex-wrap 換行的斷點都對不上），
 * 所以「高度一致」是這裡不該再宣稱的事——共用這個 class 的唯一目的是讓
 * 樣式（padding／border）只有一份來源，不是為了保證高度。
 *
 * 目前 CLS（Cumulative Layout Shift）實測是 0，但原因不是高度對齊，而是：
 * 用到這個 header 的路由全部是 dynamic render（Next.js build 輸出裡標
 * `ƒ`，不是 static）——內層 HeaderBar 讀 useSearchParams()，request time
 * 才能解析，這會讓路由無法 static bailout；換句話說 SSR 輸出的 HTML
 * 本來就不會出現這個 fallback（fallback 只有在真的發生 client-side loading
 * 狀態時才會顯示，而目前這個 dynamic-render 的設置下不會發生這種狀態），
 * 所以高度差距在目前的路由設定下永遠不會被使用者看到。
 *
 * 待辦提醒：如果以後任何一個用到這個 header 的路由改成 static
 * prerendering，這個「fallback 反正不會出現」的前提就不成立了——骨架
 * 色塊真的可能在 client-side 閃一下，屆時上面說的高度落差就會變成真的
 * CLS，需要重新評估（可能要真的照真實內容量測校準骨架尺寸，或改用其他
 * 手段避免 layout shift），不能再套用這份「反正不會出現」的假設。
 */
const HEADER_CONTAINER_CLASS =
  "flex flex-shrink-0 flex-wrap items-center gap-[10px] border-b border-line bg-panel px-5 py-[10px]";

/**
 * Suspense fallback：跟 HeaderBar 用同一個 HEADER_CONTAINER_CLASS，只共用
 * 樣式（padding／border／flex-wrap），高度不保證一致，見上方 H2 的說明。
 */
function HeaderFallback() {
  return (
    <header className={HEADER_CONTAINER_CLASS} aria-hidden="true">
      <div>
        <div className="h-[16px] w-[100px] animate-pulse rounded bg-line" />
        <div className="mt-[2px] h-[10px] w-[140px] animate-pulse rounded bg-line" />
      </div>
      <div className="ml-4 h-[10px] w-[60px] animate-pulse rounded bg-line" />
      <div className="h-[27px] w-[170px] animate-pulse rounded-[7px] bg-line" />
      <div className="h-[9.5px] w-[110px] animate-pulse rounded bg-line" />
      <div className="h-[10px] w-[40px] animate-pulse rounded bg-line" />
      <div className="h-[27px] w-[90px] animate-pulse rounded-[7px] bg-line" />
      <div className="ml-auto h-[27px] w-[70px] animate-pulse rounded-[6px] bg-line" />
    </header>
  );
}

function HeaderBar({
  sectionId,
  sections,
}: {
  sectionId: string;
  sections: readonly NavSection[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("shell");

  // 語系切換：保留當前頁面與 query（spec 驗收重點）。
  // usePathname() 來自 next-intl 的 navigation wrapper，回傳值已經不含 locale 前綴，
  // 所以只要換 { locale } 選項，router 就會導到「同一頁、不同語系」。
  function switchLocale(nextLocale: string) {
    const query = Object.fromEntries(searchParams.entries());
    router.replace({ pathname, query }, { locale: nextLocale });
  }

  return (
    <header className={HEADER_CONTAINER_CLASS}>
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

      <label className="text-[10px] font-bold tracking-wide text-ink3" htmlFor="locale-select">
        {t("localeLabel")}
      </label>
      <select
        id="locale-select"
        className="cursor-pointer rounded-[7px] border border-line bg-white px-[10px] py-[5px] text-[12px] outline-none"
        value={locale}
        onChange={(event) => switchLocale(event.target.value)}
      >
        {routing.locales.map((candidate) => (
          <option key={candidate} value={candidate}>
            {candidate === "zh-TW" ? t("localeZhTW") : t("localeEn")}
          </option>
        ))}
      </select>

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
