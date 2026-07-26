import type { Section } from "@/domain/tool";
import type { SectionId } from "@/domain/user";

/**
 * 使用者記錄裡的課別參照 → 課代碼，唯一的正規化點。
 *
 * 使用者記錄（`User.sectionId`／`managerOf`／`supportSections`、`Grant.sectionId`
 * 等）回的課別參照，目前尚未確認上游是回課代碼還是課名——這是「名稱↔代碼的
 * 轉換只在 DataSource 邊界做一次，往內一律只有 code」這條規則唯一該落地的
 * 地方。往下游（元件／頁面／Server Action）一律假設已經是 code，不會再做
 * 這層轉換。
 *
 * 這一波（Stage A）fixtures 本來就直接存 code，所以下面兩個分支都能吃：
 * - ref 已經等於某個 section 的 code → 直通回傳（Stage A 實際走的分支）。
 * - ref 對不到任何 code，但對得到 nameEn／nameZh → 查對照表換成 code
 *   （Stage B 接真實 API、若 API 回的是課名時，就是在這裡查
 *   `listSections()` 的結果轉換；若 API 回的已經是 code，上面那條直通
 *   分支會先命中，不會走到這裡）。
 *
 * 兩邊都對不到就是資料異常——丟明確錯誤，不要默默吞掉或回傳原值
 * （呼應 fixtures/tools.ts 的 getToolFixture「未知機台丟錯誤」原則）。
 */
export function resolveSectionCode(ref: string, sections: readonly Section[]): SectionId {
  const byCode = sections.find((section) => section.code === ref);
  if (byCode) return byCode.code;

  const byName = sections.find((section) => section.nameEn === ref || section.nameZh === ref);
  if (byName) return byName.code;

  throw new Error(`section-ref: unknown section reference "${ref}"`);
}
