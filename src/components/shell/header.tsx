"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { NAV_SECTIONS } from "@/lib/nav-fixtures";

/**
 * 來源：mockup L455–468
 *
 * 課別選單只列使用者有權進入的課別；無支援權限者 disabled。
 * A1.11 會把 gating 接上 user.supportSections，B1.3 由 server 強制（前端 disabled 只是 UX）。
 */
export function Header({ sectionId }: { sectionId: string }) {
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
        {NAV_SECTIONS.map((section) => (
          <option key={section.id} value={section.id} disabled={!section.accessible}>
            {section.name} {section.id}
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
