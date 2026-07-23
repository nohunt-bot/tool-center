import Link from "next/link";
import { PanePlaceholder } from "@/components/shell/pane-placeholder";

export default async function LivePage({
  params,
}: {
  params: Promise<{ sid: string; tid: string }>;
}) {
  const { sid, tid } = await params;
  return (
    <div className="h-full overflow-y-auto">
      <PanePlaceholder title="當機處理" phase="A3" context={tid} />
      <div className="px-5">
        {/* A0.8 驗證用：點開是覆蓋層、直接開連結是完整頁面 */}
        <Link
          className="inline-block rounded-[6px] border border-teal bg-teal-bg px-3 py-[6px] text-[11px] font-bold text-teal"
          href={`/section/${sid}/tool/${tid}/fdc/FOCUS-DRIFT-011?chart=u`}
        >
          📊 開 FDC 分析（驗證 intercepting route）
        </Link>
      </div>
    </div>
  );
}
