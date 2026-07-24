import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function LivePage({
  params,
}: {
  params: Promise<{ sid: string; tid: string }>;
}) {
  const { sid, tid } = await params;
  const t = await getTranslations("toolPages");
  return (
    <div className="h-full overflow-y-auto">
      <PanePlaceholder title={t("liveTitle")} phase="A3" context={tid} />
      <div className="px-5">
        {/* A0.8 驗證用：點開是覆蓋層、直接開連結是完整頁面。用 next-intl 的 Link
            自動帶目前 locale 前綴，不用手動拼 /zh-TW 或 /en。 */}
        <Link
          className="inline-block rounded-[6px] border border-teal bg-teal-bg px-3 py-[6px] text-[11px] font-bold text-teal"
          href={`/section/${sid}/tool/${tid}/fdc/FOCUS-DRIFT-011?chart=u`}
        >
          {t("fdcDemoLink")}
        </Link>
      </div>
    </div>
  );
}
