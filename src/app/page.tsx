import { redirect } from "next/navigation";
import { DEFAULT_SECTION_ID } from "@/lib/nav-fixtures";

export default function Home() {
  // 預設帶入所屬課別（mockup L466）。B1.3 之後改為從使用者 profile 取得。
  redirect(`/section/${DEFAULT_SECTION_ID}`);
}
