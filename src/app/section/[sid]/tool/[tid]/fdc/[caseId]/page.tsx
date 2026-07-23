import { FdcAnalysis } from "@/components/fdc/fdc-analysis";

/** 直接開連結時的完整頁面版本（非覆蓋層）。 */
export default async function FdcPage({
  params,
  searchParams,
}: {
  params: Promise<{ tid: string; caseId: string }>;
  searchParams: Promise<{ chart?: string }>;
}) {
  const { tid, caseId } = await params;
  const { chart } = await searchParams;

  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      <FdcAnalysis toolId={tid} caseId={caseId} chart={chart === "t" ? "t" : "u"} variant="page" />
    </div>
  );
}
