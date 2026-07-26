import type { Section } from "@/domain/tool";

/**
 * 課別清單——唯一資料來源（R3：收斂 A1.7 遺留的三份重複）。
 *
 * 收斂前有三份重複的課別資料，前一輪 reviewer 逐筆比對確認 id/name 完全相同：
 * - `src/lib/nav-fixtures.ts` 的 `NAV_SECTIONS`（A0 階段的導覽用假資料，多一個
 *   header 下拉選單專用的 `accessible` 欄位；見該檔 git 歷史 commit 82a3c4d）
 * - `src/data/fixtures/users.ts` 的 `sectionsFixture`（跟上面同樣三筆課別，
 *   沒有 accessible）
 * - `src/data/fixtures/tools.ts` 的 `sectionFixture`（只留 LITHO-02 那一筆）
 *
 * （M6：這裡曾經誤寫成「`src/data/fixtures/nav.ts` 的 `navSectionsFixture`」——
 * 那個檔案在 git 歷史中從未存在過，`git log --all -- src/data/fixtures/nav.ts`
 * 沒有任何 commit。實際被收斂的第三份是上面列的 `src/lib/nav-fixtures.ts`。）
 *
 * 收斂後「accessible」不再是課別本身的靜態屬性——它是「這個使用者對這個
 * 課別有沒有支援權限」的動態結果（見 `@/lib/permission` 的
 * `canEnterSection()`），呼叫端該自己算，不要塞進這份資料裡，否則又會變回
 * 一份要手動跟使用者資料同步的複本。
 *
 * `code` 是課代碼——唯一識別，用於 URL 與權限鍵（domain/user 的 SectionId）。
 * `nameEn`／`nameZh` 都只是顯示名（哪個名字給哪個 locale 看，見
 * `sectionDisplayName()`），不能拿來查詢或比對權限。
 *
 * 匯出對應的 *_CODE 常數，讓其他 fixtures（users/tools/settings）與測試都從
 * 這裡取課代碼，不要各自重複寫一份字串常值。
 *
 * M5：下面三個 `SEC-*` 值是 Stage A（fixtures）自選的課代碼 placeholder，
 * 不是任何上游系統給的權威值——目前沒有真實的課別對照 API 可以核對。
 * Stage B 接上真實課別對照 API 之後，這批值會整批換成上游給的實際課代碼。
 * **換值會讓現有的 `/section/<code>` URL 全部失效**（沒有舊代碼可以對應
 * 新代碼；見下方 M9 對 `DEFAULT_SECTION_ID` 由 "LITHO-02" 改成
 * `LITHO02_CODE` 這件事本身已經造成的斷裂）。
 */
export const LITHO02_CODE = "SEC-1002";
export const LITHO01_CODE = "SEC-1001";
export const ETCH01_CODE = "SEC-2001";

export const sectionsFixture: readonly Section[] = [
  { code: LITHO02_CODE, nameEn: "LITHO-02", nameZh: "黃光二課" },
  { code: LITHO01_CODE, nameEn: "LITHO-01", nameZh: "黃光一課" },
  { code: ETCH01_CODE, nameEn: "ETCH-01", nameZh: "蝕刻一課" },
];

/**
 * M9（已知、刻意的使用者可見斷裂，Stage A 可接受，但要留紀錄）：
 *
 * `DEFAULT_SECTION_ID`（見 `@/lib/nav-fixtures`）從課名 `"LITHO-02"` 換成
 * 課代碼 `LITHO02_CODE`（"SEC-1002"）之後，`/section/LITHO-02` 這條舊 URL
 * 不再對應任何 `sectionsFixture` 裡的 `code`——`layout.tsx`
 * （src/app/[locale]/section/[sid]/layout.tsx）對認不出的 `sid` 一律
 * `notFound()`，沒有 redirect、沒有相容層，所以舊 URL 現在直接 404。
 *
 * Stage B 若已經有使用者把 `/section/LITHO-02` 存成書籤或分享出去，
 * 需要在 `layout.tsx`（或更上層的 middleware）加一層「課名 → 課代碼」的
 * redirect 相容層，不能假設所有進站流量都會用新代碼——這裡先記一筆，
 * 不是這一波（Stage A）的範圍。
 */
