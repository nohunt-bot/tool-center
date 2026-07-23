import { FdcAnalysis } from "@/components/fdc/fdc-analysis";
import { ModalShell } from "@/components/fdc/modal-shell";

/** 從 pane 點開時的覆蓋層版本（intercepting route）。 */
export default async function FdcModal({
  params,
  searchParams,
}: {
  params: Promise<{ tid: string; caseId: string }>;
  searchParams: Promise<{ chart?: string }>;
}) {
  const { tid, caseId } = await params;
  const { chart } = await searchParams;

  return (
    <ModalShell>
      <FdcAnalysis toolId={tid} caseId={caseId} chart={chart === "t" ? "t" : "u"} variant="modal" />
    </ModalShell>
  );
}
