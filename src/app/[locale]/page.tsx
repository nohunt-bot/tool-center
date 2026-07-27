import { redirect } from "next/navigation";
import { DEFAULT_SECTION_ID } from "@/lib/nav-fixtures";

/**
 * R5：`localePrefix: "never"` 之下 URL 完全不帶語系段，redirect 目標
 * 不再需要（也不能）手動拼 locale 前綴——之前拼 `/${locale}/section/...`
 * 是為了避免被 proxy 用預設 locale 重新導向掉使用者本來的 `/en/` 選擇，
 * 這個理由連同 `/en/` 這種 URL 形狀一起消失了。
 */
export default async function Home() {
  // 預設帶入所屬課別（mockup L466）。B1.3 之後改為從使用者 profile 取得。
  redirect(`/section/${DEFAULT_SECTION_ID}`);
}
