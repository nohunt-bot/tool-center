import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PanePlaceholder } from "@/components/shell/pane-placeholder";

/** 當機處理（`/tool/<tid>`，index，不再有 `/live` 段——R5）。 */
export default async function ToolLivePage({
  params,
}: {
  params: Promise<{ tid: string }>;
}) {
  const { tid } = await params;
  const t = await getTranslations("toolPages");
  return (
    <div className="h-full overflow-y-auto">
      <PanePlaceholder title={t("liveTitle")} phase="A3" context={tid} />
      <div className="px-5">
        {/* A0.8 驗證用：點開是覆蓋層、直接開連結是完整頁面。用 next-intl 的 Link
            （localePrefix: "never" 之下不會帶語系前綴，見 @/i18n/routing）。
            機台子樹不帶課別段（R5），href 不含 sectionId。 */}
        <Link
          className="inline-block rounded-[6px] border border-teal bg-teal-bg px-3 py-[6px] text-[11px] font-bold text-teal"
          href={`/tool/${tid}/fdc/FOCUS-DRIFT-011?chart=u`}
        >
          {t("fdcDemoLink")}
        </Link>
      </div>
    </div>
  );
}
