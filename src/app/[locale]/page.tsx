import { redirect } from "next/navigation";
import { DEFAULT_SECTION_ID } from "@/lib/nav-fixtures";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // 預設帶入所屬課別（mockup L466）。B1.3 之後改為從使用者 profile 取得。
  // 一定要帶目前 locale——不帶的話會被 proxy 用預設 locale 重新導向，
  // 若使用者本來在 /en/ 就會被拉回 zh-TW。
  redirect(`/${locale}/section/${DEFAULT_SECTION_ID}`);
}
