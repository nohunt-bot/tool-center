import { describe, expect, it } from "vitest";
import { resolveSectionCode } from "@/data/section-ref";
import { ETCH01_CODE, LITHO02_CODE, sectionsFixture } from "@/data/fixtures/sections";

/**
 * R2：使用者記錄裡的課別參照 → 課代碼的正規化點——這批 fixtures 直接存
 * code，所以 fixturesDataSource 實際只會走「直通」分支，但這個函式本身要能
 * 兩種輸入都吃（回 code 直通、回名稱查表轉換），這裡把兩條分支跟例外情況都
 * 覆蓋掉，不要只測 fixtures 實際會用到的那一條。
 */
describe("resolveSectionCode：使用者記錄裡的課別參照 → 課代碼", () => {
  it("輸入已經是 code → 直通回傳", () => {
    expect(resolveSectionCode(LITHO02_CODE, sectionsFixture)).toBe(LITHO02_CODE);
  });

  it("輸入是英文課名（nameEn）→ 查表轉成 code", () => {
    expect(resolveSectionCode("LITHO-02", sectionsFixture)).toBe(LITHO02_CODE);
  });

  it("輸入是中文課名（nameZh）→ 查表轉成 code", () => {
    expect(resolveSectionCode("蝕刻一課", sectionsFixture)).toBe(ETCH01_CODE);
  });

  it("查無此課別參照 → 丟明確錯誤，不默默吞掉", () => {
    expect(() => resolveSectionCode("不存在的課別", sectionsFixture)).toThrow();
  });
});
